import { Component, Input, ViewChild } from '@angular/core';
import { ReviewStatus } from '@orvium/api';
import { NgClass } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';

/**
 * Component that provides visual feedback on the review status using a stepper interface.
 * It dynamically updates the stepper based on the review status to show the progress of a review.
 */
@Component({
  selector: 'app-review-status-info',
  standalone: true,
  templateUrl: './review-status-info.component.html',
  styleUrls: ['./review-status-info.component.scss'],
  imports: [NgClass, MatIconModule, MatStepperModule],
})
export class ReviewStatusInfoComponent {
  /** Local reference to the MatStepper instance. */
  private _stepper?: MatStepper;

  /** Current status of the review. */
  private _status: ReviewStatus = ReviewStatus.Draft;

  /**
   * Object representing the completion state of each step in the review process.
   */
  completedSteps = {
    draft: true,
    pending: false,
    published: false,
  };

  /**
   * Sets the stepper instance and initializes the step states based on the current review status.
   *
   * @param {MatStepper | undefined} stepper - The stepper component used to display review progress.
   */
  @ViewChild('stepper') set stepper(stepper: MatStepper | undefined) {
    this._stepper = stepper;
    this.setClasses(this._status);
  }

  /**
   * Updates the review status and adjusts the stepper display accordingly.
   *
   * @param {ReviewStatus} status - The new status to apply to the review.
   */
  @Input() set status(status: ReviewStatus) {
    this._status = status;
    this.setClasses(status);
  }

  /**
   * Configures the stepper based on the review status, marking steps as completed and selecting the appropriate index.
   *
   * @param {ReviewStatus} status - The current status of the review process.
   */
  setClasses(status: ReviewStatus): void {
    if (!this._stepper) {
      return;
    }

    switch (status) {
      case ReviewStatus.Draft: {
        this.completedSteps = {
          draft: true,
          pending: false,
          published: false,
        };
        this._stepper.selectedIndex = 0;
        break;
      }
      case ReviewStatus.PendingApproval: {
        this.completedSteps = {
          draft: true,
          pending: true,
          published: false,
        };
        this._stepper.selectedIndex = 0;
        break;
      }
      case ReviewStatus.Published: {
        this.completedSteps = {
          draft: true,
          pending: true,
          published: true,
        };
        this._stepper.selectedIndex = 0;
        break;
      }
    }
  }
}
