import { ProfileService } from '../profile.service';
import { AppSnackBarService } from '../../services/app-snack-bar.service';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { OnboardingComponent } from '../onboarding/onboarding.component';
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CanDeactivateOnboarding {
  constructor(
    private profileService: ProfileService,
    private snackbarService: AppSnackBarService
  ) {}

  canDeactivate(
    component: OnboardingComponent,
    currentRoute: ActivatedRouteSnapshot,
    currentState: RouterStateSnapshot,
    nextState: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    const profile = this.profileService.profile.getValue();
    const canDeactivate = !!profile?.isOnboarded;
    if (!canDeactivate) {
      this.snackbarService.info('Complete your profile and confirm your email first');
    }
    return canDeactivate;
  }
}
