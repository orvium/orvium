import { Component, EventEmitter, Input, Output } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { AppSnackBarService } from '../../services/app-snack-bar.service';
import { DefaultService, InviteDTO, InvitePopulatedDTO, InviteStatus } from '@orvium/api';
import { DepositsService } from '../../deposits/deposits.service';
import { assertIsDefined, isNotNullOrUndefined } from '../../shared/shared-functions';
import { lastValueFrom } from 'rxjs';
import { Router, RouterLink } from '@angular/router';
import { MatChipsModule } from '@angular/material/chips';
import { DatePipe, NgClass, TitleCasePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { SpinnerService } from '../../spinner/spinner.service';
import { DialogService } from '../../dialogs/dialog.service';
import { ContributorLineComponent } from '../../shared/contributor-line/contributor-line.component';
import { MatListModule } from '@angular/material/list';
import { ListWrapperComponent } from '../../shared/list-wrapper/list-wrapper.component';

/**
 * A component for displaying a list of invitations. It allows users to accept or reject invitations and,
 * depending on the type of invitation, create reviews associated with those invitations.
 */
@Component({
  selector: 'app-invitations-list',
  standalone: true,
  templateUrl: './invitations-list.component.html',
  styleUrls: ['./invitations-list.component.scss'],
  imports: [
    MatChipsModule,
    NgClass,
    TitleCasePipe,
    MatButtonModule,
    RouterLink,
    DatePipe,
    ContributorLineComponent,
    MatListModule,
    ListWrapperComponent,
  ],
})
export class InvitationsListComponent {
  /** Array of invitations to be displayed */
  @Input({ required: true }) invitations: InvitePopulatedDTO[] = [];

  /** Event emitter for when invitations array changes */
  @Output() invitationsChange = new EventEmitter<InvitePopulatedDTO[]>();

  /** Enum for invite statuses to be used in the component */
  InviteStatus = InviteStatus;

  /**
   * Constructs the InvitationsListComponent with necessary dependencies.
   *
   * @param apiService Service for API calls
   * @param snackBar Service for displaying snack bar messages
   * @param spinnerService Service for displaying a spinner during loading
   * @param depositService Service for deposit-related operations
   * @param router Angular Router for navigation
   * @param dialogService Service for opening dialog windows
   */
  constructor(
    private apiService: DefaultService,
    private snackBar: AppSnackBarService,
    private spinnerService: SpinnerService,
    private depositService: DepositsService,
    private router: Router,
    private dialogService: DialogService
  ) {}

  /**
   * Accepts an invitation.
   *
   * @param invite The invitation to accept
   */
  acceptInvite(invite: InviteDTO | InvitePopulatedDTO): void {
    this.dialogService
      .openConfirm({
        title: 'Accept Invitation',
        content: 'Are you sure you want to accept the invitation?',
        cancelMessage: 'Cancel',
        acceptMessage: 'Accept',
      })
      .afterClosed()
      .pipe(isNotNullOrUndefined())
      .subscribe(accept => {
        if (accept) {
          this.apiService
            .updateInvite({
              id: invite._id,
              inviteUpdateDTO: {
                status: InviteStatus.Accepted,
              },
            })
            .subscribe(response => {
              const index = this.invitations.findIndex(invite => invite._id === response._id);
              this.invitations[index] = response;
              this.invitationsChange.emit([...this.invitations]);
            });
        }
      });
  }

  /**
   * Rejects an invitation.
   *
   * @param invite The invitation to reject
   */
  rejectInvite(invite: InviteDTO | InvitePopulatedDTO): void {
    this.dialogService
      .openConfirm({
        title: 'Reject Invitation',
        content: 'Are you sure you want to reject the invitation?',
        cancelMessage: 'Cancel',
        acceptMessage: 'Reject',
      })
      .afterClosed()
      .pipe(isNotNullOrUndefined())
      .subscribe(accept => {
        if (accept) {
          this.apiService
            .updateInvite({
              id: invite._id,
              inviteUpdateDTO: {
                status: InviteStatus.Rejected,
              },
            })
            .subscribe(response => {
              const index = this.invitations.findIndex(invite => invite._id === response._id);
              this.invitations[index] = response;
              this.invitationsChange.emit([...this.invitations]);
            });
        }
      });
  }

  /**
   * Creates a review based on the invitation.
   *
   * @param invite The invitation from which to create a review
   */
  async createReview(invite: InviteDTO | InvitePopulatedDTO): Promise<void> {
    if (!invite.data.hasOwnProperty('depositId')) {
      this.snackBar.error('The invitation has not been properly created');
      throw new Error('The invitation has not been properly created');
    }

    const deposit = await lastValueFrom(this.apiService.getDeposit({ id: invite.data.depositId }));
    assertIsDefined(deposit, 'Deposit not found');

    if (!this.depositService.canReviewDeposit(deposit)) {
      this.snackBar.error('You already created a review for this publication');
      throw new Error('You already created a review for this publication');
    }

    this.apiService
      .createReview({
        createReviewDTO: {
          deposit: deposit._id,
          invite: invite._id,
        },
      })
      .pipe(
        finalize(() => {
          this.spinnerService.hide();
        })
      )
      .subscribe(review => {
        void this.router.navigate(['reviews', review._id, 'edit']);
      });
    this.spinnerService.show();
  }
}
