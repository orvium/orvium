import { Injectable, Optional } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { map } from 'rxjs/operators';

/**
 * Service to guard routes in an Angular application, ensuring that certain routes can only be accessed by authenticated users.
 * This guard can integrate with OIDC (OpenID Connect) via the OidcSecurityService to check authentication status and handle
 * redirections based on user login state.
 */
@Injectable({ providedIn: 'root' })
export class AuthGuardService {
  /**
   * Constructs the AuthGuardService with dependencies needed for route guarding.
   *
   * @param {Router} router - The Angular Router service used to navigate to other routes.
   * @param {Location} location - The Angular Location service used to manage history manipulation.
   * @param {OidcSecurityService} [oidcSecurityService] - Optional OIDC Security Service for checking authentication status.
   */
  constructor(
    private router: Router,
    private location: Location,
    @Optional() private oidcSecurityService?: OidcSecurityService
  ) {}

  /**
   * Determines if the current route can be activated based on the authentication status.
   * Redirects to an error page if the user is not authenticated, otherwise allows the route activation.
   *
   * @param {ActivatedRouteSnapshot} next - The next route snapshot that will be activated if the guard passes.
   * @param {RouterStateSnapshot} state - The router state snapshot of the application.
   * @returns {Observable<boolean> | Promise<boolean | UrlTree> | boolean}  True if the route can be activated, otherwise false or a UrlTree.
   */
  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean | UrlTree> | boolean {
    // SSR does not resolve authorized pages
    if (!this.oidcSecurityService?.isAuthenticated$) {
      return false;
    }
    return this.oidcSecurityService.isAuthenticated$.pipe(
      map(authenticatedResult => {
        if (!authenticatedResult.isAuthenticated) {
          void this.router.navigate(['/error']).then(() => {
            this.location.replaceState(state.url);
          });
          return false;
        }
        return true;
      })
    );
  }
}
