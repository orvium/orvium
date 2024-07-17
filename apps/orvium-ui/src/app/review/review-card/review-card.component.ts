import { Component, Input, OnInit } from '@angular/core';
import { DepositStatus, ReviewDecision, ReviewKind, ReviewPopulatedDTO } from '@orvium/api';
import { DatePipe, SlicePipe, TitleCasePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { SeparatorPipe } from '../../shared/custom-pipes/separator.pipe';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FileCardComponent } from '../../shared/file-card/file-card.component';
import { ShowMoreComponent } from '../../shared/show-more/show-more.component';
import { AvatarDirective } from '../../shared/directives/avatar.directive';
import { ContributorLineComponent } from '../../shared/contributor-line/contributor-line.component';
import { ReviewVisibilityComponent } from '../review-visibility/review-visibility.component';
import { CopyToClipboardDirective } from '../../shared/directives/copy-to-clipboard.directive';

/**
 * Represents information about review icons.
 */
class ReviewIconsInfo {
  /** The icon associated with the review status. */
  icon!: string;

  /** The description associated with the icon, indicating the review decision. */
  description!: string;
}

/**
 * Component to display a review card with details such as decision, status, and associated actions.
 */
@Component({
  selector: 'app-review-card',
  standalone: true,
  templateUrl: './review-card.component.html',
  styleUrls: ['./review-card.component.scss'],
  imports: [
    RouterLink,
    MatIconModule,
    AvatarDirective,
    SeparatorPipe,
    SlicePipe,
    MatButtonModule,
    MatCardModule,
    DatePipe,
    MatMenuModule,
    MatChipsModule,
    MatTooltipModule,
    FileCardComponent,
    ShowMoreComponent,
    ContributorLineComponent,
    ReviewVisibilityComponent,
    TitleCasePipe,
    CopyToClipboardDirective,
  ],
})
export class ReviewCardComponent implements OnInit {
  /** The review data to be displayed on the card. */
  @Input({ required: true }) review!: ReviewPopulatedDTO;

  /** Indicates if the "Read Review" button should be shown. */
  @Input() showReadButton = true;

  /** Indicates whether additional details of the review should be expanded by default. */
  @Input() expanded = false;

  /**  Optional link for initiating a chat related to the review. */
  @Input() chatLink?: string;

  /** Enum mapping for the review decision status. */
  DepositStatus = DepositStatus;

  /** Enum mapping for the type of review. */
  ReviewKind = ReviewKind;

  /** Current icon and description for the review based on its decision. */
  reviewIcon: ReviewIconsInfo = {
    icon: 'error',
    description: 'major revision required',
  };

  /**
   * Initializes component data and settings.
   */
  ngOnInit(): void {
    this.reviewIcon = this.getReviewsIcons(this.review);
  }

  /**
   * Determines the appropriate icon and description based on the review's decision.
   *
   * @param {ReviewPopulatedDTO} review - The review data to determine the icon for.
   * @returns {ReviewIconsInfo} - The icon and description corresponding to the review's decision.
   */
  getReviewsIcons(review: ReviewPopulatedDTO): ReviewIconsInfo {
    switch (review.decision) {
      case ReviewDecision.Accepted:
        return {
          icon: 'verified',
          description: 'Accepted',
        };
      case ReviewDecision.MinorRevision:
        return {
          icon: 'published_with_changes',
          description: 'Minor revision',
        };
      default: {
        return {
          icon: 'error',
          description: 'Major revision ',
        };
      }
    }
  }
}
