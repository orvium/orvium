import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  Inject,
  inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, Params, Router, RouterLink } from '@angular/router';
import { EthereumService } from '../../blockchain/ethereum.service';
import { environment } from '../../../environments/environment';
import { catchError, concatMap, finalize, map, tap } from 'rxjs/operators';
import {
  DatePipe,
  DOCUMENT,
  isPlatformBrowser,
  isPlatformServer,
  KeyValuePipe,
  NgClass,
  NgTemplateOutlet,
  TitleCasePipe,
  UpperCasePipe,
} from '@angular/common';
import { throwError } from 'rxjs';
import { BlockchainService } from '../../blockchain/blockchain.service';
import { DepositsService } from '../deposits.service';
import { ProfileService } from '../../profile/profile.service';
import { AppSnackBarService } from '../../services/app-snack-bar.service';
import { BreakpointObserver } from '@angular/cdk/layout';
import {
  AcceptedFor,
  AccessRight,
  Citation,
  CreateCommentDTOResourceModelEnum,
  DefaultService,
  DepositPopulatedDTO,
  DepositStatus,
  FeedbackDTO,
  FileMetadata,
  ReviewPopulatedDTO,
  ReviewStatus,
  UserPrivateDTO,
} from '@orvium/api';
import { SeoTagsService } from '../../services/seo-tags.service';
import { StructuredDataService } from '../../services/structured-data.service';
import { InviteService } from '../../services/invite.service';
import { MatButtonModule } from '@angular/material/button';
import { FeedbackDirective } from '../../shared/feedback/feedback.directive';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { InfoToolbarComponent } from '../../shared/info-toolbar/info-toolbar.component';
import { DescriptionLineComponent } from '../../shared/description-line/description-line.component';
import { MatMenuModule } from '@angular/material/menu';
import { ShareMediaComponent } from '../../shared/share-media/share-media.component';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { HistoryLogComponent } from '../../shared/history-log/history-log.component';
import { CommentSectionComponent } from '../../comment/comment-section/comment-section.component';
import { CopyToClipboardDirective } from '../../shared/directives/copy-to-clipboard.directive';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { SpinnerService } from '../../spinner/spinner.service';
import { AlertComponent } from '../../shared/alert/alert.component';
import { FileCardComponent } from '../../shared/file-card/file-card.component';
import { ReviewCardComponent } from '../../review/review-card/review-card.component';
import { DialogService } from '../../dialogs/dialog.service';
import { AuthorAvatarListComponent } from '../../shared/author-avatar-list/author-avatar-list.component';
import { AuthorsListComponent } from '../../shared/authors-list/authors-list.component';
import { ShowMoreComponent } from '../../shared/show-more/show-more.component';
import { DepositVersionsAccordionComponent } from '../deposit-versions-accordion/deposit-versions-accordion.component';
import { ContributorLineComponent } from '../../shared/contributor-line/contributor-line.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ReviewIconPipe } from '../../shared/custom-pipes/review-icon.pipe';
import { OverlayLoadingDirective } from '../../spinner/overlay-loading.directive';
import { HttpErrorResponse } from '@angular/common/http';
import { AccessDeniedComponent } from '../../shared/access-denied/access-denied.component';
import { ScriptService } from '../../services/script.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { EncodeURIComponentPipe } from '../../shared/custom-pipes/encode-uri-component.pipe';
import { assertIsDefined, isNotNullOrUndefined } from '../../shared/shared-functions';
import { BREAKPOINTS } from '../../layout/breakpoints';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonsMenuComponent } from '../../buttons-menu/buttons-menu.component';
import { ModerateDepositsService } from '../../services/moderate-deposits.service';

/**
 * Interface representing an album of images for the deposit view component.
 *
 * @property {string} src - Source URL of the album
 * @property {string} caption - The optional caption for the image.
 */
export interface IAlbum {
  src: string;
  caption?: string;
}

/**
 * Component that handles the display and interaction with a specific deposit's details, including versions,
 * reviews, and related actions such as creating a review or sharing the deposit.
 */
@Component({
  selector: 'app-deposit-view',
  standalone: true,
  templateUrl: './deposit-view.component.html',
  styleUrls: ['./deposit-view.component.scss'],
  imports: [
    MatButtonModule,
    FeedbackDirective,
    MatTooltipModule,
    MatIconModule,
    RouterLink,
    InfoToolbarComponent,
    DescriptionLineComponent,
    NgTemplateOutlet,
    MatMenuModule,
    ShareMediaComponent,
    DepositVersionsAccordionComponent,
    DatePipe,
    MatListModule,
    MatChipsModule,
    TitleCasePipe,
    MatTabsModule,
    HistoryLogComponent,
    NgClass,
    CommentSectionComponent,
    CopyToClipboardDirective,
    KeyValuePipe,
    MatExpansionModule,
    UpperCasePipe,
    MatFormFieldModule,
    AlertComponent,
    FileCardComponent,
    ReviewCardComponent,
    AuthorAvatarListComponent,
    AuthorsListComponent,
    ShowMoreComponent,
    ContributorLineComponent,
    FontAwesomeModule,
    ReviewIconPipe,
    OverlayLoadingDirective,
    AccessDeniedComponent,
    EncodeURIComponentPipe,
    ButtonsMenuComponent,
  ],
})
export class DepositViewComponent implements OnInit, OnDestroy {
  /** Sharedialog template */
  @ViewChild('shareDialogTemplate') shareDialogTemplate!: TemplateRef<unknown>;

  /** Enumeration of possible deposit statuses. */
  DepositStatus = DepositStatus;

  /** Enumeration of possible review statuses. */
  ReviewStatus = ReviewStatus;

  /** Enumeration of possible access rights for the deposit. */
  AccessRight = AccessRight;

  /** The detailed information of the current deposit. */
  deposit!: DepositPopulatedDTO;

  /** A list of peer reviews associated with the deposit. */
  peerReviews: ReviewPopulatedDTO[] = [];

  /** Metadata of files associated with the deposit. */
  files: FileMetadata[] = [];

  /** Environment configuration variable based on .env file */
  environment = environment;

  /** Balance of tokens associated with the user's account. Blockchain */
  balanceTokens = '0';

  /** Balance of allowance tokens associated with the user's account. Blockchain */
  allowanceTokens = '0';

  /** Flag indicating if the deposit is starred by the user. */
  isStarred = false;

  /** The user's profile information as a DTO. */
  profile?: UserPrivateDTO;

  /** List of all versions of the deposit as DTOs */
  depositVersions: DepositPopulatedDTO[] = [];

  /** The latest version of the deposit. */
  latestVersion?: DepositPopulatedDTO;

  /** Citation information for the deposit. */
  citation?: Citation;

  /** List of images associated with the deposit. */
  images: IAlbum[] = [];

  /** Link to the user's conversation related to the deposit. */
  conversationLink?: { routerLink: string; queryParam: Params };

  /** Indicates if the user has been invited to review the deposit. */
  hasBeenInvitedToReview = false;

  /** Indicates if the user can invite reviewers for the deposit. */
  canInviteReviewers = false;

  /** Indicates if the user can review the deposit. */
  canReview = false;

  /** Indicates if the user can moderate the deposit. */
  canModerateDeposit = false;

  /** Indicates if the user can create a new version of the deposit. */
  canCreateVersion = false;

  /** Indicates if the user can manage the deposit. */
  canManageDeposit = false;

  /** Indicates if the user can create comments on the deposit. */
  canCreateComment = false;

  /** The file extension of the publication file. */
  publicationFileExtension = '';

  /** Draft version of the deposit, if available. */
  draftDeposit?: DepositPopulatedDTO;

  /** Version of the deposit pending approval, if available. */
  pendingApprovalDeposit?: DepositPopulatedDTO;

  /**  Indicates if the application is running on a server platform. */
  isPlatformServer = true;

  /** Indicates if the viewport is mobile-sized when the page loads. */
  isMobileWhenPageStarts = false;

  /** Indicates if the viewport is currently mobile-sized. */
  isMobile = false;

  /** Text to display for sharing the deposit. */
  shareText = 'Share this!';

  /** Enumeration of resource models for creating comments. */
  ResourceModelEnum = CreateCommentDTOResourceModelEnum;

  /** Indicates if the deposit view is loading. */
  depositViewLoading = false;

  /** Regular expression match array for validating Overleaf usage. */
  canUseOverleaf!: RegExpMatchArray | null;

  /** Track information of the deposit if available */
  track?: string;

  /** Indicates if the user is unauthorized to view the deposit. */
  unauthorized = false;

  /** Sanitized URL for the PDF file of the deposit. */
  sanitizedPDFFileUrl: SafeUrl | undefined;

  /** Enumeration of acceptance purposes. */
  protected readonly AcceptedFor = AcceptedFor;

  /** Reference for managing component destruction. */
  private destroyRef = inject(DestroyRef);

  /**
   * Constructor for the DepositViewComponent.
   *
   * @param {DefaultService} apiService - Service for making API calls.
   * @param {BlockchainService} blockchainService - Service for blockchain interactions.
   * @param {ActivatedRoute} route - Service for accessing route parameters.
   * @param {Router} router - Service for navigating between routes.
   * @param {EthereumService} ethereumService - Service for Ethereum blockchain interactions.
   * @param {ProfileService} profileService - Service for accessing user profile information.
   * @param {AppSnackBarService} snackBar - Service for displaying snack bar notifications.
   * @param {SpinnerService} spinnerService - Service for displaying a loading spinner.
   * @param {SeoTagsService} seoTagsService - Service for managing SEO tags.
   * @param {StructuredDataService} structuredDataService - Service for managing structured data.
   * @param {DepositsService} depositService - Service for managing deposits.
   * @param {DialogService} dialogService - Service for managing dialogs.
   * @param {BreakpointObserver} breakpointObserver - Service for observing viewport breakpoints.
   * @param {InviteService} inviteService - Service for managing invites.
   * @param {ScriptService} scriptService - Service for loading external scripts.
   * @param {ChangeDetectorRef} changeDetectorRef - Service for detecting changes in the component.
   * @param {DomSanitizer} domSanitizer - Service for sanitizing URLs.
   * @param {ModerateDepositsService} moderateDepositService - Service for moderating deposits.
   * @param {string} platformId - The platform ID for determining the running environment.
   * @param {Document} document - The document object for accessing the DOM.
   */
  constructor(
    private apiService: DefaultService,
    public blockchainService: BlockchainService,
    private route: ActivatedRoute,
    private router: Router,
    public ethereumService: EthereumService,
    private profileService: ProfileService,
    private snackBar: AppSnackBarService,
    private spinnerService: SpinnerService,
    private seoTagsService: SeoTagsService,
    private structuredDataService: StructuredDataService,
    private depositService: DepositsService,
    public dialogService: DialogService,
    public breakpointObserver: BreakpointObserver,
    private inviteService: InviteService,
    private scriptService: ScriptService,
    private changeDetectorRef: ChangeDetectorRef,
    private domSanitizer: DomSanitizer,
    private moderateDepositService: ModerateDepositsService,
    @Inject(PLATFORM_ID) private platformId: string,
    @Inject(DOCUMENT) private document: Document
  ) {}

  /**
   * Initializes the component and loads necessary data for displaying the deposit details.
   */
  ngOnInit(): void {
    this.isPlatformServer = isPlatformServer(this.platformId);
    this.breakpointObserver.observe(BREAKPOINTS.MOBILE).subscribe(result => {
      this.isMobile = result.matches;
    });
    this.isMobileWhenPageStarts = !this.breakpointObserver.isMatched(BREAKPOINTS.MOBILE);

    this.route.paramMap
      .pipe(
        tap(() => {
          // This is necessary because otherwise the router link does not detect the change in the OnInit.
          this.depositViewLoading = true;
        }),
        map(params => params.get('depositId')),
        isNotNullOrUndefined(),
        concatMap(depositId => this.apiService.getDeposit({ id: depositId })),
        takeUntilDestroyed(this.destroyRef),
        tap(() => {
          this.depositViewLoading = false;
        }),
        catchError(error => {
          this.depositViewLoading = false;
          if (error instanceof HttpErrorResponse && error.status === 401) {
            this.unauthorized = true;
          }
          return throwError(error);
        })
      )
      .subscribe(deposit => {
        this.deposit = deposit;
        this.refreshDeposit(this.deposit);
        this.apiService
          .getReviews({ depositId: deposit._id, creator: '' })
          .subscribe(reviews => (this.peerReviews = reviews));

        const profile = this.profileService.profile.getValue();
        if (profile) {
          this.profile = profile;
          this.conversationLink = this.profileService.getConversationLink(profile._id);
          this.refreshDeposit(this.deposit);
          this.apiService.hasBeenInvited({ id: this.deposit._id }).subscribe(response => {
            this.hasBeenInvitedToReview = response;
          });
        }
        if (
          this.deposit.status === DepositStatus.Preprint ||
          this.deposit.status === DepositStatus.Published
        ) {
          this.setSEOTags();
          this.shareText = 'Share <b>' + this.deposit.title + '</b> in your social media';
        }
        this.apiService.getDepositVersions({ id: this.deposit._id }).subscribe(deposits => {
          this.depositVersions = deposits;
          this.latestVersion = this.getVersion(deposits);
        });

        this.apiService.getCitation({ id: this.deposit._id }).subscribe(response => {
          this.citation = response;
        });

        /*    if (this.deposit.track) {
      for (const track of this.deposit.community.newTracks) {
        if (this.deposit.track === track.time) {
          this.track = track.title;
        }
      }
    }*/
      });
  }

  /**
   * Cleans up resources when the component is destroyed, such as removing SEO tags among others.
   */
  ngOnDestroy(): void {
    this.seoTagsService.removeTagsAndCanonical();
    this.structuredDataService.removeStructuredData();
  }

  /**
   * Initiates the creation of a new review for the current deposit. Shows a spinner while the request is processed.
   * On success, navigates to the edit page of the newly created review.
   */
  createReview(): void {
    this.spinnerService.show();
    this.apiService
      .createReview({
        createReviewDTO: {
          deposit: this.deposit._id,
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

  /**
   * Refreshes the available actions based on the provided deposit's permissions.
   *
   * @param {DepositPopulatedDTO} deposit - The deposit for which to refresh actions.
   */
  refreshActions(deposit: DepositPopulatedDTO): void {
    this.canModerateDeposit = this.depositService.canModerateDeposit(this.deposit);
    this.canInviteReviewers = this.depositService.canInviteReviewers(this.deposit);
    this.canReview = this.depositService.canReviewDeposit(this.deposit);
    this.canManageDeposit = this.depositService.canEditDeposit(this.deposit);
    this.canCreateComment = this.depositService.canCreateCommentDeposit(this.deposit);
    this.canCreateVersion = this.depositService.canCreateVersion(this.deposit);
  }

  /**
   * Refreshes the current deposit's data and updates the component state accordingly.
   * Sets the SEO tags, structured data, publication file URL, star status, images, and track information.
   *
   * @param {DepositPopulatedDTO} deposit - The deposit to refresh.
   */
  refreshDeposit(deposit: DepositPopulatedDTO): void {
    this.deposit = deposit;
    this.refreshActions(deposit);
    this.files = deposit.publicationFile
      ? [deposit.publicationFile].concat(deposit.files)
      : deposit.files;
    if (
      this.deposit.status === DepositStatus.Preprint ||
      this.deposit.status === DepositStatus.Published
    ) {
      this.setSEOTags();
      this.structuredDataService.removeStructuredData();
      this.setStructuredData();
    }

    if (deposit.pdfUrl) {
      this.sanitizedPDFFileUrl = this.domSanitizer.bypassSecurityTrustResourceUrl(deposit.pdfUrl);
    }

    if (this.ethereumService.isInitialized) {
      void this.ethereumService
        .getTokenBalance(deposit)
        .then(result => (this.balanceTokens = result));
      void this.ethereumService
        .getTokenAllowance()
        .then(result => (this.allowanceTokens = result.toString()));
    }

    // Set star
    if (this.profile) {
      this.isStarred = this.getStarIndex(this.profile) > -1;
    }

    //Set figures
    this.images = [];
    for (const src of deposit.images) {
      const image = {
        src: environment.apiEndpoint + '/deposits/' + this.deposit._id + '/media/' + src,
      };
      this.images.push(image);
    }

    //Set Publication File Extension
    if (deposit.publicationFile?.filename) {
      this.canUseOverleaf = this.canOpenOverleaf(deposit.publicationFile.filename);
      this.publicationFileExtension =
        deposit.publicationFile.filename.split('.').pop()?.toUpperCase() || 'unknownExtension';
    }

    //Publication track
    if (deposit.newTrackTimestamp) {
      const communityTrack = deposit.communityPopulated.newTracks.find(
        track => track.timestamp === deposit.newTrackTimestamp
      );
      assertIsDefined(communityTrack, 'track is not defined');
      this.track = communityTrack.title;
    }

    if (isPlatformBrowser(this.platformId)) {
      this.scriptService
        .loadScript('https://cdn.jsdelivr.net/npm/mathjax@3.2.2/es5/tex-mml-chtml.min.js')
        .subscribe(() => {
          console.log('Mathjax library loaded');

          // Force change detection so publication html is rendered in the page
          // before MathJax looks for new formulas to render
          this.changeDetectorRef.detectChanges();

          if (this.document.defaultView && 'MathJax' in this.document.defaultView) {
            // @ts-expect-error
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            this.document.defaultView.MathJax?.typeset();
          }
        });
    }
  }

  /**
   * Opens a custom dialog for sharing the deposit.
   */
  openShare(): void {
    this.dialogService.openCustom({
      template: this.shareDialogTemplate,
      showActionButtons: false,
    });
  }

  /**
   * Retrieves the latest version of a deposit from a list of deposit versions.
   *
   * @param {DepositPopulatedDTO[]} depositVersions - Array of deposit versions.
   * @returns {DepositPopulatedDTO} - The latest version of the deposit.
   */
  getVersion(depositVersions: DepositPopulatedDTO[]): DepositPopulatedDTO {
    return depositVersions.reduce((deposit1, deposit2) => {
      return deposit1.version > deposit2.version ? deposit1 : deposit2;
    });
  }

  /**
   * Sets the SEO tags for the current deposit.
   */
  public setSEOTags(): void {
    this.seoTagsService.setGeneralSeo(this.deposit.title, this.deposit.abstract);
    this.seoTagsService.setPublicationTags(this.deposit, this.router.url);
    this.seoTagsService.setOpengraphTags(
      this.deposit.title,
      `Read now "${this.deposit.title}" publication`,
      environment.publicUrl + this.router.url
    );
  }

  /**
   * Sets the structured data for the current deposit.
   */
  public setStructuredData(): void {
    this.structuredDataService.insertScholarlyArticleSchema(this.deposit);
  }

  /**
   * Toggles the star status of the current deposit for the logged-in user.
   * If the user is not logged in, shows an error message.
   */
  star(): void {
    if (!this.profile) {
      this.snackBar.error('You need to log in first to use this feature');
      return;
    }
    const index = this.getStarIndex(this.profile);
    if (index !== -1) {
      this.profile.starredDeposits.splice(index, 1);
    } else {
      this.profile.starredDeposits.push(this.deposit._id);
    }
    this.profileService
      .updateProfile({ starredDeposits: this.profile.starredDeposits })
      .subscribe(() => {
        this.refreshDeposit(this.deposit);
      });
  }

  /**
   * Gets the index of the current deposit in the user's starred deposits.
   *
   * @param {UserPrivateDTO} profile - The user's profile.
   * @returns {number} - The index of the current deposit in the starred deposits array.
   */
  getStarIndex(profile: UserPrivateDTO): number {
    if (profile.starredDeposits.includes(this.deposit._id)) {
      return profile.starredDeposits.indexOf(this.deposit._id);
    }
    return -1;
  }

  /**
   * Creates a new revision of the current deposit.
   * On success, navigates to the edit page of the newly created deposit version.
   */
  createRevision(): void {
    this.apiService.createDepositRevision({ id: this.deposit._id }).subscribe(response => {
      this.snackBar.info('New version created');
      void this.router.navigate(['deposits', response._id, 'edit']);
    });
  }

  /**
   * Generates the Binder URL for a given GitHub repository URL.
   *
   * @param {string} gitRepositoryURL - The GitHub repository URL.
   * @returns {string} - The Binder URL for the given repository.
   */
  getBinderURL(gitRepositoryURL: string): string {
    const regexGitHub = /https:\/\/github\.com\/(.+)/;
    let binderURL = 'https://mybinder.org/error';
    const repository = gitRepositoryURL.match(regexGitHub);
    if (repository) {
      binderURL = `https://mybinder.org/v2/gh/${repository[1]}/HEAD?urlpath=lab`;
    }
    return binderURL;
  }

  /**
   * Reports the current deposit with the given feedback.
   *
   * @param {object} event - The feedback event object.
   */
  reportDeposit(event: object): void {
    const feedback = event as FeedbackDTO;
    this.apiService.createFeedback({ feedbackDTO: feedback }).subscribe(() => {
      this.snackBar.info('Thank you for your feedback!');
    });
  }

  /**
   * Claims the current deposit with the given claim details.
   *
   * @param {object} event - The claim event object.
   */
  claimArticle(event: object): void {
    const claim = event as FeedbackDTO;
    this.apiService.createFeedback({ feedbackDTO: claim }).subscribe(() => {
      this.snackBar.info('Your claim has been received, thanks.');
    });
  }

  /**
   * Opens the invite dialog for inviting reviewers or editors.
   */
  openInviteDialog(): void {
    this.inviteService.openInviteDialog();
  }

  /**
   * Checks if the given filename can be opened in Overleaf.
   *
   * @param {string} filename - The filename to check.
   * @returns {RegExpMatchArray | null} - The match array if the filename matches the Overleaf pattern, otherwise null.
   */
  canOpenOverleaf(filename: string): RegExpMatchArray | null {
    const regex = /\w+\.tex|\w+\.zip/g;
    return filename.match(regex);
  }

  /**
   * Opens the modal to accept the current deposit.
   * On success, refreshes the deposit and shows a success message.
   */
  openAcceptModal(): void {
    this.moderateDepositService
      .openAcceptModalComplete(this.deposit, this.depositViewLoading)
      .subscribe(deposit => {
        this.refreshDeposit(deposit);
        this.snackBar.info('Publication accepted');
      });
  }

  /**
   * Publishes the current deposit.
   * Shows a loading spinner during the process.
   * On success, refreshes the deposit and shows a success message.
   */
  publishDeposit(): void {
    this.depositViewLoading = true;
    this.moderateDepositService
      .publishDeposit(this.deposit)
      .pipe(
        finalize(() => {
          this.depositViewLoading = false;
          this.snackBar.info('Publication published');
        })
      )
      .subscribe(deposit => {
        this.refreshDeposit(deposit);
      });
  }

  /**
   * Opens the modal to draft the current deposit.
   * On success, refreshes the deposit and shows a success message.
   */
  openDraftModal(): void {
    this.moderateDepositService
      .openDraftModalComplete(this.deposit, this.depositViewLoading)
      .subscribe(deposit => {
        this.refreshDeposit(deposit);
        this.snackBar.info('Publication drafted');
      });
  }

  /**
   * Opens the dialog to move the current deposit back to pending approval.
   * On success, refreshes the deposit and shows a success message.
   */
  openBackToPendingApprovalDialog(): void {
    this.moderateDepositService
      .openBackToPendingApprovalComplete(this.deposit, this.depositViewLoading)
      .subscribe(deposit => {
        this.refreshDeposit(deposit);
        this.snackBar.info('Publication back to pending approval');
      });
  }

  /**
   * Opens the modal to reject the current deposit.
   * On success, refreshes the deposit and shows a success message.
   */
  openRejectModal(): void {
    this.moderateDepositService
      .openRejectModalComplete(this.deposit, this.depositViewLoading)
      .subscribe(deposit => {
        this.refreshDeposit(deposit);
        this.snackBar.info('Publication rejected');
      });
  }

  /**
   * Opens the modal to merge the current deposit.
   * On success, refreshes the deposit and shows a success message.
   */
  openMergeModal(): void {
    this.moderateDepositService
      .openMergeModalComplete(this.deposit, this.depositViewLoading)
      .subscribe(deposit => {
        this.refreshDeposit(deposit);
        this.snackBar.info('Publication merged');
      });
  }
}
