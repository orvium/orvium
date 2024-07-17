import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ComponentType } from '@angular/cdk/overlay';

/**
 * Interface representing the data structure passed to the dialog wrapper.
 *
 * @property {string} title - Optional title for the dialog.
 * @property {ComponentType<unknown>} component - Component type to be embedded within the dialog.
 */
export interface DialogWrapperData {
  title?: string;
  component: ComponentType<unknown>;
}

/**
 * Component that acts as a wrapper for various dialogs, allowing for dynamic content insertion.
 * It can dynamically load any component passed to it as part of the dialog data.
 */
@Component({
  selector: 'app-dialog-wrapper',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  templateUrl: './dialog-wrapper.component.html',
  styleUrls: ['./dialog-wrapper.component.scss'],
})
export class DialogWrapperComponent {
  /**
   * Constructs a dialog wrapper component instance.
   *
   * @param {MatDialogRef<DialogWrapperComponent>} dialogRef Reference to the dialog opened.
   * @param {DialogWrapperData} data Configuration and data for the dialog, including which component to load.
   */
  constructor(
    public dialogRef: MatDialogRef<DialogWrapperComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogWrapperData
  ) {}
}
