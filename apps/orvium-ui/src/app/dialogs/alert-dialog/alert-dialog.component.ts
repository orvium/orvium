import { Component } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

import { MatButtonModule } from '@angular/material/button';

/**
 * Component AlertDialogComponent, enable generic alert dialogs
 */
@Component({
  selector: 'app-alert-dialog',
  standalone: true,
  templateUrl: './alert-dialog.component.html',
  styleUrls: ['./alert-dialog.component.scss'],
  imports: [MatIconModule, MatButtonModule, MatDialogModule],
})
export class AlertDialogComponent {
  /** Optional title of the alert dialog. */
  title?: string;

  /** Optional content of the alert dialog. */
  content?: string;

  /** Optional icon of the alert dialog. */
  icon?: string;

  /** Message displayed on the confirm button. Default is 'Confirm'.*/
  acceptMessage = 'Confirm';

  /**
   * Constructs an instance of AlertDialogComponent.
   *
   * @param {MatDialogRef<AlertDialogComponent, boolean>} dialogRef - Reference to the dialog opened.
   */
  constructor(private dialogRef: MatDialogRef<AlertDialogComponent, boolean>) {}

  /**
   * Closes the dialog and returns a true value.
   */
  confirm(): void {
    this.dialogRef.close(true);
  }
}
