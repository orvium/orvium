import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import {
  CallDTO,
  CallType,
  CommunityPopulatedDTO,
  DefaultService,
  DisciplineDTO,
} from '@orvium/api';
import { Observable } from 'rxjs';
import { DisciplinesService } from '../../services/disciplines.service';
import { concatMap, finalize, map, startWith } from 'rxjs/operators';
import { CALLTYPE_LOV } from '../../model/orvium';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AppSnackBarService } from '../../services/app-snack-bar.service';
import { OnExit } from '../../shared/guards/exit.guard';
import { assertIsDefined, isNotNullOrUndefined } from '../../shared/shared-functions';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { InfoToolbarComponent } from '../../shared/info-toolbar/info-toolbar.component';
import { DescriptionLineComponent } from '../../shared/description-line/description-line.component';
import { AsyncPipe, NgTemplateOutlet } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { SpinnerService } from '../../spinner/spinner.service';
import { DialogService } from '../../dialogs/dialog.service';
import { InputWithChipsComponent } from '../../shared/input-with-chips/input-with-chips.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { validateEmail, validateIsNotBlank } from '../../shared/AppCustomValidators';

/**
 * Interface representing the structure of the form used to manage the details of a call.
 * Each property corresponds to a form control, managing specific aspects of a call.
 *
 * @property {FormControl<string>} title - Control for the title of the call. Must be a non-empty string.
 * @property {FormControl<Date>} deadline - Control for the deadline of the call, represented as a Date object.
 * @property {FormControl<string>} description - Control for the description of the call, detailing the purpose, eligibility, etc.
 * @property {FormControl<CallType>} callType - Control for selecting the type of the call, categorized by predefined types.
 * @property {FormControl<string>} scope - Control for the scope of the call, indicating the extent or range of its applicability.
 * @property {FormControl<string[]>} disciplines - Control for selecting disciplines related to the call. Supports multiple selections.
 * @property {FormControl<string>} contact - Control for the name or identifier of the primary contact person for the call.
 * @property {FormControl<string>} contactEmail - Control for the email address of the contact person, validated for format.
 * @property {FormControl<boolean>} visible - Toggle control indicating if the call should be visible to the public or restricted.
 */
interface CallForm {
  title: FormControl<string>;
  deadline: FormControl<Date>;
  description: FormControl<string>;
  callType: FormControl<CallType>;
  scope: FormControl<string>;
  disciplines: FormControl<string[]>;
  contact: FormControl<string>;
  contactEmail: FormControl<string>;
  visible: FormControl<boolean>;
}

/**
 * Component for creating or editing call information within the platform.
 * It features a complex form with multiple fields including text inputs, selections, and toggle switches
 * for detailed call specifications. This component also manages API interactions for saving or deleting call data.
 */
@Component({
  selector: 'app-call-edit',
  standalone: true,
  templateUrl: './call-edit.component.html',
  styleUrls: ['./call-edit.component.scss'],
  imports: [
    MatButtonModule,
    MatIconModule,
    RouterLink,
    InfoToolbarComponent,
    DescriptionLineComponent,
    NgTemplateOutlet,
    MatCardModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatChipsModule,
    MatAutocompleteModule,
    AsyncPipe,
    MatSlideToggleModule,
    InputWithChipsComponent,
  ],
})
export class CallEditComponent implements OnInit, OnExit {
  /** Subscription management for cleanup. */
  private destroyRef = inject(DestroyRef);

  /** Observable list of filtered disciplines based on user input. */
  filteredDisciplines?: Observable<DisciplineDTO[]>;

  /** FormControl for inputting and filtering discipline names. */
  disciplinesControl = new FormControl<string>('');

  /** The current call data, fetched via API. */
  call?: CallDTO;

  /** List of options for the call type, used in dropdown selections. */
  callTypeLOV = CALLTYPE_LOV;

  /** Array of disciplines data used for filtering and autocomplete. */
  private disciplines: DisciplineDTO[] = [];

  /** Community data fetched based on the call's community ID. */
  community?: CommunityPopulatedDTO;

  /** The FormGroup representing the form for a call, strongly typed with CallForm. */
  callForm = this.formBuilder.nonNullable.group<CallForm>({
    title: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, validateIsNotBlank],
    }),
    deadline: new FormControl<Date>(new Date(), {
      nonNullable: true,
      validators: Validators.required,
    }),
    description: new FormControl<string>('', {
      nonNullable: true,
      validators: Validators.required,
    }),
    callType: new FormControl<CallType>(CallType.Papers, {
      nonNullable: true,
      validators: Validators.required,
    }),
    scope: new FormControl<string>('', { nonNullable: true, validators: Validators.required }),
    disciplines: new FormControl<string[]>([], {
      nonNullable: true,
      validators: Validators.required,
    }),
    contact: new FormControl<string>('', { nonNullable: true, validators: Validators.required }),
    contactEmail: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, validateEmail],
    }),
    visible: new FormControl<boolean>(true, { nonNullable: true, validators: Validators.required }),
  });

  /**
   * Initializes a new instance of the CallEditComponent.
   *
   * @param formBuilder Service for creating form groups and controls.
   * @param disciplinesService Service for fetching disciplines data.
   * @param route ActivatedRoute service to access route parameters.
   * @param router Router service for navigation.
   * @param snackBar Service for displaying notifications.
   * @param spinnerService Service for managing loading spinners.
   * @param dialogService Service for displaying dialog windows.
   * @param apiService Service for API interactions.
   */
  constructor(
    private formBuilder: FormBuilder,
    private disciplinesService: DisciplinesService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: AppSnackBarService,
    private spinnerService: SpinnerService,
    private dialogService: DialogService,
    private apiService: DefaultService
  ) {}

  /** OnInit lifecycle hook to initialize form values and subscriptions. */
  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map(params => params.get('callId')),
        isNotNullOrUndefined(),
        concatMap(callId => this.apiService.getCall({ id: callId })),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(call => {
        this.call = call;
        this.apiService.getCommunity({ id: this.call.community }).subscribe(community => {
          this.community = community;
        });
        this.disciplinesControl.setValue(null); // Init control value
        this.disciplinesService
          .getDisciplines()
          .subscribe(disciplines => (this.disciplines = disciplines));
        this.filteredDisciplines = this.disciplinesControl.valueChanges.pipe(
          startWith(null),
          map(discipline => this.filterDisciplines(discipline))
        );

        this.refreshCall(this.call);
      });
  }
  /** Deletes the current call after confirmation from the user. */
  deleteCall(): void {
    this.dialogService
      .openConfirm({
        title: 'Delete call',
        content: 'Are you sure you want to delete this call?',
        cancelMessage: 'Cancel',
        acceptMessage: 'Delete',
      })
      .afterClosed()
      .pipe(isNotNullOrUndefined())
      .subscribe(accept => {
        assertIsDefined(this.call);
        if (accept) {
          this.spinnerService.show();
          this.apiService
            .deleteCall({ id: this.call._id })
            .pipe(
              finalize(() => {
                this.spinnerService.hide();
              })
            )
            .subscribe(response => {
              this.snackBar.info('Call deleted');
              assertIsDefined(this.call);
              void this.router.navigate(['/communities', this.call.community, 'view']);
            });
        }
      });
  }

  /** Filters disciplines based on user input for autocomplete functionality. */
  private filterDisciplines(value: string | null): DisciplineDTO[] {
    if (value) {
      const filterValue = value.toLowerCase();

      return this.disciplines
        .filter(
          discipline =>
            discipline.name.toLowerCase().includes(filterValue) &&
            !this.callForm.controls.disciplines.value.includes(discipline.name)
        )
        .slice(0, 50);
    } else {
      return this.disciplines
        .filter(discipline => !this.callForm.controls.disciplines.value.includes(discipline.name))
        .slice(0, 50);
    }
  }

  refreshCall(call: CallDTO): void {
    this.call = call;
    this.callForm.patchValue(call);
    this.callForm.markAsPristine();
  }

  save(): void {
    assertIsDefined(this.call);
    if (this.callForm.valid) {
      this.call = Object.assign(this.call, this.callForm.value);
      this.spinnerService.show();
      this.apiService
        .updateCall({ id: this.call._id, callUpdateDTO: this.callForm.value })
        .pipe(
          finalize(() => {
            this.spinnerService.hide();
          })
        )
        .subscribe(call => {
          this.callForm.markAsPristine();
          this.snackBar.info('Call saved');
        });
    } else {
      this.snackBar.error('Please, write down all the needed info correctly.');
    }
  }

  onExit(): Observable<boolean> | boolean {
    if (this.callForm.pristine) {
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

  onInputValueChange(value: string): void {
    this.disciplinesControl.setValue(value);
  }
}
