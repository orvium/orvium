import { Component, DestroyRef, OnInit, ViewChild, inject } from '@angular/core';
import { InputWithChipsComponent } from '../../shared/input-with-chips/input-with-chips.component';
import {
  MatAutocomplete,
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import {
  AuthorDTO,
  CommunityPopulatedDTO,
  CommunityPrivateDTO,
  DefaultService,
  DepositPopulatedDTO,
  DepositsQueryDTO,
  SessionDTO,
  SpeakerDTO,
} from '@orvium/api';
import { Observable } from 'rxjs';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  concatMap,
  debounceTime,
  distinctUntilChanged,
  finalize,
  map,
  startWith,
  tap,
} from 'rxjs/operators';
import { AppSnackBarService } from '../../services/app-snack-bar.service';
import { OnExit } from '../../shared/guards/exit.guard';
import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { COMMA, ENTER, SEMICOLON } from '@angular/cdk/keycodes';
import { CommunityService, ICommunityActions } from '../../communities/community.service';
import { assertIsDefined, isNotNullOrUndefined } from '../../shared/shared-functions';
import { AccessDeniedComponent } from '../../shared/access-denied/access-denied.component';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { InfoToolbarComponent } from '../../shared/info-toolbar/info-toolbar.component';
import { DescriptionLineComponent } from '../../shared/description-line/description-line.component';
import { NgTemplateOutlet, TitleCasePipe } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import {
  MatChipListbox,
  MatChipOption,
  MatChipSelectionChange,
  MatChipsModule,
} from '@angular/material/chips';
import { SpinnerService } from '../../spinner/spinner.service';
import { AlertComponent } from '../../shared/alert/alert.component';
import { DialogService } from '../../dialogs/dialog.service';
import { AvatarDirective } from '../../shared/directives/avatar.directive';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  validateDurationDates,
  validateIsNotBlank,
  validateOrcid,
} from '../../shared/AppCustomValidators';

/**
 * Interface defining the structure for session form controls.
 *
 * @property {FormControl<string>} title - Control for the session's title.
 * @property {FormControl<string>} description - Control for the session's description.
 * @property {FormControl<SpeakerDTO[]>} speakers - Control for the list of speakers in the session.
 * @property {FormControl<Date>} dateStart - Control for the session's start date.
 * @property {FormControl<Date>} dateEnd - Control for the session's end date.
 * @property {FormControl<number>} newTrackTimestamp - Control for the timestamp of a new track associated with the session.
 * @property {FormControl<string[]>} deposits - Control for linking deposits to the session.
 */
interface SessionForm {
  title: FormControl<string>;
  description: FormControl<string>;
  speakers: FormControl<SpeakerDTO[]>;
  dateStart: FormControl<Date>;
  dateEnd: FormControl<Date>;
  newTrackTimestamp: FormControl<number>;
  deposits: FormControl<string[]>;
}

/**
 * Interface defining the structure for speaker form controls within a session.
 *
 * @property {FormControl<string>} firstName - Control for the speaker's first name.
 * @property {FormControl<string>} lastName - Control for the speaker's last name.
 * @property {FormControl<string>} orcid - Control for the speaker's ORCID identifier.
 * @property {FormControl<string[]>} credit - Control for listing the speaker's credits.
 * @property {FormControl<number>} index - Control for the speaker's index within the session.
 * @property {FormControl<string[]>} institutions - Control for listing the institutions associated with the speaker.
 * @property {FormControl<string[]>} tags - Control for the tags associated with the speaker.
 */
interface SpeakerForm {
  firstName: FormControl<string>;
  lastName: FormControl<string>;
  orcid: FormControl<string>;
  credit: FormControl<string[]>;
  index: FormControl<number>;
  institutions: FormControl<string[]>;
  tags: FormControl<string[]>;
}

@Component({
  selector: 'app-session-edit',
  standalone: true,
  templateUrl: './session-edit.component.html',
  styleUrls: ['./session-edit.component.scss'],
  imports: [
    AccessDeniedComponent,
    MatButtonModule,
    MatTooltipModule,
    RouterLink,
    MatIconModule,
    InfoToolbarComponent,
    DescriptionLineComponent,
    NgTemplateOutlet,
    ReactiveFormsModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    InputWithChipsComponent,
    MatAutocompleteModule,
    MatDatepickerModule,
    MatChipsModule,
    TitleCasePipe,
    CdkDropList,
    CdkDrag,
    AlertComponent,
    AvatarDirective,
  ],
})
export class SessionEditComponent implements OnInit, OnExit {
  /**
   * Reference to the input component for handling chip-based inputs, particularly useful for tags and keywords.
   */
  @ViewChild('inputComponent', { read: InputWithChipsComponent })
  inputComponent?: InputWithChipsComponent;

  /**
   * Reference to the autocomplete component for selecting and searching linked publications.
   */
  @ViewChild('autoCompletePublications', { read: MatAutocomplete })
  matAutocompleteDeposits?: MatAutocomplete;

  /** Query results for deposits, including pagination and total count. */
  depositsQuery: DepositsQueryDTO = { deposits: [], count: 0 };

  /** An array of selectable session deposits, used for linking existing deposits to the session. */
  selectableSessionDeposits: DepositPopulatedDTO[] = [];

  /** Filtered list of deposits based on search criteria, used for autocomplete and selection. */
  filteredDeposits$: DepositPopulatedDTO[] = [];

  /** Calculated duration of the session based on the start and end times. */
  sessionDuration?: { hours: number; minutes: number };

  /** Dependency injection to manage the lifecycle and destruction of component-related resources. */
  private destroyRef = inject(DestroyRef);

  /**
   * Form configuration for editing session details, initialized with validation requirements.
   */
  sessionForm = this.formBuilder.nonNullable.group<SessionForm>(
    {
      title: new FormControl('', { nonNullable: true, validators: Validators.required }),
      description: new FormControl('', { nonNullable: true, validators: Validators.required }),
      speakers: new FormControl<SpeakerDTO[]>([], { nonNullable: true }),
      dateStart: new FormControl<Date>(new Date(), {
        nonNullable: true,
        validators: Validators.required,
      }),
      dateEnd: new FormControl<Date>(new Date(), {
        nonNullable: true,
        validators: Validators.required,
      }),
      newTrackTimestamp: new FormControl<number>(0, { nonNullable: true }),
      deposits: new FormControl<string[]>([], { nonNullable: true }),
    },
    { validators: validateDurationDates }
  );

  /**
   * Form configuration for managing speaker details within a session, initialized with
   * custom validation for fields like ORCID.
   */
  speakersForm = this.formBuilder.nonNullable.group<SpeakerForm>({
    firstName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, validateIsNotBlank],
    }),
    lastName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, validateIsNotBlank],
    }),
    orcid: new FormControl<string>('', {
      nonNullable: true,
      validators: validateOrcid,
    }),
    credit: new FormControl<string[]>([], { nonNullable: true }),
    index: new FormControl<number>(-1, { nonNullable: true }),
    institutions: new FormControl<string[]>([], { nonNullable: true }),
    tags: new FormControl<string[]>([], { nonNullable: true }),
  });

  /** FormControl for managing deposit search input in the UI. */
  depositsControl = new FormControl('', { nonNullable: true });

  /** Selected session information. */
  session?: SessionDTO;

  /** Controls whether the speaker edit section is displayed. */
  showSpeakerEdit = false;

  /** Delimiters for splitting institution and tag input strings. */
  institutionSeparators = [ENTER, SEMICOLON];
  tagSeparators = [ENTER, SEMICOLON, COMMA];

  /** racks the previously selected track for a session. */
  previousTrack = 0;

  /** List of authors linked to the session as DTOs */
  authorsList: AuthorDTO[] = [];

  /** Community information linked to the session, which can be either populated or private. */
  community?: CommunityPopulatedDTO | CommunityPrivateDTO;

  /** List of deposits selected for inclusion in the session. */
  depositsSelected: DepositPopulatedDTO[] = [];

  /**
   * Community actions allowed based on the user's role and permissions.
   */
  communityActions: ICommunityActions = {
    moderate: false,
    submit: false,
    update: false,
  };

  /**
   * Constructs the SessionEditComponent and initializes necessary dependencies.
   *
   * @param {FormBuilder} formBuilder - Provides the capabilities to build complex forms using a group of FormControl instances.
   * @param {DefaultService} apiService - API service for all backend communication related to session data and other CRUD operations.
   * @param {ActivatedRoute} route - Contains the information about a route associated with the component that is loaded in an outlet.
   * @param {SpinnerService} spinnerService - Manages the display of progress spinners to indicate loading states across the component.
   * @param {DialogService} dialogService - Handles the opening of dialogs for user interactions and confirmations.
   * @param {AppSnackBarService} snackBar - Service to display snack-bar notifications for various user actions and feedback.
   * @param {Router} router - Provides the navigation and URL manipulation capabilities.
   * @param {CommunityService} communityService - Manages community-related operations and data handling.
   */
  constructor(
    private formBuilder: FormBuilder,
    private apiService: DefaultService,
    private route: ActivatedRoute,
    private spinnerService: SpinnerService,
    private dialogService: DialogService,
    private snackBar: AppSnackBarService,
    private router: Router,
    private communityService: CommunityService
  ) {}

  /**
   * Initializes the component by setting up observables to fetch session and community data based on route parameters,
   * handling form value changes, and initializing the session environment.
   */
  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map(params => params.get('sessionId')),
        isNotNullOrUndefined(),
        concatMap(sessionId => this.apiService.getSession({ id: sessionId })),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(session => {
        this.session = session;

        this.apiService.getCommunity({ id: this.session.community }).subscribe(community => {
          this.community = community;
          this.refreshActions(community);
          this.getDeposits().subscribe();
          this.refreshSession(session);
        });
        if (this.session.newTrackTimestamp) {
          this.previousTrack = this.session.newTrackTimestamp;
        }
      });

    this.depositsControl.valueChanges
      .pipe(
        startWith(null),
        debounceTime(500),
        distinctUntilChanged(),
        tap(value => this.getDeposits(value || '').subscribe()),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();

    this.sessionForm.controls.dateStart.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => (this.sessionDuration = this.calculateSessionDuration()));

    this.sessionForm.controls.dateEnd.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => (this.sessionDuration = this.calculateSessionDuration()));
  }

  /**
   * Refreshes the session-related data on the form, and loads associated deposits.
   *
   * @param {SessionDTO} session - The session data to be refreshed on the component.
   */
  refreshSession(session: SessionDTO): void {
    this.session = session;
    this.sessionForm.reset({ ...this.session });

    const depositIds = this.session.deposits;
    if (depositIds.length > 0) {
      this.sessionForm.controls.deposits.setValue([]);
      for (const id of depositIds) {
        this.apiService.getDeposit({ id: id }).subscribe(deposit => {
          assertIsDefined(deposit, 'Publication not found');
          this.sessionForm.controls.deposits.value.push(deposit.title);
          if (!this.depositsSelected.some(depositSaved => depositSaved.title === deposit.title)) {
            this.depositsSelected.push(deposit);
          }
        });
      }
    }
    this.sessionDuration = this.calculateSessionDuration();
    this.sessionForm.markAsPristine();
  }

  /**
   * Invoked when user types in the depositsControl input to update its value.
   *
   * @param {string} value - The current value of the input.
   */
  onInputValueChange(value: string): void {
    this.depositsControl.setValue(value);
  }

  /**
   * Fetches deposits based on the given filter from the API service and updates related states.
   *
   * @param {string} [filter] - Optional filter to apply to the deposits query.
   * @returns {Observable<DepositsQueryDTO>} - An observable that emits the result of the deposits query.
   */
  getDeposits(filter?: string): Observable<DepositsQueryDTO> {
    assertIsDefined(this.session, 'session is not defined');
    const params: {
      communities: string[];
      page: number;
      query?: string | undefined;
      newTrackTimestamp?: number | undefined;
    } = {
      communities: [this.session.community],
      page: 1,
      newTrackTimestamp: this.sessionForm.controls.newTrackTimestamp.value,
    };
    if (filter) {
      params.query = filter;
    }
    return this.apiService.getDeposits(params).pipe(
      tap(depositQueryResult => {
        this.depositsQuery = depositQueryResult;
        this.selectableSessionDeposits = this.depositsQuery.deposits.sort((n1, n2) => {
          if (n1.title > n2.title) {
            return 1;
          }

          if (n1.title < n2.title) {
            return -1;
          }

          return 0;
        });
        this.filteredDeposits$ = depositQueryResult.deposits;
      })
    );
  }

  /**
   * Saves the modified session details. Converts deposit titles in the form to deposit IDs,
   * shows a loading spinner during the operation, and provides user feedback upon completion.
   */
  save(): void {
    const newSession = this.sessionForm.getRawValue();
    // We need to find the deposit ids by title
    newSession.deposits = newSession.deposits.map(deposit => {
      const foundDeposit = this.depositsSelected.find(
        foundDeposit => foundDeposit.title === deposit
      );
      assertIsDefined(foundDeposit, 'Error in publication list');
      return foundDeposit._id;
    });
    this.spinnerService.show();
    assertIsDefined(this.session, 'session is not defined');
    this.apiService
      .updateSession({ id: this.session._id, sessionUpdateDTO: newSession })
      .pipe(
        finalize(() => {
          this.spinnerService.hide();
        })
      )
      .subscribe(session => {
        this.sessionForm.markAsPristine();
        this.snackBar.info('Session saved');
      });
  }

  /**
   * Calculates the duration between the session's start and end times, returning an object with hours and minutes.
   *
   * @returns {{hours: number, minutes: number}} An object containing the duration in hours and minutes.
   */
  calculateSessionDuration(): { hours: number; minutes: number } {
    const duration =
      this.sessionForm.controls.dateEnd.value.getTime() -
      this.sessionForm.controls.dateStart.value.getTime();
    return {
      hours: Math.trunc(duration / 3600000),
      minutes: Math.trunc((duration % 3600000) / 60000),
    };
  }

  /**
   * Calculates the duration between the session's start and end times, returning an object with hours and minutes.
   *
   * @returns {{hours: number, minutes: number}} An object containing the duration in hours and minutes.
   */
  saveSpeaker(): void {
    const index = this.speakersForm.controls.index.value;
    if (index >= 0) {
      this.sessionForm.controls.speakers.value[index] = this.speakersForm.getRawValue();
    } else {
      this.sessionForm.controls.speakers.value.push(this.speakersForm.getRawValue());
    }
    this.sessionForm.markAsDirty();
    this.speakersForm.reset({ institutions: [], tags: [] });
    this.showSpeakerEdit = false;
  }

  /**
   * Removes a speaker from the session based on the index stored in the speaker form.
   */
  removeSpeaker(): void {
    const index = this.speakersForm.controls.index.value;
    if (index >= 0 && this.session) {
      this.session.speakers.splice(index, 1);
      this.sessionForm.markAsDirty();
      this.speakersForm.reset({ institutions: [], tags: [] });
      this.showSpeakerEdit = false;
    }
  }

  /**
   * Displays the speaker form for editing or adding new speaker details.
   */
  showSpeakerForm(): void {
    this.getAuthorsList();
    this.showSpeakerEdit = true;
  }

  /**
   * Selects an author from the autocomplete list and sets it as a speaker in the speaker form.
   *
   * @param {AuthorDTO} author - The author to be set as a speaker.
   */
  selectAuthorAutocomplete(author: AuthorDTO): void {
    this.copyAuthorAsSpeaker(author);
  }

  /**
   * Fetches and sorts the list of authors from selected publications.
   */
  getAuthorsList(): void {
    this.authorsList = this.depositsSelected.map(deposit => deposit.authors).flat();
    this.authorsList = this.authorsList.sort((author1, author2) =>
      author1.firstName.localeCompare(author2.firstName)
    );
  }

  /**
   * Selects a speaker from a list and populates the speaker form for editing.
   *
   * @param {$event: MatChipSelectionChange} $event - Event triggered by selecting a chip.
   * @param {number} index - Index of the selected speaker.
   */
  selectSpeaker($event: MatChipSelectionChange, index: number): void {
    assertIsDefined(this.session, 'session is not defined');
    if ($event.selected) {
      const speaker = this.session.speakers[index];
      this.speakersForm.patchValue({
        ...speaker,
        index: index,
      });
      this.showSpeakerForm();
    } else {
      this.speakersForm.reset({ institutions: [], tags: [] });
      this.showSpeakerEdit = false;
    }
  }

  /**
   * Copies an author's data to the speaker form to facilitate easy editing.
   *
   * @param {AuthorDTO} author - The author whose data is to be copied.
   */
  copyAuthorAsSpeaker(author: AuthorDTO): void {
    assertIsDefined(author, 'Select an author first');
    this.speakersForm.reset({ institutions: [], tags: [] });
    this.speakersForm.patchValue({
      ...author,
      lastName: author.lastName,
      firstName: author.firstName,
    });
  }

  /**
   * Deletes a session after confirming with the user.
   */
  deleteSession(): void {
    this.dialogService
      .openConfirm({
        title: 'Delete session',
        content: 'Are you sure you want to delete this session?',
        cancelMessage: 'Cancel',
        acceptMessage: 'Delete',
      })
      .afterClosed()
      .pipe(isNotNullOrUndefined())
      .subscribe(accept => {
        if (accept) {
          this.spinnerService.show();
          assertIsDefined(this.session, 'session is not defined');
          this.apiService
            .deleteSession({ id: this.session._id })
            .pipe(
              finalize(() => {
                this.spinnerService.hide();
              })
            )
            .subscribe(response => {
              this.snackBar.info('Session deleted');
              assertIsDefined(this.session, 'session is not defined');
              void this.router.navigate(['communities', this.session.community, 'program']);
            });
        }
      });
  }

  /**
   * Cancels editing a speaker, resetting the form and deselecting any selected chips.
   *
   * @param {speakersChips: MatChipListbox} speakersChips - The chip listbox containing speakers.
   */
  cancelSpeakerEdit(speakersChips: MatChipListbox): void {
    this.speakersForm.reset({ institutions: [], tags: [] });
    this.showSpeakerEdit = false;
    if (speakersChips.selected instanceof MatChipOption) {
      speakersChips.selected.toggleSelected(false);
    }
  }

  /**
   * Handles the event triggered when attempting to navigate away from the current page.
   * Checks if the session form is dirty and prompts the user to confirm leaving if unsaved changes exist.
   *
   * @returns {Observable<boolean> | boolean} True if the form is pristine, or an observable that resolves to the user's choice.
   */
  onExit(): Observable<boolean> | boolean {
    if (this.sessionForm.pristine) {
      return true;
    }
    const dialog = this.dialogService
      .openConfirm({
        title: 'Exit Edit',
        content: 'Are you sure you want to exit? You have unsaved changes that will be lost.',
        cancelMessage: 'Cancel',
        acceptMessage: 'Ok',
      })
      .afterClosed()
      .pipe(map(value => !!value));

    return dialog;
  }

  /**
   * Handles the dragging and dropping of session speakers, updating their order.
   *
   * @param {CdkDragDrop<SessionDTO[]>} event - The drag drop event containing the previous and current index.
   */
  drop(event: CdkDragDrop<SessionDTO[]>): void {
    assertIsDefined(this.session, 'session is not defined');
    moveItemInArray(this.session.speakers, event.previousIndex, event.currentIndex);
    this.sessionForm.markAsDirty();
  }

  /**
   * Refreshes the actions available for the community based on the current community context.
   *
   * @param {CommunityPrivateDTO | CommunityPopulatedDTO} community - The community for which actions are to be determined.
   */
  refreshActions(community: CommunityPrivateDTO | CommunityPopulatedDTO): void {
    this.communityActions = this.communityService.getCommunityActions(community);
  }

  /**
   * Changes the session's track after confirming with the user that they want to remove selected publications.
   */
  changeTrack(): void {
    if (this.sessionForm.getRawValue().deposits.length > 0) {
      this.dialogService
        .openConfirm({
          title: 'Change track',
          content:
            'Are you sure you want to change the track? The selected publications will be removed.',
          cancelMessage: 'Cancel',
          acceptMessage: 'Accept',
        })
        .afterClosed()
        .subscribe(accept => {
          if (accept) {
            this.getDeposits().subscribe();
            this.sessionForm.controls.deposits.setValue([]);
            this.previousTrack = this.sessionForm.getRawValue().newTrackTimestamp;
          } else {
            this.sessionForm.controls.newTrackTimestamp.setValue(this.previousTrack);
          }
        });
    } else {
      this.getDeposits().subscribe();
      this.previousTrack = this.sessionForm.getRawValue().newTrackTimestamp;
    }
  }

  /**
   * Selects a publication to be added to the session from an autocomplete dropdown.
   *
   * @param {MatAutocompleteSelectedEvent} $event - The event object containing the selected publication.
   */
  selectedPublication($event: MatAutocompleteSelectedEvent): void {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    this.depositsSelected.push($event.option.value);
  }

  /**
   * Opens the time picker dialog for a given input element.
   *
   * @param {HTMLInputElement} element - The HTML input element to show the picker for.
   */
  openTimer(element: HTMLInputElement): void {
    element.showPicker();
  }

  /**
   * Sets the time on a FormControl from an HTML input element.
   *
   * @param {HTMLInputElement} element - The HTML input element containing the time value.
   * @param {FormControl<Date>} control - The FormControl to set the time on.
   */
  setTime(element: HTMLInputElement, control: FormControl<Date>): void {
    const [hour, minute] = element.value.split(':');
    control.value.setHours(Number(hour), Number(minute));
    control.setValue(control.value);
    control.markAsDirty();
  }

  /**
   * Extracts the formatted time string from a Date object.
   *
   * @param {Date} date - The date from which to extract the time.
   * @returns {string} The formatted time string.
   */
  getTimeFromDate(date: Date): string {
    return `${date.getHours().toString().padStart(2, '0')}:${date
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;
  }
}
