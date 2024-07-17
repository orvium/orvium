import { Component, Input } from '@angular/core';
import { ReviewDecision, ReviewPopulatedDTO, ReviewStatus } from '@orvium/api';
import { REVIEWDECISION_LOV } from '../../model/orvium';
import { MatChipsModule } from '@angular/material/chips';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { AuthorAvatarListComponent } from '../../shared/author-avatar-list/author-avatar-list.component';
import { MatMenuModule } from '@angular/material/menu';
import { ContributorLineComponent } from '../../shared/contributor-line/contributor-line.component';
import { ListWrapperComponent } from '../../shared/list-wrapper/list-wrapper.component';
import { ReviewIconPipe } from '../../shared/custom-pipes/review-icon.pipe';
import { ReviewVisibilityComponent } from '../review-visibility/review-visibility.component';
import { CopyToClipboardDirective } from '../../shared/directives/copy-to-clipboard.directive';
import { MatTooltipModule } from '@angular/material/tooltip';

/**
 * Component for listing reviews with various details displayed such as the review status, decisions, and icons.
 */
@Component({
  selector: 'app-review-list',
  standalone: true,
  templateUrl: './review-list.component.html',
  styleUrls: ['./review-list.component.scss'],
  imports: [
    MatChipsModule,
    TitleCasePipe,
    MatButtonModule,
    MatIconModule,
    RouterLink,
    MatListModule,
    AuthorAvatarListComponent,
    DatePipe,
    MatMenuModule,
    ContributorLineComponent,
    ListWrapperComponent,
    ReviewIconPipe,
    ReviewVisibilityComponent,
    CopyToClipboardDirective,
    MatTooltipModule,
  ],
})
export class ReviewListComponent {
  /** Array of reviews to be displayed by the component. Each review contains populated data as a DTO. */
  @Input({ required: true }) reviews: ReviewPopulatedDTO[] = [];

  /** Mapping of review decisions to their corresponding icons. This mapping is initialized based on predefined values. */
  reviewDecisions = new Map<ReviewDecision, string>();

  /** Contains and accesses the review statuses for use within the component, facilitating the display of appropriate status information. */
  ReviewStatus = ReviewStatus;

  /**
   * Construct an object of ReviewListComponent
   */
  constructor() {
    for (const entry of REVIEWDECISION_LOV.values()) {
      this.reviewDecisions.set(entry.value, entry.icon);
    }
  }
}
