import { Routes } from '@angular/router';
import { AuthGuardService } from '../auth/auth-guard.service';
import { DepositDetailsComponent } from './deposit-details/deposit-details.component';
import { DepositViewComponent } from './deposit-view/deposit-view.component';
import { DepositInvitationsPanelComponent } from './deposit-invitations-panel/deposit-invitations-panel.component';
import { AfterSubmitViewComponent } from './after-submit-view/after-submit-view.component';
import { ExitGuard } from '../shared/guards/exit.guard';

export const DEPOSIT_ROUTES: Routes = [
  {
    path: 'submitted',
    component: AfterSubmitViewComponent,
  },
  {
    path: ':depositId/edit',
    runGuardsAndResolvers: 'always',
    component: DepositDetailsComponent,
    canActivate: [AuthGuardService],
    canDeactivate: [ExitGuard],
  },
  {
    path: ':depositId',
    redirectTo: 'deposits/:depositId/view',
    pathMatch: 'full',
  },
  {
    path: ':depositId/view',
    runGuardsAndResolvers: 'always',
    component: DepositViewComponent,
  },
  {
    path: ':depositId/invite',
    runGuardsAndResolvers: 'always',
    component: DepositInvitationsPanelComponent,
    canActivate: [AuthGuardService],
  },
];
