import { Routes } from '@angular/router';
import { SessionEditComponent } from './session-edit/session-edit.component';
import { ExitGuard } from '../shared/guards/exit.guard';
import { SessionViewComponent } from './session-view/session-view.component';

export const SESSION_ROUTES: Routes = [
  {
    path: ':sessionId/edit',
    component: SessionEditComponent,
    canDeactivate: [ExitGuard],
  },
  {
    path: ':sessionId/view',
    component: SessionViewComponent,
    canDeactivate: [ExitGuard],
  },
];
