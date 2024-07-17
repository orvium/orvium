import { TestBed } from '@angular/core/testing';

import { MockComponent, MockProvider, MockRender } from 'ng-mocks';
import { ProfileService } from '../../profile/profile.service';
import { BehaviorSubject, of } from 'rxjs';
import { DefaultService, PlatformImageType, UserPrivateDTO } from '@orvium/api';
import { factoryDepositPopulatedDTO, factoryUserPrivateDTO } from '../../shared/test-data';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpResponse } from '@angular/common/http';
import { FileuploadComponent } from '../../shared/fileupload/fileupload.component';
import { AppSnackBarService } from '../../services/app-snack-bar.service';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AccessDeniedComponent } from '../../shared/access-denied/access-denied.component';
import { CommunitiesListComponent } from '../../communities/communities-list/communities-list.component';
import AdminPanelComponent from './admin-panel.component';
import { DepositsListComponent } from '../../deposits/deposits-list/deposits-list.component';

describe('AdminPanelComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AdminPanelComponent,
        HttpClientTestingModule,
        RouterTestingModule,
        NoopAnimationsModule,
        MockComponent(FileuploadComponent),
        MockComponent(AccessDeniedComponent),
        MockComponent(CommunitiesListComponent),
        MockComponent(DepositsListComponent),
      ],
      providers: [
        MockProvider(ProfileService, {
          profile: new BehaviorSubject<UserPrivateDTO | undefined>(
            factoryUserPrivateDTO.build({
              roles: ['admin'],
            })
          ),
          getProfile: jest.fn().mockReturnValue(
            of(
              factoryUserPrivateDTO.build({
                roles: ['admin'],
              })
            )
          ),
        }),
        MockProvider(DefaultService, {
          uploadLogoImageConfirmation: jest.fn().mockReturnValue(of({})),
          uploadLogoImage: jest.fn().mockReturnValue(of({})),
          getCommunitiesPendingApproval: jest.fn().mockReturnValue(of({})),
          getDepositsPendingApproval: jest
            .fn()
            .mockReturnValue(of([factoryDepositPopulatedDTO.build()])),
        }),
        MockProvider(AppSnackBarService),
      ],
    });
  });

  it('should create', () => {
    const fixture = MockRender(AdminPanelComponent);
    fixture.detectChanges();
    expect(fixture.point.componentInstance).toBeTruthy();
  });

  it('should upload the file', () => {
    const fixture = MockRender(AdminPanelComponent);
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
      PlatformImageType.Logo
    );
    expect(apiService.uploadLogoImageConfirmation).toHaveBeenCalled();
  });

  it('should generate signed URL', async () => {
    const fixture = MockRender(AdminPanelComponent);
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

    void fixture.point.componentInstance.generateSignedUrl(
      // ts-ignore added for form data value
      // @ts-expect-error
      { fileObject: file, formData: {} },
      false,
      fileUploadComponent,
      PlatformImageType.Logo
    );
    expect(apiService.uploadLogoImage).toHaveBeenCalled();
  });
});
