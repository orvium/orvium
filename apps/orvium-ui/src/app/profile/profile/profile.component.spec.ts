import { MockedComponentFixture, MockProvider, MockRender, ngMocks } from 'ng-mocks';
import { ProfileComponent } from './profile.component';
import { factoryUserPrivateDTO } from '../../shared/test-data';
import { BehaviorSubject, firstValueFrom, Observable, of, throwError } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { ProfileService } from '../profile.service';
import { assertIsDefined, assertIsObservable } from '../../shared/shared-functions';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { DisciplinesService } from '../../services/disciplines.service';
import { BreakpointObserver } from '@angular/cdk/layout';
import { DialogService } from '../../dialogs/dialog.service';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { DefaultService, ProfileImageType, UserPrivateDTO } from '@orvium/api';
import { HttpResponse } from '@angular/common/http';
import { AuthenticationService } from '../../auth/authentication.service';
import { MatDialogRef } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../dialogs/confirm-dialog/confirm-dialog.component';
import { Router } from '@angular/router';

describe('ProfileComponent', () => {
  const profile = factoryUserPrivateDTO.build({
    isOnboarded: true,
    avatar: 'example.png',
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ProfileComponent,
        MatSnackBarModule,
        HttpClientTestingModule,
        RouterTestingModule,
        NoopAnimationsModule,
      ],
      providers: [
        MockProvider(ProfileService, {
          getProfile: jest.fn().mockReturnValue(of(profile)),
          updateProfile: jest.fn().mockImplementation(),
          pushNotifications: new BehaviorSubject<boolean | undefined>(true),
        }),
        MockProvider(DisciplinesService, { getDisciplines: () => of([]) }),
        MockProvider(BreakpointObserver, {
          observe: jest.fn().mockReturnValue(of({ matches: false, breakpoints: {} })),
        }),
        MockProvider(DialogService, {
          openAlert: jest.fn().mockReturnValue(of()),
        }),
        MockProvider(AuthenticationService),
        MockProvider(DefaultService, {
          uploadUserImagesConfirmation: jest.fn().mockReturnValue(of({})),
          uploadProfileImages: jest.fn().mockReturnValue(of({})),
          dummyNotification: jest.fn().mockReturnValue(of({})),
          requestData: jest.fn().mockReturnValue(of({})),
        }),
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = MockRender(ProfileComponent);
    expect(fixture).toBeDefined();
  });

  it('should refresh profile', () => {
    const fixture = MockRender(ProfileComponent);
    const nameField = ngMocks.find(fixture, '#firstNameInput');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(nameField.nativeElement.value).toEqual('William');
    ngMocks.change(nameField, 'Francis');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(nameField.nativeElement.value).toEqual('Francis');
    expect(fixture.point.componentInstance.profileFormGroup.controls.firstName.value).toEqual(
      'Francis'
    );
  });

  it('should do onExit', async () => {
    const fixture = MockRender(ProfileComponent);
    assertIsDefined(
      fixture.point.componentInstance.profileFormGroup,
      'profile form is not defined'
    );
    fixture.point.componentInstance.profileFormGroup.markAsPristine();
    fixture.point.componentInstance.onExit();

    fixture.point.componentInstance.profileFormGroup.markAsDirty();
    await testOnExit(fixture);
  });

  it('should change discipline', () => {
    const fixture = MockRender(ProfileComponent);
    fixture.point.componentInstance.onInputValueChange('test');
  });

  it('should save profile', () => {
    const fixture = MockRender(ProfileComponent);
    const nameField = ngMocks.find(fixture, '#firstNameInput');
    ngMocks.change(nameField, 'My New Name');
    fixture.detectChanges();

    const profileService = TestBed.inject(ProfileService);
    jest.spyOn(profileService, 'updateProfile').mockReturnValue(of(profile));
    const saveButton = ngMocks.find(fixture, '#save');
    ngMocks.click(saveButton);
    expect(profileService.updateProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: 'My New Name',
      })
    );
  });

  it('should beforeUpload profileform pristine', () => {
    const fixture = MockRender(ProfileComponent);
    const canSave = fixture.point.componentInstance.beforeUpload(undefined);
    expect(canSave).toBe(true);
  });

  it('should beforeUpload profileform dirty', () => {
    const fixture = MockRender(ProfileComponent);
    fixture.point.componentInstance.profileFormGroup.markAsDirty();
    const canSave = fixture.point.componentInstance.beforeUpload(undefined);
    expect(canSave).toBe(false);
  });

  it('should upload the file', () => {
    const fixture = MockRender(ProfileComponent);
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
      ProfileImageType.Avatar
    );
    expect(apiService.uploadUserImagesConfirmation).toHaveBeenCalled();
  });

  it('should generate signed URL', () => {
    const fixture = MockRender(ProfileComponent);
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
      ProfileImageType.Avatar
    );
    expect(apiService.uploadProfileImages).toHaveBeenCalled();
  });

  it('should send test notifications', () => {
    const fixture = MockRender(ProfileComponent);
    fixture.detectChanges();
    const apiService = fixture.point.injector.get(DefaultService);
    fixture.point.componentInstance.testNotification();
    expect(apiService.dummyNotification).toHaveBeenCalled();
  });

  it('should delete account', () => {
    const fixture = MockRender(ProfileComponent);
    const router = fixture.point.injector.get(Router);
    const apiService = fixture.point.injector.get(DefaultService);
    const dialogService = fixture.point.injector.get(DialogService);

    jest.spyOn(dialogService, 'open').mockReturnValue({
      afterClosed: () => of(true),
    } as MatDialogRef<ConfirmDialogComponent, boolean>);

    jest.spyOn(router, 'navigate').mockReturnValue(Promise.resolve(true));
    const spy = jest
      .spyOn(apiService, 'deleteProfile')
      .mockReturnValue(of({} as HttpResponse<UserPrivateDTO>));
    fixture.componentInstance.deleteAccount();
    expect(spy).toHaveBeenCalled();
  });

  it('should not delete account', () => {
    const fixture = MockRender(ProfileComponent);
    const router = fixture.point.injector.get(Router);
    const apiService = fixture.point.injector.get(DefaultService);
    const dialogService = fixture.point.injector.get(DialogService);

    jest.spyOn(dialogService, 'open').mockReturnValue({
      afterClosed: () => of(true),
    } as MatDialogRef<ConfirmDialogComponent, boolean>);
    const error = {
      status: 401,
      message: 'Unauthorized',
    };
    jest.spyOn(router, 'navigate').mockImplementation();
    jest.spyOn(apiService, 'deleteProfile').mockReturnValue(throwError(() => error));
    fixture.componentInstance.deleteAccount();
    expect(fixture.componentInstance.accountUndeletable).toBeTruthy();
  });

  it('should show requested personal data', () => {
    const fixture = MockRender(ProfileComponent);
    fixture.detectChanges();
    const apiService = fixture.point.injector.get(DefaultService);
    fixture.point.componentInstance.requestData();
    expect(apiService.requestData).toHaveBeenCalled();
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
