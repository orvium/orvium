import { Component, DestroyRef, inject, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import { EthereumService } from '../../blockchain/ethereum.service';
import { concatMap, finalize, map } from 'rxjs/operators';
import {
  FormBuilder,
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { NGXLogger } from 'ngx-logger';
import { BlockchainService } from '../../blockchain/blockchain.service';
import {
  assertIsDefined,
  getDelta,
  hasJsonStructure,
  isNotNullOrUndefined,
} from '../../shared/shared-functions';
import { HttpResponse } from '@angular/common/http';
import { ProfileService } from '../../profile/profile.service';
import { AppSnackBarService } from '../../services/app-snack-bar.service';
import {
  CommunityPopulatedDTO,
  CommunityPrivateDTO,
  DefaultService,
  DepositDTO,
  DepositPopulatedDTO,
  ReviewDecision,
  ReviewPopulatedDTO,
  ReviewStatus,
  SignedUrlDTO,
  UpdateReviewDTO,
  UserPrivateDTO,
} from '@orvium/api';
import { IReviewActions, ReviewService } from '../review.service';
import {
  ACCEPT_TYPES,
  FileuploadComponent,
  MAX_FILE_SIZE,
} from '../../shared/fileupload/fileupload.component';
import { lastValueFrom, Observable } from 'rxjs';
import { LOCALSTORAGE_SHOWOPTIONALFIELDS, REVIEWDECISION_LOV } from '../../model/orvium';
import { OnExit } from '../../shared/guards/exit.guard';
import { AccessDeniedComponent } from '../../shared/access-denied/access-denied.component';
import { InfoToolbarComponent } from '../../shared/info-toolbar/info-toolbar.component';
import { DescriptionLineComponent } from '../../shared/description-line/description-line.component';
import { JsonPipe, KeyValuePipe, NgClass, TitleCasePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SpinnerService } from '../../spinner/spinner.service';
import { OverlayLoadingDirective } from '../../spinner/overlay-loading.directive';
import { AlertComponent } from '../../shared/alert/alert.component';
import { FileCardComponent } from '../../shared/file-card/file-card.component';
import { DialogService } from '../../dialogs/dialog.service';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { DOI_REGEXP, validateDOI } from '../../shared/AppCustomValidators';
import { MatChipsModule } from '@angular/material/chips';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonsMenuComponent } from '../../buttons-menu/buttons-menu.component';
import { BreakpointObserver } from '@angular/cdk/layout';
import { BREAKPOINTS } from '../../layout/breakpoints';
import { MatRadioModule } from '@angular/material/radio';
import { LocalStorageService } from '../../services/local-storage.service';
import { DoiStatusComponent } from '../../shared/doi-status/doi-status.component';

/**
 * Represents the form used for submitting or editing a review, capturing all necessary review details.
 *
 * @property {FormControl<string>} comments - FormControl to handle the input of review comments.
 * @property {FormControl<ReviewDecision>} decision - FormControl to handle the selection of the review decision, e.g., accepted, rejected.
 * @property {FormControl<string>} showIdentity - FormControl to handle the visibility of the reviewer's identity based on defined enums.
 * @property {FormControl<string>} showReview - FormControl to handle the visibility of the review content based on defined enums.
 * @property {FormControl<string>} doi - FormControl for handling the DOI (Digital Object Identifier) associated with the review or related content.
 */
interface ReviewForm {
  comments: FormControl<string>;
  decision: FormControl<ReviewDecision>;
  showIdentity: FormControl<string>;
  showReview: FormControl<string>;
  doi: FormControl<string>;
}

/**
 * Enum for defining visibility settings for the review content.
 * Specifies who can see the review.
 */
export enum showReviewEnum {
  everyone = 'true:true',
  author = 'false:true',
  NoOne = 'false:false',
}

/**
 * Enum for defining visibility settings for the reviewer's identity.
 * Specifies who can see the reviewer's identity.
 */
export enum showReviewIdentityEnum {
  everyone = 'true:true',
  author = 'false:true',
  NoOne = 'false:false',
}

/**
 * Component for creating or editing reviews.
 * This component is responsible for handling the UI and functionality to create or edit a review within the platform.
 * It integrates with various services to fetch, display, and update review data, as well as handling community and deposit data.
 */
@Component({
  selector: 'app-reviews-create',
  standalone: true,
  templateUrl: './reviews-create.component.html',
  styleUrls: ['./reviews-create.component.scss'],
  imports: [
    AccessDeniedComponent,
    InfoToolbarComponent,
    DescriptionLineComponent,
    MatButtonModule,
    ReactiveFormsModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    TitleCasePipe,
    FileuploadComponent,
    NgClass,
    KeyValuePipe,
    MatTooltipModule,
    OverlayLoadingDirective,
    AlertComponent,
    FileCardComponent,
    MatIconModule,
    RouterLink,
    MatSlideToggleModule,
    JsonPipe,
    MatChipsModule,
    ButtonsMenuComponent,
    MatRadioModule,
    FormsModule,
    DoiStatusComponent,
  ],
})
export class ReviewsCreateComponent implements OnInit, OnExit {
  /**  Contains the community information related to the review, a populated community DTO or private community DTO. */
  community!: CommunityPopulatedDTO | CommunityPrivateDTO;

  /** The review data, if available; used in edit mode. */
  review?: ReviewPopulatedDTO;

  /** The deposit data associated with the review. */
  deposit?: DepositDTO;

  /** User profile information. */
  profile?: UserPrivateDTO;

  /**
   * Cached form data for the review to enable undo changes or compare changes.
   */
  cachedReviewForm!: {
    comments: string;
    decision: ReviewDecision;
    showIdentity: string;
    showReview: string;
    doi: string;
  };

  /** Environment settings for the component. */
  environment = environment;

  /** Reference used to destroy subscriptions on component destruction. */
  private destroyRef = inject(DestroyRef);

  /**
   * FormGroup for handling review data inputs.
   */
  reviewForm = this.formBuilder.nonNullable.group<ReviewForm>({
    comments: new FormControl<string>('', { nonNullable: true }),
    decision: new FormControl(ReviewDecision.Accepted, {
      nonNullable: true,
      validators: Validators.required,
    }),
    doi: new FormControl<string>('', {
      nonNullable: true,
      validators: validateDOI,
    }),
    showIdentity: new FormControl('false:false', { nonNullable: true }),
    showReview: new FormControl('false:false', { nonNullable: true }),
  });

  /** Enum mapping for showing review based on settings. */
  showReviewEnum = showReviewEnum;

  /** Enum mapping for showing review identity based on settings. */
  showReviewIdentityEnum = showReviewIdentityEnum;

  /** List of decision values for the review. */
  reviewDecisionLov = REVIEWDECISION_LOV;

  /** Status of the review from enum. */
  ReviewStatus = ReviewStatus;

  /** Flag indicating if ownership is being saved. */
  saveOwnershipFlag = false;

  /** Flag for file expansion in the UI. */
  fileExpanded = true;

  /** Accepted file types for uploads. */
  ACCEPT_TYPES = ACCEPT_TYPES;

  /** Maximum file size constants. */
  MAX_FILE_SIZE = MAX_FILE_SIZE;

  /** Indicates if the current device is mobile for responsive purposes. */
  isMobile = false;

  /** Loading indicator for review information. */
  loadingReview = true;

  /** Optional fields display flag, fetched from local storage. */
  showOptionalFields: boolean | undefined;

  /**
   * Actions available on the review based on permissions.
   */
  reviewActions: IReviewActions = {
    edit: false,
    delete: false,
    update: false,
    moderate: false,
    read: false,
    createComment: false,
  };

  /** List of deposit versions associated with the review. */
  depositVersions: DepositPopulatedDTO[] = [];

  /** The latest version of the deposit. */
  latestVersion?: DepositPopulatedDTO;

  /** Text metadata for the DOI. */
  doiMetadataText = '';

  /** JSON metadata for the DOI. */
  doiMetadataJson: unknown = {};

  /** Template reference for DOI metadata in text format. */
  @ViewChild('doiMetadataTextTemplate') doiMetadataTextTemplate!: TemplateRef<unknown>;

  /** Template reference for DOI metadata in JSON format. */
  @ViewChild('doiMetadataJSONTemplate') doiMetadataJSONTemplate!: TemplateRef<unknown>;

  /**
   * Constructs the ReviewsCreateComponent, initializing essential services and settings.
   *
   * @param profileService {ProfileService} Service for user profile operations.
   * @param blockchainService {BlockchainService} Service handling blockchain interactions.
   * @param route {ActivatedRoute} Service related to route information.
   * @param spinnerService {SpinnerService} Service for displaying loading spinners.
   * @param snackBar {AppSnackBarService} Service for displaying snack bar notifications.
   * @param ethereumService {EthereumService} Service handling Ethereum blockchain interactions.
   * @param router {Router} Service for routing operations.
   * @param titleService {Title} Service for setting the title of the document.
   * @param formBuilder {FormBuilder} Service for creating form groups and controls.
   * @param logger {NGXLogger} Service for logging purposes.
   * @param reviewService {ReviewService} Service for review-specific operations.
   * @param dialogService {DialogService} Service for handling dialog operations.
   * @param apiService {DefaultService} API service for backend interactions.
   * @param breakpointObserver {BreakpointObserver} Service for responsive design based on breakpoints.
   * @param storageService {LocalStorageService} Service for interacting with local storage.
   */
  constructor(
    private profileService: ProfileService,
    public blockchainService: BlockchainService,
    private route: ActivatedRoute,
    private spinnerService: SpinnerService,
    private snackBar: AppSnackBarService,
    public ethereumService: EthereumService,
    private router: Router,
    private titleService: Title,
    private formBuilder: FormBuilder,
    private logger: NGXLogger,
    private reviewService: ReviewService,
    private dialogService: DialogService,
    private apiService: DefaultService,
    public breakpointObserver: BreakpointObserver,
    private storageService: LocalStorageService
  ) {}

  /**
   * Initializes the component by setting the initial state and subscribing to necessary data streams.
   * It loads the review data based on the ID from the route, checks mobile responsiveness, and sets up the form and related metadata.
   */
  ngOnInit(): void {
    this.breakpointObserver.observe(BREAKPOINTS.MOBILE).subscribe(result => {
      this.isMobile = result.matches;
    });
    this.route.paramMap
      .pipe(
        map(params => params.get('reviewId')),
        isNotNullOrUndefined(),
        concatMap(reviewId =>
          this.apiService.getReview({ id: reviewId }).pipe(
            finalize(() => {
              this.loadingReview = false;
            })
          )
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(review => {
        this.review = review;
        this.deposit = this.review.depositPopulated;

        this.apiService.getDepositVersions({ id: this.deposit._id }).subscribe(deposits => {
          this.depositVersions = deposits;
          this.latestVersion = this.getVersion(deposits);
        });
        this.apiService
          .getCommunity({ id: this.review.communityPopulated._id })
          .subscribe(community => {
            this.community = community;
          });

        const profile = this.profileService.profile.getValue();

        assertIsDefined(profile, 'Profile is undefined');
        this.profile = profile;

        this.refreshPeerReview(this.review);

        this.showOptionalFields =
          this.storageService.read(LOCALSTORAGE_SHOWOPTIONALFIELDS) === 'true';

        if (!this.reviewActions.edit) {
          this.reviewForm.disable();
        }
      });
  }

  /**
   * Handles the action to be taken when attempting to navigate away from the component.
   * This method checks if there are unsaved changes and prompts the user to confirm their exit, potentially losing these changes.
   *
   * @returns {Observable<boolean> | boolean} Returns an Observable (boolean) if the user confirmed the exit, or a boolean if no unsaved changes.
   */
  onExit(): Observable<boolean> | boolean {
    if (!this.reviewForm.dirty) {
      return true;
    }
    const dialog = this.dialogService
      .openConfirm({
        title: 'Exit Review',
        content: 'Are you sure you want to exit? You have unsaved changes that will be lost.',
        cancelMessage: 'Cancel',
        acceptMessage: 'Ok',
      })
      .afterClosed()
      .pipe(map(value => !!value));

    return dialog;
  }

  /**
   * Saves the modifications made to the review, if any. This method calculates the changes, updates the review data,
   * and notifies the user of the outcome.
   */
  save(): void {
    assertIsDefined(this.review, 'review is not defined');
    const delta = getDelta(this.reviewForm.getRawValue(), this.cachedReviewForm);
    const { showReview, showIdentity, ...deltaSin } = delta;

    const updateReview: UpdateReviewDTO = deltaSin;

    if (showReview) {
      updateReview.showReviewToEveryone = showReview.split(':')[0] === 'true';
      updateReview.showReviewToAuthor = showReview.split(':')[1] === 'true';
    }

    if (showIdentity) {
      updateReview.showIdentityToEveryone = showIdentity.split(':')[0] === 'true';
      updateReview.showIdentityToAuthor = showIdentity.split(':')[1] === 'true';
    }

    this.review = Object.assign(this.review, this.reviewForm.value);
    this.spinnerService.show();
    assertIsDefined(this.profile);
    this.apiService
      .updateReview({
        id: this.review._id,
        updateReviewDTO: updateReview,
      })
      .pipe(
        finalize(() => {
          this.spinnerService.hide();
        })
      )
      .subscribe(response => {
        this.refreshPeerReview(response);
        this.reviewForm.markAsPristine();
        this.snackBar.info('Saved! Press submit when you finish');
      });
  }

  /**
   * Submits the review for final processing. This action is only available if the review is complete and valid.
   */
  submitReview(): void {
    if (this.canPublish()) {
      this.dialogService
        .openConfirm({
          title: 'Submit review',
          content: 'Are you sure you want to submit this review?',
          cancelMessage: 'Cancel',
        })
        .afterClosed()
        .pipe(isNotNullOrUndefined())
        .subscribe(accept => {
          if (accept) {
            assertIsDefined(this.review, 'review is not defined');
            this.apiService
              .submitReview({
                id: this.review._id,
              })
              .subscribe(response => {
                this.refreshPeerReview(response);
                this.snackBar.info('Peer Review submitted');
                void this.router.navigateByUrl('reviews/submitted', {
                  state: { review: this.review },
                });
              });
          }
        });
    }
  }

  /**
   * Checks if the current state of the review is valid for submission.
   *
   * @returns {boolean} True if the review can be submitted, otherwise false.
   */
  canPublish(): boolean {
    assertIsDefined(this.review, 'review is not defined');
    if (!this.review.file) {
      this.fileExpanded = true;
      this.snackBar.error('Review report file is missing');
      return false;
    }
    if (!this.reviewForm.pristine) {
      this.snackBar.error('Save all your changes first');
      return false;
    }

    return this.reviewForm.valid;
  }

  /**
   * Initiates the process to delete the review after confirming with the user.
   */
  deleteReview(): void {
    this.dialogService
      .openConfirm({
        title: 'Delete review',
        content: 'Are you sure you want to delete this review?',
        cancelMessage: 'Cancel',
        acceptMessage: 'Delete',
      })
      .afterClosed()
      .pipe(isNotNullOrUndefined())
      .subscribe(accept => {
        if (accept) {
          this.spinnerService.show();
          assertIsDefined(this.review, 'review is not defined');

          this.apiService
            .deleteReview({ id: this.review._id })
            .pipe(
              finalize(() => {
                this.spinnerService.hide();
              })
            )
            .subscribe(response => {
              this.snackBar.info('Review deleted');
              assertIsDefined(this.deposit, 'deposit is not defined');
              void this.router.navigate(['/deposits/' + this.deposit._id + '/view']);
            });
        }
      });
  }
  /**
   * Verifies the existence of an Ethereum provider and the necessary file for hashing.
   * It performs the proof of ownership for the review by hashing the file and verifying it on the blockchain.
   */
  async proofOwnership(): Promise<void> {
    if (!this.ethereumService.isReady()) {
      this.snackBar.error('No Ethereum provider detected, check if blockchain is activated');
      return;
    }
    assertIsDefined(this.review, 'review is not defined');
    if (!this.review.file?.url) {
      this.snackBar.error('Upload a file first');
      return;
    }

    // Calculate hash
    const responseFile = await fetch(this.review.file.url);
    const arrayBuffer = await responseFile.arrayBuffer();
    const fileHash = this.ethereumService.hashFile(arrayBuffer);

    if (!fileHash) {
      this.snackBar.error('Incorrect peer review hash');
      return;
    }

    this.ethereumService.publicationProofOwnership(fileHash).subscribe(transaction => {
      this.logger.debug('Transaction', transaction);
      this.saveOwnershipFlag = true;

      assertIsDefined(this.review, 'review is not defined');

      if (!this.review.transactions) {
        this.review.transactions = {};
      }

      if (this.ethereumService.currentNetwork.value) {
        const blockchainNetwork = this.ethereumService.currentNetwork.value.name;
        const update: Partial<UpdateReviewDTO> = {};
        update.transactions = {};
        update.transactions[blockchainNetwork] = transaction;
        update.keccak256 = fileHash;
        this.apiService
          .updateReview({ id: this.review._id, updateReviewDTO: update })
          .subscribe(response => {
            this.refreshPeerReview(response);
            this.reviewForm.markAsPristine();
            this.snackBar.info('Review saved');
            this.logger.debug('Review saved');
          });
      }

      void transaction.wait().then(receipt => {
        this.logger.debug('Receipt', receipt);
        const update: Partial<UpdateReviewDTO> = {};
        update.transactions = {};

        this.saveOwnershipFlag = false;
        if (!this.review?.transactions) {
          update.transactions = {};
        }

        if (this.ethereumService.currentNetwork.value) {
          const blockchainNetwork = this.ethereumService.currentNetwork.value.name;
          update.transactions[blockchainNetwork] = receipt;
        }
        assertIsDefined(this.review, 'review is not defined');
        this.apiService
          .updateReview({ id: this.review._id, updateReviewDTO: update })
          .subscribe(response => {
            this.refreshPeerReview(response);
            this.reviewForm.markAsPristine();
            this.snackBar.info('Review saved');
            this.logger.debug('Review saved');
          });
      });
    });
  }

  /**
   * Handles file upload events, confirming the upload and updating the review details based on the file's metadata.
   *
   * @param $event - Contains information about the file upload event including the original event, the files uploaded, ect.
   */
  async filesUploaded($event: {
    originalEvent: HttpResponse<unknown>;
    files: File[];
    payload: SignedUrlDTO;
  }): Promise<void> {
    assertIsDefined(this.review, 'review is not defined');
    const updatedPeerReview = await lastValueFrom(
      this.apiService.uploadFileConfirmationReview({
        id: this.review._id,
        uploadFilePayload: {
          fileMetadata: $event.payload.fileMetadata,
          isMainFile: $event.payload.isMainFile,
          replacePDF: false,
        },
      })
    );
    assertIsDefined(updatedPeerReview, 'Review not found');
    this.refreshPeerReview(updatedPeerReview);
    this.snackBar.info('File uploaded');
  }
  /**
   * Verifies that the review form is pristine before allowing a file upload to proceed,
   * ensuring that all changes are saved prior to uploading to prevent data loss.
   *
   * @param $event - The event object related to the file upload initiation.
   * @returns {boolean} - Returns true if the form is pristine and the upload can proceed, otherwise returns false.
   */
  beforeUpload($event: unknown): boolean {
    if (!this.reviewForm.pristine) {
      this.snackBar.error('Save your changes before uploading a file');
      return false;
    }
    return true;
  }

  /**
   * Refreshes the available actions for a review based on its current state and permissions.
   *
   * @param review - The review for which actions are being refreshed.
   */
  refreshActions(review: ReviewPopulatedDTO): void {
    this.reviewActions = this.reviewService.getReviewActions(review);
  }

  /**
   * Refreshes the display and internal state of a peer review, updating UI elements and form controls to match the current review data.
   *
   * @param peerReview - The peer review whose data is used to refresh the UI and form controls.
   */
  refreshPeerReview(peerReview: ReviewPopulatedDTO): void {
    this.titleService.setTitle(`Peer Review by ${peerReview.author}`);
    this.review = peerReview;
    this.refreshActions(peerReview);
    this.reviewForm.reset({
      ...this.review,
      showReview: `${String(this.review.showReviewToEveryone)}:${String(
        this.review.showReviewToAuthor
      )}`,
      showIdentity: `${String(this.review.showIdentityToEveryone)}:${String(
        this.review.showIdentityToAuthor
      )}`,
    });

    this.cachedReviewForm = this.reviewForm.getRawValue();
    if (!this.reviewActions.update) {
      this.reviewForm.disable();
    } else {
      this.reviewForm.enable();
    }
  }

  /**
   * Initiates the deletion of a file associated with a review, confirming the action with the user before proceeding.
   *
   * @param filename - The name of the file to be deleted.
   */
  deleteFile(filename: string): void {
    this.dialogService
      .openConfirm({
        title: 'Delete file',
        content: 'Are you sure you want to delete this file?',
        cancelMessage: 'Cancel',
        acceptMessage: 'Delete',
      })
      .afterClosed()
      .pipe(isNotNullOrUndefined())
      .subscribe(accept => {
        if (accept) {
          this.spinnerService.show();
          assertIsDefined(this.review, 'review not found');
          this.apiService
            .deleteReviewExtraFile({ id: this.review._id, filename: filename })
            .pipe(
              finalize(() => {
                this.spinnerService.hide();
              })
            )
            .subscribe(response => {
              this.snackBar.info('File deleted');
              this.refreshPeerReview(response);
            });
        }
      });
  }

  /**
   * Generates a signed URL for file upload and initiates the upload process using the given Fileupload component.
   *
   * @param $event - Contains the file object and form data needed for the upload.
   * @param isMainFile - A boolean indicating whether the file is the main file of the review.
   * @param mainReviewFileUpload - The Fileupload component responsible for the actual file upload.
   */
  async generateSignedUrl(
    $event: { fileObject: File; formData: FormData },
    isMainFile: boolean,
    mainReviewFileUpload: FileuploadComponent
  ): Promise<void> {
    assertIsDefined(this.review);
    const file = {
      name: $event.fileObject.name,
      type: $event.fileObject.type,
      size: $event.fileObject.size,
      lastModified: $event.fileObject.lastModified,
    };
    const signedUrl = await lastValueFrom(
      this.apiService.uploadReviewFile({
        id: this.review._id,
        isMainFile: isMainFile,
        createFileDTO: {
          file: file,
        },
      })
    );
    mainReviewFileUpload.uploadFile(signedUrl, $event.fileObject, $event.formData);
  }

  /**
   * Toggles the display of optional fields in the form based on the user's interaction with a slide toggle.
   *
   * @param $event - The change event from the MatSlideToggle component indicating whether the toggle is checked or not.
   */
  optionalFields($event: MatSlideToggleChange): void {
    if (!$event.source.checked) {
      this.showOptionalFields = false;
      this.storageService.write(LOCALSTORAGE_SHOWOPTIONALFIELDS, 'false');
    } else {
      this.showOptionalFields = true;
      this.storageService.write(LOCALSTORAGE_SHOWOPTIONALFIELDS, 'true');
    }
  }

  /**
   * Previews the DOI registration metadata for a review.
   * It displays the metadata in a custom dialog depending on whether the metadata is in JSON format or plain text.
   */
  previewDOI(): void {
    assertIsDefined(this.review, 'review not found');
    this.apiService.previewDOIRegistrationReview({ id: this.review._id }).subscribe(result => {
      const isJSON = hasJsonStructure(result.data);
      if (isJSON) {
        this.doiMetadataJson = JSON.parse(result.data);
      } else {
        this.doiMetadataText = result.data;
      }
      this.dialogService.openCustom({
        template: isJSON ? this.doiMetadataJSONTemplate : this.doiMetadataTextTemplate,
      });
    });
  }

  /**
   * Registers a DOI for the review and updates the DOI field in the form based on the response from the server.
   */
  registerDOI(): void {
    assertIsDefined(this.review, 'review not found');
    this.apiService.createDoiReview({ id: this.review._id }).subscribe(result => {
      this.doiMetadataText = result.data;
      if (DOI_REGEXP.test(result.data)) {
        this.reviewForm.controls.doi.setValue(result.data);
        this.reviewForm.controls.doi.markAsDirty();
      }
      this.dialogService.openCustom({
        template: this.doiMetadataTextTemplate,
      });
    });
  }

  /**
   * Fetches the registered DOI metadata for the review and displays it in a custom dialog using the JSON template.
   */
  getRegisteredDOIMetadata(): void {
    assertIsDefined(this.review, 'review not found');
    this.apiService.getDoiReview({ id: this.review._id }).subscribe(data => {
      this.doiMetadataJson = data;
      this.dialogService.openCustom({
        template: this.doiMetadataJSONTemplate,
      });
    });
  }

  /**
   * Determines the latest version from a list of deposit versions based on the version number.
   *
   * @param depositVersions - An array of deposit versions.
   * @returns {DepositPopulatedDTO} - The deposit with the highest version number.
   */
  getVersion(depositVersions: DepositPopulatedDTO[]): DepositPopulatedDTO {
    return depositVersions.reduce((deposit1, deposit2) => {
      return deposit1.version > deposit2.version ? deposit1 : deposit2;
    });
  }
}
