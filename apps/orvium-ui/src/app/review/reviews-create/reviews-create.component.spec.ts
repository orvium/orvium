import { ReviewsCreateComponent } from './reviews-create.component';
import { BehaviorSubject, firstValueFrom, Observable, of } from 'rxjs';
import {
  factoryCommunityPopulatedDTO,
  factoryDepositPopulatedDTO,
  factoryFileMetadata,
  factoryReviewPopulatedDTO,
  factoryUserPrivateDTO,
} from '../../shared/test-data';
import { ProfileService } from '../../profile/profile.service';
import { MockedComponentFixture, MockProvider, MockRender } from 'ng-mocks';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import {
  DefaultService,
  FileMetadata,
  ReviewPopulatedDTO,
  ReviewStatus,
  StringDataPayload,
  UserPrivateDTO,
} from '@orvium/api';
import { TestBed } from '@angular/core/testing';
import { assertIsDefined, assertIsObservable } from '../../shared/shared-functions';
import { AppSnackBarService } from '../../services/app-snack-bar.service';
import { DialogService } from '../../dialogs/dialog.service';
import { ConfirmDialogComponent } from '../../dialogs/confirm-dialog/confirm-dialog.component';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { HttpEvent, HttpResponse } from '@angular/common/http';
import { NGXLogger } from 'ngx-logger';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { FontAwesomeTestingModule } from '@fortawesome/angular-fontawesome/testing';
import { LocalStorageService } from '../../services/local-storage.service';

const deposit = factoryDepositPopulatedDTO.build();
const review = factoryReviewPopulatedDTO.build({
  status: ReviewStatus.Draft,
  actions: ['edit', 'update'],
});
const routeSnapshot = {
  snapshot: {
    data: { deposit, review },
  },
  paramMap: of(
    convertToParamMap({
      reviewId: review._id,
    })
  ),
};

describe('ReviewsCreateComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ReviewsCreateComponent,
        NoopAnimationsModule,
        HttpClientTestingModule,
        MatIconTestingModule,
        FontAwesomeTestingModule,
      ],
      providers: [
        MockProvider(ProfileService, {
          profile: new BehaviorSubject<UserPrivateDTO | undefined>(factoryUserPrivateDTO.build()),
        }),
        MockProvider(DialogService, {
          openCustom: jest.fn().mockReturnValue(of({})),
        }),
        MockProvider(LocalStorageService, {
          read: jest.fn().mockReturnValue(of('true')),
          write: jest.fn().mockReturnValue(of('true')),
        }),
        MockProvider(DefaultService, {
          getDepositVersions: jest
            .fn()
            .mockReturnValue(of(factoryDepositPopulatedDTO.buildList(2))),
          getCommunity: jest.fn().mockReturnValue(of(factoryCommunityPopulatedDTO.buildList(2))),
          getReview: jest.fn().mockReturnValue(of(review)),
          deleteReview: jest.fn().mockReturnValue(of(review)),
          submitReview: jest.fn().mockReturnValue(of(review)),
          uploadReviewFile: jest.fn().mockReturnValue(of(factoryReviewPopulatedDTO.build())),
          uploadFileConfirmationReview: jest
            .fn()
            .mockReturnValue(of(factoryReviewPopulatedDTO.build())),
        }),
        MockProvider(AppSnackBarService, {
          info: jest.fn().mockReturnValue(of({})),
          error: jest.fn().mockReturnValue(of({})),
        }),
        MockProvider(NGXLogger),
        { provide: ActivatedRoute, useValue: routeSnapshot },
      ],
    });
  });

  it('should create', () => {
    const fixture = MockRender(ReviewsCreateComponent);
    expect(fixture.point.componentInstance).toBeDefined();
    fixture.detectChanges();
    expect(fixture.point.componentInstance).toBeTruthy();
  });

  it('should save review', () => {
    const fixture = MockRender(ReviewsCreateComponent);
    fixture.point.componentInstance.reviewForm.controls.showIdentity.setValue('false:true');
    fixture.point.componentInstance.reviewForm.controls.showReview.setValue('false:true');
    const apiService = TestBed.inject(DefaultService);
    const snackBar = TestBed.inject(AppSnackBarService);
    jest.spyOn(apiService, 'updateReview').mockReturnValue(
      // eslint-disable-next-line
      of(factoryReviewPopulatedDTO.build({ status: ReviewStatus.Draft }) as any)
    );
    jest.spyOn(snackBar, 'info');
    fixture.point.componentInstance.review = review;
    fixture.point.componentInstance.save();
    expect(snackBar.info).toHaveBeenCalledWith('Saved! Press submit when you finish');
  });

  it('should submit review', () => {
    const fixture = MockRender(ReviewsCreateComponent);
    fixture.point.componentInstance.review = review;
    fixture.point.componentInstance.review.file = {
      filename: 'name',
      description: 'name',
      contentType: 'type',
      contentLength: 1,
      tags: [],
    } as FileMetadata;

    fixture.detectChanges();
    expect(fixture.point.componentInstance.reviewForm.valid).toBe(true);

    jest.spyOn(TestBed.inject(DialogService), 'openConfirm').mockReturnValue({
      afterClosed: () => of(true),
    } as MatDialogRef<ConfirmDialogComponent, true>);

    const spy = jest.spyOn(TestBed.inject(Router), 'navigateByUrl').mockImplementation();
    fixture.point.componentInstance.submitReview();
    expect(spy).toHaveBeenCalled();
  });

  it('should publish review', () => {
    const fixture = MockRender(ReviewsCreateComponent);
    const dialogService = TestBed.inject(DialogService);
    const apiService = TestBed.inject(DefaultService);
    jest.spyOn(fixture.point.componentInstance, 'canPublish').mockReturnValue(true);
    jest.spyOn(dialogService, 'openConfirm').mockReturnValue({
      afterClosed: () => of(true),
    } as MatDialogRef<ConfirmDialogComponent, true>);
    jest
      .spyOn(apiService, 'updateReview')
      .mockReturnValue(of(review as unknown as HttpEvent<ReviewPopulatedDTO>));
    fixture.point.componentInstance.review = review;
    const spy = jest.spyOn(TestBed.inject(Router), 'navigateByUrl').mockImplementation();
    fixture.point.componentInstance.submitReview();
    expect(spy).toHaveBeenCalled();
  });

  it('should do onExit', () => {
    const fixture = MockRender(ReviewsCreateComponent);
    assertIsDefined(fixture.point.componentInstance.reviewForm, 'review form is not defined');
    fixture.point.componentInstance.reviewForm.markAsPristine();
    fixture.point.componentInstance.onExit();
  });

  it('should not publish review if form is pristine', () => {
    const fixture = MockRender(ReviewsCreateComponent);
    fixture.point.componentInstance.review = review;
    fixture.point.componentInstance.review.file = {
      filename: 'name',
      description: 'name',
      contentType: 'type',
      contentLength: 1,
      tags: [],
    } as FileMetadata;
    fixture.point.componentInstance.reviewForm.controls.comments.setValue('Test');
    fixture.point.componentInstance.reviewForm.markAsDirty();
    expect(fixture.point.componentInstance.canPublish()).toBeFalsy();
  });

  it('should show error when when form is not pristine or valid', () => {
    const fixture = MockRender(ReviewsCreateComponent);
    const snackBar = TestBed.inject(AppSnackBarService);
    jest.spyOn(snackBar, 'error');
    fixture.point.componentInstance.reviewForm.markAsDirty();
    fixture.point.componentInstance.beforeUpload({});
    expect(snackBar.error).toHaveBeenCalled();
  });

  it('should not accept when publishing review', () => {
    const fixture = MockRender(ReviewsCreateComponent);
    const dialogService = TestBed.inject(DialogService);
    jest.spyOn(fixture.point.componentInstance, 'canPublish').mockReturnValue(true);
    jest.spyOn(dialogService, 'openConfirm').mockReturnValue({
      afterClosed: () => of(false),
    } as MatDialogRef<ConfirmDialogComponent, boolean>);
    const spy = jest.spyOn(TestBed.inject(DefaultService), 'updateReview');
    fixture.point.componentInstance.submitReview();
    expect(spy).not.toHaveBeenCalled();
  });

  it('should try to publish and fail', () => {
    const fixture = MockRender(ReviewsCreateComponent);
    const snackBar = TestBed.inject(AppSnackBarService);
    jest.spyOn(snackBar, 'error');
    fixture.point.componentInstance.review = review;
    fixture.point.componentInstance.review.file = undefined;
    const spy = jest.spyOn(TestBed.inject(Router), 'navigateByUrl').mockImplementation();
    fixture.point.componentInstance.submitReview();
    expect(spy).not.toHaveBeenCalled();
    expect(fixture.componentInstance.fileExpanded).toBeTruthy();
    expect(snackBar.error).toHaveBeenCalledWith('Review report file is missing');
  });

  it('should delete review', () => {
    const fixture = MockRender(ReviewsCreateComponent);
    const dialogService = TestBed.inject(DialogService);
    const apiService = TestBed.inject(DefaultService);
    jest.spyOn(dialogService, 'openConfirm').mockReturnValue({
      afterClosed: () => of(true),
    } as MatDialogRef<ConfirmDialogComponent, boolean>);
    jest
      .spyOn(apiService, 'deleteReview')
      .mockReturnValue(of(review as unknown as HttpEvent<ReviewPopulatedDTO>));
    fixture.point.componentInstance.review = review;
    const spy = jest.spyOn(TestBed.inject(Router), 'navigate').mockImplementation();
    fixture.point.componentInstance.deleteReview();
    expect(spy).toHaveBeenCalled();
  });

  it('reviewForm should be disabled', () => {
    review.actions = [];
    const fixture = MockRender(ReviewsCreateComponent);
    expect(fixture.point.componentInstance.reviewForm.disabled).toBe(true);
  });

  it('should show optional fields', () => {
    const fixture = MockRender(ReviewsCreateComponent);
    fixture.point.componentInstance.optionalFields({
      source: {
        checked: true,
      },
    } as MatSlideToggleChange);
    const option = fixture.point.componentInstance.showOptionalFields;
    expect(option).toBe(true);
  });

  it('should not show optional fields', () => {
    const fixture = MockRender(ReviewsCreateComponent);
    fixture.point.componentInstance.optionalFields({
      source: {
        checked: false,
      },
    } as MatSlideToggleChange);
    const option = fixture.point.componentInstance.showOptionalFields;
    expect(option).toBe(false);
  });

  it('should generate doi', () => {
    const fixture = MockRender(ReviewsCreateComponent);
    expect(fixture.point.componentInstance.doiMetadataText).toBeFalsy();
    const apiService = fixture.point.injector.get(DefaultService);
    const spyApiService = jest.spyOn(apiService, 'createDoiReview').mockReturnValue(
      of({
        data: '10.2222/972439723573',
      } as unknown as HttpEvent<StringDataPayload>)
    );
    fixture.point.componentInstance.registerDOI();
    expect(spyApiService).toHaveBeenCalled();
    expect(fixture.point.componentInstance.doiMetadataText).toBeTruthy();
  });

  it('should get doi', () => {
    const fixture = MockRender(ReviewsCreateComponent);
    expect(fixture.point.componentInstance.doiMetadataJson).toStrictEqual({});
    const apiService = fixture.point.injector.get(DefaultService);
    const spyApiService = jest
      .spyOn(apiService, 'getDoiReview')
      .mockReturnValue(of({ data: { somedata: '' } } as unknown as HttpEvent<object>));
    fixture.point.componentInstance.getRegisteredDOIMetadata();
    expect(spyApiService).toHaveBeenCalled();
    expect(fixture.point.componentInstance.doiMetadataJson).toStrictEqual({
      data: { somedata: '' },
    });
  });

  it('should preview doi', () => {
    const fixture = MockRender(ReviewsCreateComponent);
    const apiService = fixture.point.injector.get(DefaultService);
    const spyApiService = jest
      .spyOn(apiService, 'previewDOIRegistrationReview')
      .mockReturnValue(of({ data: 'some text' } as unknown as HttpEvent<StringDataPayload>));
    fixture.point.componentInstance.previewDOI();
    expect(spyApiService).toHaveBeenCalled();
    expect(fixture.point.componentInstance.doiMetadataText).toBe('some text');

    // Now test if return value is json
    jest
      .spyOn(apiService, 'previewDOIRegistrationReview')
      .mockReturnValue(
        of({ data: JSON.stringify({ somedata: '' }) } as unknown as HttpEvent<StringDataPayload>)
      );
    fixture.point.componentInstance.previewDOI();
    expect(spyApiService).toHaveBeenCalled();
    expect(fixture.point.componentInstance.doiMetadataJson).toStrictEqual({ somedata: '' });
  });

  it('should trigger onExit', async () => {
    const fixture = MockRender(ReviewsCreateComponent);
    const dialogService = fixture.point.injector.get(DialogService);
    const spy1 = jest.spyOn(dialogService, 'openConfirm').mockReturnValue({
      afterClosed: () => of(true),
    } as MatDialogRef<ConfirmDialogComponent, boolean>);
    const exitResult1 = fixture.point.componentInstance.onExit();
    expect(spy1).not.toHaveBeenCalled();
    expect(exitResult1).toBe(true);

    fixture.point.componentInstance.reviewForm.markAsDirty();
    await testOnExit(fixture);
  });

  it('should remove file from extraFile', () => {
    const defaultReview = factoryReviewPopulatedDTO.build({
      extraFiles: [factoryFileMetadata.build()],
    });
    const fixture = MockRender(ReviewsCreateComponent, { review: defaultReview });
    const apiService = TestBed.inject(DefaultService);

    const dialogService = fixture.point.injector.get(DialogService);
    jest.spyOn(dialogService, 'openConfirm').mockReturnValue({
      afterClosed: () => of(true),
    } as MatDialogRef<ConfirmDialogComponent, boolean>);
    const modifiedReview = defaultReview;
    const spyApiService = jest
      .spyOn(apiService, 'deleteReviewExtraFile')
      .mockReturnValue(of({ modifiedReview } as unknown as HttpResponse<ReviewPopulatedDTO>));
    const snackBarService = fixture.point.injector.get(AppSnackBarService);
    const spySnackBar = jest.spyOn(snackBarService, 'info');

    fixture.point.componentInstance.deleteFile(defaultReview.extraFiles[0].filename);
    expect(spySnackBar).toHaveBeenCalledWith('File deleted');
    expect(spyApiService).toHaveBeenCalled();
  });

  it('should upload the file', async () => {
    const fixture = MockRender(ReviewsCreateComponent);
    fixture.detectChanges();
    const apiService = fixture.point.injector.get(DefaultService);
    // Test if the upload can be done and return false
    fixture.point.componentInstance.reviewForm.markAsDirty();
    expect(fixture.point.componentInstance.beforeUpload(undefined)).toBe(false);
    // Test if the upload can be done and return true
    fixture.point.componentInstance.reviewForm.markAsPristine();
    expect(fixture.point.componentInstance.beforeUpload(undefined)).toBe(true);
    const files: File[] = [
      // @ts-expect-error
      {
        lastModified: 1666681728398,
        name: 'logo8.svg',
        size: 2863,
        type: 'image/svg+xml',
        webkitRelativePath: '',
      },
    ];
    const originalEvent: HttpResponse<unknown> = {
      body: null,
      // @ts-expect-error
      headers: {},
      ok: true,
      status: 200,
      statusText: 'OK',
      type: 4,
      url: '',
    };
    const payload = {
      fileMetadata: {
        filename: 'logo8.svg',
        description: 'logo8.svg',
        contentType: 'image/svg',
        contentLength: 2863,
        tags: ['Deposits'],
      },
      isMainFile: false,
      replacePDF: false,
      signedUrl: '',
    };
    await fixture.point.componentInstance.filesUploaded({ originalEvent, files, payload });
    expect(apiService.uploadFileConfirmationReview).toHaveBeenCalled();
  });

  it('should generate signed URL', async () => {
    const fixture = MockRender(ReviewsCreateComponent);
    await fixture.whenStable();
    fixture.detectChanges();

    const apiService = fixture.point.injector.get(DefaultService);
    // @ts-expect-error
    const file: File = {
      lastModified: 1666681728398,
      name: 'logo8.svg',
      size: 2863,
      type: 'image/svg+xml',
      webkitRelativePath: '',
    };

    const fileUploadComponent = {
      uploadFile: jest.fn().mockImplementation(),
    };

    await fixture.point.componentInstance.generateSignedUrl(
      // ts-ignore added for form data value
      // @ts-expect-error
      { fileObject: file, formData: {} },
      false,
      fileUploadComponent
    );
    expect(apiService.uploadReviewFile).toHaveBeenCalled();
  });

  it('should return deposit 1 when returning deposit versions', () => {
    const fixture = MockRender(ReviewsCreateComponent);
    const deposits = [
      factoryDepositPopulatedDTO.build({ version: 2 }),
      factoryDepositPopulatedDTO.build({ version: 1 }),
    ];
    expect(fixture.point.componentInstance.getVersion(deposits)).toBe(deposits[0]);
  });
});

async function testOnExit<
  T extends {
    onExit: () => Observable<boolean> | boolean;
  },
>(fixture: MockedComponentFixture<T>): Promise<void> {
  const dialogService = fixture.point.injector.get(DialogService);

  jest.spyOn(dialogService, 'openConfirm').mockReturnValue({
    afterClosed: () => of(true),
  } as MatDialogRef<ConfirmDialogComponent, boolean>);
  const onExitTrue = fixture.point.componentInstance.onExit();
  assertIsObservable(onExitTrue);
  expect(await firstValueFrom(onExitTrue)).toBe(true);

  jest.spyOn(dialogService, 'openConfirm').mockReturnValue({
    afterClosed: () => of(false),
  } as MatDialogRef<ConfirmDialogComponent, boolean>);
  const onExitFalse = fixture.point.componentInstance.onExit();
  assertIsObservable(onExitFalse);
  expect(await firstValueFrom(onExitFalse)).toBe(false);
}
