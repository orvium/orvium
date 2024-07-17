import { CommunityDetailsComponent } from './community-details.component';
import { MockComponent, MockedComponentFixture, MockProvider, MockRender } from 'ng-mocks';
import { DefaultService, ImageType } from '@orvium/api';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { firstValueFrom, Observable, of } from 'rxjs';
import { CommunityService } from '../community.service';
import { TestBed } from '@angular/core/testing';
import { AppSnackBarService } from '../../services/app-snack-bar.service';
import { DisciplinesService } from '../../services/disciplines.service';
import { FullScreenService } from '../../services/full-screen.service';
import {
  factoryCommunityPopulatedDTO,
  factoryCommunityPrivateDTO,
  factoryUserPrivateDTO,
} from '../../shared/test-data';
import { ProfileService } from '../../profile/profile.service';
import { DialogService } from '../../dialogs/dialog.service';
import { SpinnerService } from '../../spinner/spinner.service';
import { SidenavService } from '../../services/sidenav.service';
import { assertIsDefined, assertIsObservable } from '../../shared/shared-functions';
import { CommunityCalendarComponent } from '../community-calendar/community-calendar.component';
import { CommunityCardComponent } from '../community-card/community-card.component';
import { AccessDeniedComponent } from '../../shared/access-denied/access-denied.component';
import { DescriptionLineComponent } from '../../shared/description-line/description-line.component';
import { InfoToolbarComponent } from '../../shared/info-toolbar/info-toolbar.component';
import { MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FontAwesomeTestingModule } from '@fortawesome/angular-fontawesome/testing';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { HttpResponse } from '@angular/common/http';
import { MatNativeDateModule } from '@angular/material/core';
import { ConfirmDialogComponent } from '../../dialogs/confirm-dialog/confirm-dialog.component';
import { CustomDialogComponent } from '../../dialogs/custom-dialog/custom-dialog.component';

describe('CommunityDetailsComponent', () => {
  beforeEach(() => {
    const community = factoryCommunityPrivateDTO.build();
    const routeSnapshot = {
      paramMap: of(
        convertToParamMap({
          communityId: community._id,
        })
      ),
    };

    TestBed.configureTestingModule({
      imports: [
        CommunityDetailsComponent,
        MockComponent(CommunityCalendarComponent),
        MockComponent(CommunityCardComponent),
        MockComponent(AccessDeniedComponent),
        MockComponent(DescriptionLineComponent),
        MockComponent(InfoToolbarComponent),
        NoopAnimationsModule,
        HttpClientTestingModule,
        FontAwesomeTestingModule,
        MatIconTestingModule,
        MatNativeDateModule,
      ],
      providers: [
        MockProvider(ProfileService, {
          getProfile: jest.fn().mockReturnValue(of(factoryUserPrivateDTO.build())),
        }),
        MockProvider(CommunityService, {
          getCommunityActions: jest.fn().mockReturnValue({
            moderate: true,
            update: true,
            submit: true,
          }),
        }),
        MockProvider(FullScreenService, {
          setFullScreen: jest.fn().mockReturnValue(of({})),
        }),
        MockProvider(DialogService, {
          openConfirm: jest.fn().mockReturnValue(of({})),
          openCustom: jest.fn().mockReturnValue(of({})),
        }),
        MockProvider(SpinnerService),
        MockProvider(SidenavService),
        MockProvider(AppSnackBarService, {
          info: jest.fn().mockReturnValue('Info message'),
          error: jest.fn().mockReturnValue('Error message'),
        }),
        MockProvider(DisciplinesService, {
          getDisciplines: jest.fn().mockReturnValue(of(['Acoustics', 'Computing'])),
        }),
        MockProvider(DefaultService, {
          submitCommunity: jest.fn().mockReturnValue(of(community)),
          getCommunity: jest.fn().mockReturnValue(of(community)),
          uploadImages: jest.fn().mockReturnValue(of({})),
          uploadImagesConfirmation: jest.fn().mockReturnValue(of({})),
          updateCommunity: jest.fn().mockReturnValue(of(factoryCommunityPrivateDTO.build())),
        }),
        { provide: ActivatedRoute, useValue: routeSnapshot },
      ],
    });
  });

  it('should create', () => {
    const fixture = MockRender(CommunityDetailsComponent);
    expect(fixture.point.componentInstance).toBeDefined();
    fixture.detectChanges();
    expect(fixture.point.componentInstance).toBeTruthy();
  });

  it('should disable forms when user can not update', () => {
    const fixture = MockRender(CommunityDetailsComponent);
    fixture.point.componentInstance.deleteDate(2);
    fixture.point.componentInstance.addDates();
    fixture.point.componentInstance.openCalendar();
    fixture.point.componentInstance.addDates(2);
    fixture.point.componentInstance.communityActions.update = false;
    fixture.detectChanges();
    assertIsDefined(fixture.point.componentInstance.community);
    fixture.point.componentInstance.refreshCommunity({
      ...fixture.point.componentInstance.community,
      newTracks: [{ title: 'example', timestamp: 1, description: 'example' }],
    });
    fixture.detectChanges();
    expect(fixture.point.componentInstance.communityForm.disabled).toBeTruthy();
  });

  it('should delete date and disable calendar visibility', () => {
    const fixture = MockRender(CommunityDetailsComponent);
    fixture.point.componentInstance.deleteDate(0);
    expect(fixture.point.componentInstance.communityForm.dirty).toBe(true);
    expect(fixture.point.componentInstance.communityForm.controls.calendarVisible.value).toBe(
      false
    );
  });

  it('should add and delete track', () => {
    const fixture = MockRender(CommunityDetailsComponent);
    fixture.point.componentInstance.addTrack(0);
    expect(fixture.point.componentInstance.communityForm.controls.newTracks.length).toBe(1);
    fixture.point.componentInstance.deleteTrack(0);
    expect(fixture.point.componentInstance.communityForm.controls.newTracks.length).toBe(0);
    fixture.point.componentInstance.addTrack();
    expect(fixture.point.componentInstance.communityForm.controls.newTracks.length).toBe(1);
  });

  it('should mark ISSN as incorrect', () => {
    const fixture = MockRender(CommunityDetailsComponent);
    fixture.point.componentInstance.communityForm.patchValue({
      issn: '204936311',
    });
    const snackBarService = fixture.point.injector.get(AppSnackBarService);
    const spySnackBar = jest.spyOn(snackBarService, 'error');
    fixture.detectChanges();
    const apiService = TestBed.inject(DefaultService);
    jest.spyOn(apiService, 'updateCommunity');
    fixture.point.componentInstance.save();
    fixture.detectChanges();
    expect(fixture.point.componentInstance.detailsExpanded).toBeTruthy();
    expect(spySnackBar).toHaveBeenCalledWith('Make sure all details are correct');
  });

  it('should save community', () => {
    const fixture = MockRender(CommunityDetailsComponent);
    fixture.point.componentInstance.communityForm.controls.showIdentity.setValue('false:true');
    fixture.point.componentInstance.communityForm.controls.showReview.setValue('false:true');
    fixture.point.componentInstance.community = factoryCommunityPrivateDTO.build();
    const snackBarService = fixture.point.injector.get(AppSnackBarService);
    const spySnackBar = jest.spyOn(snackBarService, 'info');
    fixture.detectChanges();
    fixture.point.componentInstance.save();
    fixture.detectChanges();
    expect(spySnackBar).toHaveBeenCalledWith('Community saved');
  });

  it('should delete community', () => {
    const fixture = MockRender(CommunityDetailsComponent);
    const dialogService = fixture.point.injector.get(DialogService);
    jest.spyOn(dialogService, 'openConfirm').mockReturnValue({
      afterClosed: () => of(true),
    } as MatDialogRef<ConfirmDialogComponent, boolean>);
    const apiService = fixture.point.injector.get(DefaultService);
    const spy = jest.spyOn(apiService, 'deleteCommunity').mockReturnValue(
      // @ts-expect-error
      of(factoryCommunityPopulatedDTO.build())
    );
    fixture.point.componentInstance.deleteCommunity();
    expect(spy).toHaveBeenCalled();
  });

  it('should open openSubmitCommunityModal', () => {
    const fixture = MockRender(CommunityDetailsComponent);
    const dialogService = fixture.point.injector.get(DialogService);
    jest.spyOn(dialogService, 'openCustom').mockReturnValue({
      afterClosed: () => of(true),
    } as MatDialogRef<CustomDialogComponent, true>);
    fixture.point.componentInstance.openSubmitCommunityModal();
  });

  it('should do on exit pristine', () => {
    const fixture = MockRender(CommunityDetailsComponent);
    const dialogService = fixture.point.injector.get(DialogService);
    jest.spyOn(dialogService, 'openConfirm').mockReturnValue({
      afterClosed: () => of(true),
    } as MatDialogRef<ConfirmDialogComponent, boolean>);
    fixture.point.componentInstance.onExit();
    jest.spyOn(dialogService, 'openConfirm').mockReturnValue({
      afterClosed: () => of(false),
    } as MatDialogRef<ConfirmDialogComponent, boolean>);
    fixture.point.componentInstance.onExit();
  });

  it('should do on exit not pristine', async () => {
    const fixture = MockRender(CommunityDetailsComponent);
    fixture.point.componentInstance.communityForm.markAsDirty();
    await testOnExit(fixture);
  });

  it('should beforeUpload communityform pristine', () => {
    const fixture = MockRender(CommunityDetailsComponent);
    const canSave = fixture.point.componentInstance.beforeUpload(undefined);
    expect(canSave).toBe(true);
  });

  it('should beforeUpload communityform dirty', () => {
    const fixture = MockRender(CommunityDetailsComponent);
    fixture.point.componentInstance.communityForm.markAsDirty();
    const canSave = fixture.point.componentInstance.beforeUpload(undefined);
    expect(canSave).toBe(false);
  });

  it('should do submit', () => {
    const fixture = MockRender(CommunityDetailsComponent);
    fixture.point.componentInstance.communityForm.markAsPristine();
    const canSave = fixture.point.componentInstance.beforeUpload(true);
    fixture.point.componentInstance.submit();
    expect(canSave).toBe(true);
  });

  it('should upload the file', () => {
    const fixture = MockRender(CommunityDetailsComponent);
    fixture.detectChanges();
    const apiService = fixture.point.injector.get(DefaultService);
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
        tags: ['Admin'],
      },
      isMainFile: false,
      replacePDF: false,
      signedUrl: '',
    };
    void fixture.point.componentInstance.filesUploaded(
      { originalEvent, files, payload },
      ImageType.Logo
    );
    expect(apiService.uploadImagesConfirmation).toHaveBeenCalled();
  });

  it('should generate signed URL', () => {
    const fixture = MockRender(CommunityDetailsComponent);
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

    void fixture.point.componentInstance.generateSignedUrl(
      // ts-ignore added for form data value
      // @ts-expect-error
      { fileObject: file, formData: {} },
      false,
      fileUploadComponent,
      ImageType.Logo
    );
    expect(apiService.uploadImages).toHaveBeenCalled();
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
