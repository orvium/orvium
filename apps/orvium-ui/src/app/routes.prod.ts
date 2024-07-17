import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { AuthGuardService } from './auth/auth-guard.service';
import { UnauthorizedPageComponent } from './unauthorized-page/unauthorized-page.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { UserDeletedComponent } from './profile/user-deleted/user-deleted.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
  },
  {
    path: 'profile',
    loadChildren: () => import('./profile/routes').then(m => m.PROFILE_ROUTES),
  },
  {
    path: 'communities',
    loadChildren: () => import('./communities/routes').then(m => m.COMMUNITIES_ROUTES),
  },
  {
    path: 'reviews',
    loadChildren: () => import('./review/routes').then(m => m.REVIEW_ROUTES),
  },
  {
    path: 'deposits',
    loadChildren: () => import('./deposits/routes').then(m => m.DEPOSIT_ROUTES),
  },
  {
    path: 'templates',
    canActivate: [AuthGuardService],
    loadChildren: () => import('./templates/routes').then(m => m.TEMPLATES_ROUTES),
  },
  {
    path: 'payments',
    canActivate: [AuthGuardService],
    loadChildren: () => import('./payment/routes').then(m => m.PAYMENTS_ROUTES),
  },
  {
    path: 'call',
    loadChildren: () => import('./call/routes').then(m => m.CALL_ROUTES),
  },
  {
    path: 'session',
    loadChildren: () => import('./session/routes').then(m => m.SESSION_ROUTES),
  },
  {
    path: 'search',
    loadComponent: () => import('./search/search/search.component'),
  },
  {
    path: 'blockchain',
    loadComponent: () => import('./blockchain/blockchain-info/blockchain-info.component'),
  },
  {
    path: 'publications',
    loadComponent: () => import('./deposits/my-deposits/my-deposits.component'),
    canActivate: [AuthGuardService],
  },
  {
    path: 'chat',
    loadComponent: () => import('./chat/chat-view/chat-view.component'),
    canActivate: [AuthGuardService],
  },
  {
    path: 'bookmarked',
    loadComponent: () => import('./deposits/bookmarked-deposits/bookmarked-deposits.component'),
    canActivate: [AuthGuardService],
  },
  {
    path: 'admin-dashboard',
    loadComponent: () => import('./admin/admin-panel/admin-panel.component'),
    canActivate: [AuthGuardService],
  },
  { path: 'unauthorized', component: UnauthorizedPageComponent },
  { path: 'user-deleted', component: UserDeletedComponent },
  { path: 'error', component: PageNotFoundComponent },
  { path: '**', component: PageNotFoundComponent },
];
