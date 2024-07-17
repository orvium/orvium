import {
  Component,
  DestroyRef,
  inject,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { REVIEWDECISION_LOV, ReviewDecisionLov } from '../../model/orvium';
import { environment } from '../../../environments/environment';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EthereumService } from '../../blockchain/ethereum.service';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { NGXLogger } from 'ngx-logger';
import { assertIsDefined, isNotNullOrUndefined } from '../../shared/shared-functions';
import { ProfileService } from '../../profile/profile.service';
import { AppSnackBarService } from '../../services/app-snack-bar.service';
import {
  DefaultService,
  DepositDTO,
  DepositPopulatedDTO,
  DepositStatus,
  FeedbackDTO,
  FileMetadata,
  ReviewPopulatedDTO,
  ReviewStatus,
  UserPrivateDTO,
} from '@orvium/api';
import { IReviewActions, ReviewService } from '../review.service';
import { ShareService } from 'ngx-sharebuttons';
import { BreakpointObserver } from '@angular/cdk/layout';
import { SeoTagsService } from '../../services/seo-tags.service';
import { concatMap, map } from 'rxjs/operators';
import { MatFormFieldModule } from '@angular/material/form-field';
import { NgTemplateOutlet } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { ShareMediaComponent } from '../../shared/share-media/share-media.component';
import { FeedbackDirective } from '../../shared/feedback/feedback.directive';
import { InfoToolbarComponent } from '../../shared/info-toolbar/info-toolbar.component';
import { DescriptionLineComponent } from '../../shared/description-line/description-line.component';
import { MatMenuModule } from '@angular/material/menu';
import { MatTabsModule } from '@angular/material/tabs';
import { HistoryLogComponent } from '../../shared/history-log/history-log.component';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { OverlayLoadingDirective } from '../../spinner/overlay-loading.directive';
import { AlertComponent } from '../../shared/alert/alert.component';
import { FileCardComponent } from '../../shared/file-card/file-card.component';
import { ReviewCardComponent } from '../review-card/review-card.component';
import { DialogService } from '../../dialogs/dialog.service';
import { DepositCardComponent } from '../../deposits/deposit-card/deposit-card.component';
import { IAlbum } from '../../deposits/deposit-view/deposit-view.component';
import { BREAKPOINTS } from '../../layout/breakpoints';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonsMenuComponent } from '../../buttons-menu/buttons-menu.component';
import { ReviewCommentsComponent } from '../review-comments/review-comments.component';

/**
 * Component for viewing detailed information about a review.
 * This component displays review details, associated deposit information, actions that can be performed on the review, and related media files.
 * It integrates with various services to handle review-related actions such as editing, deleting, updating status, and adding comments.
 */
@Component({
  selector: 'app-review-view',
  standalone: true,
  templateUrl: './review-view.component.html',
  styleUrls: ['./review-view.component.scss'],
  imports: [
    MatFormFieldModule,
    ReactiveFormsModule,
    MatButtonModule,
    RouterLink,
    ShareMediaComponent,
    FeedbackDirective,
    InfoToolbarComponent,
    DescriptionLineComponent,
    NgTemplateOutlet,
    MatMenuModule,
    MatTabsModule,
    HistoryLogComponent,
    MatInputModule,
    MatIconModule,
    MatTooltipModule,
    OverlayLoadingDirective,
    AlertComponent,
    FileCardComponent,
    ReviewCardComponent,
    DepositCardComponent,
    ButtonsMenuComponent,
    ReviewCommentsComponent,
  ],
})
export class ReviewViewComponent implements OnInit, OnDestroy {
  /** Template reference for the pay reviewer dialog. */
  @ViewChild('displayPayReviewerDialogTemplate')
  displayPayReviewerDialogTemplate!: TemplateRef<unknown>;

  /** Template reference for the share dialog. */
  @ViewChild('shareDialogTemplate') shareDialogTemplate!: TemplateRef<unknown>;

  /** Holds the detailed information of the peer review being displayed. */
  peerReview?: ReviewPopulatedDTO;

  /** Holds the deposit details associated with the peer review. */
  deposit?: DepositPopulatedDTO;

  /** Environment variables for the application. */
  environment = environment;

  /** Array of files metadata associated with the review. */
  files: FileMetadata[] = [];

  /** Profile information of the currently logged-in user as a DTO */
  profile?: UserPrivateDTO;

  /** Balance of tokens for the reviewer (blockchain). */
  balanceTokens = '0';

  /** Ethereum address of the reviewer (blockchain). */
  reviewerAddress = '0';

  /** Selected decision for the review process. */
  decisionSelected: ReviewDecisionLov | undefined;

  /**  Indicates if the device is mobile based on screen size. */
  isMobile = false;

  /**
   * Form control for entering the number of tokens to pay the reviewer.
   */
  numberPayReviewerControl = new FormControl('', [
    Validators.required,
    Validators.min(1),
    Validators.max(100),
  ]);

  /** Flag to indicate if a reward is being processed (blockchain). */
  rewardFlag = false;

  /** Text to be used for sharing the review on social media. */
  shareText = 'Share this!';

  /** Status of the deposit (draft, pending approval, published etc) */
  depositStatus = DepositStatus;

  /** Images associated */
  images: IAlbum[] = [];

  /** Reference to the destroy service to clean up subscriptions */
  private destroyRef = inject(DestroyRef);

  /**
   * Actions that can be performed on the review based on the user's permissions and review status.
   */
  reviewActions: IReviewActions = {
    edit: false,
    delete: false,
    update: false,
    moderate: false,
    read: false,
    createComment: false,
  };

  /**
   * Constructor initializes the component with necessary dependencies.
   *
   * @param {DefaultService} apiService Service to interact with the API.
   * @param {ActivatedRoute} route Provides access to information about the route associated with this component.
   * @param {Router} router Provides the navigation and URL manipulation capabilities.
   * @param {SeoTagsService} seoTagsService Service to manage SEO tags.
   * @param {AppSnackBarService} snackBar Service to display snack bar notifications.
   * @param {EthereumService} ethereumService Service to interact with the Ethereum blockchain.
   * @param {ProfileService} profileService Service to manage the user profile.
   * @param {NGXLogger} logger Logger service for debugging and logging.
   * @param {ReviewService} reviewService Service to manage review-related operations.
   * @param {DialogService} dialogService Service to manage dialogs.
   * @param {ShareService} share Service to handle sharing functionalities.
   * @param {BreakpointObserver} breakpointObserver Service to access media query match results.
   */
  constructor(
    public apiService: DefaultService,
    private route: ActivatedRoute,
    private seoTagsService: SeoTagsService,
    private snackBar: AppSnackBarService,
    public ethereumService: EthereumService,
    private profileService: ProfileService,
    private logger: NGXLogger,
    public reviewService: ReviewService,
    private router: Router,
    public dialogService: DialogService,
    public share: ShareService,
    public breakpointObserver: BreakpointObserver
  ) {}

  /**
   * Initializes the component by fetching review and deposit details.
   */
  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map(params => params.get('reviewId')),
        isNotNullOrUndefined(),
        concatMap(reviewId => this.apiService.getReview({ id: reviewId })),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(review => {
        this.peerReview = review;
        this.apiService.getDeposit({ id: review.depositPopulated._id }).subscribe(deposit => {
          this.deposit = deposit;
          this.refreshBalance();
          if (review.status === ReviewStatus.Published) {
            this.setSEOTags(this.deposit, review);
            this.shareText = `Share this <b>review of "${review.depositPopulated.title}"</b> in your social media`;
          }
        });
        this.files = [];

        assertIsDefined(this.peerReview, 'Peer review not found');

        this.decisionSelected = REVIEWDECISION_LOV.find(x => x.value === this.peerReview?.decision);
        if (this.peerReview.file?.filename) {
          this.files.push(this.peerReview.file);
        }
        for (const extraFile of this.peerReview.extraFiles) {
          this.files.push(extraFile);
        }
        //Set figures
        this.images = [];
        for (const src of review.images) {
          const image = {
            src: environment.apiEndpoint + '/reviews/' + this.peerReview._id + '/media/' + src,
          };
          this.images.push(image);
        }

        if (this.ethereumService.isInitialized) {
          if (this.peerReview.transactions && this.ethereumService.currentNetwork.value) {
            const transaction =
              this.peerReview.transactions[this.ethereumService.currentNetwork.value.name];
            if (
              transaction &&
              typeof transaction === 'object' &&
              // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
              transaction.hasOwnProperty('from')
            ) {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              this.reviewerAddress = transaction.from;
            }
          }
        }
        this.refreshActions(this.peerReview);
      });

    this.profileService.getProfile().subscribe(profile => {
      this.profile = profile;
    });

    this.breakpointObserver.observe(BREAKPOINTS.MOBILE).subscribe(result => {
      this.isMobile = result.matches;
    });
  }

  /**
   * Cleans up resources on component destruction, specifically removing SEO tags and canonical links to prevent memory leaks
   * and ensure clean state on re-navigation.
   */
  ngOnDestroy(): void {
    this.seoTagsService.removeTagsAndCanonical();
  }

  /**
   * Refreshes the available actions for a review based on the current review data.
   *
   * @param {ReviewPopulatedDTO} review - The review data object to determine actions for.
   */
  refreshActions(review: ReviewPopulatedDTO): void {
    this.reviewActions = this.reviewService.getReviewActions(review);
    console.log(this.reviewActions);
  }

  /**
   * Sets SEO tags for the current review based on its content and deposit information.
   *
   * @param {DepositPopulatedDTO} deposit - The deposit associated with the review.
   * @param {ReviewPopulatedDTO} peerReview - The review for which to set SEO tags.
   */
  public setSEOTags(deposit: DepositPopulatedDTO, peerReview: ReviewPopulatedDTO): void {
    this.seoTagsService.setGeneralSeo(
      `${deposit.title} review | Orvium`,
      `${deposit.title} review by ${peerReview.author}`
    );
    this.seoTagsService.setOpengraphTags(
      deposit.title,
      `Read now "${deposit.title}" review by ${peerReview.author} in Orvium`,
      environment.publicUrl + this.router.url
    );
  }

  /**
   * Toggles the starring of a deposit. Requires user to be logged in.
   *
   * @param {DepositDTO | DepositPopulatedDTO} deposit - The deposit to be starred or unstarred.
   */
  star(deposit: DepositDTO | DepositPopulatedDTO): void {
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
   * Retrieves the index of a starred deposit within the user's profile.
   *
   * @param {UserPrivateDTO} profile - The user's profile.
   * @param {DepositDTO | DepositPopulatedDTO} deposit - The deposit to find within the starred deposits.
   * @returns {number} The index of the deposit if found, otherwise -1.
   */
  getStarIndex(profile: UserPrivateDTO, deposit: DepositDTO | DepositPopulatedDTO): number {
    if (profile.starredDeposits.includes(deposit._id)) {
      return profile.starredDeposits.indexOf(deposit._id);
    }
    return -1;
  }

  /**
   * Determines if a deposit is starred by the current user.
   *
   * @param {DepositDTO | DepositPopulatedDTO} deposit - The deposit to check.
   * @returns {boolean} True if the deposit is starred, false otherwise.
   */
  isStarred(deposit: DepositDTO | DepositPopulatedDTO): boolean {
    if (this.profile) {
      return this.getStarIndex(this.profile, deposit) > -1;
    }
    return false;
  }

  /**
   * Opens a share dialog for the current review.
   */
  openShare(): void {
    this.dialogService.openCustom({
      template: this.shareDialogTemplate,
      showActionButtons: false,
    });
  }

  /**
   * Submits a feedback report for the current review.
   *
   * @param {object} event - The event object containing the feedback data.
   */
  reportReview(event: object): void {
    const feedback = event as FeedbackDTO;
    this.apiService.createFeedback({ feedbackDTO: feedback }).subscribe(() => {
      this.snackBar.info('Thank you for your feedback!');
    });
  }

  /**
   * Refreshes the user's balance of tokens related to the current deposit (blockchain).
   */
  refreshBalance(): void {
    assertIsDefined(this.deposit, 'deposit is not defined');
    if (this.ethereumService.isInitialized && this.ethereumService.account) {
      this.ethereumService
        .getUserTokenBalance(this.ethereumService.account, this.deposit)
        .subscribe(result => {
          this.balanceTokens = result.toString();
        });
    }
  }

  /**
   * Opens a dialog to initiate the payment process to the reviewer if conditions are met (blockchain).
   */
  showPayReviewer(): void {
    if (!this.ethereumService.isReady()) {
      this.snackBar.error(
        'No Ethereum provider detected, check if Metamask is installed in your browser'
      );
      return;
    }
    if (!this.balanceTokens || this.balanceTokens === '0') {
      this.snackBar.info('Please, deposit first some ORV tokens to make the reward');
      return;
    }
    this.dialogService
      .openCustom({
        title: 'Reward peer reviewer',
        content: 'Please enter the number of ORV tokens that you want to give to the peer reviewer',
        template: this.displayPayReviewerDialogTemplate,
        showActionButtons: false,
      })
      .afterClosed()
      .subscribe();
  }

  /**
   * Conducts the token transaction to pay a reviewer.
   *
   * @param {string} value - The amount of tokens to pay.
   */
  payReviewer(value: string): void {
    assertIsDefined(this.peerReview, 'deposit is not defined');
    this.ethereumService
      .payReviewer(value, this.peerReview.depositPopulated, this.reviewerAddress)
      .subscribe(transaction => {
        this.logger.debug('Transaction', transaction);
        this.rewardFlag = true;

        void transaction.wait().then(receipt => {
          this.logger.debug('Receipt', receipt);
          this.rewardFlag = false;
          this.dialogService.closeAll();
        });
      });
  }
}
