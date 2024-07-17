import { Component } from '@angular/core';
import { DefaultService, FeedbackDTO } from '@orvium/api';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { FeedbackDirective } from '../shared/feedback/feedback.directive';
import { AppSnackBarService } from '../services/app-snack-bar.service';

/**
 * Component that renders a 'Page Not Found' view. This is typically used for handling 404 errors where the requested
 * page does not exist. It provides users an option to send feedback via a button that triggers the `onSend` method.
 */
@Component({
  selector: 'app-page-not-found',
  standalone: true,
  templateUrl: './page-not-found.component.html',
  styleUrls: ['./page-not-found.component.scss'],
  imports: [MatButtonModule, MatIconModule, RouterLink, FeedbackDirective],
})
export class PageNotFoundComponent {
  /**
   * Constructs the PageNotFoundComponent.
   *
   * @param {DefaultService} apiService - Service used to communicate with backend APIs for actions like sending feedback.
   * @param {AppSnackBarService} snackbarService - Service used to display snack bars for user notifications.
   */
  constructor(
    private apiService: DefaultService,
    private snackbarService: AppSnackBarService
  ) {}

  /**
   * Handles sending of feedback from the user. Expected to be triggered by a user action, such as clicking a 'Send Feedback' button.
   *
   * @param {object} event - The event object containing feedback data, expected to conform to the FeedbackDTO interface.
   */
  onSend(event: object): void {
    const feedback = event as FeedbackDTO;
    this.apiService.createFeedback({ feedbackDTO: feedback }).subscribe(data => {
      this.snackbarService.info('Thank you for your feedback!', 'Dismiss');
    });
  }
}
