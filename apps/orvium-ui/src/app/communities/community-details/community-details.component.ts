import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ACCESSRIGHT_LOV, COMMUNITYTYPE_LOV, FILEEXTENSION_LOV } from '../../model/orvium';
import { ProfileService } from '../../profile/profile.service';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { concatMap, finalize, map, tap } from 'rxjs/operators';
import { CommunityService, ICommunityActions } from '../community.service';
import { lastValueFrom, Observable } from 'rxjs';
import { AppSnackBarService } from '../../services/app-snack-bar.service';
import {
  AccessRight,
  CommunityPrivateDTO,
  CommunityStatus,
  CommunityType,
  CommunityUpdateDto,
  DefaultService,
  FileExtensions,
  ImageType,
  SignedUrlDTO,
  UserPrivateDTO,
} from '@orvium/api';
import { ShareService } from 'ngx-sharebuttons';
import { MatAutocomplete } from '@angular/material/autocomplete';
import { OnExit } from '../../shared/guards/exit.guard';
import { environment } from '../../../environments/environment';
import { SidenavService } from '../../services/sidenav.service';
import { assertIsDefined, getDelta, isNotNullOrUndefined } from '../../shared/shared-functions';
import {
  ACCEPT_TYPES,
  FileuploadComponent,
  MAX_FILE_SIZE,
} from '../../shared/fileupload/fileupload.component';
import { HttpResponse } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';

import { MatExpansionModule } from '@angular/material/expansion';
import { MatSelectModule } from '@angular/material/select';
import { EditorComponent } from '@tinymce/tinymce-angular';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatListModule } from '@angular/material/list';
import { InfoToolbarComponent } from '../../shared/info-toolbar/info-toolbar.component';
import { DescriptionLineComponent } from '../../shared/description-line/description-line.component';
import { MatInputModule } from '@angular/material/input';
import { AccessDeniedComponent } from '../../shared/access-denied/access-denied.component';
import { SpinnerService } from '../../spinner/spinner.service';
import { OverlayLoadingDirective } from '../../spinner/overlay-loading.directive';
import { CommunityCalendarComponent } from '../community-calendar/community-calendar.component';
import { CommunityCardComponent } from '../community-card/community-card.component';
import { DialogService } from '../../dialogs/dialog.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatIconModule } from '@angular/material/icon';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatRadioModule } from '@angular/material/radio';
import {
  validateArrayIsNotEmpty,
  validateFacebook,
  validateIsNotBlank,
  validateISSN,
  validateTwitter,
  validateURL,
} from '../../shared/AppCustomValidators';

/**
 * Enum representing visibility settings for reviewing content within a community.
 * Specifies who can view reviews associated with the community content.
 *
 * @property {boolean} everyone - Reviews are visible to everyone.
 * @property {boolean} author - Reviews are only visible to the author of the content.
 * @property {boolean} NoOne - Reviews are visible to no one.
 */
export enum showReviewEnum {
  everyone = 'true:true',
  author = 'false:true',
  NoOne = 'false:false',
}

/**
 * Enum representing the settings for showing reviewer identities within a community.
 * Specifies who can see the identities of the reviewers.
 *
 * @property {boolean} everyone - Reviews are visible to everyone.
 * @property {boolean} author - Reviews are only visible to the author of the content.
 * @property {boolean} NoOne - Reviews are visible to no o
 */
export enum showReviewIdentityEnum {
  everyone = 'true:true',
  author = 'false:true',
  NoOne = 'false:false',
}

/**
 * Interface representing the form structure for individual calendar dates within a community.
 * Used for managing events and significant dates related to the community.
 *
 * @property {FormControl<Date>} date - The specific date of the event or reminder.
 * @property {FormControl<string>} message - A message or description associated with the date.
 */
interface DateForm {
  date: FormControl<Date>;
  message: FormControl<string>;
}

/**
 * Interface representing the form structure for tracks within a community.
 * Tracks can represent thematic areas or categories within the community.
 *
 * @property {FormControl<string>} title - Name of the track
 * @property {FormControl<string | undefined>} description - Optional description of what the track entails.
 * @property {FormControl<number>} timestamp - Timestamp marking the creation or significant modification
 */
interface TrackForm {
  title: FormControl<string>;
  description: FormControl<string | undefined>;
  timestamp: FormControl<number>;
}

/**
 * Interface representing the complete form structure for community details.
 * This form is used to capture and manage all aspects of a community's data.
 *
 * @property {string} name - The name of the community.
 * @property {string} description - A detailed description of the community.
 * @property {string} country - The country associated with the community.
 * @property {CommunityType} type - The type of the community, categorized by predefined types.
 * @property {string} acknowledgement - An acknowledgement message or note related to the community.
 * @property {string} twitterURL - URL to the community's Twitter page.
 * @property {string} facebookURL - URL to the community's Facebook page.
 * @property {string} websiteURL - URL to the community's official website.
 * @property {string} logoURL - URL to the community's logo image.
 * @property {string} bannerURL - URL to the community's banner image.
 * @property {string} cardImageUrl - URL to the community's card image, used for previews or thumbnails.
 * @property {string} guidelinesURL - URL to a document detailing the community's guidelines.
 * @property {AccessRight[]} customLicenses - Array of custom licenses or access rights associated with the community.
 * @property {string} issn - The International Standard Serial Number associated with publications from the community.
 * @property {Object[]} calendarDates - An array of objects representing important dates in the community's calendar.
 * @property {Date} calendarDates.date - The specific date of the event or milestone.
 * @property {Object[]} newTracks - An array of objects representing new tracks or themes within the community.
 * @property {FileExtensions[]} preferredFileExtensions - List of preferred file extensions for documents related to the community.
 * @property {boolean} calendarVisible - A boolean indicating whether the community's calendar is visible to users.
 * @property {boolean} privateReviews - Whether reviews within the community are kept private.
 * @property {boolean} canAuthorInviteReviewers - Whether authors in the community can invite reviewers independently.
 * @property {string} showReview - Settings for who can see reviews (everyone, author only, or no one).
 */
interface CommunityForm {
  name: FormControl<string>;
  description: FormControl<string>;
  country: FormControl<string>;
  type: FormControl<CommunityType>;
  acknowledgement: FormControl<string>;
  twitterURL: FormControl<string>;
  facebookURL: FormControl<string>;
  websiteURL: FormControl<string>;
  logoURL: FormControl<string>;
  bannerURL: FormControl<string>;
  cardImageUrl: FormControl<string>;
  guidelinesURL: FormControl<string>;
  customLicenses: FormControl<AccessRight[]>;
  issn: FormControl<string>;
  calendarDates: FormArray<FormGroup<DateForm>>;
  newTracks: FormArray<FormGroup<TrackForm>>;
  preferredFileExtensions: FormControl<FileExtensions[]>;
  calendarVisible: FormControl<boolean>;
  showIdentity: FormControl<string>;
  privateReviews: FormControl<boolean>;
  canAuthorInviteReviewers: FormControl<boolean>;
  showReview: FormControl<string>;
}

/**
 * Component responsible for handling the detailed view and modifications of a specific community's data.
 * Provides functionalities for editing community details, managing calendar events, uploading community images,
 * and setting various permissions related to community interaction.
 */
@Component({
  selector: 'app-community-details',
  standalone: true,
  templateUrl: './community-details.component.html',
  styleUrls: ['./community-details.component.scss'],
  imports: [
    MatButtonModule,
    RouterLink,
    ReactiveFormsModule,
    MatExpansionModule,
    MatSelectModule,
    EditorComponent,
    MatButtonToggleModule,
    FileuploadComponent,
    MatSlideToggleModule,
    MatDatepickerModule,
    MatTooltipModule,
    MatListModule,
    RouterLinkActive,
    InfoToolbarComponent,
    DescriptionLineComponent,
    MatInputModule,
    AccessDeniedComponent,
    OverlayLoadingDirective,
    CommunityCalendarComponent,
    CommunityCardComponent,
    FontAwesomeModule,
    MatIconModule,
    MatRadioModule,
  ],
})
export class CommunityDetailsComponent implements OnInit, OnExit, AfterViewInit {
  /**
   * A template reference used for submitting community changes.
   */
  @ViewChild('submitDialogTemplate') submitDialogTemplate!: TemplateRef<unknown>;

  /**
   * A template reference used for managing community calendar details.
   */
  @ViewChild('calendarDialogTemplate') calendarDialogTemplate!: TemplateRef<unknown>;

  /**
   * Reference to an input element for disciplines. Used for autocomplete functionality to input or edit tags.
   */
  @ViewChild('disciplineInput') disciplineInput?: ElementRef<HTMLInputElement>;

  /**
   * Reference to the autocomplete component associated with discipline inputs (selectable autocomplete options).
   */
  @ViewChild('autoCompleteDisciplines') matAutocomplete?: MatAutocomplete;

  /**
   * A template reference used for additional side navigation content.
   */
  @ViewChild('extraSidenavTemplate') extraSidenavTemplate!: TemplateRef<unknown>;

  /**
   * Injectable reference to assist with the lifecycle of subscriptions, ensuring clean-up to prevent
   * memory leaks when the component is destroyed.
   */
  private destroyRef = inject(DestroyRef);

  /**
   * The detailed data of the community being managed or viewed.
   */
  community?: CommunityPrivateDTO;

  /**
   * The user profile information, used to determine what content or actions the user is authorized to perform.
   */
  profile?: UserPrivateDTO;

  /**
   * Cache for the community form data, used to store the initial state of the community form when the component is loaded
   * or the last saved state. This cache aids in detecting changes, handling form submissions, and reverting to the
   * original form state when necessary.
   *
   * @property {string} name - The name of the community.
   * @property {string} description - A detailed description of the community.
   * @property {string} country - The country associated with the community.
   * @property {CommunityType} type - The type of the community, categorized by predefined types.
   * @property {string} acknowledgement - An acknowledgement message or note related to the community.
   * @property {string} twitterURL - URL to the community's Twitter page.
   * @property {string} facebookURL - URL to the community's Facebook page.
   * @property {string} websiteURL - URL to the community's official website.
   * @property {string} logoURL - URL to the community's logo image.
   * @property {string} bannerURL - URL to the community's banner image.
   * @property {string} cardImageUrl - URL to the community's card image, used for previews or thumbnails.
   * @property {string} guidelinesURL - URL to a document detailing the community's guidelines.
   * @property {AccessRight[]} customLicenses - Array of custom licenses or access rights associated with the community.
   * @property {string} issn - The International Standard Serial Number associated with publications from the community.
   * @property {Object[]} calendarDates - An array of objects representing important dates in the community's calendar.
   * @property {Object[]} newTracks - An array of objects representing new tracks or themes within the community.
   * @property {FileExtensions[]} preferredFileExtensions - List of preferred file extensions for documents related to the community.
   * @property {boolean} calendarVisible - A boolean indicating whether the community's calendar is visible to users.
   * @property {boolean} privateReviews - Whether reviews within the community are kept private.
   * @property {boolean} canAuthorInviteReviewers - Whether authors in the community can invite reviewers independently.
   * @property {string} showIdentity - Settings for displaying identities related to reviews (everyone, author only, or no one).
   * @property {string} showReview - Settings for who can see reviews (everyone, author only, or no one).
   */
  cachedCommunityForm!: {
    name: string;
    description: string;
    country: string;
    type: CommunityType;
    acknowledgement: string;
    twitterURL: string;
    facebookURL: string;
    websiteURL: string;
    logoURL: string;
    bannerURL: string;
    cardImageUrl: string;
    guidelinesURL: string;
    customLicenses: AccessRight[];
    issn: string;
    calendarDates: { date: Date; message: string }[];
    newTracks: { title: string; description: string | undefined; timestamp: number }[];
    preferredFileExtensions: FileExtensions[];
    calendarVisible: boolean;
    privateReviews: boolean;
    canAuthorInviteReviewers: boolean;
    showIdentity: string;
    showReview: string;
  };

  /**
   * Enum mapping the settings for who can view the reviews.
   */
  showReviewEnum = showReviewEnum;

  /**
   * Enum mapping the settings for whose identity is shown in reviews.
   */
  showReviewIdentityEnum = showReviewIdentityEnum;

  /**
   * Form array to manage multiple track entries, each with a title, description, and timestamp.
   */
  newTracksForm = this.formBuilder.array<FormGroup<TrackForm>>([]);

  /**
   * Form array to manage multiple calendar date entries, each with a specific date and associated message.
   */
  calendarDatesForm = this.formBuilder.array<FormGroup<DateForm>>([]);

  /**
   * Main form group that encapsulates all community details. This form includes all the necessary validations
   * and fields required to submit community details to the server.
   */
  communityForm = this.formBuilder.nonNullable.group<CommunityForm>({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, validateIsNotBlank],
    }),
    description: new FormControl('', { nonNullable: true, validators: Validators.required }),
    country: new FormControl('', { nonNullable: true }),
    type: new FormControl(CommunityType.Community, {
      nonNullable: true,
      validators: Validators.required,
    }),
    privateReviews: new FormControl(false, { nonNullable: true }),
    showIdentity: new FormControl('false:false', { nonNullable: true }),
    showReview: new FormControl('false:false', { nonNullable: true }),
    canAuthorInviteReviewers: new FormControl(false, { nonNullable: true }),
    acknowledgement: new FormControl('', { nonNullable: true }),
    twitterURL: new FormControl('', {
      nonNullable: true,
      validators: validateTwitter,
    }),
    facebookURL: new FormControl('', {
      nonNullable: true,
      validators: validateFacebook,
    }),
    websiteURL: new FormControl('', {
      nonNullable: true,
      validators: validateURL,
    }),
    logoURL: new FormControl('', {
      nonNullable: true,
    }),
    bannerURL: new FormControl('', {
      nonNullable: true,
    }),
    cardImageUrl: new FormControl('', {
      nonNullable: true,
    }),
    guidelinesURL: new FormControl('', {
      nonNullable: true,
      validators: validateURL,
    }),
    newTracks: this.newTracksForm,
    customLicenses: new FormControl([], {
      nonNullable: true,
      validators: validateArrayIsNotEmpty,
    }),
    issn: new FormControl('', { nonNullable: true, validators: validateISSN }),
    calendarDates: this.calendarDatesForm,
    preferredFileExtensions: new FormControl([], { nonNullable: true }),
    calendarVisible: new FormControl(
      { value: false, disabled: this.calendarDatesForm.length === 0 },
      {
        nonNullable: true,
        validators: Validators.required,
      }
    ),
  });

  /**
   * Lookup of values for community type based on a predefined list of values.
   */
  communityTypeLOV = COMMUNITYTYPE_LOV;

  /**
   * Enum representing the various statuses a community can hold.
   */
  CommunityStatus = CommunityStatus;

  /**
   * List of values for preferred file extensions, used for file uploads within the community.
   */
  preferredFileExtensionsLOV = FILEEXTENSION_LOV;

  /**
   * Lookup of access rights for communities, used to manage what content is accessible and to whom.
   */
  accessRightLov = ACCESSRIGHT_LOV;

  /**
   * Flag to keep track of whether the details panel within the UI is expanded.
   */
  detailsExpanded = true;

  /**
   * Access to environment variables for use within the component.
   */
  environment = environment;

  /**
   * Flag to indicate if the current user has administrative privileges within the context of this community.
   */
  isAdmin = false;

  /**
   * Boolean indicating whether the community is currently being loaded.
   */
  loadingCommunity = true;

  /**
   * Default maximum file size for uploads within the community settings.
   */
  defaultMaxFileSize = MAX_FILE_SIZE.TWENTY_MB;

  /**
   * Allowed file types for uploads within the community.
   */
  ACCEPT_TYPES = ACCEPT_TYPES;

  /**
   * Allowed Image types for uploads within the community.
   */
  communityImageType = ImageType;

  /**
   * Allowed actions within the community. Default all to false.
   */
  communityActions: ICommunityActions = {
    update: false,
    moderate: false,
    submit: false,
  };

  /**
   * Constructs the CommunityDetailsComponent, injecting various services required for
   * managing community details, handling user interactions, and performing API operations.
   *
   * @param {ActivatedRoute} route - Service that provides access to information about a route associated with a component that is loaded in an outlet.
   * @param {ProfileService} profileService - Service for managing user profiles, including fetching and updating profile information.
   * @param {FormBuilder} formBuilder - Angular service for building and managing reactive forms.
   * @param {SpinnerService} spinnerService - Service for displaying a loading spinner during asynchronous operations.
   * @param {AppSnackBarService} snackBar - Service for displaying snack bar notifications to the user.
   * @param {CommunityService} communityService - Service for managing community-specific operations such as creating and updating communities.
   * @param {Router} router - Angular service for navigation and routing within the application.
   * @param {ShareService} share - Service for handling sharing functionalities, such as social media sharing.
   * @param {DialogService} dialogService - Service for managing dialog interactions within the application.
   * @param {DefaultService} apiService - Service for performing API operations, such as fetching and updating community data.
   * @param {SidenavService} sidenavService - Service for managing the side navigation menu within the application.
   */
  constructor(
    private route: ActivatedRoute,
    private profileService: ProfileService,
    private formBuilder: FormBuilder,
    private spinnerService: SpinnerService,
    public snackBar: AppSnackBarService,
    private communityService: CommunityService,
    private router: Router,
    public share: ShareService,
    private dialogService: DialogService,
    private apiService: DefaultService,
    private sidenavService: SidenavService
  ) {}

  /**
   * After the view initializes, set additional UI components like side navigation templates.
   */
  ngAfterViewInit(): void {
    this.sidenavService.setExtraSidenav(this.extraSidenavTemplate);
  }

  /**
   * Initializes the component by loading the user profile and the specific community details based on the route parameters.
   * This method sets up the initial state and prepares the component for user interaction.
   */
  ngOnInit(): void {
    this.profileService.getProfile().subscribe(profile => {
      this.profile = profile;
      if (this.profile) {
        this.isAdmin = this.profile.roles.includes('admin');
      }
    });
    this.route.paramMap
      .pipe(
        map(params => params.get('communityId')),
        isNotNullOrUndefined(),
        concatMap(communityId =>
          this.apiService.getCommunity({ id: communityId }).pipe(
            finalize(() => {
              this.loadingCommunity = false;
            })
          )
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(community => {
        // narrow type to CommunityPrivateDTO by checking `dataciteEnabled` property
        if ('isPrivateDTO' in community) {
          this.refreshCommunity(community);
        }
      });
  }

  /**
   * Handles the component's clean-up logic when navigating away from the page, ensuring no memory leaks and that
   * any side navigations are properly closed.
   *
   * @returns {Observable<boolean> | boolean} Returns an observable or boolean indicating if it's safe to navigate away,
   * considering unsaved changes.
   */
  onExit(): Observable<boolean> | boolean {
    if (!this.communityForm.dirty) {
      this.sidenavService.setExtraSidenav(undefined);
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
      .pipe(
        map(value => !!value),
        tap(value => {
          if (value) {
            this.sidenavService.setExtraSidenav(undefined);
          }
        })
      );
    return dialog;
  }

  /**
   * Refreshes the action permissions for the community based on the current user's rights and community status.
   *
   * @param {CommunityPrivateDTO} community - The community object to refresh actions for.
   */
  refreshActions(community: CommunityPrivateDTO): void {
    this.communityActions = this.communityService.getCommunityActions(community);
  }

  /**
   * Refreshes the entire community form and resets its values based on the provided community data.
   * Also reinitializes form controls for dynamic form arrays such as calendar dates and tracks.
   *
   * @param {CommunityPrivateDTO} community - The community object with updated data to refresh the form.
   */
  refreshCommunity(community: CommunityPrivateDTO): void {
    this.community = community;
    this.refreshActions(community);
    this.communityForm.reset({
      ...this.community,
      showReview: `${String(this.community.showReviewToEveryone)}:${String(
        this.community.showReviewToAuthor
      )}`,
      showIdentity: `${String(this.community.showIdentityToEveryone)}:${String(
        this.community.showIdentityToAuthor
      )}`,
    });

    this.communityForm.controls.calendarDates.clear();
    for (const dateEvent of community.calendarDates) {
      const datesForm = this.formBuilder.group<DateForm>({
        date: new FormControl(dateEvent.date, {
          nonNullable: true,
          validators: Validators.required,
        }),
        message: new FormControl(dateEvent.message, {
          nonNullable: true,
          validators: Validators.required,
        }),
      });
      this.communityForm.controls.calendarDates.push(datesForm);
    }

    this.communityForm.controls.newTracks.clear();
    for (const track of community.newTracks) {
      const trackForm = this.formBuilder.group<TrackForm>({
        timestamp: new FormControl<number>(track.timestamp, { nonNullable: true }),
        title: new FormControl<string>(track.title, {
          nonNullable: true,
          validators: Validators.required,
        }),
        description: new FormControl<string | undefined>(track.description, {
          nonNullable: true,
        }),
      });
      this.communityForm.controls.newTracks.push(trackForm);
    }

    if (this.communityActions.update) {
      this.communityForm.enable();
    } else {
      this.communityForm.disable();
    }

    this.cachedCommunityForm = this.communityForm.getRawValue();
  }

  /**
   * Saves changes made to the community by sending updated data to the server.
   * Validates the form and displays errors if necessary.
   */
  save(): void {
    if (!this.communityForm.valid) {
      this.detailsExpanded = true;
      this.snackBar.error('Make sure all details are correct');
      return;
    }
    assertIsDefined(this.community, 'community is not defined');
    const delta = getDelta(this.communityForm.getRawValue(), this.cachedCommunityForm);
    const { showReview, showIdentity, ...deltaSin } = delta;

    const updateCommunity: CommunityUpdateDto = deltaSin;

    if (showReview) {
      updateCommunity.showReviewToEveryone = showReview.split(':')[0] === 'true';
      updateCommunity.showReviewToAuthor = showReview.split(':')[1] === 'true';
    }

    if (showIdentity) {
      updateCommunity.showIdentityToEveryone = showIdentity.split(':')[0] === 'true';
      updateCommunity.showIdentityToAuthor = showIdentity.split(':')[1] === 'true';
    }

    this.community = Object.assign(this.community, this.communityForm.value);
    this.spinnerService.show();
    this.apiService
      .updateCommunity({ id: this.community._id, communityUpdateDto: updateCommunity })
      .pipe(
        finalize(() => {
          this.spinnerService.hide();
        })
      )
      .subscribe(response => {
        this.refreshCommunity(response);
        this.communityForm.markAsPristine();
        this.snackBar.info('Community saved');
      });
  }

  /**
   * Deletes a community after user confirmation.
   */
  deleteCommunity(): void {
    this.dialogService
      .openConfirm({
        title: 'Delete Community',
        content: 'Do you want to delete this community? This process can not be undone.',
        cancelMessage: 'Cancel',
        acceptMessage: 'Delete',
      })
      .afterClosed()
      .pipe(isNotNullOrUndefined())
      .subscribe(accept => {
        if (accept) {
          this.spinnerService.show();
          assertIsDefined(this.community, 'community is not defined');
          this.apiService
            .deleteCommunity({ id: this.community._id })
            .pipe(
              finalize(() => {
                this.spinnerService.hide();
              })
            )
            .subscribe(response => {
              void this.router.navigate(['/']);
            });
        }
      });
  }

  /**
   * Adds a new track to the community form.
   *
   * @param {number} [index=-1] - The index at which to add the track.
   */
  addTrack(index = -1): void {
    const tracksForm = this.formBuilder.nonNullable.group<TrackForm>({
      timestamp: new FormControl(Date.now(), {
        nonNullable: true,
        validators: Validators.required,
      }),
      title: new FormControl('', { nonNullable: true, validators: Validators.required }),
      description: new FormControl('', { nonNullable: true }),
    });
    this.communityForm.markAsDirty();
    this.communityForm.controls.newTracks.push(tracksForm);
  }

  /**
   * Deletes a track from the community form.
   *
   * @param {number} trackFormIndex - The index of the track to delete.
   */
  deleteTrack(trackFormIndex: number): void {
    this.communityForm.controls.newTracks.removeAt(trackFormIndex);
    this.communityForm.markAsDirty();
  }

  /**
   * Adds a new date to the community form.
   *
   * @param {number} [index=-1] - The index at which to add the date.
   */
  addDates(index = -1): void {
    const datesForm = this.formBuilder.nonNullable.group<DateForm>({
      date: new FormControl(new Date(), { nonNullable: true, validators: Validators.required }),
      message: new FormControl('', { nonNullable: true, validators: Validators.required }),
    });
    this.communityForm.markAsDirty();
    index === -1
      ? this.communityForm.controls.calendarDates.push(datesForm)
      : this.communityForm.controls.calendarDates.insert(index + 1, datesForm);
  }

  /**
   * Deletes a date from the community form.
   *
   * @param {number} calendarFormIndex - The index of the date to delete.
   */
  deleteDate(calendarFormIndex: number): void {
    this.communityForm.controls.calendarDates.removeAt(calendarFormIndex);
    this.communityForm.markAsDirty();
    if (this.communityForm.controls.calendarDates.length === 0) {
      this.communityForm.controls.calendarVisible.setValue(false);
    }
  }

  /**
   * Opens the calendar dialog.
   */
  openCalendar(): void {
    assertIsDefined(this.community, 'community is not defined');
    this.dialogService.openCustom({
      title: `Calendar (${this.community.calendarDates.length})`,
      template: this.calendarDialogTemplate,
      showActionButtons: false,
    });
  }

  /**
   * Opens the submit community modal dialog.
   */
  openSubmitCommunityModal(): void {
    this.dialogService
      .openCustom({
        title: 'Submit Community',
        content:
          'We will review the community and will proceed to accept it or decline it. You will be notified soon.',
        template: this.submitDialogTemplate,
        showActionButtons: true,
        acceptMessage: 'Accept',
      })
      .afterClosed()
      .pipe(isNotNullOrUndefined())
      .subscribe(accept => {
        if (accept) {
          this.submit();
        }
      });
  }

  /**
   * Submits the community form.
   */
  submit(): void {
    assertIsDefined(this.community, 'community is not defined');
    this.apiService.submitCommunity({ id: this.community._id }).subscribe(() => {
      this.snackBar.info('Community submitted');
      void this.router.navigate(['communities']);
    });
  }
  /**
   * Handles the event when files are uploaded.
   *
   * @param {object} $event - The event object containing file information.
   * @param {HttpResponse} $event.originalEvent - The original event.
   * @param {File[]} $event.files - The uploaded files.
   * @param {SignedUrlDTO} $event.payload - The signed URL payload.
   * @param {ImageType} communityImage - The type of community image.
   */
  async filesUploaded(
    $event: {
      originalEvent: HttpResponse<unknown>;
      files: File[];
      payload: SignedUrlDTO;
    },
    communityImage: ImageType
  ): Promise<void> {
    assertIsDefined(this.community, 'community not found');
    this.loadingCommunity = true;
    await lastValueFrom(
      this.apiService.uploadImagesConfirmation({
        id: this.community._id,
        communityUploadConfirmation: {
          imageType: communityImage,
          fileMetadata: {
            filename: $event.files[0].name,
            description: $event.files[0].name,
            contentType: $event.files[0].type,
            contentLength: $event.files[0].size,
            tags: ['Community'],
          },
        },
      })
    );
    this.snackBar.info('Image uploaded');
    // Update the community to update de card, banner and logo preview
    this.apiService
      .getCommunity({ id: this.community._id })
      .pipe(
        finalize(() => {
          this.loadingCommunity = false;
        })
      )
      .subscribe(community => {
        this.refreshCommunity(community as CommunityPrivateDTO);
      });
  }

  /**
   * Checks if the community form is pristine before uploading files.
   *
   * @param {unknown} $event - The event object.
   * @returns {boolean} - Returns true if the form is pristine, otherwise false.
   */
  beforeUpload($event: unknown): boolean {
    if (!this.communityForm.pristine) {
      this.snackBar.error('Save your data first');
      return false;
    } else {
      return true;
    }
  }

  /**
   * Generates a signed URL for uploading files.
   *
   * @param {object} $event - The event object containing file information.
   * @param {File} $event.fileObject - The file object to upload.
   * @param {FormData} $event.formData - The form data for the upload.
   * @param {boolean} isMainFile - Indicates if the file is the main file.
   * @param {FileuploadComponent} mainReviewFileUpload - The file upload component.
   * @param {ImageType} communityImageType - The type of community image.
   */
  async generateSignedUrl(
    $event: { fileObject: File; formData: FormData },
    isMainFile: boolean,
    mainReviewFileUpload: FileuploadComponent,
    communityImageType: ImageType
  ): Promise<void> {
    assertIsDefined(this.community);
    const file = {
      name: $event.fileObject.name,
      type: $event.fileObject.type,
      size: $event.fileObject.size,
      lastModified: $event.fileObject.lastModified,
    };
    const signedUrl = await lastValueFrom(
      this.apiService.uploadImages({
        id: this.community._id,
        createImageDTO: {
          file: file,
          communityImage: communityImageType,
        },
      })
    );
    mainReviewFileUpload.uploadFile(signedUrl, $event.fileObject, $event.formData);
  }
}
