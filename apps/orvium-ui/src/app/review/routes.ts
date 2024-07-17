import { Routes } from '@angular/router';
import { AuthGuardService } from '../auth/auth-guard.service';
import { ReviewViewComponent } from './review-view/review-view.component';
import { ReviewsCreateComponent } from './reviews-create/reviews-create.component';
import { MyReviewsComponent } from './my-reviews/my-reviews.component';
import { ReviewAfterSubmitViewComponent } from './review-after-submit-view/review-after-submit-view.component';
import { ExitGuard } from '../shared/guards/exit.guard';
import { MyInvitationsComponent } from '../invitations/my-invitations/my-invitations.component';

export const REVIEW_ROUTES: Routes = [
  {
    path: 'myreviews',
    component: MyReviewsComponent,
    canActivate: [AuthGuardService],
  },
  {
    path: 'invitations',
    component: MyInvitationsComponent,
    canActivate: [AuthGuardService],
  },
  {
    path: 'submitted',
    component: ReviewAfterSubmitViewComponent,
  },
  {
    path: ':reviewId/edit',
    runGuardsAndResolvers: 'always',
    component: ReviewsCreateComponent,
    canActivate: [AuthGuardService],
    canDeactivate: [ExitGuard],
  },
  {
    path: ':reviewId/view',
    runGuardsAndResolvers: 'always',
    component: ReviewViewComponent,
    canActivate: [],
  },
];
