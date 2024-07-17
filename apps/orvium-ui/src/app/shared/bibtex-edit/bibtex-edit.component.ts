import { Component, Inject } from '@angular/core';

import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { BibtexReferences, DefaultService } from '@orvium/api';
import { MatChipsModule } from '@angular/material/chips';
import { assertIsDefined } from '../shared-functions';
import { MatButtonModule } from '@angular/material/button';
import { finalize } from 'rxjs/operators';
import { MatOptionModule } from '@angular/material/core';
import { BIBTEXPUBLICATIONTYPES_LOV } from '../../model/orvium';
import { MatSelectModule } from '@angular/material/select';
import { OverlayLoadingDirective } from '../../spinner/overlay-loading.directive';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { validateDOI, validateIsNotBlank, validateISSN, validateURL } from '../AppCustomValidators';

/**
 * Interface defining the structure of a form group for editing Bibtex references.
 *
 * @property {FormControl<string>} id - A required field for the unique identifier of the reference.
 * @property {FormControl<string>} raw - A required field for the raw Bibtex string.
 * @property {FormControl<string>} type - A required field for the type of the reference.
 * @property {FormControl<string>} title - A required field for the title of the reference.
 * @property {FormControl<string | undefined>} author - An optional field for the author(s) of the reference.
 * @property {FormControl<string | undefined>} journal - An optional field for the journal name of the reference.
 * @property {FormControl<string | undefined>} month - An optional field for the month of publication.
 * @property {FormControl<string | undefined>} pages - An optional field for the page numbers.
 * @property {FormControl<string | undefined>} copyright - An optional field for copyright information.
 * @property {FormControl<string | undefined>} volume - An optional field for the volume number.
 * @property {FormControl<string | undefined>} note - An optional field for additional notes.
 * @property {FormControl<string | undefined>} issn - An optional field for the ISSN number.
 * @property {FormControl<string | undefined>} bookTitle - An optional field for the title of the book.
 * @property {FormControl<string | undefined>} url - An optional field for the URL.
 * @property {FormControl<string | undefined>} publisher - An optional field for the publisher's name.
 * @property {FormControl<string | undefined>} address - An optional field for the publisher's address.
 * @property {FormControl<string | undefined>} editor - An optional field for the editor's name.
 * @property {FormControl<string | undefined>} series - An optional field for the series title.
 * @property {FormControl<string | undefined>} school - An optional field for the school name.
 * @property {FormControl<string | undefined>} doi - An optional field for the DOI.
 * @property {FormControl<string | number | undefined>} number - An optional field for the issue number.
 * @property {FormControl<string | undefined>} urldate - An optional field for the date a URL was accessed.
 * @property {FormControl<string | number | undefined>} year - An optional field for the year of publication.
 */
interface BibtexReferenceForm {
  id: FormControl<string>;
  raw: FormControl<string>;
  type: FormControl<string>;
  title: FormControl<string>;
  author: FormControl<string | undefined>;
  journal: FormControl<string | undefined>;
  month: FormControl<string | undefined>;
  pages: FormControl<string | undefined>;
  copyright: FormControl<string | undefined>;
  volume: FormControl<string | undefined>;
  note: FormControl<string | undefined>;
  issn: FormControl<string | undefined>;
  bookTitle: FormControl<string | undefined>;
  url: FormControl<string | undefined>;
  publisher: FormControl<string | undefined>;
  address: FormControl<string | undefined>;
  editor: FormControl<string | undefined>;
  series: FormControl<string | undefined>;
  school: FormControl<string | undefined>;
  doi: FormControl<string | undefined>;
  number: FormControl<string | number | undefined>;
  urldate: FormControl<string | undefined>;
  year: FormControl<string | number | undefined>;
}

/**
 * Creates and returns a FormGroup for a Bibtex reference form with all necessary validations.
 *
 * @returns {FormGroup<BibtexReferenceForm>} The FormGroup for Bibtex reference data.
 */
export function createBibtexForm(): FormGroup<BibtexReferenceForm> {
  return new FormGroup<BibtexReferenceForm>({
    id: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, validateIsNotBlank],
    }),
    type: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, validateIsNotBlank],
    }),
    title: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, validateIsNotBlank],
    }),
    address: new FormControl<string | undefined>(undefined, {
      nonNullable: true,
    }),
    author: new FormControl<string | undefined>(undefined, {
      nonNullable: true,
    }),
    bookTitle: new FormControl<string | undefined>(undefined, {
      nonNullable: true,
    }),
    copyright: new FormControl<string | undefined>(undefined, {
      nonNullable: true,
    }),
    doi: new FormControl<string | undefined>(undefined, {
      nonNullable: true,
      validators: validateDOI,
    }),
    editor: new FormControl<string | undefined>(undefined, {
      nonNullable: true,
    }),
    issn: new FormControl<string | undefined>(undefined, {
      nonNullable: true,
      validators: validateISSN,
    }),
    journal: new FormControl<string | undefined>(undefined, {
      nonNullable: true,
    }),
    month: new FormControl<string | undefined>(undefined, {
      nonNullable: true,
    }),

    note: new FormControl<string | undefined>(undefined, {
      nonNullable: true,
    }),
    number: new FormControl<string | number>('', {
      nonNullable: true,
    }),
    year: new FormControl<string | number>('', {
      nonNullable: true,
    }),
    pages: new FormControl<string | undefined>(undefined, {
      nonNullable: true,
    }),
    publisher: new FormControl<string | undefined>(undefined, {
      nonNullable: true,
    }),
    school: new FormControl<string | undefined>(undefined, {
      nonNullable: true,
    }),
    series: new FormControl<string | undefined>(undefined, {
      nonNullable: true,
    }),
    volume: new FormControl<string | undefined>(undefined, {
      nonNullable: true,
    }),
    url: new FormControl<string | undefined>(undefined, {
      nonNullable: true,
      validators: validateURL,
    }),
    raw: new FormControl<string>('', {
      nonNullable: true,
    }),

    urldate: new FormControl<string | undefined>('', {
      nonNullable: true,
      validators: validateURL,
    }),
  });
}

/**
 * Component responsible for creating and editing Bibtex references.
 */
@Component({
  selector: 'app-bibtex-edit',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatIconModule,
    MatChipsModule,
    MatButtonModule,
    MatOptionModule,
    MatSelectModule,
    OverlayLoadingDirective,
    MatDialogModule,
  ],
  templateUrl: './bibtex-edit.component.html',
  styleUrls: ['./bibtex-edit.component.scss'],
})
export class BibtexEditComponent {
  /** Form group instance holding the Bibtex reference data. */
  bibtexDoiLoading = false;

  /** Indicates if the DOI lookup is loading */
  bibtexPublicationTypes = BIBTEXPUBLICATIONTYPES_LOV;

  /** List of available Bibtex publication types. */
  bibtexReferenceForm = createBibtexForm();

  /**
   * Initializes a new instance of the BibtexEditComponent with necessary services and data injection.
   *
   * @param {DefaultService} apiService - Service for API interactions.
   * @param {MatDialogRef<BibtexEditComponent>} dialogRef - Reference to the dialog opened.
   * @param {any} data - Optional data passed to the component, used for initializing the form if present.
   */
  constructor(
    private apiService: DefaultService,
    public dialogRef: MatDialogRef<BibtexEditComponent>,
    @Inject(MAT_DIALOG_DATA) public data?: BibtexReferences
  ) {
    if (data) {
      this.bibtexReferenceForm.patchValue(data);
    }
  }

  /**
   * Saves the current state of the Bibtex reference form and closes the dialog.
   */
  save(): void {
    this.dialogRef.close(this.bibtexReferenceForm.getRawValue());
  }

  /**
   * Retrieves Bibtex data based on the DOI provided in the form, if valid.
   * Updates the form with the retrieved data.
   */
  setBibtexData(): void {
    if (
      this.bibtexReferenceForm.controls.doi.value &&
      this.bibtexReferenceForm.controls.doi.valid
    ) {
      this.bibtexDoiLoading = true;

      const doi = this.bibtexReferenceForm.getRawValue().doi;
      assertIsDefined(doi, 'doi not found');
      this.apiService
        .getBibtexDoi({ doi: doi })
        .pipe(finalize(() => (this.bibtexDoiLoading = false)))
        .subscribe(data => {
          this.bibtexReferenceForm.patchValue(data);
        });
    }
  }
}
