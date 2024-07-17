import { Routes } from '@angular/router';
import { DashboardDemoComponent } from './dashboard-demo/dashboard-demo.component';
import { AccessDeniedDemoComponent } from './access-denied-demo/access-denied-demo.component';
import { BenefitsDemoComponent } from './benefits-demo/benefits-demo.component';
import { SpinnerDemoComponent } from './spinner-demo/spinner-demo.component';
import { SearchBarDemoComponent } from './search-bar-demo/search-bar-demo.component';
import { ProfileMenuDemoComponent } from './profile-menu-demo/profile-menu-demo.component';
import { CommunityCalendarDemoComponent } from './community-calendar-demo/community-calendar-demo.component';
import { AlertDemoComponent } from './alert-demo/alert-demo.component';
import { FileCardDemoComponent } from './file-card-demo/file-card-demo.component';
import { ReviewCardDemoComponent } from './review-card-demo/review-card-demo.component';
import { CommunityCardDemoComponent } from './community-card-demo/community-card-demo.component';
import { CallForPapersCardDemoComponent } from './call-for-papers-card-demo/call-for-papers-card-demo.component';
import { PredefinedDialogsDemoComponent } from './predefined-dialogs-demo/predefined-dialogs-demo.component';
import { DepositCardDemoComponent } from './deposit-card-demo/deposit-card-demo.component';
import { AuthorsListDemoComponent } from './authors-list-demo/authors-list-demo.component';
import { StatusInfoDemoComponent } from './status-info-demo/status-info-demo.component';
import { ThemeOverviewDemoComponent } from './theme-overview-demo/theme-overview-demo.component';
import { CommentSectionDemoComponent } from './comment-section-demo/comment-section-demo.component';
import { ContributorLineDemoComponent } from './contributor-line-demo/contributor-line-demo.component';
import { TableOfContentsDemoComponent } from './table-of-contents-demo/table-of-contents-demo.component';
import { SendNotificationsDemoComponent } from './send-notifications-demo/send-notifications-demo.component';
import { PaymentCardDemoComponent } from './payment-card-demo/payment-card-demo.component';
import { ChipsDemoComponent } from './chips-demo/chips-demo.component';
import { ChatListDemoComponent } from './chat-list-demo/chat-list-demo.component';
import { AfterSubmitViewDemoComponent } from './after-submit-view-demo/after-submit-view-demo.component';

export const DEMO_ROUTES: Routes = [
  {
    path: '',
    component: DashboardDemoComponent,
  },
  {
    path: 'access-denied',
    component: AccessDeniedDemoComponent,
  },
  {
    path: 'alert',
    component: AlertDemoComponent,
  },
  {
    path: 'benefit',
    component: BenefitsDemoComponent,
  },
  {
    path: 'community-card',
    component: CommunityCardDemoComponent,
  },
  {
    path: 'call-for-papers',
    component: CallForPapersCardDemoComponent,
  },
  {
    path: 'comment-section',
    component: CommentSectionDemoComponent,
  },
  {
    path: 'file-card',
    component: FileCardDemoComponent,
  },
  {
    path: 'spinner',
    component: SpinnerDemoComponent,
  },
  {
    path: 'searchbar',
    component: SearchBarDemoComponent,
  },
  {
    path: 'profile-menu',
    component: ProfileMenuDemoComponent,
  },
  {
    path: 'calendar',
    component: CommunityCalendarDemoComponent,
  },
  {
    path: 'chips',
    component: ChipsDemoComponent,
  },
  {
    path: 'review-card',
    component: ReviewCardDemoComponent,
  },
  {
    path: 'payment-card',
    component: PaymentCardDemoComponent,
  },
  {
    path: 'predefined-dialogs',
    component: PredefinedDialogsDemoComponent,
  },
  {
    path: 'deposit-card',
    component: DepositCardDemoComponent,
  },
  {
    path: 'author-list',
    component: AuthorsListDemoComponent,
  },
  {
    path: 'status-info',
    component: StatusInfoDemoComponent,
  },
  {
    path: 'contributor-line',
    component: ContributorLineDemoComponent,
  },
  {
    path: 'theme',
    component: ThemeOverviewDemoComponent,
  },
  {
    path: 'toc',
    component: TableOfContentsDemoComponent,
  },
  {
    path: 'send-notifications',
    component: SendNotificationsDemoComponent,
  },
  {
    path: 'chat-list',
    component: ChatListDemoComponent,
  },
  {
    path: 'after-submit',
    component: AfterSubmitViewDemoComponent,
  },
];
