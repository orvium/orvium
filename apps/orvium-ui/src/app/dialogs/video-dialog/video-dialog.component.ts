import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { TrustUrlPipe } from '../../pipes/trustUrl.pipe';

/**
 * Component to display a video dialog with configurable content and action buttons.
 * It uses a trusted URL pipe to ensure the video URLs are safe to embed.
 */
@Component({
  selector: 'app-video-dialog',
  standalone: true,
  templateUrl: './video-dialog.component.html',
  styleUrls: ['./video-dialog.component.scss'],
  imports: [TrustUrlPipe],
})
export class VideoDialogComponent {
  /** The URL of the video to be displayed in the dialog. */
  videoUrl!: string;

  /** The type of the video, which helps the browser understand what type of video is being handled. */
  videoType!: string;

  /** A boolean to determine whether action buttons should be displayed in the dialog. */
  showActionButtons = false;

  /**
   * Constructs the video dialog component with a reference to its dialog container.
   *
   * @param {MatDialogRef<VideoDialogComponent, boolean>} dialogRef Reference to the dialog that was opened.
   */
  constructor(private dialogRef: MatDialogRef<VideoDialogComponent, boolean>) {}

  /**
   * Closes the dialog and returns true to indicate a confirmation action was taken.
   */
  confirm(): void {
    this.dialogRef.close(true);
  }

  /**
   * Closes the dialog and returns false to indicate a cancellation action was taken.
   */
  cancel(): void {
    this.dialogRef.close(false);
  }
}
