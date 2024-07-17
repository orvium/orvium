import { Routes } from '@angular/router';
import { CallEditComponent } from './call-edit/call-edit.component';
import { ExitGuard } from '../shared/guards/exit.guard';

export const CALL_ROUTES: Routes = [
  {
    path: ':callId/edit',
    component: CallEditComponent,
    canDeactivate: [ExitGuard],
  },
];
