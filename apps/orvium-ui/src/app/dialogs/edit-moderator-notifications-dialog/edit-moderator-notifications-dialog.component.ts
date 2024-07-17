import { Component, Inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommunityDTO, CommunityModeratorDTO, Track } from '@orvium/api';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatButtonModule } from '@angular/material/button';

/**
 * Component for editing moderator notification settings within a community.
 * Allows for specifying which tracks a moderator should receive notifications about.
 */
@Component({
  selector: 'app-edit-moderator-notifications-dialog',
  standalone: true,
  templateUrl: './edit-moderator-notifications-dialog.component.html',
  styleUrls: ['./edit-moderator-notifications-dialog.component.scss'],
  imports: [MatButtonToggleModule, ReactiveFormsModule, MatButtonModule],
})
export class EditModeratorNotificationsDialogComponent {
  /** The community related to the moderator as a DTO */
  community!: CommunityDTO;

  /** The moderator whose notification settings are being edited. */
  moderator!: CommunityModeratorDTO;

  /** Available tracks in the community for which notifications can be set. */
  communityTracks!: Track[];

  /** Form control to manage the selection of tracks for notifications. */
  editNotificationsForm: FormControl<number[] | null>;

  /**
   * Constructs the dialog component for editing moderator notifications.
   *
   * @param {MatDialogRef<EditModeratorNotificationsDialogComponent>} dialogRef Reference to the dialog.
   * @param {Object} data Contains the moderator and community tracks data.
   */
  constructor(
    public dialogRef: MatDialogRef<EditModeratorNotificationsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data: { moderator: CommunityModeratorDTO; communityTracks: Track[] }
  ) {
    this.editNotificationsForm = new FormControl<number[] | null>(
      data.moderator.notificationOptions?.tracks ?? null
    );
    this.communityTracks = data.communityTracks;
    this.moderator = data.moderator;
  }

  /**
   * Submits the selected notification settings for the moderator.
   * Closes the dialog after saving the settings.
   *
   * @param {CommunityModeratorDTO} moderator The moderator data with potentially updated notification settings.
   */
  submitNotifications(moderator: CommunityModeratorDTO): void {
    if (!this.moderator.notificationOptions) {
      this.moderator.notificationOptions = { tracks: [] };
    }
    this.moderator.notificationOptions.tracks = this.editNotificationsForm.value ?? [];
    this.dialogRef.close(moderator);
    this.editNotificationsForm.reset();
    this.editNotificationsForm.clearValidators();
  }

  /**
   * Closes the dialog without saving changes.
   */
  close(): void {
    this.dialogRef.close();
  }
}
