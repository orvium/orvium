import { Component, OnInit } from '@angular/core';
import { AppSnackBarService } from '../../services/app-snack-bar.service';
import { DefaultService, FeedbackDTO, UserPrivateDTO } from '@orvium/api';
import { ProfileService } from '../../profile/profile.service';
import { MatButtonModule } from '@angular/material/button';
import { FeedbackDirective } from '../../shared/feedback/feedback.directive';

/**
 * Represents the footer component of the application, handling user interactions
 * and feedback submission.
 */
@Component({
  selector: 'app-footer',
  standalone: true,
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  imports: [MatButtonModule, FeedbackDirective],
})
export class FooterComponent implements OnInit {
  /** Holds the private user information if available */
  protected user: UserPrivateDTO | undefined;

  /**
   * Constructs the FooterComponent with necessary dependencies.
   *
   * @param apiService Service for API calls, particularly for sending feedback.
   * @param profileService Service to access user profile information.
   * @param snackBar Service to show snack bar notifications.
   */
  constructor(
    private apiService: DefaultService,
    public profileService: ProfileService,
    private snackBar: AppSnackBarService
  ) {}

  /**
   * Sends user feedback to the server and displays a notification.
   *
   * @param event Data transfer object containing user feedback.
   */
  onSend(event: FeedbackDTO): void {
    this.apiService.createFeedback({ feedbackDTO: event }).subscribe(data => {
      this.snackBar.info('Thank you for your feedback!');
    });
  }

  /**
   * Initializes the component by retrieving the user's profile information.
   */
  ngOnInit(): void {
    this.user = this.profileService.profile.getValue();
  }
}
