import { ToolbarComponent } from './toolbar.component';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { NotificationService } from '../../notification/notification.service';
import { ProfileService } from '../../profile/profile.service';
import { MockComponent, MockProvider, MockRender, MockService, ngMocks } from 'ng-mocks';
import { factoryCommunityPopulatedDTO, factoryUserPrivateDTO } from '../../shared/test-data';
import { BreakpointObserver } from '@angular/cdk/layout';
import { SidenavService } from '../../services/sidenav.service';
import { AppNotificationDTO, DefaultService, UserPrivateDTO } from '@orvium/api';
import { PLATFORM_ID } from '@angular/core';
import { AppSnackBarService } from '../../services/app-snack-bar.service';
import { EthereumService } from '../../blockchain/ethereum.service';
import { TestBed } from '@angular/core/testing';
import { MatSidenav } from '@angular/material/sidenav';
import { LoginResponse, OidcSecurityService } from 'angular-auth-oidc-client';
import { AuthenticationService } from '../../auth/authentication.service';
import { NotificationsPanelComponent } from '../../notification/notifications-panel/notifications-panel.component';
import { FontAwesomeTestingModule } from '@fortawesome/angular-fontawesome/testing';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { DialogService } from '../../dialogs/dialog.service';
import { THEMES, ThemeService } from '../../services/theme.service';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { HttpEvent } from '@angular/common/http';
import { ImpersonateProfileComponent } from '../../admin/impersonate-profile/impersonate-profile.component';
import { assertIsDefined } from '../../shared/shared-functions';
import { DOCUMENT } from '@angular/common';
import { RouterTestingModule } from '@angular/router/testing';

const notifications: AppNotificationDTO[] = [
  {
    _id: '1',
    userId: 'abc',
    title: 'New notification',
    body: 'Check now',
    createdOn: new Date(),
    isRead: false,
    icon: 'home',
  },
  {
    _id: '2',
    userId: 'abc',
    title: 'New notification',
    body: 'Check now',
    createdOn: new Date(),
    isRead: false,
    icon: 'home',
  },
];

describe('ToolbarComponent', () => {
  // Window location is readonly so to mock it we need to change its original configuration
  // and set it up using beforeAll and afterAll hooks
  const original = window.location;

  beforeAll(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { reload: jest.fn() },
    });
  });

  afterAll(() => {
    Object.defineProperty(window, 'location', { configurable: true, value: original });
  });

  beforeEach(() => {
    jest.spyOn(localStorage, 'getItem').mockReturnValue(THEMES.light);
    TestBed.configureTestingModule({
      imports: [
        ToolbarComponent,
        MockComponent(ImpersonateProfileComponent),
        FontAwesomeTestingModule,
        MatIconTestingModule,
        NoopAnimationsModule,
        RouterTestingModule,
      ],
      providers: [
        MockProvider(ProfileService, {
          getProfile: jest.fn().mockReturnValue(of(factoryUserPrivateDTO.build())),
        }),
        MockProvider(NotificationService, {
          getNotifications: jest.fn().mockReturnValue(of(notifications)),
          readNotification: jest.fn().mockReturnValue(of(notifications[0])),
        }),
        MockProvider(BreakpointObserver, {
          observe: jest.fn().mockReturnValue(of({ matches: false, breakpoints: {} })),
        }),
        MockProvider(PLATFORM_ID, 'browser'),
        MockProvider(AppSnackBarService, {
          info: jest.fn().mockReturnValue('Complete your profile and confirm your email first'),
        }),
        MockProvider(SidenavService, {
          toggle: jest.fn().mockReturnValue(of({})),
          toggleRight: jest.fn().mockReturnValue(of({})),
          getSidenav: jest.fn().mockReturnValue(of(MatSidenav)),
        }),
        MockProvider(DefaultService, {
          getCommunities: jest.fn().mockReturnValue(of(factoryCommunityPopulatedDTO.buildList(1))),
          stopImpersonation: jest.fn().mockReturnValue(of({})),
        }),
        MockProvider(AuthenticationService, {
          oidcSecurityService: MockService(OidcSecurityService, {
            checkAuth: () => of({ userData: { sub: 'impersonatingId' } } as LoginResponse),
          }),
          login: jest.fn().mockReturnValue(of()),
        }),
        MockProvider(DialogService, {
          openCustom: jest.fn().mockReturnValue({ close: jest.fn() }),
          open: jest.fn().mockReturnValue({}),
        }),
        MockProvider(NotificationsPanelComponent),
      ],
    });
  });

  it('should create', () => {
    const fixture = MockRender(ToolbarComponent);
    expect(fixture.point.componentInstance).toBeDefined();
    fixture.detectChanges();
    expect(fixture.point.componentInstance).toBeTruthy();
  });

  it('should navigate when searching', () => {
    const fixture = MockRender(ToolbarComponent);
    const router = fixture.point.injector.get(Router);
    const navigateSpy = jest.spyOn(router, 'navigate').mockImplementation();
    fixture.point.componentInstance.searchInput = 'My deposit title';
    fixture.point.componentInstance.searchPapers('My deposit title');
    expect(navigateSpy).toHaveBeenCalledWith(['/search'], {
      queryParams: { query: 'My deposit title', size: 10 },
      queryParamsHandling: 'merge',
    });
  });

  it('should search with dialog in mobile', () => {
    const fixture = MockRender(ToolbarComponent);
    const router = fixture.point.injector.get(Router);
    const navigateSpy = jest.spyOn(router, 'navigate').mockImplementation();
    fixture.point.componentInstance.isTablet = true;
    fixture.detectChanges();
    const searchButton = ngMocks.find(fixture, '[data-test=search-mobile-button]');

    ngMocks.click(searchButton);
    fixture.point.componentInstance.searchPapers('My deposit title');
    expect(navigateSpy).toHaveBeenCalledWith(['/search'], {
      queryParams: { query: 'My deposit title', size: 10 },
      queryParamsHandling: 'merge',
    });
  });

  it('should toggle sidenav', async () => {
    const fixture = MockRender(ToolbarComponent);
    const sidenavService = fixture.point.injector.get(SidenavService);
    await fixture.point.componentInstance.toggleSidenav();
    expect(sidenavService.toggle).toHaveBeenCalled();
  });

  it('should toggle right sidenav', async () => {
    const fixture = MockRender(ToolbarComponent);
    const sidenavService = fixture.point.injector.get(SidenavService);
    await fixture.point.componentInstance.openNotifications();
    expect(sidenavService.toggleRight).toHaveBeenCalled();
  });

  it('should change theme', () => {
    const fixture = MockRender(ToolbarComponent);
    const themeService = fixture.point.injector.get(ThemeService);
    fixture.point.componentInstance.changeTheme();
    expect(themeService.theme()).toBe(THEMES.dark);
    fixture.point.componentInstance.changeTheme();
    expect(themeService.theme()).toBe(THEMES.light);
  });

  it('should delete notification', () => {
    const fixture = MockRender(ToolbarComponent);
    const event = new MouseEvent('deleteNotificationEvent', {});
    const notificationService = fixture.point.injector.get(NotificationService);
    expect(fixture.point.componentInstance.notifications.length).toBe(2);
    fixture.point.componentInstance.deleteNotification(0, event);
    expect(notificationService.readNotification).toHaveBeenCalled();
    fixture.detectChanges();
    expect(fixture.point.componentInstance.notifications.length).toBe(1);
  });

  it('should not open dialog create publication', () => {
    const fixture = MockRender(ToolbarComponent);
    if (fixture.point.componentInstance.profile) {
      fixture.point.componentInstance.profile.isOnboarded = false;
    }
    const snackBarService = fixture.point.injector.get(AppSnackBarService);
    fixture.point.componentInstance.create();
    expect(snackBarService.info).toHaveBeenCalled();
  });

  it('should open dialog create publication', () => {
    const fixture = MockRender(ToolbarComponent);
    expect(fixture.point.componentInstance.profile?.isOnboarded).toBe(true);
    expect(fixture.point.componentInstance.profile?.emailPendingConfirmation).toBeUndefined();
    const orvDialogService = fixture.point.injector.get(DialogService);
    const spy = jest.spyOn(orvDialogService, 'open');
    fixture.point.componentInstance.create();
    expect(spy).toHaveBeenCalled();
  });

  it('should stop impersonation', async () => {
    const fixture = MockRender(ToolbarComponent);
    await fixture.whenStable();
    fixture.detectChanges();

    const stopImpersonationButton = ngMocks.find(fixture, '[data-test=stop-impersonation-button]');
    const apiService = fixture.point.injector.get(DefaultService);
    const spy = jest
      .spyOn(apiService, 'stopImpersonation')
      .mockReturnValue(of({} as HttpEvent<UserPrivateDTO>));
    const document = fixture.point.injector.get(DOCUMENT);
    assertIsDefined(document.defaultView);
    const spyReload = jest.spyOn(document.defaultView.location, 'reload').mockImplementation();
    ngMocks.click(stopImpersonationButton);
    expect(spy).toHaveBeenCalled();
    expect(spyReload).toHaveBeenCalled();
  });

  it('should open impersonation', async () => {
    const fixture = MockRender(ToolbarComponent);
    await fixture.whenStable();
    fixture.detectChanges();

    const dialogService = fixture.point.injector.get(DialogService);
    const spyDialog = jest.spyOn(dialogService, 'open').mockImplementation();
    await fixture.point.componentInstance.openImpersonateDialog();
    expect(spyDialog).toHaveBeenCalled();
  });

  it('should not toggle blockchain if no MetaMask', () => {
    const fixture = MockRender(ToolbarComponent);
    const ethereumService = fixture.point.injector.get(EthereumService);
    const dialogService = fixture.point.injector.get(DialogService);
    const spy = jest.spyOn(dialogService, 'openCustom');
    const spyEthereum = jest.spyOn(ethereumService, 'init');
    fixture.point.componentInstance.switchBlockchain({
      source: {
        checked: false,
      },
    } as MatSlideToggleChange);
    expect(spyEthereum).not.toHaveBeenCalled();
    expect(spy).toHaveBeenCalled();
  });

  it('should handle login', () => {
    const fixture = MockRender(ToolbarComponent);
    fixture.detectChanges();
    const authenticationService = fixture.point.injector.get(AuthenticationService);
    fixture.point.componentInstance.handleLogin();
    expect(authenticationService.login).toHaveBeenCalled();
  });
});
