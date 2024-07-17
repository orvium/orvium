import { Routes } from '@angular/router';
import { TemplatesComponent } from './templates/templates.component';
import { AuthGuardService } from '../auth/auth-guard.service';
import { ExitGuard } from '../shared/guards/exit.guard';

export const TEMPLATES_ROUTES: Routes = [
  {
    path: '',
    component: TemplatesComponent,
    canActivate: [AuthGuardService],
    canDeactivate: [ExitGuard],
  },
];
