import { Component, DestroyRef, inject, OnInit, ViewChild } from '@angular/core';
import { finalize, map, startWith } from 'rxjs/operators';
import { lastValueFrom, Observable } from 'rxjs';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocomplete, MatAutocompleteModule } from '@angular/material/autocomplete';
import { DisciplinesService } from '../../services/disciplines.service';
import { ProfileService } from '../profile.service';
import {
  DefaultService,
  DisciplineDTO,
  ProfileImageType,
  SignedUrlDTO,
  UserPrivateDTO,
  UserType,
} from '@orvium/api';
import { Title } from '@angular/platform-browser';
import { OnExit } from '../../shared/guards/exit.guard';
import { BreakpointObserver } from '@angular/cdk/layout';
import { ENTER, SEMICOLON } from '@angular/cdk/keycodes';
import { USERTYPE_LOV } from '../../model/orvium';
import { environment } from '../../../environments/environment';
import { HttpResponse } from '@angular/common/http';
import { assertIsDefined, isNotNullOrUndefined } from '../../shared/shared-functions';
import {
  ACCEPT_TYPES,
  FileuploadComponent,
  MAX_FILE_SIZE,
} from '../../shared/fileupload/fileupload.component';
import { AppSnackBarService } from '../../services/app-snack-bar.service';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { AsyncPipe, TitleCasePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSelectModule } from '@angular/material/select';
import { InputWithChipsComponent } from '../../shared/input-with-chips/input-with-chips.component';
import { InfoToolbarComponent } from '../../shared/info-toolbar/info-toolbar.component';
import { MatInputModule } from '@angular/material/input';
import { AlertComponent } from '../../shared/alert/alert.component';
import { DialogService } from '../../dialogs/dialog.service';
import { AvatarDirective } from '../../shared/directives/avatar.directive';
import { MatDividerModule } from '@angular/material/divider';
import { DeleteDialogComponent } from '../../dialogs/delete-dialog/delete-dialog.component';
import { OverlayLoadingDirective } from '../../spinner/overlay-loading.directive';
import { AuthenticationService } from '../../auth/authentication.service';
import { MatDialogConfig } from '@angular/material/dialog';
import { BREAKPOINTS } from '../../layout/breakpoints';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  validateIsNotBlank,
  validateLinkedin,
  validateOrcid,
  validateURL,
} from '../../shared/AppCustomValidators';

/**
 * Interface representing the form group structure for a user's complete profile information.
 *
 * @property {FormControl<string>} firstName - FormControl for the user's first name.
 * @property {FormControl<string>} lastName - FormControl for the user's last name.
 * @property {FormControl<string>} orcid - FormControl for the user's ORCID identifier.
 * @property {FormControl<string>} linkedin - FormControl for the user's LinkedIn URL.
 * @property {FormControl<string>} blog - FormControl for the URL of the user's blog or personal website.
 * @property {FormControl<string>} role - FormControl for the user's role or position.
 * @property {FormControl<string>} aboutMe - FormControl for the user's biographical description.
 * @property {FormControl<string[]>} institutions - FormControl for the array of institutions with which the user is affiliated.
 * @property {FormControl<UserType>} userType - FormControl for the user's type, categorized by specific roles or permissions.
 * @property {FormControl<string[]>} disciplines - FormControl for the array of academic or professional disciplines associated with the user.
 */
export interface ProfileFormGroup {
  firstName: FormControl<string>;
  lastName: FormControl<string>;
  orcid: FormControl<string>;
  linkedin: FormControl<string>;
  blog: FormControl<string>;
  role: FormControl<string>;
  aboutMe: FormControl<string>;
  institutions: FormControl<string[]>;
  userType: FormControl<UserType>;
  disciplines: FormControl<string[]>;
}
/**
 * Interface representing the form group structure for a user's banner configuration.
 *
 * @property {FormControl<string>} bannerURL - FormControl for the URL of the user's personal or profile banner image.
 */
export interface BannerFormGroup {
  bannerURL: FormControl<string>;
}

/**
 * Component for managing and displaying user profiles. This component provides
 * a comprehensive interface for users to view and edit their profile details,
 * including personal information, academic or professional affiliations, and more.
 */
@Component({
  selector: 'app-profile',
  standalone: true,
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  imports: [
    MatChipsModule,
    MatIconModule,
    TitleCasePipe,
    RouterLink,
    MatTooltipModule,
    MatButtonModule,
    ReactiveFormsModule,
    MatExpansionModule,
    MatSelectModule,
    AsyncPipe,
    FileuploadComponent,
    InputWithChipsComponent,
    InfoToolbarComponent,
    MatAutocompleteModule,
    MatInputModule,
    AlertComponent,
    AvatarDirective,
    MatDividerModule,
    DeleteDialogComponent,
    OverlayLoadingDirective,
  ],
})
export class ProfileComponent implements OnInit, OnExit {
  /** Reference for destroying the component */
  private destroyRef = inject(DestroyRef);

  /** ViewChild reference to the MatAutocomplete component for disciplines */
  @ViewChild('autoCompleteDisciplines', { read: MatAutocomplete })
  matAutocomplete?: MatAutocomplete;

  /** Currently logged in user's profile information */
  profile?: UserPrivateDTO;

  /** Observable for filtered disciplines based on user input */
  filteredDisciplines$?: Observable<DisciplineDTO[]>;

  /**
   * FormGroup for managing profile form inputs
   */
  profileFormGroup = this.formBuilder.nonNullable.group<ProfileFormGroup>({
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
    linkedin: new FormControl<string>('', {
      nonNullable: true,
      validators: validateLinkedin,
    }),
    blog: new FormControl<string>('', {
      nonNullable: true,
      validators: validateURL,
    }),
    role: new FormControl<string>('', { nonNullable: true }),
    aboutMe: new FormControl<string>('', { nonNullable: true }),
    institutions: new FormControl<string[]>([], { nonNullable: true }),
    userType: new FormControl<UserType>(UserType.Academic, {
      nonNullable: true,
      validators: Validators.required,
    }),
    disciplines: new FormControl<string[]>([], { nonNullable: true }),
  });

  /**
   * FormGroup for managing banner image URL
   */
  bannerFormGroup = this.formBuilder.nonNullable.group<BannerFormGroup>({
    bannerURL: new FormControl('', {
      nonNullable: true,
    }),
  });

  /** FormControl for disciplines, aiding in autocomplete and selection */
  disciplinesControl = new FormControl('');

  /** Lookup values for user types */
  userType = USERTYPE_LOV;

  /**
   * Flags for UI focus control on first name and last name fields
   */
  focusFirstName?: boolean;
  focusLastName?: boolean;

  /**
   * Text bodies for deletion and information request modals
   */
  deleteAccountBody!: string;
  requestInformationBody!: string;

  /** Mobile responsiveness indicator */
  isMobile = false;

  /** Configuration for institution input field separators */
  institutionSeparators = [ENTER, SEMICOLON];

  /** Accepted file types for uploads */
  ACCEPT_TYPES = ACCEPT_TYPES;

  /**
   * Maximum file size configurations for avatar and banner images
   */
  defaultAvatarMaxFileSize = MAX_FILE_SIZE.KB_50;
  defaultBannerMaxFileSize = MAX_FILE_SIZE.KB_500;

  /** Profile image type enumeration for component context */
  profileImageType = ProfileImageType;

  /**  Array of discipline DTOs for autocomplete suggestions */
  private disciplines: DisciplineDTO[] = [];

  /** Environment configuration access defined in .env file */
  environment = environment;

  /** Current timestamp for component instance creation */
  actualTimeStamp = Date.now();

  /** Indicator for whether notifications are enabled for the profile */
  hasNotificationsEnabled: boolean | undefined = false;

  /** Flag indicating whether the account can be deleted */
  accountUndeletable = false;

  /** Loading indicator for asynchronous operations */
  loading = false;

  /** Current email value for the profile; possibly awaiting confirmation */
  email = '';

  /**
   * Constructor for the ProfileComponent.
   *
   * @param {FormBuilder} formBuilder - Provides syntactic sugar to reduce redundancy in form control creation.
   * @param {AppSnackBarService} snackBarService - Service to display snack bar notifications.
   * @param {ProfileService} profileService - Service to manage and retrieve user profile data.
   * @param {DisciplinesService} disciplinesService - Service to retrieve discipline data for dropdowns and autocomplete.
   * @param {DialogService} dialogService - Service to handle opening of dialog windows.
   * @param {Title} titleService - Service to set the title of the document displayed in the title bar.
   * @param {BreakpointObserver} breakpointObserver - Service to access media query match results.
   * @param {Router} router - Angular Router for navigating among views and URL manipulation.
   * @param {DefaultService} apiService - API service for backend communication.
   * @param {AuthenticationService} authService - Service for handling authentication operations.
   */
  constructor(
    private formBuilder: FormBuilder,
    public snackBarService: AppSnackBarService,
    private profileService: ProfileService,
    private disciplinesService: DisciplinesService,
    public dialogService: DialogService,
    private titleService: Title,
    public breakpointObserver: BreakpointObserver,
    public router: Router,
    private apiService: DefaultService,
    private authService: AuthenticationService
  ) {
    this.titleService.setTitle('Edit Profile');
  }

  /**
   * Lifecycle hook that is called after Angular has initialized all data-bound properties of a directive.
   */
  ngOnInit(): void {
    // Get profile
    this.profileService
      .getProfile()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(profile => {
        if (profile) {
          this.refreshProfile(profile);
        }
      });

    //Get if push notifications are enabled
    this.profileService.pushNotifications.subscribe(enabled => {
      this.hasNotificationsEnabled = enabled;
    });

    this.breakpointObserver.observe(BREAKPOINTS.MOBILE).subscribe(result => {
      this.isMobile = result.matches;
    });

    this.disciplinesService.getDisciplines().subscribe(disciplines => {
      this.disciplines = disciplines;

      this.filteredDisciplines$ = this.disciplinesControl.valueChanges.pipe(
        startWith(null),
        map(discipline => this.filterDisciplines(discipline))
      );
    });
  }

  /**
   * Handles the component's custom onExit behavior which prompts the user to save changes if any form data has been modified.
   *
   * @returns {Observable<boolean> | boolean} - Observable that resolves to a boolean or a direct boolean value, indicating if navigation should proceed.
   */
  onExit(): Observable<boolean> | boolean {
    if (!this.profileFormGroup.dirty) {
      return true;
    }

    const dialog = this.dialogService
      .openConfirm({
        title: 'Exit Profile',
        content: 'Are you sure you want to exit? You have unsaved changes that will be lost.',
        cancelMessage: 'Cancel',
        acceptMessage: 'Ok',
      })
      .afterClosed()
      .pipe(map(value => !!value));

    return dialog;
  }

  /**
   * Handles input value changes for the disciplines form control.
   *
   * @param {string} value - The input value from the discipline input field.
   */
  onInputValueChange(value: string): void {
    this.disciplinesControl.setValue(value);
  }

  /**
   * Saves the current state of the profile form group to the profileService.
   */
  save(): void {
    this.profileService.updateProfile(this.profileFormGroup.value).subscribe(profile => {
      this.refreshProfile(profile);
      this.snackBarService.info('Profile saved');
    });
  }

  /**
   * Refreshes the profile details on the component by loading the latest profile information.
   *
   * @param {UserPrivateDTO} profile - The profile data to load.
   */
  refreshProfile(profile: UserPrivateDTO): void {
    this.profile = profile;
    this.email = profile.email ?? '';
    this.profileFormGroup.reset({ ...this.profile });
    this.bannerFormGroup.reset({ bannerURL: this.profile.bannerURL });
    this.profileFormGroup.markAsPristine();
    this.deleteAccountBody = encodeURIComponent(
      `I require to delete my account and all the private data attached to it. User ID ${this.profile._id} .`
    );
    this.requestInformationBody = encodeURIComponent(
      `I require to obtain all the information related to my profile. User Id ${this.profile._id} .`
    );
  }

  /**
   * Filters disciplines based on the user's input.
   *
   * @param {string | null} value - The current value of the discipline input field.
   * @returns {DisciplineDTO[]} - An array of filtered disciplines.
   */
  private filterDisciplines(value: string | null): DisciplineDTO[] {
    if (value) {
      const filterValue = value.toLowerCase();

      return this.disciplines
        .filter(
          discipline =>
            discipline.name.toLowerCase().includes(filterValue) &&
            !this.profileFormGroup.controls.disciplines.value.includes(discipline.name)
        )
        .slice(0, 50);
    } else {
      return this.disciplines
        .filter(
          discipline => !this.profileFormGroup.controls.disciplines.value.includes(discipline.name)
        )
        .slice(0, 50);
    }
  }
  /**
   * Handles the file upload event, confirming the upload of user images and updating the profile.
   *
   * @param {object} $event - Contains the HttpResponse and the File list along with a signed URL payload.
   * @param {ProfileImageType} profileImage - Specifies the type of image being uploaded (e.g., avatar, banner).
   * @returns {Promise<void>} - A promise that resolves when the upload is confirmed and the profile is updated.
   */
  async filesUploaded(
    $event: {
      originalEvent: HttpResponse<unknown>;
      files: File[];
      payload: SignedUrlDTO;
    },
    profileImage: ProfileImageType
  ): Promise<void> {
    assertIsDefined(this.profile, 'profile not found');

    const profile = await lastValueFrom(
      this.apiService.uploadUserImagesConfirmation({
        profileUploadConfirmation: {
          imageType: profileImage,
          fileMetadata: {
            filename: $event.files[0].name,
            description: $event.files[0].name,
            contentType: $event.files[0].type,
            contentLength: $event.files[0].size,
            tags: ['Profile'],
          },
        },
      })
    );
    /* Used to force the profile image update */
    this.actualTimeStamp = Date.now();
    if (profile.avatar) {
      profile.avatar = profile.avatar + '?lastmod=' + this.actualTimeStamp.toString();
    }
    this.refreshProfile(profile);

    this.snackBarService.info('Image uploaded, will take some time to take effect');
  }

  /**
   * Validates if the form data can be uploaded based on the current state of the profile form group.
   *
   * @param {$event} unknown - The event object that could contain various data, unused here.
   * @returns {boolean} - Returns true if the form is pristine; otherwise, it returns false and displays an error message.
   */
  beforeUpload($event: unknown): boolean {
    if (!this.profileFormGroup.pristine) {
      this.snackBarService.error('Save your data first');
      return false;
    } else {
      return true;
    }
  }

  /**
   * Generates a signed URL for uploading profile images and initiates the upload through a file upload component.
   *
   * @param {object} $event - Contains the file object and additional form data.
   * @param {boolean} isMainFile - Indicates if the file is the main file.
   * @param {FileuploadComponent} mainReviewFileUpload - The component responsible for uploading the file.
   * @param {ProfileImageType} profileImageType - Specifies the type of profile image being uploaded.
   * @returns {Promise<void>} - A promise that resolves when the signed URL is obtained and the file upload is initiated.
   */
  async generateSignedUrl(
    $event: { fileObject: File; formData: FormData },
    isMainFile: boolean,
    mainReviewFileUpload: FileuploadComponent,
    profileImageType: ProfileImageType
  ): Promise<void> {
    assertIsDefined(this.profile);
    const file = {
      name: $event.fileObject.name,
      type: $event.fileObject.type,
      size: $event.fileObject.size,
      lastModified: $event.fileObject.lastModified,
    };

    const signedUrl = await lastValueFrom(
      this.apiService.uploadProfileImages({
        createProfileImageDTO: {
          file: file,
          profileImage: profileImageType,
        },
      })
    );

    mainReviewFileUpload.uploadFile(signedUrl, $event.fileObject, $event.formData);
  }

  /**
   * Sends a dummy notification request to the server.
   */
  testNotification(): void {
    this.apiService.dummyNotification().subscribe();
  }

  /**
   * Initiates the account deletion process by opening a confirmation dialog and performing the deletion if confirmed.
   */
  deleteAccount(): void {
    this.dialogService
      .open(DeleteDialogComponent, {} as MatDialogConfig<boolean>)
      .afterClosed()
      .pipe(isNotNullOrUndefined())
      .subscribe(accept => {
        if (accept) {
          this.loading = true;
          this.apiService
            .deleteProfile()
            .pipe(finalize(() => (this.loading = false)))
            .subscribe({
              next: () => {
                this.authService.logoffUserDeleted();
              },
              error: error => {
                this.accountUndeletable = true;
                throw error;
              },
            });
        }
      });
  }

  /**
   * Requests and displays the user's personal data.
   */
  requestData(): void {
    this.apiService.requestData().subscribe(personalData => {
      this.dialogService.openAlert({
        title: 'Your data',
        content: personalData.data,
      });
    });
  }
}
