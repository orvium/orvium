import { Component, Input, OnInit } from '@angular/core';
import { DefaultService, DepositPopulatedDTO, UserPrivateDTO } from '@orvium/api';
import { ProfileService } from '../../profile/profile.service';
import { AppSnackBarService } from '../../services/app-snack-bar.service';
import { finalize } from 'rxjs/operators';
import { Router } from '@angular/router';
import { DepositsService } from '../deposits.service';

import { SpinnerService } from '../../spinner/spinner.service';
import { DepositCardComponent } from '../deposit-card/deposit-card.component';

/**
 * Component for displaying a list of deposits and includes functionalities to star, create review, etc.
 */
@Component({
  selector: 'app-deposits-list',
  standalone: true,
  templateUrl: './deposits-list.component.html',
  styleUrls: ['./deposits-list.component.scss'],
  imports: [DepositCardComponent],
})
export class DepositsListComponent implements OnInit {
  /** List of deposits to display. */
  @Input({ required: true }) deposits: DepositPopulatedDTO[] = [];

  /** Flag indicating whether to use the reduced card view. */
  @Input() isReducedCard = false;

  /**  Flag indicating whether to show the bookmark option. */
  @Input() showBookmark = true;

  /** User profile data. */
  profile?: UserPrivateDTO;

  /**
   * Constructs a new instance of the DepositsListComponent.
   *
   * @param {ProfileService} profileService - Service to manage user profile data.
   * @param {AppSnackBarService} snackBar - Service to display snack bar messages.
   * @param {SpinnerService} spinnerService - Service to control the loading spinner.
   * @param {DefaultService} apiService - Service to make API calls.
   * @param {Router} router - Service to manage navigation.
   * @param {DepositsService} depositService - Service to manage deposit-related operations.
   */
  constructor(
    private profileService: ProfileService,
    private snackBar: AppSnackBarService,
    private spinnerService: SpinnerService,
    private apiService: DefaultService,
    private router: Router,
    public depositService: DepositsService
  ) {}

  /**
   * Initializes the component by fetching the user profile.
   */
  ngOnInit(): void {
    this.profileService.getProfile().subscribe(profile => {
      this.profile = profile;
    });
  }

  /**
   * Toggles the star status of a deposit for the logged-in user.
   * If the user is not logged in, shows an error message.
   *
   * @param {DepositPopulatedDTO} deposit - The deposit to star or unstar.
   */
  star(deposit: DepositPopulatedDTO): void {
    if (!this.profile) {
      this.snackBar.error('You need to log in first to use this feature');
      return;
    }

    const index = this.getStarIndex(this.profile, deposit);
    if (index !== -1) {
      this.profile.starredDeposits.splice(index, 1);
    } else {
      this.profile.starredDeposits.push(deposit._id);
    }
    this.profileService
      .updateProfile({ starredDeposits: this.profile.starredDeposits })
      .subscribe();
  }

  /**
   * Gets the index of the deposit in the user's starred deposits.
   *
   * @param {UserPrivateDTO} profile - The user's profile.
   * @param {DepositPopulatedDTO} deposit - The deposit to check.
   * @returns {number} - The index of the deposit in the starred deposits array.
   */
  getStarIndex(profile: UserPrivateDTO, deposit: DepositPopulatedDTO): number {
    if (profile.starredDeposits.includes(deposit._id)) {
      return profile.starredDeposits.indexOf(deposit._id);
    }
    return -1;
  }

  /**
   * Checks if the deposit is starred by the user.
   *
   * @param {DepositPopulatedDTO} deposit - The deposit to check.
   * @returns {boolean} - True if the deposit is starred, false otherwise.
   */
  isStarred(deposit: DepositPopulatedDTO): boolean {
    if (this.profile) {
      return this.getStarIndex(this.profile, deposit) > -1;
    }
    return false;
  }

  /**
   * Creates a review for the deposit.
   * If the user is not logged in, shows an error message.
   * If the user has already created a review for the deposit, shows an info message.
   *
   * @param {DepositPopulatedDTO} deposit - The deposit to review.
   */
  createReview(deposit: DepositPopulatedDTO): void {
    if (!this.profile) {
      this.snackBar.error('You need to log in first to use this feature');
      return;
    }

    for (const review of deposit.peerReviewsPopulated) {
      if (review.creator === this.profile._id) {
        this.snackBar.info('You already created a review for this publication');
        return;
      }
    }

    this.spinnerService.show();
    this.apiService
      .createReview({
        createReviewDTO: {
          deposit: deposit._id,
        },
      })
      .pipe(
        finalize(() => {
          this.spinnerService.hide();
        })
      )
      .subscribe(response => {
        void this.router.navigate(['reviews', response._id, 'edit']);
      });
  }
}
