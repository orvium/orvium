import { AuthenticationService } from './authentication.service';
import { TestBed } from '@angular/core/testing';
import { AuthModule, OidcSecurityService } from 'angular-auth-oidc-client';
import { environment } from '../../environments/environment';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { MockComponent } from 'ng-mocks';
import { UserDeletedComponent } from '../profile/user-deleted/user-deleted.component';

describe('AuthenticationService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule.withRoutes([
          { path: 'user-deleted', component: MockComponent(UserDeletedComponent) },
        ]),
        AuthModule.forRoot({
          config: {
            authority: environment.auth.ISSUER,
            redirectUrl: environment.auth.REDIRECT_URL,
            postLogoutRedirectUri: environment.auth.REDIRECT_URL,
            clientId: environment.auth.CLIENT_ID,
            scope: 'openid profile email offline_access',
            responseType: 'code',
            silentRenew: true,
            useRefreshToken: true,
            secureRoutes: [environment.apiEndpoint],
            configId: 'default',
          },
        }),
      ],
    });
  });

  it('should be created', () => {
    const service = TestBed.inject(AuthenticationService);
    expect(service).toBeDefined();
  });

  it('should login', () => {
    const service = TestBed.inject(AuthenticationService);
    const oidcSecurityService = TestBed.inject(OidcSecurityService);
    jest.spyOn(oidcSecurityService, 'authorize');
    service.login();
    expect(oidcSecurityService.authorize).toHaveBeenCalled();
  });

  it('should login with invitation token', () => {
    const service = TestBed.inject(AuthenticationService);
    const oidcSecurityService = TestBed.inject(OidcSecurityService);
    jest.spyOn(oidcSecurityService, 'authorize');
    jest.spyOn(sessionStorage, 'setItem').mockImplementation();
    service.login('myInvitationToken');
    expect(oidcSecurityService.authorize).toHaveBeenCalled();
    expect(sessionStorage.setItem).toHaveBeenCalledWith('inviteToken', 'myInvitationToken');
  });

  it('should logoff', () => {
    const service = TestBed.inject(AuthenticationService);
    const oidcSecurityService = TestBed.inject(OidcSecurityService);
    jest.spyOn(oidcSecurityService, 'logoffAndRevokeTokens').mockReturnValue(of('logged out'));
    jest.spyOn(oidcSecurityService, 'logoffLocal');
    service.logoff();
    expect(oidcSecurityService.logoffAndRevokeTokens).toHaveBeenCalled();
    expect(oidcSecurityService.logoffLocal).toHaveBeenCalled();
  });

  it('should logoff user deleted', () => {
    const service = TestBed.inject(AuthenticationService);
    const oidcSecurityService = TestBed.inject(OidcSecurityService);

    jest.spyOn(oidcSecurityService, 'logoffAndRevokeTokens').mockReturnValue(of('logged out'));
    service.logoffUserDeleted();
    expect(oidcSecurityService.logoffAndRevokeTokens).toHaveBeenCalled();
  });
});
