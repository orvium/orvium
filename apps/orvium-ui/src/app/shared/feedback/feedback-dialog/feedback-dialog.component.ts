import { AfterViewInit, Component } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FEEDBACK_TYPE } from '../entity/feedback';
import { FeedbackService } from '../feedback.service';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { FeedbackDTO } from '@orvium/api';

/**
 * A component for displaying a feedback dialog.
 * Allows users to submit various types of feedback.
 */
@Component({
  selector: 'app-feedback-dialog',
  standalone: true,
  templateUrl: './feedback-dialog.component.html',
  styleUrls: ['./feedback-dialog.component.scss'],
  imports: [
    MatFormFieldModule,
    MatButtonModule,
    FormsModule,
    MatInputModule,
    MatSelectModule,
    MatDialogModule,
  ],
})
export class FeedbackDialogComponent implements AfterViewInit {
  /** The feedback object containing user email, description, and additional data. */
  public feedback: FeedbackDTO;

  /**
   * An array of feedback types available for selection in the dialog.
   * Each type has a value and a view value.
   */
  feedbackTypes = [
    { value: FEEDBACK_TYPE.general, viewValue: 'General feedback' },
    { value: FEEDBACK_TYPE.bug, viewValue: 'Bug/Error' },
    { value: FEEDBACK_TYPE.claim, viewValue: 'Claim article' },
    { value: FEEDBACK_TYPE.inappropriate, viewValue: 'Inappropriate/Offensive content' },
    { value: FEEDBACK_TYPE.other, viewValue: 'Other' },
  ];

  /** The selected feedback type, defaulting to general feedback. */
  selected = FEEDBACK_TYPE.general;

  /**
   * Constructs the FeedbackDialogComponent.
   * Initializes the feedback object with user's email and current URL.
   *
   * @param {MatDialogRef<FeedbackDialogComponent>} dialogRef - Reference to the dialog opened.
   * @param {FeedbackService} feedbackService - Service to handle feedback operations.
   * @param {Router} router - Router to access the current URL.
   */
  constructor(
    public dialogRef: MatDialogRef<FeedbackDialogComponent>,
    public feedbackService: FeedbackService,
    private router: Router
  ) {
    this.feedback = {
      email: feedbackService.initialVariables.user?.email ?? '',
      description: '',
      data: {
        user: feedbackService.initialVariables.user,
        url: this.router.url,
      },
    };
  }

  /**
   * Lifecycle hook that is called after a component's view has been fully initialized.
   * Subscribes to the afterClosed observable of the dialog reference.
   */
  public ngAfterViewInit(): void {
    this.dialogRef.afterClosed().subscribe(sendNow => {
      if (sendNow === true) {
        this.feedbackService.setFeedback(this.feedback);
      }
    });
  }
}
