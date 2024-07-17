import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MockProvider, MockRender } from 'ng-mocks';
import { AuthGuardService } from './auth-guard.service';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { firstValueFrom, of } from 'rxjs';
import { assertIsObservable } from '../shared/shared-functions';

describe('AuthGuardService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [MockProvider(OidcSecurityService)],
    });
  });

  it('should be created', () => {
    const fixture = MockRender(AuthGuardService);
    expect(fixture).toBeTruthy();
  });

  it('should activate when user is authenticated', async () => {
    const fixture = MockRender(AuthGuardService);
    const oidcService = TestBed.inject(OidcSecurityService);
    jest.spyOn(oidcService, 'isAuthenticated$', 'get').mockReturnValue(
      of({
        isAuthenticated: true,
        allConfigsAuthenticated: [],
      })
    );

    const result = await fixture.point.componentInstance.canActivate(
      {} as ActivatedRouteSnapshot,
      { url: 'nextUrl' } as RouterStateSnapshot
    );
    assertIsObservable(result);
    await expect(firstValueFrom(result)).resolves.toBe(true);
  });

  it('should navigate to error when user is NOT authenticated', async () => {
    const fixture = MockRender(AuthGuardService);
    const oidcService = TestBed.inject(OidcSecurityService);
    const router = TestBed.inject(Router);
    jest.spyOn(oidcService, 'isAuthenticated$', 'get').mockReturnValue(
      of({
        isAuthenticated: false,
        allConfigsAuthenticated: [],
      })
    );
    const spyRouter = jest.spyOn(router, 'navigate').mockResolvedValue(true);

    const result = await fixture.point.componentInstance.canActivate(
      {} as ActivatedRouteSnapshot,
      { url: 'nextUrl' } as RouterStateSnapshot
    );
    assertIsObservable(result);
    await expect(firstValueFrom(result)).resolves.toBe(false);
    expect(spyRouter).toHaveBeenCalledWith(['/error']);
  });

  it('should return false in SSR', async () => {
    const fixture = MockRender(AuthGuardService);
    const oidcService = TestBed.inject(OidcSecurityService);

    // @ts-expect-error forcing isAuthenticated to be undefined like in SSR
    jest.spyOn(oidcService, 'isAuthenticated$', 'get').mockReturnValue(undefined);

    const result = await fixture.point.componentInstance.canActivate(
      {} as ActivatedRouteSnapshot,
      { url: 'nextUrl' } as RouterStateSnapshot
    );
    expect(typeof result).toBe('boolean');
    expect(result).toBe(false);
  });
});
