import { Injectable } from '@angular/core';
import { LogoutAuthOptions, OidcSecurityService } from 'angular-auth-oidc-client';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';

/**
 * Service for managing authentication processes in the application. It handles user logins and logouts,
 * integrating with OIDC (OpenID Connect) via the OidcSecurityService.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthenticationService {
  /**
   * Constructs the AuthenticationService.
   *
   * @param {Router} router - The Angular Router service used to manage navigation and capture current route state.
   * @param {OidcSecurityService} oidcSecurityService - Service provided by the Angular OIDC library to manage security and authentication.
   */
  constructor(
    private router: Router,
    public oidcSecurityService: OidcSecurityService
  ) {}

  /**
   * Initiates the login process. Stores an invite token if provided and the current route before login for later use.
   * Sets custom parameters for the OIDC authorization request.
   */
  login(inviteToken?: string): void {
    if (inviteToken) {
      sessionStorage.setItem('inviteToken', inviteToken);
    }
    sessionStorage.setItem('beforeLoginRoute', this.router.url);

    const customParams = { audience: environment.auth.AUTH0_AUDIENCE };
    this.oidcSecurityService.authorize(undefined, {
      customParams: customParams,
    });
  }

  /**
   * Logs off the user from the application, revoking tokens and clearing local session state related to the user's security.
   * Allows passing additional parameters to customize the logoff behavior.
   *
   * @param {LogoutAuthOptions} [params] - Optional parameters to adjust the logoff process, such as redirect URLs or token hints.
   */
  logoff(params?: LogoutAuthOptions): void {
    this.oidcSecurityService.logoffAndRevokeTokens(undefined, params).subscribe();
    this.oidcSecurityService.logoffLocal(undefined);
  }

  /**
   * Special logoff method used when a user's account is deleted. Revokes tokens using a POST method and navigates to a specific route
   * after completion, which triggers a page reload to ensure all user data is cleared from the client.
   */
  logoffUserDeleted(): void {
    this.oidcSecurityService
      .logoffAndRevokeTokens(undefined, { logoffMethod: 'POST' })
      .pipe(
        finalize(() => {
          void this.router.navigate(['user-deleted']).then(() => location.reload());
        })
      )
      .subscribe();
  }
}
