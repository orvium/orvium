import { Component, OnInit, ViewChild } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { map, takeWhile, tap } from 'rxjs/operators';
import { Observable, of, timer } from 'rxjs';
import { ProfileService } from '../profile.service';
import { DefaultService, UserPrivateDTO } from '@orvium/api';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { AppSnackBarService } from '../../services/app-snack-bar.service';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { AlertComponent } from '../../shared/alert/alert.component';
import { AvatarDirective } from '../../shared/directives/avatar.directive';
import { validateEmail } from '../../shared/AppCustomValidators';
import { HttpErrorResponse } from '@angular/common/http';

/**
 * Interface representing the form to input a user's code for confirmation or validation purposes.
 *
 * @property {FormControl<string>} code - FormControl for user's unique code, often used for verification processes.
 */
interface UserCodeForm {
  code: FormControl<string>;
}

/**
 * Interface representing the form structure for a user's profile information.
 *
 * @property {FormControl<string | undefined>} emailPendingConfirmation - FormControl for the email address that is pending confirmation.
 * @property {FormControl<string>} firstName - FormControl for the user's first name.
 * @property {FormControl<string>} lastName - FormControl for the user's last name.
 * @property {FormControl<boolean>} acceptedTC - FormControl to capture whether the user has accepted the terms and conditions.
 */
interface UserProfileForm {
  emailPendingConfirmation: FormControl<string | undefined>;
  firstName: FormControl<string>;
  lastName: FormControl<string>;
  acceptedTC: FormControl<boolean>;
}

/**
 * Component for managing user onboarding processes including profile setup, account linking,
 * and email verification.
 */
@Component({
  selector: 'app-onboarding',
  standalone: true,
  templateUrl: './onboarding.component.html',
  styleUrls: ['./onboarding.component.scss'],
  imports: [
    MatStepperModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatButtonModule,
    MatTooltipModule,
    MatIconModule,
    AlertComponent,
    AvatarDirective,
  ],
})
export class OnboardingComponent implements OnInit {
  /** The user's profile information. */
  profile!: UserPrivateDTO;

  /**
   * FormGroup for managing user profile input during onboarding.
   */
  userProfileFormGroup = this.formBuilder.nonNullable.group<UserProfileForm>({
    emailPendingConfirmation: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, validateEmail],
      asyncValidators: this.validateDomain.bind(this),
    }),
    firstName: new FormControl('', { nonNullable: true, validators: Validators.required }),
    lastName: new FormControl('', { nonNullable: true, validators: Validators.required }),
    acceptedTC: new FormControl(false, {
      nonNullable: true,
      validators: Validators.required,
    }),
  });

  /**
   * FormGroup for managing user code input during email verification.
   */
  userCodeFormGroup = this.formBuilder.nonNullable.group<UserCodeForm>({
    code: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(6),
        Validators.pattern('^[0-9]*$'),
      ],
    }),
  });

  /** The user's avatar URL, if available. */
  avatar = '';

  /** The user's gravatar URL, if available. */
  gravatar = '';

  /** Stores any errors that occur during the onboarding process. */
  onboardingError = '';

  /** Countdown timer for resend button to prevent spamming. */
  resendButtonWait = 20;

  /**  Reference to the MatStepper component in the template, used for navigating between steps. */
  @ViewChild('stepper') private stepper!: MatStepper;

  /**  Flag to indicate whether the linking accounts process is currently enabled. */
  linkingAccountsProcessEnabled = false;

  /** Message displayed during the linking accounts process. */
  linkAccountsMessage = '';

  /**
   * Constructs the OnboardingComponent with necessary dependencies.
   *
   * @param {FormBuilder} formBuilder - Provides an API to build form controls.
   * @param {DefaultService} apiService - Service for making API calls.
   * @param {ProfileService} profileService - Service to manage user profile information.
   * @param {Router} router - Service to navigate among views.
   * @param {AppSnackBarService} snackBar - Service to display snack bar notifications.
   */
  constructor(
    private formBuilder: FormBuilder,
    private apiService: DefaultService,
    private profileService: ProfileService,
    private router: Router,
    private snackBar: AppSnackBarService
  ) {}

  /**
   * OnInit lifecycle hook to fetch the user profile and initialize form values.
   */
  ngOnInit(): void {
    this.profileService.getProfileFromApi().subscribe(profile => {
      this.profile = profile;
      this.refresh();
      this.populateFormOnLoad(this.profile);
    });
  }

  /**
   * Validates if the provided email domain is allowed for registration.
   *
   * @param {AbstractControl} control - The form control element containing the email.
   * @returns {Observable<ValidationErrors | null>} An observable emitting the validation result.
   */
  validateDomain(control: AbstractControl): Observable<ValidationErrors | null> {
    if (typeof control.value !== 'string') {
      return of({ invalidDomain: 'The domain is not a valid domain' });
    }
    const domain = control.value.replace(/.*@/, '');
    return this.apiService
      .isDomainBlocked({ domain: domain })
      .pipe(
        map(invalidDomain =>
          invalidDomain ? { invalidDomain: `The domain "${domain}" is not a valid domain` } : null
        )
      );
  }

  /**
   * Pre-populates the onboarding form with user profile data fetched from the API.
   *
   * @param {UserPrivateDTO} profile - User profile data to populate the form.
   */
  populateFormOnLoad(profile: UserPrivateDTO): void {
    this.userProfileFormGroup.setValue({
      emailPendingConfirmation: profile.email ?? profile.emailPendingConfirmation,
      firstName: profile.firstName,
      lastName: profile.lastName,
      acceptedTC: profile.acceptedTC,
    });

    this.gravatar = profile.gravatar ?? '';
    this.avatar = profile.avatar ?? '';
  }

  /**
   * Saves the user profile data to the server and proceeds to the next step in the onboarding process.
   */
  save(): void {
    this.linkingAccountsProcessEnabled = false;
    this.onboardingError = '';
    this.profileService.updateProfile(this.userProfileFormGroup.value).subscribe({
      next: res => {
        this.profile = res;
        this.stepper.next();
        if (this.profile.emailPendingConfirmation) {
          this.sendConfirmationEmail();
        }
      },
      error: err => {
        // If conflict status code, then another account is already registered with the same email
        if (err instanceof HttpErrorResponse && err.status === 409) {
          this.linkingAccountsProcessEnabled = true;
          this.sendConfirmationEmail();
          this.stepper.next();
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          this.linkAccountsMessage = err.error.message;
        } else {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          this.onboardingError = err?.error?.message ?? 'Onboarding error';
        }
      },
    });
  }

  /**
   * Refreshes the user profile data from the API.
   */
  refresh(): void {
    this.profileService.getProfileFromApi().subscribe(response => {
      this.profile = response;
    });
  }

  /**
   * Initiates sending a confirmation email to the user's email address.
   */
  sendConfirmationEmail(): void {
    this.resendButtonWait = 20;

    timer(1000, 1000) //Initial delay 1 seconds and interval countdown also 1 second
      .pipe(
        takeWhile(() => this.resendButtonWait > 0),
        tap(() => this.resendButtonWait--)
      )
      .subscribe();

    this.apiService.sendConfirmationEmail().subscribe(response => {
      this.snackBar.info('Confirmation email sent');
    });
  }

  /**
   * Confirms the user's email address using the provided code.
   */
  confirmEmail(): void {
    this.profileService
      .confirmEmail(this.userCodeFormGroup.getRawValue().code)
      .subscribe(result => {
        if (!result.success) {
          this.snackBar.error(result.message);
        } else {
          this.snackBar.info(result.message);
          this.linkingAccountsProcessEnabled = false;
          this.refresh();
        }
      });
  }

  /**
   * Completes the onboarding process and navigates the user to their profile page.
   */
  completeOnboarding(): void {
    this.profileService.updateProfile({ isOnboarded: true }).subscribe(response => {
      this.profileService.profile.next(response);
      void this.router.navigate(['/profile']);
    });
  }
}
