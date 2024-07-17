import { TestBed } from '@angular/core/testing';

import { BibtexEditComponent } from './bibtex-edit.component';
import { MockComponent, MockInstance, MockProvider, MockRender } from 'ng-mocks';
import { BibtexReferences, DefaultService } from '@orvium/api';
import { of } from 'rxjs';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { DepositDetailsComponent } from '../../deposits/deposit-details/deposit-details.component';
import { AppSnackBarService } from '../../services/app-snack-bar.service';
import { SpinnerService } from '../../spinner/spinner.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

describe('BibtexEditComponent', () => {
  MockInstance.scope();

  const bibtexReference: BibtexReferences = {
    id: '',
    raw: '',
    address: 'My address',
    author: 'Oda',
    booktitle: 'OP',
    copyright: 'CC',
    editor: 'john',
    issn: '1234-5679',
    journal: 'WSJ',
    month: '07',
    note: 'A note',
    number: '15',
    pages: '15',
    publisher: 'WSJ',
    school: 'Ekialdea',
    series: 'WSJ',
    title: 'Phantom menace',
    type: 'article',
    url: 'example.exameple.com',
    volume: '15',
    year: 2004,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        BibtexEditComponent,
        MatSnackBarModule,
        NoopAnimationsModule,
        HttpClientTestingModule,
        MockComponent(DepositDetailsComponent),
      ],
      providers: [
        MockProvider(DefaultService, {
          getBibtexDoi: jest.fn().mockReturnValue(of([bibtexReference])),
        }),
        MockProvider(AppSnackBarService),
        MockProvider(SpinnerService),
        MockProvider(MatDialogRef, {
          close: jest.fn().mockReturnValue(of({})),
        }),
        MockProvider(MAT_DIALOG_DATA),
      ],
    });
  });

  it('should create', () => {
    const fixture = MockRender(BibtexEditComponent);
    expect(fixture.point.componentInstance).toBeDefined();
    fixture.detectChanges();
    expect(fixture.point.componentInstance).toBeTruthy();
    expect(fixture.point.componentInstance.bibtexReferenceForm.controls.title.getRawValue()).toBe(
      ''
    );
  });

  it('should create with data', () => {
    const bibtexReference: BibtexReferences = {
      title: 'bibtex title',
      type: 'article',
      raw: '',
      id: 'reference_me_2023',
    };
    MockInstance(MAT_DIALOG_DATA, () => bibtexReference);
    const fixture = MockRender(BibtexEditComponent);
    expect(fixture.point.componentInstance).toBeDefined();
    fixture.detectChanges();
    expect(fixture.point.componentInstance.bibtexReferenceForm.controls.title.getRawValue()).toBe(
      bibtexReference.title
    );
    expect(fixture.point.componentInstance.bibtexReferenceForm.controls.type.getRawValue()).toBe(
      bibtexReference.type
    );
  });

  it('should save references', () => {
    const fixture = MockRender(BibtexEditComponent);
    const dialogRef = fixture.point.injector.get(MatDialogRef);
    fixture.point.componentInstance.save();
    expect(dialogRef.close).toHaveBeenCalled();
  });

  it('should get the references by doi', () => {
    const fixture = MockRender(BibtexEditComponent);
    fixture.detectChanges();
    const apiService = fixture.point.injector.get(DefaultService);
    fixture.point.componentInstance.bibtexReferenceForm.controls.doi.setValue(
      '10.1093/ajae/aaq063'
    );
    fixture.point.componentInstance.setBibtexData();
    expect(apiService.getBibtexDoi).toHaveBeenCalled();
  });
});
