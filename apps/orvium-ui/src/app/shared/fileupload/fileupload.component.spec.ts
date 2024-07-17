import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ACCEPT_TYPES, FileuploadComponent } from './fileupload.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBarModule } from '@angular/material/snack-bar';

describe('FileuploadComponent', () => {
  let fileupload: FileuploadComponent;
  let fixture: ComponentFixture<FileuploadComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        FileuploadComponent,
        HttpClientTestingModule,
        MatSnackBarModule,
        NoopAnimationsModule,
      ],
    });

    fixture = TestBed.createComponent(FileuploadComponent);
    fileupload = fixture.componentInstance;
  });

  it('should display by default (advanced)', () => {
    fixture.detectChanges();

    const fileuploadEl = fixture.debugElement.query(By.css('div'));
    expect(fileuploadEl).toBeTruthy();
    expect(fileuploadEl.children.length).toEqual(2);
  });

  it('should call onFileSelect (advanced)', () => {
    fixture.detectChanges();

    const blob = new Blob(
      [
        JSON.stringify([
          {
            lastModified: 1533276674178,
            name: 'primeng.txt',
            size: 179,
            type: 'text/plain',
          },
        ]),
      ],
      { type: 'application/json' }
    );
    const blobFile = new File([blob], 'primeng.txt');
    const event = {
      target: { files: [blobFile] },
      stopPropagation: jest.fn(),
      preventDefault: jest.fn(),
    };

    fileupload.onFileSelect(event as unknown as Event);
    fixture.detectChanges();
    expect(fileupload.hasFiles()).toEqual(true);
  });

  it('should call upload (advanced)', () => {
    fixture.detectChanges();

    const blob = new Blob(
      [
        JSON.stringify([
          {
            lastModified: 1533276674178,
            name: 'primeng.txt',
            size: 179,
            type: 'text/plain',
          },
        ]),
      ],
      { type: 'application/json' }
    );
    const blobFile = new File([blob], 'primeng.txt');
    const event = {
      target: { files: [blobFile] },
      stopPropagation: jest.fn(),
      preventDefault: jest.fn(),
    };
    const uploadSpy = jest.spyOn(fileupload, 'upload');
    fileupload.onFileSelect(event as unknown as Event);
    fixture.detectChanges();

    expect(uploadSpy).toHaveBeenCalled();
  });

  it('should not push same file', () => {
    fixture.detectChanges();

    const blob = new Blob(
      [
        JSON.stringify([
          {
            lastModified: 1533276674178,
            name: 'primeng.txt',
            size: 179,
            type: 'text/plain',
          },
        ]),
      ],
      { type: 'application/json' }
    );
    const blobFile = new File([blob], 'primeng.txt');
    const event = {
      target: { files: [blobFile] },
      stopPropagation: jest.fn(),
      preventDefault: jest.fn(),
    };
    fileupload.onFileSelect(event as unknown as Event);
    fixture.detectChanges();

    expect(fileupload.files.length).toEqual(1);
    fileupload.onFileSelect(event as unknown as Event);
    fixture.detectChanges();

    expect(fileupload.files.length).toEqual(1);
  });

  it('should not push when exceeded filelimit', () => {
    fileupload.fileLimit = 1;
    fixture.detectChanges();

    const blob = new Blob(
      [
        JSON.stringify([
          {
            lastModified: 1533276674178,
            name: 'primeng.txt',
            size: 179,
            type: 'text/plain',
          },
          {
            lastModified: 1533276674179,
            name: 'primeng2.txt',
            size: 123,
            type: 'text/plain',
          },
        ]),
      ],
      { type: 'application/json' }
    );
    const blobFile = new File([blob], 'primeng.txt');
    const blobFile2 = new File([blob], 'primeng2.txt');
    const event = {
      target: { files: [blobFile, blobFile2] },
      stopPropagation: jest.fn(),
      preventDefault: jest.fn(),
    };
    jest.spyOn(fileupload, 'upload').mockImplementation();
    fileupload.onFileSelect(event as unknown as Event);
    fixture.detectChanges();

    expect(fileupload.isFileLimitExceeded).toBeTruthy();
  });

  it('should accept all of multiple given MIME types', () => {
    const mockFile1 = { type: 'application/pdf', name: 'test.pdf' };
    const mockFile2 = { type: 'image/png', name: 'test.png' };

    fileupload.accept = ACCEPT_TYPES.PUBLICATIONS_EXTENSIONS_ALLOWED;
    expect(fileupload.isFileTypeValid(mockFile1 as File)).toBe(true);
    expect(fileupload.isFileTypeValid(mockFile2 as File)).toBe(false);
    fixture.componentInstance.maxFileSize = 2;
    expect(fixture.componentInstance.validate(mockFile2 as File)).toBe(false);
    const mockFile3 = { type: 'image/png', name: 'test.png', size: 9999999999999 };
    expect(fixture.componentInstance.validate(mockFile3 as File)).toBe(false);
    fixture.componentInstance.validate(mockFile3 as File);
    fixture.componentInstance.formatSize(0);
  });

  it('should handle wildcards in MIME subtypes', () => {
    const mockFile1 = { type: 'application/pdf', name: 'test.pdf' };
    const mockFile2 = { type: 'image/png', name: 'test.png' };

    fileupload.accept = ACCEPT_TYPES.OTHER_FILE_EXTENSIONS_ALLOWED;
    expect(fileupload.isFileTypeValid(mockFile1 as File)).toBe(true);
    expect(fileupload.isFileTypeValid(mockFile2 as File)).toBe(true);
  });
});
