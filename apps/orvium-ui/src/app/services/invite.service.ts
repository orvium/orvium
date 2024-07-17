import { Injectable } from '@angular/core';
import { AppSnackBarService } from './app-snack-bar.service';
import { ProfileService } from '../profile/profile.service';
import { UserPrivateDTO } from '@orvium/api';
import { InviteDialogComponent } from '../dialogs/invite-dialog/invite-dialog.component';
import { DialogService } from '../dialogs/dialog.service';

/**
 * Provides a service to handle the invitation dialog functionality within an application.
 * This service integrates with several other services including snackbar notifications and dialog management
 * to facilitate the invitation process based on the user's authentication and profile completion status.
 */
@Injectable({
  providedIn: 'root',
})
export class InviteService {
  /** User's private profile information, typically required for validating access to the invite feature. */
  profile!: UserPrivateDTO;

  /**
   * Constructs the InviteService with necessary service dependencies.
   *
   * @param {AppSnackBarService} snackBar - Service for displaying snackbar notifications.
   * @param {ProfileService} profileService - Service to access user's profile information.
   * @param {DialogService} dialogService - Service to handle opening various dialog windows.
   */
  constructor(
    private snackBar: AppSnackBarService,
    private profileService: ProfileService,
    public dialogService: DialogService
  ) {}

  /**
   * Opens the invitation dialog if the user's profile is loaded and meets certain conditions.
   */
  openInviteDialog(): void {
    const profile = this.profileService.profile.getValue();

    if (!profile) {
      this.snackBar.error('You need to log in first to use this feature');
      return;
    }
    if (!profile.isOnboarded) {
      this.snackBar.info('You need to complete your profile first');
      return;
    }
    this.dialogService.open(InviteDialogComponent);
  }
}
