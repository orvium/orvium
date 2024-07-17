import { Component } from '@angular/core';
import { DefaultService, FeedbackDTO } from '@orvium/api';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { FeedbackDirective } from '../shared/feedback/feedback.directive';
import { AppSnackBarService } from '../services/app-snack-bar.service';

/**
 * Component representing an unauthorized page view. This component is used to display an
 * unauthorized access message to the user.
 */
@Component({
  selector: 'app-unauthorized-page',
  standalone: true,
  templateUrl: './unauthorized-page.component.html',
  styleUrls: ['./unauthorized-page.component.scss'],
  imports: [MatButtonModule, MatIconModule, RouterLink, FeedbackDirective],
})
export class UnauthorizedPageComponent {
  /**
   * Constructs the UnauthorizedPageComponent.
   *
   * @param apiService Service for API calls, particularly for submitting feedback.
   * @param snackBarService Service to show informational snack bars to the user.
   */
  constructor(
    private apiService: DefaultService,
    private snackBarService: AppSnackBarService
  ) {}

  /**
   * Sends feedback from the user to the backend via the API service.
   *
   * @param event The feedback data object containing the user's input.
   */
  onSend(event: FeedbackDTO): void {
    this.apiService.createFeedback({ feedbackDTO: event }).subscribe(() => {
      this.snackBarService.info('Thank you for your feedback!');
    });
  }
}
