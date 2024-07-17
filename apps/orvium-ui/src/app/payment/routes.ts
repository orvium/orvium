import { AuthGuardService } from '../auth/auth-guard.service';
import { Routes } from '@angular/router';
import { PaymentViewComponent } from './payment-view/payment-view.component';

export const PAYMENTS_ROUTES: Routes = [
  {
    path: '',
    component: PaymentViewComponent,
    canActivate: [AuthGuardService],
  },
];
