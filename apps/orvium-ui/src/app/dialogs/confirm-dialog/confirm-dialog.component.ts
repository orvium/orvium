import { Component } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

import { MatButtonModule } from '@angular/material/button';

/**
 * Component ConfirmDialogComponent, enable generic confirmation dialogs
 */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss'],
  imports: [MatIconModule, MatButtonModule, MatDialogModule],
})
export class ConfirmDialogComponent {
  /** Optional title of the alert dialog. */
  title?: string;

  /** Optional content of the alert dialog. */
  content?: string;

  /** Optional icon of the alert dialog. */
  icon?: string;

  /** Message displayed on the cancel button. Default is 'Cancel'.*/
  cancelMessage = 'Cancel';

  /** Message displayed on the confirm button. Default is 'Confirm'.*/
  acceptMessage = 'Confirm';

  /**
   * Constructs an instance of ConfirmDialogComponent.
   *
   * @param {MatDialogRef<ConfirmDialogComponent, boolean>} dialogRef - Reference to the dialog opened.
   */
  constructor(private dialogRef: MatDialogRef<ConfirmDialogComponent, boolean>) {}

  /**
   * Closes the dialog and returns a true value indicating confirmation.
   */
  confirm(): void {
    this.dialogRef.close(true);
  }

  /**
   * Closes the dialog and returns a false value indicating cancellation.
   */
  cancel(): void {
    this.dialogRef.close(false);
  }
}
