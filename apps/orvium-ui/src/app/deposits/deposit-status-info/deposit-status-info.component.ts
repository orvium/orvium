import { Component, Input, ViewChild } from '@angular/core';
import { DepositStatus } from '@orvium/api';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';

/**
 * Component for displaying the status of a deposit within a stepped process indicator.
 * It visually represents the progress of a deposit through various stages such as draft, pending approval, preprint, and published.
 */
@Component({
  selector: 'app-deposit-status-info',
  standalone: true,
  templateUrl: './deposit-status-info.component.html',
  styleUrls: ['./deposit-status-info.component.scss'],
  imports: [MatStepperModule],
})
export class DepositStatusInfoComponent {
  /** Reference to the stepper component used to display deposit progress steps. */
  private _stepper?: MatStepper;

  /** Current status of the deposit, used to determine the active and completed steps in the stepper. */
  private _status: DepositStatus = DepositStatus.Draft;

  /** Object holding flags indicating the completion status of each step in the deposit process. */
  completedSteps = {
    draft: true,
    pending: false,
    preprint: false,
    published: false,
  };

  /** Sets the stepper component from a ViewChild query and initializes the step classes based on the current deposit status. */
  @ViewChild('stepper') set stepper(stepper: MatStepper | undefined) {
    this._stepper = stepper;
    this.setClasses(this._status);
  }

  /** Sets the current status of the deposit and updates the stepper to reflect the changes. */
  @Input() set status(status: DepositStatus) {
    this._status = status;
    this.setClasses(status);
  }

  /**
   * Updates the completion flags and selected index of the stepper based on the current deposit status.
   * This method directly manipulates the stepper to show the correct step as active and completed based on the deposit's lifecycle state.
   *
   * @param {DepositStatus} status - The deposit status to reflect in the stepper.
   */
  setClasses(status: DepositStatus): void {
    if (!this._stepper) {
      return;
    }

    switch (status) {
      case DepositStatus.Draft: {
        this.completedSteps = {
          draft: true,
          pending: false,
          preprint: false,
          published: false,
        };
        this._stepper.selectedIndex = 0;
        break;
      }
      case DepositStatus.PendingApproval: {
        this.completedSteps = {
          draft: true,
          pending: true,
          preprint: false,
          published: false,
        };
        this._stepper.selectedIndex = 1;
        break;
      }
      case DepositStatus.Preprint: {
        this.completedSteps = {
          draft: true,
          pending: true,
          preprint: true,
          published: false,
        };
        this._stepper.selectedIndex = 2;
        break;
      }
      case DepositStatus.Published: {
        this.completedSteps = {
          draft: true,
          pending: true,
          preprint: true,
          published: true,
        };
        this._stepper.selectedIndex = 3;
        break;
      }
    }
  }
}
