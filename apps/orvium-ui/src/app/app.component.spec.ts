import { AppComponent } from './app.component';
import { factoryUserPrivateDTO } from './shared/test-data';
import { MockComponent, MockInstance, MockProvider, MockRender, MockReset } from 'ng-mocks';
import { ProfileService } from './profile/profile.service';
import { BehaviorSubject, firstValueFrom, of } from 'rxjs';
import { BannerService } from './banner/banner.service';
import { LoginResponse, OidcSecurityService } from 'angular-auth-oidc-client';
import { BannerData } from './banner/interfaces/banner-data';
import { DefaultService, PushSubscriptionDTO } from '@orvium/api';
import { ServiceWorkerModule, SwPush, SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { Router } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { DialogService } from './dialogs/dialog.service';
import { AlertDialogComponent } from './dialogs/alert-dialog/alert-dialog.component';
import { MatDialogRef } from '@angular/material/dialog';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { ToolbarComponent } from './layout/toolbar/toolbar.component';
import { BannerPanelComponent } from './banner/banner-panel/banner-panel.component';
import { SideNavComponent } from './layout/side-nav/side-nav.component';
import { FooterComponent } from './layout/footer/footer.component';
import { ProgressBarService } from './services/progress-bar.service';

const versionReady: VersionReadyEvent = {
  type: 'VERSION_READY',
  currentVersion: {
    hash: '1',
  },
  latestVersion: {
    hash: '2',
  },
};

describe('AppComponent', () => {
  beforeEach(() => {
    jest.spyOn(sessionStorage, 'getItem').mockReturnValue('');
    TestBed.configureTestingModule({
      imports: [
        AppComponent,
        HttpClientTestingModule,
        RouterTestingModule,
        MatSnackBarModule,
        NoopAnimationsModule,
        ServiceWorkerModule.register('ngsw-worker.js', {
          enabled: false,
          // Register the ServiceWorker as soon as the application is stable
          // or after 30 seconds (whichever comes first).
          registrationStrategy: 'registerWhenStable:30000',
        }),
        MockComponent(ToolbarComponent),
        MockComponent(BannerPanelComponent),
        MockComponent(SideNavComponent),
        MockComponent(FooterComponent),
      ],
      providers: [
        MockProvider(OidcSecurityService, {
          checkAuth: jest.fn().mockReturnValue(
            of({
              configId: '',
              idToken: '',
              accessToken: '',
              isAuthenticated: true,
              userData: '',
            } as LoginResponse)
          ),
        }),
        { provide: PLATFORM_ID, useValue: 'browser' },
        MockProvider(ProfileService, {
          getProfile: jest.fn().mockReturnValue(of(factoryUserPrivateDTO.build())),
          getProfileFromApi: jest.fn().mockReturnValue(of(factoryUserPrivateDTO.build())),
          getConversationsFromApi: jest.fn().mockReturnValue(of([])),
          pushNotifications: new BehaviorSubject<boolean | undefined>(undefined),
        }),
        MockProvider(SwPush, {
          isEnabled: true,
          subscription: of(null),
          requestSubscription: () =>
            firstValueFrom(
              of({
                toJSON: () => {
                  // do nothing
                },
              } as PushSubscription)
            ),
        }),
        MockProvider(SwUpdate, {
          isEnabled: true,
          versionUpdates: of(versionReady),
        }),
        MockProvider(BannerService, {
          bannerInfo$: new BehaviorSubject<BannerData | undefined>({
            text: 'banner',
            buttonText: 'button',
          }),
        }),
        MockProvider(ProgressBarService),
        MockProvider(DefaultService, {
          createPushNotificationsSubscription: jest.fn().mockReturnValue(
            of<PushSubscriptionDTO>({
              keys: {
                auth: '',
                p256dh: '',
              },
              userId: '',
              endpoint: '',
            })
          ),
          checkPushNotificationsSubscription: jest.fn().mockReturnValue(of(true)),
          getBlockchainNetworks: jest.fn().mockReturnValue(of([])),
        }),
        MockProvider(Router, {
          navigateByUrl: jest.fn().mockImplementation(),
          navigate: jest.fn().mockImplementation(),
        }),
        MockProvider(DialogService, {
          openAlert: jest.fn().mockReturnValue({
            afterClosed: () => of(true),
          } as MatDialogRef<AlertDialogComponent>),
        }),
      ],
    });
  });

  afterEach(MockReset);

  it('should create the app', () => {
    const fixture = MockRender(AppComponent);
    fixture.detectChanges();
    expect(fixture.point.componentInstance).toBeDefined();
  });

  it('should replace favicon', () => {
    const documentMock = {
      querySelector: jest.fn().mockReturnValue({ href: '' }),
    };
    const fixture = MockRender(
      AppComponent,
      {},
      {
        providers: [
          {
            provide: DOCUMENT,
            useValue: documentMock,
          },
        ],
      }
    );
    fixture.detectChanges();
    expect(documentMock.querySelector).toHaveBeenCalled();
  });

  it('should redirect if login with', () => {
    jest.spyOn(sessionStorage, 'getItem').mockReturnValue('https://localhost:4200/mypublications');

    const fixture = MockRender(AppComponent);
    expect(fixture.point.componentInstance).toBeDefined();
    const router = fixture.point.injector.get(Router);
    expect(router.navigateByUrl).toHaveBeenCalledWith('https://localhost:4200/mypublications');
  });

  it('should send to onboarding when !profile.isOnboarded', () => {
    MockInstance(ProfileService, 'getProfile', () =>
      of(factoryUserPrivateDTO.build({ isOnboarded: false }))
    );
    const fixture = MockRender(AppComponent);
    const router = fixture.point.injector.get(Router);
    fixture.detectChanges();
    expect(router.navigate).toHaveBeenCalledWith(['profile', 'onboarding']);
  });

  it('should update the app', () => {
    MockInstance(SwUpdate, () => ({
      isEnabled: true,
      versionUpdates: of(versionReady),
    }));
    MockInstance(SwPush, () => ({
      isEnabled: true,
      subscription: of({} as PushSubscription),
    }));
    const documentMock = {
      querySelector: jest.fn(),
      defaultView: {
        location: { reload: jest.fn() },
      },
    };
    const fixture = MockRender(
      AppComponent,
      {},
      {
        providers: [
          {
            provide: DOCUMENT,
            useValue: documentMock,
          },
        ],
      }
    );
    fixture.detectChanges();
    const dialogService = fixture.point.injector.get(DialogService);
    expect(dialogService.openAlert).toHaveBeenCalled();
    expect(documentMock.defaultView.location.reload).toHaveBeenCalled();
  });
});
