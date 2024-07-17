import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ReviewPopulatedDTO } from '@orvium/api';
import { AccessDeniedComponent } from '../../shared/access-denied/access-denied.component';
import { TitleCasePipe } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { ReviewStatusInfoComponent } from '../review-status-info/review-status-info.component';

/**
 * Component to display the view of a review after it has been submitted.
 */
@Component({
  selector: 'app-review-after-submit-view',
  standalone: true,
  templateUrl: './review-after-submit-view.component.html',
  styleUrls: ['./review-after-submit-view.component.scss'],
  imports: [
    AccessDeniedComponent,
    RouterLink,
    MatChipsModule,
    TitleCasePipe,
    ReviewStatusInfoComponent,
  ],
})
export class ReviewAfterSubmitViewComponent implements OnInit {
  /**  Holds the review data if passed through navigation extras. */
  review?: ReviewPopulatedDTO;

  /** Concatenated first name and last name of the deposit's primary author. */
  depositAuthor = '';

  /** Array of CSS class names for styling chips based on context in the template. */
  chipClass: string[] = ['orv-chip-secondary', 'orv-chip-yellow', 'orv-chip-pink', 'orv-chip-blue'];

  /**
   * Initializes a new instance of the ReviewAfterSubmitViewComponent.
   *
   * @param {Router} router - The router service to manage navigation and URL manipulation.
   */
  constructor(private router: Router) {
    this.review = this.router.getCurrentNavigation()?.extras.state?.['review'];
  }

  /**
   * Lifecycle hook that is called after data-bound properties of a directive are initialized.
   * Initializes the `depositAuthor` if the review is available.
   */
  ngOnInit(): void {
    if (this.review) {
      this.depositAuthor = `${this.review.depositPopulated.authors[0].firstName} ${this.review.depositPopulated.authors[0].lastName}`;
    }
  }

  /**
   * Navigates to the search page filtered by the specified discipline.
   *
   * @param {string} discipline - The discipline to search by.
   */
  searchByDiscipline(discipline: string): void {
    void this.router.navigate(['/search'], {
      queryParams: { discipline: discipline, size: 10 },
      queryParamsHandling: 'merge',
    });
  }
}
