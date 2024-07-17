import { Component, Input, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { ProfileService } from '../../profile/profile.service';
import {
  CreateInviteDTO,
  DefaultService,
  DepositPopulatedDTO,
  InviteType,
  UserPrivateDTO,
} from '@orvium/api';
import { AppSnackBarService } from '../../services/app-snack-bar.service';
import { assertIsDefined } from '../../shared/shared-functions';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { MatButtonModule } from '@angular/material/button';
import { OverlayLoadingDirective } from '../../spinner/overlay-loading.directive';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DialogService } from '../../dialogs/dialog.service';
import { MatDialogModule } from '@angular/material/dialog';
import { DomSanitizer } from '@angular/platform-browser';
import { ReviewHtmlPreviewComponent } from '../../review/review-html-preview/review-html-preview.component';
import { validateDateBeforeNow, validateEmail } from '../../shared/AppCustomValidators';

/**
 * Interface representing the form controls for an invitation.
 *
 * @property {FormControl<string>} email - The email address of the invitee.
 * @property {FormControl<string>} name - The name of the invitee.
 * @property {FormControl<string | null>} message - An optional message to include with the invitation.
 * @property {FormControl<Date | null>} dateLimit - The optional date limit for the invitation.
 */
interface InviteForm {
  email: FormControl<string>;
  name: FormControl<string>;
  message: FormControl<string | null>;
  dateLimit: FormControl<Date | null>;
}

/** Component for manage invites for reviews, including functionalities to create invites */
@Component({
  selector: 'app-invite-reviewers-dialog',
  standalone: true,
  templateUrl: './invite-reviewers-dialog.component.html',
  styleUrls: ['./invite-reviewers-dialog.component.scss'],
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    OverlayLoadingDirective,
    MatDatepickerModule,
    MatDialogModule,
    ReviewHtmlPreviewComponent,
  ],
})
export class InviteReviewersDialogComponent implements OnInit {
  /** Template reference for the review preview */
  @ViewChild('reviewPreviewTemplate')
  reviewPreviewTemplate!: TemplateRef<unknown>;

  /** The type of invitation, either for a reviewer or a copy editor. */
  @Input() invitationType: InviteType = InviteType.Review;

  /** The deposit for which the invitation is being sent.  */
  @Input({ required: true }) deposit!: DepositPopulatedDTO;

  /** Title for the invitation dialog template. */
  public templateTitle!: string;

  /** Description for the invitation dialog template. */
  public templateDescription!: string;

  /** Name label for the invitation dialog template. */
  public templateName!: string;

  /** Message label for the invitation dialog template. */
  public templateMessage!: string;

  /** Input label for the email field in the invitation dialog template. */
  public templateInputLabel!: string;

  /** User profile data of the currently logged-in user. */
  profile?: UserPrivateDTO;

  /** Form group for the invitation form. */
  inviteForm = this.formBuilder.group<InviteForm>({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, validateEmail],
    }),
    name: new FormControl('', { nonNullable: true, validators: Validators.required }),
    message: new FormControl(''),
    dateLimit: new FormControl<Date | null>(null, {
      validators: validateDateBeforeNow,
    }),
  });

  /** Indicates whether the invitation is currently being created. */
  creatingInvitation = false;

  /** HTML content for the review. */
  reviewHtml?: string;

  /**
   * Constructs a new instance of the InviteReviewersDialogComponent.
   *
   * @param {FormBuilder} formBuilder - Service to create form groups and controls.
   * @param {DefaultService} apiService - Service to make API calls.
   * @param {ProfileService} profileService - Service to manage user profile data.
   * @param {AppSnackBarService} snackBar - Service to display snack bar messages.
   * @param {DialogService} dialogService - Service to manage dialogs.
   * @param {DomSanitizer} domSanitizer - Service to sanitize HTML content.
   */
  constructor(
    private formBuilder: FormBuilder,
    private apiService: DefaultService,
    private profileService: ProfileService,
    private snackBar: AppSnackBarService,
    public dialogService: DialogService,
    private domSanitizer: DomSanitizer
  ) {}

  /**
   * Initializes the component by setting up the invite form and loading the user profile.
   */
  ngOnInit(): void {
    assertIsDefined(this.deposit, 'Input deposit is undefined');
    this.profileService.getProfile().subscribe(profile => {
      this.profile = profile;
    });

    let userInvitationType = 'Reviewer';
    if (this.invitationType === InviteType.CopyEditing) {
      userInvitationType = 'Copy Editor';
    }

    this.templateTitle = `Invite ${userInvitationType}`;
    this.templateDescription = `An invite email will be sent to the ${userInvitationType}`;
    this.templateInputLabel = `${userInvitationType} email`;
    this.templateName = `${userInvitationType} name`;
    this.templateMessage = 'A message you want to send with the invitation';
  }

  /**
   * Creates an invitation for a reviewer or copy editor based on the form input.
   */
  createInvitation(): void {
    const invitation: CreateInviteDTO = {
      inviteType: this.invitationType,
      addressee: this.inviteForm.getRawValue().email,
      data: {
        depositId: this.deposit._id,
        reviewerName: this.inviteForm.getRawValue().name,
        message: this.inviteForm.getRawValue().message ?? '',
        dateLimit: this.inviteForm.getRawValue().dateLimit ?? undefined,
      },
    };

    this.creatingInvitation = true;
    this.apiService
      .createInvite({ createInviteDTO: invitation })
      .pipe(
        finalize(() => {
          this.creatingInvitation = false;
          this.dialogService.closeAll();
          this.inviteForm.reset();
        })
      )
      .subscribe(() => {
        this.snackBar.info('Invitation sent successfully');
      });
  }

  /**
   * Creates a test invitation and opens a dialog to preview the invitation email.
   */
  createTestInvitation(): void {
    const invitation: CreateInviteDTO = {
      inviteType: this.invitationType,
      addressee: this.inviteForm.getRawValue().email,
      data: {
        depositId: this.deposit._id,
        reviewerName: this.inviteForm.getRawValue().name,
        message: this.inviteForm.getRawValue().message ?? '',
      },
    };

    this.creatingInvitation = true;
    this.apiService
      .postInvitePreview({ createInviteDTO: invitation })
      .pipe(
        finalize(() => {
          this.creatingInvitation = false;
        })
      )
      .subscribe(htmlPreview => {
        this.domSanitizer.bypassSecurityTrustHtml(htmlPreview.html);
        this.reviewHtml = htmlPreview.html;
        this.dialogService.openCustom({
          template: this.reviewPreviewTemplate,
          showActionButtons: false,
        });
      });
  }
}
