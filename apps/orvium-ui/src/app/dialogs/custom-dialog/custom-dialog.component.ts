import { Component, TemplateRef } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { NgTemplateOutlet } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

/**
 * Component CustomDialogComponent, enable customizable dialogs
 */
@Component({
  selector: 'app-custom-dialog',
  standalone: true,
  templateUrl: './custom-dialog.component.html',
  styleUrls: ['./custom-dialog.component.scss'],
  imports: [NgTemplateOutlet, MatIconModule, MatButtonModule, MatDialogModule],
})
export class CustomDialogComponent {
  /** Optional title of the alert dialog. */
  title?: string;

  /** Optional content of the alert dialog. */
  content?: string;

  /** Optional icon of the alert dialog. */
  icon?: string;

  /** templeate ref */
  template!: TemplateRef<unknown> | null;

  /** Flaf to enable/disable the action buttons (Cancel or Confirm) */
  showActionButtons = false;

  /** Message displayed on the cancel button. Default is 'Cancel'.*/
  cancelMessage? = 'Cancel';

  /** Message displayed on the confirm button. Default is 'Confirm'.*/
  acceptMessage? = 'Confirm';

  /**
   * Constructs an instance of ConfirmDialogComponent.
   *
   * @param {MatDialogRef<ConfirmDialogComponent, boolean>} dialogRef - Reference to the dialog opened.
   */
  constructor(private dialogRef: MatDialogRef<CustomDialogComponent, boolean>) {}

  /**
   * Closes the dialog and returns a true value indicating confirmation.
   */
  confirm(): void {
    this.dialogRef.close(true);
  }

  /**
   * Closes the dialog and returns a true value.
   */
  cancel(): void {
    this.dialogRef.close(false);
  }
}
