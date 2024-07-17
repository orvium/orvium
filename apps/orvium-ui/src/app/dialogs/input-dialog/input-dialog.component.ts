import { Component } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';

import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/**
 * Component for rendering a generic input dialog where users can input text.
 * This dialog can optionally use a textarea for longer text inputs.
 */
@Component({
  selector: 'app-input-dialog',
  standalone: true,
  templateUrl: './input-dialog.component.html',
  styleUrls: ['./input-dialog.component.scss'],
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
  ],
})
export class InputDialogComponent {
  /** Optional title for the dialog */
  title?: string;

  /** Content description to be displayed in the dialog, typically a question or instruction. */
  content?: string;

  /** Icon to be displayed alongside the dialog content, enhancing visual communication. */
  icon?: string;

  /** Label for the input field in the dialog. */
  inputLabel?: string;

  /** Text for the cancel button, default is 'Cancel'. */
  cancelMessage = 'Cancel';

  /** Text for the accept button, default is 'Confirm'. */
  acceptMessage = 'Confirm';

  /** Boolean to decide whether to use a textarea instead of a single-line input. */
  useTextarea = false;

  /** FormGroup for managing the input's state, including validation. */
  inputForm = this.formBuilder.nonNullable.group({
    message: new FormControl<string>('', { nonNullable: true }),
  });

  /**
   * Constructs the input dialog component.
   *
   * @param {MatDialogRef<InputDialogComponent, InputDialogResponse>} dialogRef Reference to the dialog that allows for closing and responding.
   * @param {FormBuilder} formBuilder Service for creating form groups and controls dynamically.
   */
  constructor(
    private dialogRef: MatDialogRef<InputDialogComponent, InputDialogResponse>,
    private formBuilder: FormBuilder
  ) {}

  /**
   * Closes the dialog and returns the input data as part of the `InputDialogResponse` if the confirm action is taken.
   */
  confirm(): void {
    this.dialogRef.close({ action: true, inputValue: this.inputForm.getRawValue().message });
  }

  /**
   * Closes the dialog without any action, implying a cancel.
   */
  cancel(): void {
    this.dialogRef.close({ action: false, inputValue: '' });
  }
}
/**
 * Type representing the response from an `InputDialogComponent`.
 */
export class InputDialogResponse {
  /** Indicates whether the dialog was confirmed or canceled. */
  action!: boolean;

  /** The value of the input provided by the user. */
  inputValue!: string;
}
