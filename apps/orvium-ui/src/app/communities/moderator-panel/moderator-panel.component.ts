import { Component, DestroyRef, inject, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProfileService } from '../../profile/profile.service';
import { CommunityService, ICommunityActions } from '../community.service';
import { AppSnackBarService } from '../../services/app-snack-bar.service';
import { environment } from '../../../environments/environment';
import {
  CommunityModeratorDTO,
  CommunityPopulatedDTO,
  CommunityPrivateDTO,
  DefaultService,
  DepositDTO,
  DepositPopulatedDTO,
  DepositStatus,
  EmailUsersDTO,
  InvitePopulatedDTO,
  InviteStatus,
  ModeratorRole,
  ModeratorUpdateDTO,
  PaginationLimit,
  ReviewPopulatedDTO,
  ReviewStatus,
  StringDataPayload,
  SubscriptionType,
  UpdateUserRoleDTO,
  UserPrivateDTO,
} from '@orvium/api';
import { Title } from '@angular/platform-browser';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { SearchBoxComponent } from '../../shared/search-box/search-box.component';
import { MatTab, MatTabChangeEvent, MatTabGroup, MatTabsModule } from '@angular/material/tabs';
import { catchError, concatMap, filter, finalize, map } from 'rxjs/operators';
import { AccessDeniedComponent } from '../../shared/access-denied/access-denied.component';
import { NgTemplateOutlet } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { ModeratorDepositTableComponent } from '../moderator-deposit-table/moderator-deposit-table.component';
import { ReviewList2Component } from '../../review/review-list2/review-list2.component';
import { CommunityModeratorsComponent } from '../community-moderators/community-moderators.component';
import { OverlayLoadingDirective } from '../../spinner/overlay-loading.directive';
import { DialogService } from '../../dialogs/dialog.service';
import { InfoToolbarComponent } from '../../shared/info-toolbar/info-toolbar.component';
import { DescriptionLineComponent } from '../../shared/description-line/description-line.component';
import { assertIsDefined, isNotNullOrUndefined } from '../../shared/shared-functions';
import { SpinnerService } from '../../spinner/spinner.service';
import { AlertComponent } from '../../shared/alert/alert.component';
import { MetricsComponent } from '../../shared/metrics/metrics.component';
import { DepositInvitationListComponent } from '../../deposits/deposit-invitation-list/deposit-invitation-list.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonsMenuComponent } from '../../buttons-menu/buttons-menu.component';
import { BREAKPOINTS } from '../../layout/breakpoints';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  EmailData,
  SendNotificationsComponent,
} from '../../notification/send-notifications/send-notifications.component';
import { concat, Observable, of, toArray } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

/**
 * Component responsible for managing the moderator panel, which includes functionalities related to deposits
 * such as reviews, and invitations within a community.
 */
@Component({
  selector: 'app-moderator-panel',
  standalone: true,
  templateUrl: './moderator-panel.component.html',
  styleUrls: ['./moderator-panel.component.scss'],
  imports: [
    AccessDeniedComponent,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatTabsModule,
    SearchBoxComponent,
    ModeratorDepositTableComponent,
    MatPaginatorModule,
    ReviewList2Component,
    CommunityModeratorsComponent,
    OverlayLoadingDirective,
    InfoToolbarComponent,
    DescriptionLineComponent,
    NgTemplateOutlet,
    RouterLink,
    AlertComponent,
    MetricsComponent,
    DepositInvitationListComponent,
    ButtonsMenuComponent,
    MatTooltipModule,
    SendNotificationsComponent,
  ],
})
export class ModeratorPanelComponent implements OnInit {
  /** List of deposits related to the community. */
  deposits: DepositDTO[] = [];

  /** Email recipients for community-wide notifications. */
  emailRecipients: EmailUsersDTO[] = [];

  /** Reviews associated with community submissions. */
  reviews: ReviewPopulatedDTO[] = [];

  /** Invitations sent out for community events or contributions. */
  invites: InvitePopulatedDTO[] = [];

  /** Profile data of the currently logged-in user. */
  profile?: UserPrivateDTO;

  /** Details of the community being moderated. */
  community!: CommunityPopulatedDTO | CommunityPrivateDTO;

  /** Moderators of the community. */
  moderators: CommunityModeratorDTO[] = [];

  /** Environmental settings for the component. */
  environment = environment;

  /** Count of deposits pending approval. */
  counterPendingApproval = 0;

  /** Status of deposits, used for display and filtering. */
  DepositStatus = DepositStatus;

  /** Number of reviews currently pending approval. */
  reviewsPendingApprovalNumber = 0;

  /** Number of invites awaiting response. */
  invitesPendingResponse = 0;

  /** Number of invites about to expire. */
  invitesAboutToExpire = 0;

  /** Total count of invitations. */
  invitesCount = 0;

  /** Loading flags for deposits, reviews, and invites. Set to false by default*/
  loadDeposits = false;
  loadReviews = false;
  loadInvites = false;

  /** Indicates if the moderation panel is currently loading data. */
  moderationPanelLoading = true;

  /** Currently selected tab in the moderator panel. */
  selectedTab: string | undefined;

  /** Template reference for searchboxes and community email composition. */
  @ViewChild('searchboxDeposits') searchboxDeposits?: SearchBoxComponent;
  @ViewChild('communityEmailTemplate') communityEmailTemplate!: TemplateRef<unknown>;
  @ViewChild('paginatorDeposits') paginatorDeposits?: MatPaginator;
  @ViewChild('searchboxReviews') searchboxReviews?: SearchBoxComponent;
  @ViewChild('paginatorReviews') paginatorReviews?: MatPaginator;
  @ViewChild('searchboxInvites') searchboxInvites?: SearchBoxComponent;
  @ViewChild('paginatorInvitations') paginatorInvitations?: MatPaginator;
  @ViewChild('depositsTable') depositsTable?: ModeratorDepositTableComponent;
  @ViewChild('reviewTable') reviewTable?: ReviewList2Component;

  /** Actions available to the user based on their role and permissions within the community. */
  communityActions: ICommunityActions = {
    moderate: false,
    update: false,
    submit: false,
  };

  /** Deposits without any linked invitations, requiring moderator attention. */
  depositsWithoutInvitations: string[] = [];

  /** Tab group for handling tabs within the application. */
  _tabGroup!: MatTabGroup;

  /** Pending invitations about to expired - used to filtering and notifications. */
  pendingInvitationAboutToExpire: string[] = [];

  /** Custom setter for handling tab changes dynamically based on URL fragments. */
  @ViewChild(MatTabGroup) set tabGroup(matTabGroup: MatTabGroup | undefined) {
    if (matTabGroup) {
      this.selectedTab = matTabGroup._allTabs.toArray()[matTabGroup.selectedIndex ?? 0].textLabel;
      this.route.fragment.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(fragment => {
        const actualIndex = matTabGroup._tabs
          .toArray()
          .findIndex(tab => tab.textLabel === fragment);
        // Check how to use the bitwise ~ operator in the following link
        // https://blog.logrocket.com/javascript-typescript-shorthands/#array-indexof-shorthand-bitwise-operator
        const tabIndex = ~actualIndex ? actualIndex : 0;
        matTabGroup.selectedIndex = tabIndex;
        this._tabGroup = matTabGroup;
        this.selectedTab = matTabGroup._tabs.toArray()[tabIndex].textLabel;
      });
    }
  }

  /** Counts for various types of documents and actions. */
  depositsCount = 0;
  reviewsCount = 0;

  /** Service for managing component lifecycle and cleanup. */
  private destroyRef = inject(DestroyRef);

  /** Indicates if the view is on a mobile device based on viewport size. */
  isMobile = false;

  /**
   * Constructs the ModeratorPanelComponent with necessary dependency injections.
   * This constructor sets up services required for routing, API interactions, profile management,
   * notification handling, community data handling, title management, dialog interactions, viewport size detection, and spinner control.
   *
   * @param {ActivatedRoute} route - Provides access to information about a route associated with the component that is loaded in an outlet.
   * @param {DefaultService} apiService - Service for making API calls to fetch or send data to the server.
   * @param {ProfileService} profileService - Manages the user's profile data, essential for operations that require user-specific information.
   * @param {AppSnackBarService} snackbarService - Service used to display brief messages in a small popup at the bottom of the screen.
   * @param {CommunityService} communityService - Provides functionality related to community management.
   * @param {Title} titleService - Service for setting the title of the document displayed in the browser's title bar.
   * @param {Router} router - Manages navigation and URL manipulation capabilities.
   * @param {DialogService} dialogService - Service for managing dialogs, allowing for modular and reusable dialog components.
   * @param {BreakpointObserver} breakpointObserver - Service for subscribing to media query changes.
   * @param {SpinnerService} spinnerService - Service to show or hide a loading spinner, indicating processing or waiting times.
   */
  constructor(
    private route: ActivatedRoute,
    private apiService: DefaultService,
    private profileService: ProfileService,
    private snackbarService: AppSnackBarService,
    private communityService: CommunityService,
    private titleService: Title,
    private router: Router,
    private dialogService: DialogService,
    private breakpointObserver: BreakpointObserver,
    public spinnerService: SpinnerService
  ) {}

  /**
   * Initializes the component by setting the document title and fetching community details, moderators, and other related data.
   */
  ngOnInit(): void {
    this.titleService.setTitle('Moderator Panel');
    this.route.paramMap
      .pipe(
        map(params => params.get('communityId')),
        isNotNullOrUndefined(),
        concatMap(communityId =>
          this.apiService.getCommunity({ id: communityId }).pipe(
            finalize(() => {
              this.moderationPanelLoading = false;
            })
          )
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(community => {
        this.community = community;
        this.refreshActions(this.community);
        this.filterPublications();
        this.filterReviews();
        this.filterInvitations();
        this.getPapersPendingApprovalNumber();
        this.getPapersWithNoInvitations();
        this.getReviewsPendingApprovalNumber();
        this.getInvitationsPendingNumber();
        this.getInvitationsAboutToExpire();
        this.moderators = this.community.moderatorsPopulated;
      });
    this.profileService.getProfile().subscribe(profile => {
      this.profile = profile;
    });

    this.breakpointObserver.observe(BREAKPOINTS.MOBILE).subscribe(result => {
      this.isMobile = result.matches;
    });
  }

  /**
   * Handles tab change events and updates the URL fragment to reflect the current tab.
   * This helps in maintaining the state of the UI with URL which can be useful for sharing or bookmarking.
   *
   * @param {$event: MatTabChangeEvent} $event - The event object containing details about the tab change.
   */
  onTabChanged($event: MatTabChangeEvent): void {
    this.selectedTab = $event.tab.textLabel;
    void this.router.navigate([], { fragment: $event.tab.textLabel });
  }

  /**
   * Deletes a moderator from the community by their user object ID and refreshes the community details.
   *
   * @param {string} userObjectId - The unique identifier of the moderator to be deleted.
   */
  deleteModerator(userObjectId: string): void {
    this.apiService
      .deleteModerator({ communityId: this.community._id, id: userObjectId })
      .subscribe(response => {
        this.apiService.getCommunity({ id: this.community._id }).subscribe(response => {
          this.community = response;
          this.moderators = this.community.moderatorsPopulated;
        });
      });
  }

  /**
   * Adds a moderator to the community using their email address.
   *
   * @param {string} email - The email address of the individual to be added as a moderator.
   */
  addModerator(email: string): void {
    const updateRole: UpdateUserRoleDTO = { email: email, role: ModeratorRole.Moderator };
    this.apiService
      .addModerator({ id: this.community._id, updateUserRoleDTO: updateRole })
      .subscribe(response => {
        this.apiService.getCommunity({ id: this.community._id }).subscribe(response => {
          this.community = response;
          this.moderators = this.community.moderatorsPopulated;
        });
      });
  }

  /**
   * Refreshes the community actions based on the latest community data.
   *
   * @param {CommunityPopulatedDTO | CommunityPrivateDTO} community - The community object to derive actions from.
   */
  refreshActions(community: CommunityPopulatedDTO | CommunityPrivateDTO): void {
    this.communityActions = this.communityService.getCommunityActions(community);
  }

  /**
   * Accepts a deposit and informs the user of successful acceptance.
   *
   * @param {DepositDTO} deposit - The deposit to accept.
   */
  acceptDeposit(deposit: DepositDTO): void {
    this.snackbarService.info('Publication accepted successfully');
    this.getPapersPendingApprovalNumber();
    this.filterPublications();
  }

  /**
   * Marks a deposit as pending approval and updates the UI accordingly.
   *
   * @param {DepositDTO} deposit - The deposit to mark as pending.
   */
  pendingApproval(deposit: DepositDTO): void {
    this.snackbarService.info('Changed status to pending approval successfully');
    this.getPapersPendingApprovalNumber();
    this.filterPublications();
  }

  /**
   * Publishes a deposit and updates the UI to reflect the new status.
   *
   * @param {DepositDTO} deposit - The deposit to publish.
   */
  publishDeposit(deposit: DepositDTO): void {
    this.snackbarService.info('Publication published successfully');
    this.getPapersPendingApprovalNumber();
    this.filterPublications();
  }

  /**
   * Merges a deposit into another and refreshes the deposit list.
   *
   * @param {DepositDTO} deposit - The deposit to merge.
   */
  mergeDeposit(deposit: DepositDTO): void {
    this.snackbarService.info('Publication merged successfully');
    this.filterPublications();
    this.getPapersPendingApprovalNumber();
  }

  /**
   * Rejects a deposit and updates the UI to reflect this change.
   *
   * @param {DepositDTO} deposit - The deposit to reject.
   */
  rejectDeposit(deposit: DepositDTO): void {
    this.snackbarService.info('Publication rejected successfully');
    this.getPapersPendingApprovalNumber();
    this.filterPublications();
  }

  /**
   * Changes the status of a deposit to 'Draft' and refreshes the list.
   *
   * @param {DepositDTO} deposit - The deposit to draft.
   */
  draftDeposit(deposit: DepositDTO): void {
    this.snackbarService.info('Changed to Draft status successfully');
    this.getPapersPendingApprovalNumber();
    this.filterPublications();
  }

  /**
   * Updates the status of a deposit and notifies the user.
   *
   * @param {DepositDTO} deposit - The deposit to update.
   * @param {DepositStatus} status - The new status for the deposit.
   */
  setDepositStatus(deposit: DepositDTO, status: DepositStatus): void {
    this.apiService
      .updateDeposit({
        id: deposit._id,
        updateDepositDTO: {
          status,
        },
      })
      .subscribe(response => {
        this.snackbarService.info('Status changed to ' + status);
        this.filterPublications();
        this.getPapersPendingApprovalNumber();
      });
  }

  /**
   * Publishes a review and updates the review count and list.
   *
   * @param {event: { review: ReviewPopulatedDTO; reason?: string }} event - The event containing the review and optional reason for publishing.
   */
  publishReview(event: { review: ReviewPopulatedDTO; reason?: string }): void {
    this.apiService
      .publishedReview({
        id: event.review._id,
        moderateReviewPayload: { reason: event.reason ?? '' },
      })
      .subscribe(() => {
        this.getReviewsPendingApprovalNumber();
        this.filterReviews();
        this.snackbarService.info('Review published');
      });
  }

  /**
   * Moves a review to draft status and updates the review list and count.
   *
   * @param {event: { review: ReviewPopulatedDTO; reason?: string }} event - The event containing the review and optional reason for drafting.
   */
  draftReview(event: { review: ReviewPopulatedDTO; reason?: string }): void {
    this.apiService
      .draftReview({ id: event.review._id, moderateReviewPayload: { reason: event.reason ?? '' } })
      .subscribe(() => {
        this.filterReviews();
        this.snackbarService.info('Review changed to Draft successfully');
        this.getReviewsPendingApprovalNumber();
      });
  }

  /**
   * Updates the settings for a moderator and displays a notification.
   *
   * @param {CommunityModeratorDTO} moderator - The moderator to update.
   */
  updateModerator(moderator: CommunityModeratorDTO): void {
    const updateModerator: ModeratorUpdateDTO = {};
    updateModerator.notificationOptions = moderator.notificationOptions;
    updateModerator.moderatorRole = moderator.moderatorRole;

    this.apiService
      .updateModerator({
        communityId: this.community._id,
        userObjectId: moderator._id,
        moderatorUpdateDTO: updateModerator,
      })
      .subscribe(res => {
        this.snackbarService.info('Moderator Updated');
      });
  }

  /**
   * Initiates a search for deposits based on user-provided criteria and resets pagination.
   *
   * @param {$event: {query?: string; status?: string}} [$event] - Optional event object containing search parameters.
   */
  searchDeposits($event?: { query?: string; status?: string }): void {
    if (this.paginatorDeposits) this.paginatorDeposits.pageIndex = 0;
    this.filterPublications();
  }

  /**
   * Initiates a search for reviews based on user-provided criteria and resets pagination.
   *
   * @param {$event: {query?: string; status?: string}} [$event] - Optional event object containing search parameters.
   */
  searchReviews($event?: { query?: string; status?: string }): void {
    if (this.paginatorReviews) this.paginatorReviews.pageIndex = 0;
    this.filterReviews();
  }

  /**
   * Initiates a search for invitations based on user-provided criteria and resets pagination.
   *
   * @param {$event: {query?: string; status?: string}} [$event] - Optional event object containing search parameters.
   */
  searchInvites($event?: { query?: string; status?: string }): void {
    if (this.paginatorInvitations) this.paginatorInvitations.pageIndex = 0;
    this.filterInvitations();
  }

  /**
   * Filters publications based on set parameters and updates the component state with the results.
   */
  filterPublications(): void {
    this.loadDeposits = true;
    const page = this.paginatorDeposits?.pageIndex ?? 0;
    const limit =
      this.paginatorDeposits?.pageSize === 25 ? PaginationLimit._25 : PaginationLimit._10;
    const queryParams = this.searchboxDeposits?.getCurrentQueryParams();
    this.apiService
      .getModeratorDeposits({
        id: this.community._id,
        ...queryParams,
        page,
        limit,
      })
      .subscribe(({ deposits, count }) => {
        this.deposits = deposits;
        this.depositsCount = count;
        this.loadDeposits = false;
      });
  }

  /**
   * Filters reviews based on set parameters and updates the component state with the results.
   */
  filterReviews(): void {
    this.loadReviews = true;
    const page = this.paginatorReviews?.pageIndex ?? 0;
    const limit =
      this.paginatorReviews?.pageSize === 25 ? PaginationLimit._25 : PaginationLimit._10;
    const queryParams = this.searchboxReviews?.getCurrentQueryParams();

    this.apiService
      .getModeratorReviews({
        id: this.community._id,
        ...queryParams,
        page,
        limit,
      })
      .subscribe(({ reviews, count }) => {
        this.reviews = reviews;
        this.reviewsCount = count;
        this.loadReviews = false;
      });
  }

  /**
   * Retrieves the count of pending approvals for publications.
   */
  getPapersPendingApprovalNumber(): void {
    this.apiService
      .getModeratorDeposits({
        id: this.community._id,
        status: DepositStatus.PendingApproval,
        page: 0,
        limit: PaginationLimit._10,
      })
      .subscribe(({ count }) => {
        this.counterPendingApproval = count;
      });
  }

  /**
   * Retrieves the count of pending approvals for reviews.
   */
  getReviewsPendingApprovalNumber(): void {
    this.apiService
      .getModeratorReviews({
        id: this.community._id,
        reviewStatus: ReviewStatus.PendingApproval,
        page: 0,
        limit: PaginationLimit._10,
      })
      .subscribe(({ count }) => {
        this.reviewsPendingApprovalNumber = count;
      });
  }

  /**
   * Retrieves the list of papers with no invitations linked and updates the component state.
   */
  getPapersWithNoInvitations(): void {
    this.apiService
      .getCommunityDepositsWithoutInvites({
        id: this.community._id,
      })
      .subscribe(res => {
        this.depositsWithoutInvitations = res;
      });
  }

  /**
   * Handles pagination changes for publications and triggers re-filtering.
   *
   * @param {PageEvent} pageEvent - Event object that contains the current pagination state.
   */
  public publicationsPageChange(pageEvent: PageEvent): void {
    this.filterPublications();
  }

  /**
   * Handles pagination changes for reviews and triggers re-filtering.
   *
   * @param {PageEvent} pageEvent - Event object that contains the current pagination state.
   */
  public reviewsPageChange(pageEvent: PageEvent): void {
    this.filterReviews();
  }

  /**
   * Handles pagination changes for invitations and triggers re-filtering.
   *
   * @param {PageEvent} pageEvent - Event object that contains the current pagination state.
   */
  public invitesPageChange(pageEvent: PageEvent): void {
    this.filterInvitations();
  }

  /**
   * Opens a modal with a video, typically used for tutorials or important messages.
   */
  openVideo(): void {
    this.dialogService.openVideo({
      videoUrl:
        'https://synthesia-ttv-data.s3-eu-west-1.amazonaws.com/video_data/479a0872-0908-47c4-ae24-3a13112b13b2/transfers/target_transfer.mp4',
      videoType: 'video/mp4',
    });
  }

  /**
   * Creates a new call to action or event within the community.
   */
  createCall(): void {
    assertIsDefined(this.profile, 'There is no profile when trying to create a call');
    this.apiService
      .createCall({
        callCreateDTO: {
          title: 'New Call',
          community: this.community._id,
        },
      })
      .pipe(
        finalize(() => {
          this.spinnerService.hide();
        })
      )
      .subscribe(call => {
        void this.router.navigate(['call', call._id, 'edit']);
      });
  }

  /**
   * Retrieves the number of pending responses for invitations.
   */
  getInvitationsPendingNumber(): void {
    this.apiService
      .getCommunityInvites({
        id: this.community._id,
        status: InviteStatus.Pending,
      })
      .subscribe(({ count }) => {
        this.invitesPendingResponse = count;
      });
  }

  /**
   * Retrieves the count and details of invitations about to expire within two weeks.
   */
  getInvitationsAboutToExpire(): void {
    const dateLimit = new Date().setDate(new Date().getDate() + 14);
    const dateStart = new Date().setDate(new Date().getDate() - 1);
    this.apiService
      .getCommunityInvites({
        id: this.community._id,
        status: InviteStatus.Pending,
        dateLimit: new Date(dateLimit),
        dateStart: new Date(dateStart),
      })
      .subscribe(({ count, invites }) => {
        this.invitesAboutToExpire = count;
        this.pendingInvitationAboutToExpire = invites.map(invite => invite._id);
      });
  }

  /**
   * Filters invitations based on the currently set parameters and updates the UI accordingly.
   */
  filterInvitations(): void {
    this.loadInvites = true;
    const page = this.paginatorInvitations?.pageIndex ?? 0;
    const queryParams = this.searchboxInvites?.getCurrentQueryParams();
    this.apiService
      .getCommunityInvites({
        page: page,
        limit: PaginationLimit._10,
        status: queryParams?.inviteStatus,
        query: queryParams?.query,
        id: this.community._id,
        inviteIds: queryParams?.ids,
        dateLimit: queryParams?.dateLimit,
      })
      .subscribe(({ invites, count }) => {
        this.invites = invites;
        this.invitesCount = count;
        this.loadInvites = false;
      });
  }

  /**
   * Downloads submissions in CSV format for offline analysis or record-keeping.
   */
  downloadSubmisions(): void {
    this.apiService.exportSubmissions({ id: this.community._id }).subscribe(res => {
      const blob = new Blob([res], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      window.open(url);
    });
  }

  /**
   * Sets filters for pending publications approvals and updates the related tab's content.
   */
  setFilterPublicationsPendingApproval(): void {
    this._tabGroup.selectedIndex = 0;
    this.searchboxDeposits?.setCurrentQueryParams({ status: DepositStatus.PendingApproval });
  }

  /**
   * Sets filters for pending reviews approvals and updates the related tab's content.
   */
  setFilterReviewsPendingApproval(): void {
    this._tabGroup.selectedIndex = 1;
    this.searchboxReviews?.setCurrentQueryParams({ reviewStatus: ReviewStatus.PendingApproval });
  }

  /**
   * Sets filters for publications without invitations and updates the related tab's content.
   */
  setFilterPublicationsWithOutInvitations(): void {
    this._tabGroup.selectedIndex = 0;
    this.searchboxDeposits?.setCurrentQueryParams({ ids: this.depositsWithoutInvitations });
  }

  /**
   * Sets filters for pending invitations for reviews and updates the related tab's content.
   */
  setFilterReviewsInvitationsPending(): void {
    this._tabGroup.selectedIndex = 2;
    this.searchboxInvites?.setCurrentQueryParams({ inviteStatus: InviteStatus.Pending });
  }

  /**
   * Sets filters for reviews with invitations about to expire and updates the related tab's content.
   */
  setFilterReviewsInvitationsAboutToExpire(): void {
    this._tabGroup.selectedIndex = 2;
    const date = new Date().setDate(new Date().getDate() + 14);
    this.searchboxInvites?.setCurrentQueryParams({
      dateLimit: new Date(date),
      ids: this.pendingInvitationAboutToExpire,
    });
  }

  /**
   * Retrieves the list of email recipients based on the current tab (Publications or Reviews).
   *
   * @param {MatTab} tab - The currently active tab to determine the context for fetching email addresses.
   * @returns {Observable<EmailUsersDTO[]>} An observable containing the list of email users.
   */
  getCommunityEmailRecipients(tab: MatTab): Observable<EmailUsersDTO[]> {
    if (tab.textLabel === 'Publications') {
      return this.apiService.getModeratorDepositsEmails({
        id: this.community._id,
        ...this.searchboxDeposits?.getCurrentQueryParams(),
      });
    } else if (tab.textLabel === 'Reviews') {
      return this.apiService.getModeratorReviewsEmails({
        id: this.community._id,
        ...this.searchboxReviews?.getCurrentQueryParams(),
      });
    }

    return of();
  }

  /**
   * Opens a dialog to send an email to a filtered list of community members.
   * The dialog displays after fetching the appropriate recipients.
   */
  openSendCommunityEmailDialog(): void {
    assertIsDefined(this._tabGroup);
    const selectedTab = this._tabGroup._allTabs.get(this._tabGroup.selectedIndex ?? 0);
    assertIsDefined(selectedTab);
    this.getCommunityEmailRecipients(selectedTab).subscribe(emails => {
      this.emailRecipients = emails;

      // Add yourself in copy to the email
      assertIsDefined(this.profile, 'profile not found');
      assertIsDefined(this.profile.email, 'profile email not found');
      assertIsDefined(this.profile.gravatar, 'profile gravatar not found');
      this.emailRecipients.push({
        firstName: this.profile.firstName,
        gravatar: this.profile.gravatar,
        lastName: this.profile.lastName,
        email: this.profile.email,
        avatar: this.profile.avatar,
      });

      this.dialogService
        .openCustom({
          title: 'Send community notification',
          content:
            'Send an email to a group of recipients by filtering the Publications or Reviews tabs. Your email will be included so you receive a copy of the message.',
          template: this.communityEmailTemplate,
          disableClose: true,
        })
        .afterClosed()
        .subscribe();
    });
  }

  /**
   * Sends a community-wide email with the provided content from the email dialog.
   *
   * @param {$event: EmailData} $event - Contains the body, subject, and recipients of the email.
   */
  sendCommunityEmail($event: EmailData): void {
    this.apiService
      .sendEmailToUsers({
        sendCommunityEmailsDTO: {
          message: $event.body,
          subject: $event.subject,
          emails: $event.recipients,
        },
        id: this.community._id,
      })
      .subscribe(() => {
        this.snackbarService.info('Email send succesfully');
        this.dialogService.closeAll();
      });
  }

  /**
   * Accepts all selected deposits in bulk, changing their status to "Preprint" and makes them public within the community.
   */
  bulkDepositAccept(): void {
    assertIsDefined(this.depositsTable);

    const selectedDeposit = this.depositsTable.selector.selected.filter(
      deposit => deposit.status === DepositStatus.PendingApproval
    );

    this.dialogService
      .openConfirm({
        title: `Accept ${selectedDeposit.length} publications`,
        content:
          'By accepting these publications you will change their status from “Pending Approval” to “Preprint” making ' +
          'the articles public for this community.',
        acceptMessage: 'Confirm',
      })
      .afterClosed()
      .pipe(
        isNotNullOrUndefined(),
        filter(accept => accept)
      )
      .subscribe(() => {
        const depositsToAccept = selectedDeposit.map(deposit =>
          this.apiService
            .acceptDeposit({ id: deposit._id, moderateDepositPayload: { reason: '' } })
            .pipe(
              catchError(err => {
                return of(`Deposit ${deposit.title} has failed.`);
              })
            )
        );

        concat(...depositsToAccept)
          .pipe(toArray())
          .subscribe(acceptDepositsResult => {
            const failed = acceptDepositsResult.filter(
              (deposit): deposit is string => typeof deposit === 'string'
            );
            const deposits = acceptDepositsResult.filter(
              (deposit): deposit is DepositPopulatedDTO => typeof deposit !== 'string'
            );

            this.dialogService.openAlert({
              title: 'Bulk operation completed',
              content: `The bulk process have finished, ${
                deposits.length
              } publications have been processed correctly.
                ${
                  failed.length > 0
                    ? `\t The following publications have failed:
                 ${failed.join('\n')}`
                    : ''
                }
                `,
              acceptMessage: 'Ok',
            });

            this.filterPublications();
            this.getPapersPendingApprovalNumber();
          });
      });
  }

  /**
   * Initiates bulk DOI generation for selected reviews and handles potential errors.
   */
  bulkDOIGenerationReviews(): void {
    assertIsDefined(this.reviewTable);

    const selectedReviews = this.reviewTable.selector.selected;

    this.dialogService
      .openConfirm({
        title: `Generate DOI for ${selectedReviews.length} reviews`,
        content:
          'Are you sure you want to generate DOIs for these reviews? This process cannot be undone and may take some time',
        acceptMessage: 'Confirm',
      })
      .afterClosed()
      .pipe(
        isNotNullOrUndefined(),
        filter(accept => accept)
      )
      .subscribe(() => {
        const reviewDOIsToGenerate = selectedReviews.map(review =>
          this.apiService.createDoiReview({ id: review._id }).pipe(
            catchError(err => {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              if (err?.error?.message) {
                return of(
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                  `Deposit ${review.depositPopulated.title} has failed. ${err.error.message}`
                );
              }
              return of(`Review ${review.depositPopulated.title} has failed.`);
            })
          )
        );

        concat(...reviewDOIsToGenerate)
          .pipe(toArray())
          .subscribe(generatedDOIresult => {
            const failed = generatedDOIresult.filter(
              (payload): payload is string => typeof payload === 'string'
            );
            const results = generatedDOIresult.filter(
              (payload): payload is StringDataPayload => typeof payload !== 'string'
            );

            this.dialogService.openAlert({
              title: 'Bulk operation completed',
              content: `The bulk process have finished, ${
                results.length
              } DOI have been processed correctly.
                ${
                  failed.length > 0
                    ? `\t The following doi generation have failed:
                 ${failed.join('\n')}`
                    : ''
                }
                `,
              acceptMessage: 'Ok',
            });

            this.filterReviews();
          });
      });
  }

  /**
   * Initiates the bulk generation of DOIs for selected deposits. This method first confirms the action with the user
   * and then proceeds to generate DOIs for each selected deposit. It handles any potential errors and provides
   * feedback on the operation's success or failure.
   */
  bulkDOIGenerationDeposits(): void {
    assertIsDefined(this.depositsTable);

    const selectedDeposits = this.depositsTable.selector.selected;

    this.dialogService
      .openConfirm({
        title: `Generate DOI for ${selectedDeposits.length} deposits`,
        content:
          'Are you sure you want to generate DOIs for this reviews? This process cannot be undone and may take some time.',
        acceptMessage: 'Confirm',
      })
      .afterClosed()
      .pipe(
        isNotNullOrUndefined(),
        filter(accept => accept)
      )
      .subscribe(() => {
        const depositsDOIsToGenerate = selectedDeposits.map(deposit =>
          this.apiService.createDoi({ id: deposit._id }).pipe(
            catchError(error => {
              if (error instanceof HttpErrorResponse) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                return of(`${deposit.title} FAILED. Reason ${error.error.message}`);
              }
              return of(`${deposit.title} FAILED.`);
            })
          )
        );

        concat(...depositsDOIsToGenerate)
          .pipe(toArray())
          .subscribe(generatedDOIresult => {
            const failed = generatedDOIresult.filter(
              (payload): payload is string => typeof payload === 'string'
            );

            const results = generatedDOIresult.filter(
              (payload): payload is StringDataPayload => typeof payload !== 'string'
            );

            this.dialogService.openAlert({
              title: 'Bulk operation completed',
              content: `The bulk process have finished, ${
                results.length
              } DOI have been processed correctly.
                ${
                  failed.length > 0
                    ? `\t The following doi generation have failed:
                 ${failed.join('\n')}`
                    : ''
                }
                `,
              acceptMessage: 'Ok',
            });

            this.filterPublications();
          });
      });
  }

  /**
   * A reference to the `SubscriptionType` enum, providing accessible subscription type definitions throughout the component.
   */
  protected readonly SubscriptionType = SubscriptionType;
}
