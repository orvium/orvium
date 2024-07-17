import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FileMetadata } from '@orvium/api';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { DecimalPipe } from '@angular/common';
import { EncodeURIComponentPipe } from '../custom-pipes/encode-uri-component.pipe';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

/**
 * A component for displaying a file card with options to download or delete the file.
 */
@Component({
  selector: 'app-file-card',
  standalone: true,
  templateUrl: './file-card.component.html',
  styleUrls: ['./file-card.component.scss'],
  imports: [
    FontAwesomeModule,
    MatChipsModule,
    MatIconModule,
    EncodeURIComponentPipe,
    DecimalPipe,
    MatButtonModule,
    MatTooltipModule,
  ],
})
export class FileCardComponent implements OnInit {
  /** The file metadata to be displayed. */
  @Input() file!: FileMetadata;

  /** Indicates whether the file can be deleted. */
  @Input() canDelete = true;

  /** Indicates whether the file can be downloaded. */
  @Input() canDownload = true;

  /** Event emitter for when a file is deleted. */
  @Output() fileDeleted: EventEmitter<FileMetadata> = new EventEmitter<FileMetadata>();

  /** A regular expression match array indicating if the file can be opened in Overleaf. */
  canUseOverleaf!: RegExpMatchArray | null;

  /** Opens the file URL in a new browser tab. */
  openLink(): void {
    window.open(this.file.url, '_blank');
  }

  /**
   * Emits an event to delete the file.
   *
   * @param {MouseEvent} $event - The mouse event triggering the deletion.
   * @param {FileMetadata} file - The file to be deleted.
   */
  deleteFile($event: MouseEvent, file: FileMetadata): void {
    $event.stopPropagation();
    this.fileDeleted.emit(file);
  }

  /**
   * Checks if the file can be opened in Overleaf based on its filename.
   *
   * @param {string} filename - The name of the file to check.
   * @returns {RegExpMatchArray | null} - The match result for the filename.
   */
  canOpenOverleaf(filename: string): RegExpMatchArray | null {
    const regex = /\w+\.tex|\w+\.zip/g;
    return filename.match(regex);
  }

  /**
   * Lifecycle hook that is called after data-bound properties are initialized.
   */
  ngOnInit(): void {
    this.canUseOverleaf = this.canOpenOverleaf(this.file.filename);
  }
}
