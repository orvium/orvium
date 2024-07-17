import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ShareService } from 'ngx-sharebuttons';
import { environment } from '../../../environments/environment';
import { ProfileService } from '../../profile/profile.service';
import { AppSnackBarService } from '../../services/app-snack-bar.service';
import { DefaultService } from '@orvium/api';
import { MatCardModule } from '@angular/material/card';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { CopyToClipboardDirective } from '../../shared/directives/copy-to-clipboard.directive';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { InputWithChipsComponent } from '../../shared/input-with-chips/input-with-chips.component';
import { DialogService } from '../dialog.service';
import { MatDialogModule } from '@angular/material/dialog';
import { validateEmails } from '../../shared/AppCustomValidators';

/**
 * Interface defining the structure of the form used to send email invitations.
 *
 * @property {FormControl<string[]>} emails - An array of email addresses as FormControl.
 */
interface SendEmailForm {
  emails: FormControl<string[]>;
}

/**
 * Component for rendering an invitation dialog that allows users to send email invites.
 */
@Component({
  selector: 'app-invite-dialog',
  standalone: true,
  templateUrl: './invite-dialog.component.html',
  styleUrls: ['./invite-dialog.component.scss'],
  imports: [
    MatCardModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatButtonModule,
    CopyToClipboardDirective,
    MatIconModule,
    MatInputModule,
    InputWithChipsComponent,
    MatDialogModule,
  ],
})
export class InviteDialogComponent implements OnInit {
  /**
   * Form group for managing the input of email addresses.
   */
  public sendEmailFormGroup = this.formBuilder.nonNullable.group<SendEmailForm>({
    emails: new FormControl<string[]>([], {
      nonNullable: true,
      validators: [Validators.required, validateEmails],
    }),
  });

  /** Invitation link generated for users to share. */
  public inviteLink = '';

  /**
   * Constructs the invite dialog component with necessary services.
   *
   * @param {FormBuilder} formBuilder Service for creating form groups and controls dynamically.
   * @param {AppSnackBarService} snackBar Service for displaying snack-bar notifications.
   * @param {ProfileService} profileService Service for accessing user profile data.
   * @param {DefaultService} apiService Service for making API calls.
   * @param {ShareService} share Service to facilitate sharing functionalities.
   * @param {DialogService} dialogService Service to manage dialog operations.
   */
  constructor(
    private formBuilder: FormBuilder,
    private snackBar: AppSnackBarService,
    private profileService: ProfileService,
    private apiService: DefaultService,
    public share: ShareService,
    public dialogService: DialogService
  ) {}

  /**
   * Initializes the component by constructing the invitation link using the user's invite token.
   */
  ngOnInit(): void {
    const inviteToken = this.profileService.profile.getValue()?.inviteToken;
    this.inviteLink = `${environment.publicUrl}/profile/invite?inviteToken=${inviteToken ?? ''}`;
  }

  /**
   * Sends the invitations to the emails specified in the form and closes the dialog.
   */
  public send(): void {
    this.apiService
      .sendInvitations({ sendInviteBody: { emails: this.sendEmailFormGroup.getRawValue().emails } })
      .subscribe(() => {
        this.snackBar.info('Thank you for inviting your colleagues!');
      });
    this.dialogService.closeAll();
  }

  /**
   * Closes the dialog without performing any action.
   */
  public onNoClick(): void {
    this.dialogService.closeAll();
  }
}
