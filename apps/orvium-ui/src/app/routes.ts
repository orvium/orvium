import { Routes } from '@angular/router';
import { routes as prodRoutes } from './routes.prod';

export const routes: Routes = [
  {
    path: 'demo',
    loadChildren: () => import('./demo/routes').then(m => m.DEMO_ROUTES),
  },
  ...prodRoutes,
];
