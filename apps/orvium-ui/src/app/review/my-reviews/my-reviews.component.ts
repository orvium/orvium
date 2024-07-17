import { Component, OnInit } from '@angular/core';
import { DefaultService, ReviewPopulatedDTO, ReviewStatus } from '@orvium/api';
import { Title } from '@angular/platform-browser';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { InvitationsListComponent } from '../../invitations/invitations-list/invitations-list.component';
import { ReviewListComponent } from '../review-list/review-list.component';
import { AlertComponent } from '../../shared/alert/alert.component';

/**
 * Component responsible for handle the reviews of am active log-in user
 */
@Component({
  selector: 'app-my-reviews',
  standalone: true,
  templateUrl: './my-reviews.component.html',
  styleUrls: ['./my-reviews.component.scss'],
  imports: [
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    InvitationsListComponent,
    ReviewListComponent,
    AlertComponent,
  ],
})
export class MyReviewsComponent implements OnInit {
  /** List of reviews as a DTO list */
  reviews: ReviewPopulatedDTO[] = [];

  /**
   * Constructs the MyReviewsComponent instance, initializing dependencies.
   *
   * @param {DefaultService} apiService - Service for API calls to the backend.
   * @param {Title} titleService - Service for modifying the title of the document.
   */
  constructor(
    private apiService: DefaultService,
    private titleService: Title
  ) {}

  /**
   * Initializes the component by fetching and sorting reviews related to the user.
   */
  ngOnInit(): void {
    this.titleService.setTitle('My Reviews');

    this.apiService.getMyReviews({}).subscribe(response => {
      const inProgress = response.reviews.filter(
        review =>
          review.status === ReviewStatus.Draft || review.status === ReviewStatus.PendingApproval
      );
      const resolved = response.reviews.filter(review => review.status === ReviewStatus.Published);
      this.reviews.push(...inProgress);
      this.reviews.push(...resolved);
    });
  }
}
