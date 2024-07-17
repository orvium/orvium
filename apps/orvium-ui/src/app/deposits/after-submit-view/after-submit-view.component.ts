import { Component, Input, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ProfileService } from '../../profile/profile.service';
import { DepositPopulatedDTO, UserPrivateDTO } from '@orvium/api';
import { AccessDeniedComponent } from '../../shared/access-denied/access-denied.component';

import { MatButtonModule } from '@angular/material/button';
import { DepositStatusInfoComponent } from '../deposit-status-info/deposit-status-info.component';

/**
 * Component responsible for displaying the status and details of a deposit after it has been submitted.
 * This view is typically used to show confirmation or status information to the user post-submission.
 */
@Component({
  selector: 'app-after-submit-view',
  standalone: true,
  templateUrl: './after-submit-view.component.html',
  styleUrls: ['./after-submit-view.component.scss'],
  imports: [AccessDeniedComponent, RouterLink, MatButtonModule, DepositStatusInfoComponent],
})
export class AfterSubmitViewComponent implements OnInit {
  /** Input property that allows a deposit to be passed into the component. */
  @Input() deposit?: DepositPopulatedDTO;

  /** Profile of the currently logged-in user. Used to tailor the view based on the user's details. */
  profile?: UserPrivateDTO;

  /**
   * Constructs the AfterSubmitViewComponent with necessary dependencies.
   *
   * @param {Router} router - The Angular Router used to access route parameters and navigation extras.
   * @param {ProfileService} profileService - Service used to obtain the current user's profile information.
   */
  constructor(
    private router: Router,
    private profileService: ProfileService
  ) {
    this.deposit = this.deposit ?? this.router.getCurrentNavigation()?.extras.state?.['deposit'];
  }

  /**
   * OnInit lifecycle hook that sets up the component by initializing the user's profile.
   */
  ngOnInit(): void {
    this.profile = this.profileService.profile.getValue();
  }
}
