import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpEvent,
  HttpEventType,
  HttpHeaders,
  HttpResponse,
} from '@angular/common/http';
import { AppSnackBarService } from '../../services/app-snack-bar.service';
import { assertIsDefined } from '../shared-functions';
import { SignedUrlDTO } from '@orvium/api';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { OverlayLoadingDirective } from '../../spinner/overlay-loading.directive';

export enum MAX_FILE_SIZE {
  TWENTY_MB = 20971520,
  MB_200 = 209715200,
  GB_10 = 10737418240,
  KB_50 = 51200,
  KB_500 = 512000,
}

export enum ACCEPT_TYPES {
  PUBLICATIONS_EXTENSIONS_ALLOWED = '.docx, .doc, .rtf, .pdf, .odt, .md, .txt, .tex, .epub, .zip',
  OTHER_FILE_EXTENSIONS_ALLOWED = '.docx, .doc, .rtf, .pdf, .odt, .md, .txt, .tex, .epub, .csv, .jpeg, .jpg, .png, .mp4, .gif',
  REVIEWS_EXTENSIONS_ALLOWED = '.docx, .doc, .rtf, .pdf, .odt, .md, .txt, .tex, .epub',
  COMMUNITY_EXTENSIONS_ALLOWED = '.png, .jpg, .jpeg, .webp',
  PLATFORM_EXTENSIONS_ALLOWED = '.png, .jpg, .jpeg, .webp, .svg',
  BIBTEX_EXTENSIONS_ALLOWED = '.bib',
}

/**
 * A component for handling file uploads with validation and progress tracking.
 */
@Component({
  selector: 'app-fileupload',
  standalone: true,
  templateUrl: './fileupload.component.html',
  styleUrls: ['./fileupload.component.scss'],
  imports: [MatButtonModule, MatProgressBarModule, OverlayLoadingDirective],
})
export class FileuploadComponent {
  /** The name attribute for the file input. */
  @Input() name = 'file';

  /** Accepted file types for the file input. */
  @Input() accept?: string;

  /** Indicates whether the file input is disabled. */
  @Input() disabled = false;

  /** Maximum file size allowed for upload. */
  @Input() maxFileSize?: number;

  /** Summary message for invalid file size. */
  @Input() invalidFileSizeMessageSummary = '{0}: Invalid file size, ';

  /** Detailed message for invalid file size. */
  @Input() invalidFileSizeMessageDetail = 'Maximum upload size is {0}.';

  /** Summary message for invalid file type. */
  @Input() invalidFileTypeMessageSummary = '{0}: Invalid file type, ';

  /** Detailed message for invalid file type. */
  @Input() invalidFileTypeMessageDetail = 'Allowed file types: {0}.';

  /** Detailed message for exceeding file limit. */
  @Input() invalidFileLimitMessageDetail = 'Limit is {0} at most.';

  /** Summary message for exceeding file limit. */
  @Input() invalidFileLimitMessageSummary = 'Maximum number of files exceeded, ';

  /** Label for the choose button. */
  @Input() chooseLabel = 'Choose';

  /** Label for the upload button. */
  @Input() uploadLabel = 'Upload';

  /** Label for the cancel button. */
  @Input() cancelLabel = 'Cancel';

  /** Indicates whether loading is disabled. */
  @Input() disableLoading = false;

  /** Maximum number of files allowed for upload. */
  @Input() fileLimit = 0;

  /** Count of files already uploaded. */
  @Input() uploadedFileCount = 0;

  /** Event emitted before uploading files. */
  @Output() beforeUpload = new EventEmitter<unknown>();

  /** Event emitted when files are sent. */
  @Output() send = new EventEmitter<unknown>();

  /**
   * Event emitted when files are successfully uploaded.
   */
  @Output() fileUpload = new EventEmitter<{
    originalEvent: HttpResponse<unknown>;
    files: File[];
    payload: SignedUrlDTO;
  }>();

  /** Event emitted when there is an error uploading files. */
  @Output() fileError = new EventEmitter<unknown>();

  /** Event emitted to clear the file input. */
  @Output() clear = new EventEmitter<void>();

  /** Event emitted when files are selected. */
  @Output() fileSelect = new EventEmitter<unknown>();

  /** Event emitted to track file upload progress. */
  @Output() fileProgress = new EventEmitter<unknown>();

  /** Event emitted when a file is selected to be uploaded. */
  @Output() fileSelectedToUpload = new EventEmitter<{ fileObject: File; formData: FormData }>();

  /** Reference to the advanced file input element. */
  @ViewChild('advancedfileinput') advancedFileInput?: ElementRef;

  /** Reference to the content element. */
  @ViewChild('content') content?: ElementRef;

  /** Current upload progress percentage. */
  public progress = 0;

  /** Indicates whether files are being uploaded. */
  uploading = false;

  /**
   * Constructor for the FileuploadComponent.
   *
   * @param {HttpClient} http - The HTTP client for making requests.
   * @param {AppSnackBarService} snackBar - The snack bar service for displaying messages.
   */
  constructor(
    private http: HttpClient,
    private snackBar: AppSnackBarService
  ) {}

  /** The list of files to be uploaded. */
  public _files: File[] = [];

  /**
   * Gets the list of files to be uploaded.
   *
   * @returns {File[]} The list of files.
   */
  get files(): File[] {
    return this._files;
  }

  /**
   * Sets the list of files to be uploaded.
   *
   * @param {File[]} files - The list of files to set.
   */
  @Input() set files(files) {
    this._files = [];

    for (const file of files) {
      if (this.validate(file)) {
        this._files.push(file);
      }
    }
  }

  /**
   * Handles the selection of files from the file input.
   *
   * @param {Event} event - The file input change event.
   */
  onFileSelect(event: Event): void {
    const files = (event.target as HTMLInputElement).files;
    for (let i = 0; files && i < files.length; i++) {
      const file = files[i];
      if (!this.isFileSelected(file)) {
        if (this.validate(file)) {
          this.files.push(file);
        }
      }
    }
    this.fileSelect.emit({ originalEvent: event, files, currentFiles: this.files });

    if (this.fileLimit > 0) {
      this.checkFileLimit();
    }

    if (this.hasFiles() && !this.isFileLimitExceeded()) {
      this.upload();
    }
  }

  /**
   * Checks if a file is already selected.
   *
   * @param {File} file - The file to check.
   * @returns {boolean} True if the file is already selected, otherwise false.
   */
  isFileSelected(file: File): boolean {
    for (const sFile of this.files) {
      if (
        sFile.name + sFile.type + sFile.size.toString() ===
        file.name + file.type + file.size.toString()
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * Validates a file based on type and size constraints.
   *
   * @param {File} file - The file to validate.
   * @returns {boolean} True if the file is valid, otherwise false.
   */
  validate(file: File): boolean {
    if (this.accept && !this.isFileTypeValid(file)) {
      const errorMessage = this.invalidFileTypeMessageDetail.replace('{0}', this.accept);
      this.snackBar.error(errorMessage);
      return false;
    }

    if (this.maxFileSize && file.size > this.maxFileSize) {
      const errorMessage = this.invalidFileSizeMessageDetail.replace(
        '{0}',
        this.formatSize(this.maxFileSize)
      );
      this.snackBar.error(errorMessage);
      return false;
    }

    return true;
  }

  /**
   * Checks if a file type is valid based on the accepted types.
   *
   * @param {File} file - The file to check.
   * @returns {boolean} True if the file type is valid, otherwise false.
   */
  isFileTypeValid(file: File): boolean {
    if (this.accept) {
      const acceptableTypes = this.accept.split(',').map(type => type.trim());
      for (const type of acceptableTypes) {
        const acceptable = this.isWildcard(type)
          ? this.getTypeClass(file.type) === this.getTypeClass(type)
          : file.type === type || this.getFileExtension(file).toLowerCase() === type.toLowerCase();

        if (acceptable) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Gets the class of a file type.
   *
   * @param {string} fileType - The file type to get the class for.
   * @returns {string} The class of the file type.
   */
  getTypeClass(fileType: string): string {
    return fileType.substring(0, fileType.indexOf('/'));
  }

  /**
   * Checks if a file type is a wildcard type.
   *
   * @param {string} fileType - The file type to check.
   * @returns {boolean} True if the file type is a wildcard, otherwise false.
   */
  isWildcard(fileType: string): boolean {
    return fileType.includes('*');
  }

  /**
   * Gets the extension of a file.
   *
   * @param {File} file - The file to get the extension for.
   * @returns {string} The file extension.
   */
  getFileExtension(file: File): string {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    return `.${file.name.split('.').pop()}`;
  }

  /**
   * Uploads the selected files.
   */
  upload(): void {
    if (!this.disableLoading) {
      this.uploading = true;
    }

    const formData = new FormData();

    this.beforeUpload.emit({
      formData,
    });

    for (const file of this.files) {
      formData.append(this.name, file, file.name);
    }

    const fileObject = this.files[0];

    this.fileSelectedToUpload.emit({ fileObject, formData });
  }

  /**
   * Handles the file upload process to a specified signed URL.
   *
   * @param {SignedUrlDTO} payload - The signed URL payload.
   * @param {File} fileObject - The file object to upload.
   * @param {FormData} formData - The form data containing the file.
   */
  uploadFile(payload: SignedUrlDTO, fileObject: File, formData: FormData): void {
    this.http
      .put(payload.signedUrl, fileObject, {
        reportProgress: true,
        observe: 'events',
        headers: new HttpHeaders({ 'ngsw-bypass': 'true' }),
      })
      .subscribe(
        (event: HttpEvent<unknown>) => {
          switch (event.type) {
            case HttpEventType.Sent:
              this.send.emit({
                originalEvent: event,
                formData,
              });
              break;
            case HttpEventType.Response:
              this.uploading = false;
              this.progress = 0;

              if (event.status >= 200 && event.status < 300) {
                if (this.fileLimit > 0) {
                  this.uploadedFileCount += this.files.length;
                }

                assertIsDefined(payload);

                this.fileUpload.emit({ originalEvent: event, files: this.files, payload: payload });
              } else {
                this.fileError.emit({ files: this.files });
                this.snackBar.error(event.statusText);
              }

              this.onClear();
              break;
            case HttpEventType.UploadProgress: {
              if (event.loaded && event.total) {
                this.progress = Math.round((event.loaded * 100) / event.total);
              }

              this.fileProgress.emit({ originalEvent: event, progress: this.progress });
              break;
            }
          }
        },
        (error: HttpErrorResponse) => {
          this.uploading = false;
          this.fileError.emit({ files: this.files, error });
          this.snackBar.error(error.message);
        }
      );
  }

  /**
   * Clears the selected files.
   */
  onClear(): void {
    this.files = [];
    this.clear.emit();
    this.clearInputElement();
  }

  /**
   * Checks if the file limit is exceeded.
   *
   * @returns {boolean} True if the file limit is exceeded, otherwise false.
   */
  isFileLimitExceeded(): boolean {
    return this.fileLimit > 0 && this.fileLimit < this.files.length + this.uploadedFileCount;
  }

  /**
   * Checks if the file limit is exceeded and displays an error message if it is.
   */
  checkFileLimit(): void {
    if (this.isFileLimitExceeded()) {
      const errorMessage = this.invalidFileLimitMessageDetail.replace(
        '{0}',
        this.fileLimit.toString()
      );
      this.snackBar.error(errorMessage);
      this.onClear();
    }
  }

  /**
   * Clears the file input element.
   */
  clearInputElement(): void {
    if (this.advancedFileInput?.nativeElement) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.advancedFileInput.nativeElement.value = '';
    }
  }

  /**
   * Checks if there are any selected files.
   *
   * @returns {boolean} True if there are selected files, otherwise false.
   */
  hasFiles(): boolean {
    return this.files.length > 0;
  }

  /**
   * Formats the file size into a human-readable string.
   *
   * @param {number} bytes - The file size in bytes.
   * @returns {string} The formatted file size.
   */
  formatSize(bytes: number): string {
    if (bytes === 0) {
      return '0 B';
    }
    const k = 1024;
    const dm = 3;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  }
}
