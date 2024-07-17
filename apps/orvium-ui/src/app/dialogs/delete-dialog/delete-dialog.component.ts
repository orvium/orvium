import { Component, Input, OnInit } from '@angular/core';

import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { DialogService } from '../dialog.service';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { validateSameWord } from '../../shared/AppCustomValidators';

/**
 * Interface representing the form controls for the deletion confirmation.
 *
 * @property {FormControl<string>} confirmationWord - FormControl for user to input the confirmation word required to proceed with deletion.
 */
interface DeleteForm {
  confirmationWord: FormControl<string>;
}

/**
 * Component for deleting an entity with a confirmation dialog.
 * The user must type a specific confirmation word to enable the deletion action.
 */
@Component({
  selector: 'app-delete-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatInputModule, MatCardModule],
  templateUrl: './delete-dialog.component.html',
  styleUrls: ['./delete-dialog.component.scss'],
})
export class DeleteDialogComponent implements OnInit {
  /**  Title displayed in the delete dialog. Default 'Deletion confirmation' */
  public templateTitle = 'Deletion confirmation';

  /** Word that the user must input correctly to confirm deletion. Default 'confirm' */
  @Input() confirmationWord = `confirm`;

  /** Description displayed in the delete dialog, instructing the user on the required confirmation word. */
  public templateDescription = `To confirm deletion please write <strong>${this.confirmationWord}</strong> in the input below`;

  /** Form group for the deletion confirmation input. */
  public deleteForm = this.formBuilder.group<DeleteForm>({
    confirmationWord: new FormControl('', { nonNullable: true }),
  });

  /**
   * Initializes a new instance of the DeleteDialogComponent with necessary services.
   *
   * @param {DialogService} dialogService - Service to manage dialog interactions.
   * @param {FormBuilder} formBuilder - Service to construct forms.
   * @param {MatDialogRef<DeleteDialogComponent>} dialogRef - Reference to the dialog opened.
   */
  constructor(
    public dialogService: DialogService,
    private formBuilder: FormBuilder,
    public dialogRef: MatDialogRef<DeleteDialogComponent>
  ) {}

  /**
   * Lifecycle hook that is called after Angular has initialized all data-bound properties.
   */
  ngOnInit(): void {
    this.deleteForm.controls.confirmationWord.addValidators([
      validateSameWord(this.confirmationWord),
    ]);
  }
}
