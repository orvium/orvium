import { Component, Input, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { DefaultService, DoiStatus } from '@orvium/api';
import { CopyToClipboardDirective } from '../directives/copy-to-clipboard.directive';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { DialogService } from '../../dialogs/dialog.service';
import { OverlayLoadingDirective } from '../../spinner/overlay-loading.directive';
import { finalize } from 'rxjs/operators';

/**
 * A component that displays and manages the status of a DOI (Digital Object Identifier).
 * It allows viewing detailed error information if the DOI process encounters issues.
 */
@Component({
  selector: 'app-doi-status',
  standalone: true,
  imports: [
    CommonModule,
    MatChipsModule,
    MatButtonModule,
    CopyToClipboardDirective,
    MatTooltipModule,
    MatIconModule,
    OverlayLoadingDirective,
  ],
  templateUrl: './doi-status.component.html',
  styleUrls: ['./doi-status.component.scss'],
})
export class DoiStatusComponent {
  /** The current status of the DOI. */
  @Input({ required: true }) doiStatus?: string;

  /** The DOI string to display and manage. */
  @Input({ required: true }) doi!: string;

  /** The resource ID associated with the DOI, used for fetching DOI logs. */
  @Input({ required: true }) resourceId!: string;

  /** emplate reference for the DOI metadata text. */
  @ViewChild('doiMetadataTextTemplate') doiMetadataTextTemplate!: TemplateRef<unknown>;

  /** A constant representing possible DOI statuses. */
  protected readonly DoiStatus = DoiStatus;

  /** Text content for DOI metadata. */
  doiMetadataText = '';

  /** Indicates whether the component is in a loading state. */
  loading = false;

  /**
   * Create an instance of DoiStatusComponent
   *
   * @param {DefaultService} apiService - The service for API interactions.
   * @param {DialogService} dialogService - The service for managing dialogs.
   */
  constructor(
    private apiService: DefaultService,
    private dialogService: DialogService
  ) {}

  /**
   * Opens a dialog to display error information related to the DOI.
   * Fetches the DOI log from the server and displays it in the dialog.
   */
  openErrorInfo(): void {
    this.doiMetadataText = '';
    this.dialogService.openCustom({
      title: 'DOI error info',
      acceptMessage: 'Accept',
      template: this.doiMetadataTextTemplate,
    });
    this.loading = true;
    this.apiService
      .getDoiLog({ id: this.resourceId })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(log => {
        this.doiMetadataText = log.data || 'No data found';
      });
  }
}
