import { fakeAsync, flush, TestBed, tick } from '@angular/core/testing';
import { Location } from '@angular/common';
import { provideRouter, Router, RouterOutlet } from '@angular/router';
import { MockRender } from 'ng-mocks';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AuthGuardService } from './auth/auth-guard.service';
import { routes } from './routes';

describe('TestRoute:Route', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        provideRouter(routes),
        { provide: AuthGuardService, useValue: (): boolean => true },
      ],
    });
  });

  it('renders / with HomeComponent', fakeAsync(() => {
    const fixture = MockRender(RouterOutlet);
    const router = TestBed.inject(Router);
    const location = TestBed.inject(Location);
    // First we need to initialize navigation.
    location.go('/');
    if (fixture.ngZone) {
      fixture.ngZone.run(() => router.initialNavigation());
      tick(); // is needed for rendering of the current route.
    }

    expect(location.path()).toEqual('');
  }));

  it('renders /search with SearchComponent', fakeAsync(() => {
    const fixture = MockRender(RouterOutlet);
    const router = TestBed.inject(Router);
    const location = TestBed.inject(Location);
    // First we need to initialize navigation.
    location.go('/search');
    if (fixture.ngZone) {
      fixture.ngZone.run(() => router.initialNavigation());
      tick(); // is needed for rendering of the current route.
    }

    expect(location.path()).toEqual('/search');
  }));

  it('renders /publications with MyworkComponent', fakeAsync(() => {
    const fixture = MockRender(RouterOutlet);
    const router = TestBed.inject(Router);
    const location = TestBed.inject(Location);
    // First we need to initialize navigation.
    location.go('/publications');
    if (fixture.ngZone) {
      fixture.ngZone.run(() => router.initialNavigation());
      tick(); // is needed for rendering of the current route.
    }

    expect(location.path()).toEqual('/publications');
  }));

  it('renders /publications with BlockchainComponent', fakeAsync(() => {
    const fixture = MockRender(RouterOutlet);
    const router = TestBed.inject(Router);
    const location = TestBed.inject(Location);
    // First we need to initialize navigation.
    location.go('/blockchain');
    if (fixture.ngZone) {
      fixture.ngZone.run(() => router.initialNavigation());
      tick(); // is needed for rendering of the current route.
    }

    expect(location.path()).toEqual('/blockchain');
  }));

  it('renders /bookmarked with BookmarkedDepositComponent', fakeAsync(() => {
    const fixture = MockRender(RouterOutlet);
    const router = TestBed.inject(Router);
    const location = TestBed.inject(Location);
    // First we need to initialize navigation.
    location.go('/bookmarked');
    if (fixture.ngZone) {
      fixture.ngZone.run(() => router.initialNavigation());
      tick(); // is needed for rendering of the current route.
    }

    expect(location.path()).toEqual('/bookmarked');
  }));

  it('renders /error with PageNotFoundComponent', fakeAsync(() => {
    const fixture = MockRender(RouterOutlet);
    const router = TestBed.inject(Router);
    const location = TestBed.inject(Location);
    // First we need to initialize navigation.
    location.go('/error');
    if (fixture.ngZone) {
      fixture.ngZone.run(() => router.initialNavigation());
      tick(); // is needed for rendering of the current route.
    }
    expect(location.path()).toEqual('/error');
  }));

  it('should render PageNotFoundComponent for non existing route', fakeAsync(() => {
    const fixture = MockRender(RouterOutlet);
    const router = TestBed.inject(Router);
    const location = TestBed.inject(Location);
    // First we need to initialize navigation.
    location.go('/not-a-valid-route');
    if (fixture.ngZone) {
      fixture.ngZone.run(() => router.initialNavigation());
      tick(); // is needed for rendering of the current route.
    }

    expect(location.path()).toEqual('/not-a-valid-route');
    flush();
  }));

  it('should load profile module routes', fakeAsync(() => {
    const fixture = MockRender(RouterOutlet);
    const router = TestBed.inject(Router);
    const location = TestBed.inject(Location);

    location.go('/profile');
    if (fixture.ngZone) {
      fixture.ngZone.run(() => router.initialNavigation());
      tick(); // is needed for rendering of the current route.
    }
    expect(location.path()).toEqual('/profile');
    flush();
  }));

  it('should load communities module routes', fakeAsync(() => {
    const fixture = MockRender(RouterOutlet);
    const router = TestBed.inject(Router);
    const location = TestBed.inject(Location);

    location.go('/communities');
    if (fixture.ngZone) {
      fixture.ngZone.run(() => router.initialNavigation());
      tick(); // is needed for rendering of the current route.
    }
    expect(location.path()).toEqual('/communities');
    flush();
  }));

  it('should load reviews module routes', fakeAsync(() => {
    const fixture = MockRender(RouterOutlet);
    const router = TestBed.inject(Router);
    const location = TestBed.inject(Location);

    location.go('/reviews');
    if (fixture.ngZone) {
      fixture.ngZone.run(() => router.initialNavigation());
      tick(); // is needed for rendering of the current route.
    }
    expect(location.path()).toEqual('/reviews');
    flush();
  }));

  it('should load deposits module routes', fakeAsync(() => {
    const fixture = MockRender(RouterOutlet);
    const router = TestBed.inject(Router);
    const location = TestBed.inject(Location);

    location.go('/deposits');
    if (fixture.ngZone) {
      fixture.ngZone.run(() => router.initialNavigation());
      tick(); // is needed for rendering of the current route.
    }
    expect(location.path()).toEqual('/deposits');
    flush();
  }));

  it('should load ConversationsModule', fakeAsync(() => {
    const fixture = MockRender(RouterOutlet);
    const router = TestBed.inject(Router);
    const location = TestBed.inject(Location);

    location.go('/conversations');
    if (fixture.ngZone) {
      fixture.ngZone.run(() => router.initialNavigation());
      tick(); // is needed for rendering of the current route.
    }
    expect(location.path()).toEqual('/conversations');
    flush();
  }));

  it('should load CallModule', fakeAsync(() => {
    const fixture = MockRender(RouterOutlet);
    const router = TestBed.inject(Router);
    const location = TestBed.inject(Location);

    location.go('/call');
    if (fixture.ngZone) {
      fixture.ngZone.run(() => router.initialNavigation());
      tick(); // is needed for rendering of the current route.
    }
    expect(location.path()).toEqual('/call');
    flush();
  }));

  it('should load SessionModule', fakeAsync(() => {
    const fixture = MockRender(RouterOutlet);
    const router = TestBed.inject(Router);
    const location = TestBed.inject(Location);

    location.go('/session');
    if (fixture.ngZone) {
      fixture.ngZone.run(() => router.initialNavigation());
      tick(); // is needed for rendering of the current route.
    }
    expect(location.path()).toEqual('/session');
    flush();
  }));

  it('should load Routes', fakeAsync(() => {
    const fixture = MockRender(RouterOutlet);
    const router = TestBed.inject(Router);
    const location = TestBed.inject(Location);

    location.go('/templates');
    if (fixture.ngZone) {
      fixture.ngZone.run(() => router.initialNavigation());
      tick(); // is needed for rendering of the current route.
    }
    expect(location.path()).toEqual('/templates');
    flush();
  }));

  it('should load ChatModule', fakeAsync(() => {
    const fixture = MockRender(RouterOutlet);
    const router = TestBed.inject(Router);
    const location = TestBed.inject(Location);

    location.go('/chat');
    if (fixture.ngZone) {
      fixture.ngZone.run(() => router.initialNavigation());
      tick(); // is needed for rendering of the current route.
    }
    expect(location.path()).toEqual('/chat');
    flush();
  }));

  it('should load DemoModule', fakeAsync(() => {
    const fixture = MockRender(RouterOutlet);
    const router = TestBed.inject(Router);
    const location = TestBed.inject(Location);

    location.go('/demo');
    if (fixture.ngZone) {
      fixture.ngZone.run(() => router.initialNavigation());
      tick(); // is needed for rendering of the current route.
    }
    expect(location.path()).toEqual('/demo');
    flush();
  }));

  it('should load PaymentModule', fakeAsync(() => {
    const fixture = MockRender(RouterOutlet);
    const router = TestBed.inject(Router);
    const location = TestBed.inject(Location);

    location.go('/payments');
    if (fixture.ngZone) {
      fixture.ngZone.run(() => router.initialNavigation());
      tick(); // is needed for rendering of the current route.
    }
    expect(location.path()).toEqual('/payments');
    flush();
  }));

  it('should load AdminPanel', fakeAsync(() => {
    const fixture = MockRender(RouterOutlet);
    const router = TestBed.inject(Router);
    const location = TestBed.inject(Location);

    location.go('/admin-dashboard');
    if (fixture.ngZone) {
      fixture.ngZone.run(() => router.initialNavigation());
      tick(); // is needed for rendering of the current route.
    }
    expect(location.path()).toEqual('/admin-dashboard');
    flush();
  }));
});
