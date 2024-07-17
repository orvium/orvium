import { ProfileComponent } from './profile/profile.component';
import { OnboardingComponent } from './onboarding/onboarding.component';
import { CallbackComponent } from './callback/callback.component';
import { AuthGuardService } from '../auth/auth-guard.service';
import { Routes } from '@angular/router';
import { PublicProfileComponent } from './public-profile/public-profile.component';
import { ExitGuard } from '../shared/guards/exit.guard';
import { ImpersonateProfileComponent } from '../admin/impersonate-profile/impersonate-profile.component';
import { CanDeactivateOnboarding } from './public-profile/CanDeactivateOnboarding';

export const PROFILE_ROUTES: Routes = [
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
    canDeactivate: [CanDeactivateOnboarding],
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
