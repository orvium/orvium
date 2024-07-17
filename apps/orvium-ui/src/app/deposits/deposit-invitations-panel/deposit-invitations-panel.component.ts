import { Component, DestroyRef, OnInit, TemplateRef, ViewChild, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DepositsService } from '../deposits.service';
import { ProfileService } from '../../profile/profile.service';
import {
  DefaultService,
  DepositPopulatedDTO,
  InviteDTO,
  InvitePopulatedDTO,
  InviteStatus,
  InviteType,
  UserPrivateDTO,
} from '@orvium/api';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { concatMap, finalize, map } from 'rxjs/operators';
import { assertIsDefined, isNotNullOrUndefined } from '../../shared/shared-functions';
import { AccessDeniedComponent } from '../../shared/access-denied/access-denied.component';
import { DatePipe, NgClass, TitleCasePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { InviteReviewersDialogComponent } from '../invite-reviewers-dialog/invite-reviewers-dialog.component';
import { OverlayLoadingDirective } from '../../spinner/overlay-loading.directive';
import { DialogService } from '../../dialogs/dialog.service';
import { MetricsComponent } from '../../shared/metrics/metrics.component';
import { MatListModule } from '@angular/material/list';
import { ContributorLineComponent } from '../../shared/contributor-line/contributor-line.component';
import { ListWrapperComponent } from '../../shared/list-wrapper/list-wrapper.component';
import { DepositInvitationListComponent } from '../deposit-invitation-list/deposit-invitation-list.component';
import { InfoToolbarComponent } from '../../shared/info-toolbar/info-toolbar.component';
import { ButtonsMenuComponent } from '../../buttons-menu/buttons-menu.component';
import { BreakpointObserver } from '@angular/cdk/layout';
import { BREAKPOINTS } from '../../layout/breakpoints';
import { AlertComponent } from '../../shared/alert/alert.component';

/**
 * Component for managing and displaying invitations related to a specific deposit.
 * It includes functionalities to invite reviewers or copy editors, display a list of existing invitations,
 * and refresh or update invitation data.
 */
@Component({
  selector: 'app-deposit-invitations-panel',
  standalone: true,
  templateUrl: './deposit-invitations-panel.component.html',
  styleUrls: ['./deposit-invitations-panel.component.scss'],
  imports: [
    AccessDeniedComponent,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    DatePipe,
    MatChipsModule,
    NgClass,
    TitleCasePipe,
    InviteReviewersDialogComponent,
    OverlayLoadingDirective,
    MatListModule,
    ContributorLineComponent,
    ListWrapperComponent,
    RouterLink,
    MetricsComponent,
    DepositInvitationListComponent,
    InfoToolbarComponent,
    ButtonsMenuComponent,
    AlertComponent,
  ],
})
export class DepositInvitationsPanelComponent implements OnInit {
  /** Template reference for the invite dialog, used to configure and display the modal for inviting participants. */
  @ViewChild('inviteDialogTemplate') inviteDialogTemplate!: TemplateRef<unknown>;

  /** Array of populated invitation DTOs representing the current invitations associated with the deposit. */
  invites: InvitePopulatedDTO[] = [];

  /** Profile information of the user currently logged in, used for various permission checks and UI adjustments. */
  profile?: UserPrivateDTO;

  /** The deposit object associated with the current invitation management context. */
  deposit?: DepositPopulatedDTO;

  /** Flag indicating whether the user has permission to invite reviewers, determined by business rules and permissions. */
  canInviteReviewers = false;

  /** Enum type representing the kind of invitation being processed, such as review or copy editing. */
  public inviteType = InviteType.Review;

  /** Loading state for the invitation panel, used to show or hide loading indicators during data retrieval. */
  invitationPanelLoading = true;

  /** A reference for managing component destruction subscriptions, ensuring that all subscriptions are cleaned up.  */
  private destroyRef = inject(DestroyRef);

  /** Holds a template reference for buttons that should always be visible in the menu, irrespective of other UI state changes. */
  buttonsAlwaysInMenu: TemplateRef<unknown> | undefined;

  /** Indicates whether the device is currently using a mobile viewport, based on media queries. */
  isMobile = false;

  /** The current invite object being processed, typically used when editing or updating an existing invitation. */
  invite?: InviteDTO;

  /** Metrics object holding counts of different statuses of invitations such as accepted, rejected, and pending. */
  metrics = {
    rejected: 0,
    accepted: 0,
    pending: 0,
  };

  /** Array of all versions of the deposit, used for displaying historical data and managing version control. */
  depositVersions: DepositPopulatedDTO[] = [];

  /** The most current version of the deposit, typically used for display or actions requiring the latest data. */
  latestVersion?: DepositPopulatedDTO;

  /**
   * Constructor for DepositInvitationsPanelComponent, where dependencies are injected and component properties are initialized.
   *
   * @param {ActivatedRoute} route Provides access to information about a route associated with a component loaded in an outlet.
   * @param {DefaultService} apiService Service used to make API calls for deposit and invitation data.
   * @param {ProfileService} profileService Service used to access user profile data.
   * @param {DepositsService} depositService Service used for deposit-related operations and permission checks.
   * @param {DialogService} dialogService Service used for opening modal dialogs across the application.
   * @param {BreakpointObserver} breakpointObserver Utility for checking the current viewport size and reacting to changes.
   */
  constructor(
    private route: ActivatedRoute,
    private apiService: DefaultService,
    private profileService: ProfileService,
    private depositService: DepositsService,
    public dialogService: DialogService,
    private breakpointObserver: BreakpointObserver
  ) {}

  /**
   * Initializes component, setting up initial data and subscriptions for user profile and deposit details.
   */
  ngOnInit(): void {
    const profile = this.profileService.profile.getValue();
    if (profile) {
      this.profile = profile;
    }

    this.route.paramMap
      .pipe(
        map(params => params.get('depositId')),
        isNotNullOrUndefined(),
        concatMap(depositId =>
          this.apiService.getDeposit({ id: depositId }).pipe(
            finalize(() => {
              this.invitationPanelLoading = false;
            })
          )
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(deposit => {
        this.deposit = deposit;
        this.apiService.getDepositInvites({ depositId: this.deposit._id }).subscribe(response => {
          this.invites = response;
          this.metrics = {
            rejected: this.invites.filter(invite => invite.status === InviteStatus.Rejected).length,
            accepted: this.invites.filter(invite => invite.status === InviteStatus.Accepted).length,
            pending: this.invites.filter(invite => invite.status === InviteStatus.Pending).length,
          };
        });
        this.canInviteReviewers = this.depositService.canInviteReviewers(this.deposit);
        this.apiService.getDepositVersions({ id: this.deposit._id }).subscribe(deposits => {
          this.depositVersions = deposits;
          this.latestVersion = this.getVersion(deposits);
        });
      });
    this.breakpointObserver.observe(BREAKPOINTS.MOBILE).subscribe(result => {
      this.isMobile = result.matches;
    });
  }

  /**
   * Refreshes the invitation list by retrieving updated data from the server, used for keeping UI state in sync with backend data.
   */
  refresh(): void {
    this.invitationPanelLoading = true;
    assertIsDefined(this.deposit, 'deposit not found');
    this.apiService
      .getDepositInvites({ depositId: this.deposit._id })
      .pipe(
        finalize(() => {
          this.invitationPanelLoading = false;
        })
      )
      .subscribe(response => {
        this.invites = response;
      });
  }

  /**
   * Initiates the process to invite a reviewer, setting necessary states and opening the invitation modal.
   */
  public inviteReviewer(): void {
    this.inviteType = InviteType.Review;
    this.openInviteModal();
  }

  /**
   * Initiates the process to invite a copy editor, similar to inviteReviewer but for a different role.
   */
  public inviteCopyEditor(): void {
    this.inviteType = InviteType.CopyEditing;
    this.openInviteModal();
  }

  /**
   * Opens the invitation modal and handles the post-dialog actions such as refreshing the invitation list.
   */
  private openInviteModal(): void {
    this.dialogService
      .open(this.inviteDialogTemplate)
      .afterClosed()
      .subscribe(() => {
        this.refresh();
      });
  }

  /**
   * Opens a video related to the deposit invitation process, providing visual aid or guidance.
   */
  openVideo(): void {
    this.dialogService.openVideo({
      videoUrl:
        'https://synthesia-ttv-data.s3-eu-west-1.amazonaws.com/video_data/16167bd9-15ef-4ae9-97b0-38ac1deae986/transfers/target_transfer.mp4',
      videoType: 'video/mp4',
    });
  }

  /**
   * Determines the latest version of a deposit from an array of deposit versions.
   *
   * @param {DepositPopulatedDTO[]} depositVersions Array of deposit versions to evaluate.
   * @returns {DepositPopulatedDTO} The latest deposit version.
   */
  getVersion(depositVersions: DepositPopulatedDTO[]): DepositPopulatedDTO {
    return depositVersions.reduce((deposit1, deposit2) => {
      return deposit1.version > deposit2.version ? deposit1 : deposit2;
    });
  }
}
