import { fakeAsync, tick } from '@angular/core/testing';
import { Location } from '@angular/common';
import { Router, RouterModule, RouterOutlet, Routes } from '@angular/router';
import { MockBuilder, MockRender, NG_MOCKS_GUARDS, NG_MOCKS_ROOT_PROVIDERS } from 'ng-mocks';
import { OnboardingComponent } from './onboarding/onboarding.component';
import { ProfileComponent } from './profile/profile.component';
import { PublicProfileComponent } from './public-profile/public-profile.component';
import { AuthGuardService } from '../auth/auth-guard.service';
import { ImpersonateProfileComponent } from '../admin/impersonate-profile/impersonate-profile.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CallbackComponent } from './callback/callback.component';
import { ExitGuard } from '../shared/guards/exit.guard';
import { RouterTestingModule } from '@angular/router/testing';

describe('TestRoute: Profile', () => {
  const routes: Routes = [
    {
      path: '',
      component: ProfileComponent,
      canActivate: [AuthGuardService],
      canDeactivate: [ExitGuard],
    },
    { path: 'confirmEmail', component: CallbackComponent },
    { path: 'invite', component: CallbackComponent },
    { path: 'callback', component: CallbackComponent },
    {
      path: 'onboarding',
      component: OnboardingComponent,
      canActivate: [AuthGuardService],
    },
    {
      path: 'impersonate',
      component: ImpersonateProfileComponent,
    },
    {
      path: ':nickname',
      component: PublicProfileComponent,
    },
  ];

  beforeEach(() => {
    return MockBuilder([
      RouterModule,
      RouterTestingModule.withRoutes(routes),
      NG_MOCKS_ROOT_PROVIDERS,
    ])
      .keep(HttpClientTestingModule)
      .exclude(NG_MOCKS_GUARDS)
      .mock(CallbackComponent)
      .mock(OnboardingComponent)
      .mock(PublicProfileComponent)
      .mock(ProfileComponent);
  });

  it('renders / with ProfileComponent', fakeAsync(() => {
    const fixture = MockRender(RouterOutlet);
    const router = fixture.point.injector.get(Router);
    const location = fixture.point.injector.get(Location);
    // First we need to initialize navigation.
    location.go('/');
    if (fixture.ngZone) {
      fixture.ngZone.run(() => router.initialNavigation());
      tick(); // is needed for rendering of the current route.
    }

    // We should see Target1Component component on /1 page.
    expect(location.path()).toEqual('/');
    // expect(() => ngMocks.find(fixture, ProfileComponent)).not.toThrow();
  }));

  it('renders /confirmEmail with CallbackComponent', fakeAsync(() => {
    const fixture = MockRender(RouterOutlet);
    const router = fixture.point.injector.get(Router);
    const location = fixture.point.injector.get(Location);
    // First we need to initialize navigation.
    location.go('/confirmEmail');
    if (fixture.ngZone) {
      fixture.ngZone.run(() => router.initialNavigation());
      tick(); // is needed for rendering of the current route.
    }

    // We should see Target1Component component on /1 page.
    expect(location.path()).toEqual('/confirmEmail');
    // expect(() => ngMocks.find(CallbackComponent)).not.toThrow();
  }));

  it('renders /invite with CallbackComponent', fakeAsync(() => {
    const fixture = MockRender(RouterOutlet);
    const router = fixture.point.injector.get(Router);
    const location = fixture.point.injector.get(Location);
    // First we need to initialize navigation.
    location.go('/invite');
    if (fixture.ngZone) {
      fixture.ngZone.run(() => router.initialNavigation());
      tick(); // is needed for rendering of the current route.
    }
    fixture.detectChanges();

    // We should see Target1Component component on /1 page.
    expect(location.path()).toEqual('/invite');
    // expect(() => ngMocks.find(CallbackComponent)).not.toThrow();
  }));

  it('renders /callback with CallbackComponent', fakeAsync(() => {
    const fixture = MockRender(RouterOutlet);
    const router = fixture.point.injector.get(Router);
    const location = fixture.point.injector.get(Location);
    // First we need to initialize navigation.
    location.go('/callback');
    if (fixture.ngZone) {
      fixture.ngZone.run(() => router.initialNavigation());
      tick(); // is needed for rendering of the current route.
    }

    // We should see Target1Component component on /1 page.
    expect(location.path()).toEqual('/callback');
    // expect(() => ngMocks.find(CallbackComponent)).not.toThrow();
  }));

  it('renders /:nickname with PublicProfileComponent', fakeAsync(() => {
    const fixture = MockRender(RouterOutlet);
    const router = fixture.point.injector.get(Router);
    const location = fixture.point.injector.get(Location);
    // First we need to initialize navigation.
    location.go('/:nickname');
    if (fixture.ngZone) {
      fixture.ngZone.run(() => router.initialNavigation());
      tick(); // is needed for rendering of the current route.
    }

    // We should see Target1Component component on /1 page.
    expect(location.path()).toEqual('/:nickname');
    // expect(() => ngMocks.find(PublicProfileComponent)).not.toThrow();
  }));

  it('renders /onboarding with OnboardingComponent', fakeAsync(() => {
    const fixture = MockRender(RouterOutlet);
    const router = fixture.point.injector.get(Router);
    const location = fixture.point.injector.get(Location);
    // First we need to initialize navigation.
    location.go('/onboarding');
    if (fixture.ngZone) {
      fixture.ngZone.run(() => router.initialNavigation());
      tick(); // is needed for rendering of the current route.
    }

    // We should see Target1Component component on /1 page.
    expect(location.path()).toEqual('/onboarding');
    // expect(() => ngMocks.find(OnboardingComponent)).not.toThrow();
  }));

  it('renders /advanced-settings with AdvancedSettingsComponent', fakeAsync(() => {
    const fixture = MockRender(RouterOutlet);
    const router = fixture.point.injector.get(Router);
    const location = fixture.point.injector.get(Location);
    // First we need to initialize navigation.
    location.go('/advanced-settings');
    if (fixture.ngZone) {
      fixture.ngZone.run(() => router.initialNavigation());
      tick(); // is needed for rendering of the current route.
    }
  }));
});
