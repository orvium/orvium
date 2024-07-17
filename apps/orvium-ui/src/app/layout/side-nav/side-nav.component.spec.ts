import { SideNavComponent } from './side-nav.component';
import { SidenavService } from '../../services/sidenav.service';
import { BehaviorSubject, of } from 'rxjs';
import { ProfileService } from '../../profile/profile.service';
import { factoryUserPrivateDTO } from '../../shared/test-data';
import { MockProvider, MockRender } from 'ng-mocks';
import { BreakpointObserver } from '@angular/cdk/layout';
import { AppSnackBarService } from '../../services/app-snack-bar.service';
import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { InviteService } from '../../services/invite.service';
import { DialogService } from '../../dialogs/dialog.service';

describe('SideNavComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SideNavComponent, NoopAnimationsModule],
      providers: [
        MockProvider(ProfileService, {
          getProfile: jest.fn().mockReturnValue(of(factoryUserPrivateDTO.build())),
        }),
        MockProvider(BreakpointObserver, {
          observe: jest.fn().mockReturnValue(of({ matches: false, breakpoints: {} })),
        }),
        MockProvider(SidenavService, {
          toggle: jest.fn(),
          toggleRight: jest.fn(),
          sidenavExpandedChange: new BehaviorSubject<boolean>(true),
        }),
        MockProvider(DialogService, {
          openCustom: jest.fn().mockReturnValue(of({})),
        }),
        MockProvider(AppSnackBarService, {
          info: jest.fn().mockReturnValue(''),
        }),
        MockProvider(InviteService, {
          openInviteDialog: jest.fn().mockImplementation(),
        }),
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = MockRender(SideNavComponent);
    expect(fixture.point.componentInstance).toBeDefined();
    fixture.detectChanges();
    expect(fixture.point.componentInstance).toBeTruthy();
  });

  it('should toggle right sidenav', async () => {
    const fixture = MockRender(SideNavComponent);
    const sidenavService = fixture.point.injector.get(SidenavService);
    await fixture.point.componentInstance.toggleRightSidenav();
    expect(sidenavService.toggleRight).toHaveBeenCalled();
  });

  it('should close sidenav when small screen', async () => {
    const fixture = MockRender(SideNavComponent);
    fixture.detectChanges();
    const sidenavService = fixture.point.injector.get(SidenavService);
    const sideNavSpy = jest.spyOn(sidenavService, 'close');
    const sideNavSpy2 = jest.spyOn(sidenavService, 'closeRight');
    fixture.point.componentInstance.smallScreen = true;
    await fixture.point.componentInstance.closeSidenav();
    expect(sideNavSpy).toHaveBeenCalled();
    expect(sideNavSpy2).toHaveBeenCalled();
  });

  it('should open dialog when inviting colleges but not logged in', () => {
    const fixture = MockRender(SideNavComponent);
    fixture.point.componentInstance.profile = undefined;
    fixture.point.componentInstance.openInviteDialog();
  });

  it('should not open create dialog when account is not completed', () => {
    const fixture = MockRender(SideNavComponent);
    if (fixture.point.componentInstance.profile) {
      fixture.point.componentInstance.profile.isOnboarded = false;
    }
    const dialogService = fixture.point.injector.get(AppSnackBarService);
    fixture.point.componentInstance.create();
    expect(dialogService.info).toHaveBeenCalled();
  });

  it('should open create dialog when account is completed', () => {
    const fixture = MockRender(SideNavComponent);
    if (fixture.point.componentInstance.profile) {
      fixture.point.componentInstance.profile.isOnboarded = true;
      fixture.point.componentInstance.profile.emailPendingConfirmation = '';
    }
    const dialogService = fixture.point.injector.get(DialogService);
    fixture.point.componentInstance.create();
    expect(dialogService.openCustom).toHaveBeenCalled();
  });
});
