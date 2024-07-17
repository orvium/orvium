import { Routes } from '@angular/router';
import { CommunityViewComponent } from './community-view/community-view.component';
import { ModeratorPanelComponent } from './moderator-panel/moderator-panel.component';
import { CommunityDetailsComponent } from './community-details/community-details.component';
import { CommunitiesOverviewComponent } from './communities-overview/communities-overview.component';
import { ExitGuard } from '../shared/guards/exit.guard';
import { ConferenceProgramComponent } from './conference-program/conference-program.component';
import { OrderInfoComponent } from './order-info/order-info.component';
import { CommunityIntegrationsComponent } from './community-integrations/community-integrations.component';
import { TemplatesComponent } from '../templates/templates/templates.component';
import { CommunityProductsComponent } from './community-products/community-products.component';
import { CommunityPaymentsComponent } from './community-payments/community-payments.component';
import { AuthGuardService } from '../auth/auth-guard.service';
import { MyComunitiesComponent } from './my-comunities/my-comunities.component';

export const COMMUNITIES_ROUTES: Routes = [
  {
    path: '',
    component: CommunitiesOverviewComponent,
  },
  {
    path: ':communityId/view',
    component: CommunityViewComponent,
  },
  {
    path: ':communityId/moderate',
    component: ModeratorPanelComponent,
  },
  {
    path: ':communityId/edit',
    component: CommunityDetailsComponent,
    canDeactivate: [ExitGuard],
  },
  {
    path: ':communityId/integrations',
    component: CommunityIntegrationsComponent,
    canDeactivate: [ExitGuard],
  },
  {
    path: ':communityId/program',
    component: ConferenceProgramComponent,
    canActivate: [],
  },
  {
    path: ':communityId/products',
    component: CommunityProductsComponent,
  },
  {
    path: ':communityId/order-info',
    component: OrderInfoComponent,
  },
  {
    path: ':communityId/templates',
    component: TemplatesComponent,
    canDeactivate: [ExitGuard],
  },
  {
    path: ':communityId/payments',
    component: CommunityPaymentsComponent,
  },
  {
    path: 'my-communities',
    component: MyComunitiesComponent,
    canActivate: [AuthGuardService],
  },
];
