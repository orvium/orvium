import {
  Component,
  DestroyRef,
  ElementRef,
  inject,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EthereumService } from '../../blockchain/ethereum.service';
import { environment } from '../../../environments/environment';
import { concatMap, finalize, map, startWith } from 'rxjs/operators';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { lastValueFrom, Observable } from 'rxjs';
import { NGXLogger } from 'ngx-logger';
import { MatAutocomplete, MatAutocompleteModule } from '@angular/material/autocomplete';
import {
  DOI_REGEXP,
  validateDOI,
  validateEmail,
  validateGithubURL,
  validateIsNotBlank,
  validateISSN,
  validateLanguage,
  validateOrcid,
  validateURL,
} from '../../shared/AppCustomValidators';
import { BlockchainService } from '../../blockchain/blockchain.service';
import { DisciplinesService } from '../../services/disciplines.service';
import {
  assertIsDefined,
  extractDOIFromURL,
  getDelta,
  hasJsonStructure,
  isNotNullOrUndefined,
} from '../../shared/shared-functions';
import { HttpResponse } from '@angular/common/http';
import { DepositsService } from '../deposits.service';
import { ProfileService } from '../../profile/profile.service';
import { AppSnackBarService } from '../../services/app-snack-bar.service';
import {
  AccessRight,
  AuthorDTO,
  BibtexReferences,
  CommunityDTO,
  CommunityPrivateDTO,
  CreditType,
  DefaultService,
  DepositPopulatedDTO,
  DepositStatus,
  DisciplineDTO,
  IThenticateSimilarityReportStatusEnum,
  PublicationType,
  Reference,
  ReviewType,
  SignedUrlDTO,
  SimilarityMetadata,
  SimpleSubmissionResponseStatusEnum,
  SubmissionClass,
  SubmissionStatusEnum,
  SubscriptionType,
  UpdateDepositDTO,
  UploadFilePayload,
  UserPrivateDTO,
} from '@orvium/api';
import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import {
  ACCEPT_TYPES,
  FileuploadComponent,
  MAX_FILE_SIZE,
} from '../../shared/fileupload/fileupload.component';
import { OnExit } from '../../shared/guards/exit.guard';
import { InputWithChipsComponent } from '../../shared/input-with-chips/input-with-chips.component';
import { ENTER, SEMICOLON } from '@angular/cdk/keycodes';
import {
  ACCESSRIGHT_LOV,
  CREDITTYPE_LOV,
  DEPOSITSTATUS_LOV,
  LOCALSTORAGE_SHOWOPTIONALFIELDS,
  PUBLICATIONTYPE_LOV,
} from '../../model/orvium';
import { BreakpointObserver } from '@angular/cdk/layout';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AccessDeniedComponent } from '../../shared/access-denied/access-denied.component';
import {
  AsyncPipe,
  JsonPipe,
  KeyValuePipe,
  NgClass,
  NgTemplateOutlet,
  TitleCasePipe,
} from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { InfoToolbarComponent } from '../../shared/info-toolbar/info-toolbar.component';
import { DescriptionLineComponent } from '../../shared/description-line/description-line.component';
import {
  MatChipListbox,
  MatChipOption,
  MatChipSelectionChange,
  MatChipsModule,
} from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TrimDirective } from '../../shared/directives/trim.directive';
import { EditorComponent } from '@tinymce/tinymce-angular';
import { MatCardModule } from '@angular/material/card';
import { AcknowledgementComponent } from '../../shared/acknowledgement/acknowledgement.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SpinnerService } from '../../spinner/spinner.service';
import { OverlayLoadingDirective } from '../../spinner/overlay-loading.directive';
import { AlertComponent } from '../../shared/alert/alert.component';
import { FileCardComponent } from '../../shared/file-card/file-card.component';
import { DialogService } from '../../dialogs/dialog.service';
import { AvatarDirective } from '../../shared/directives/avatar.directive';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { BibtexEditComponent } from '../../shared/bibtex-edit/bibtex-edit.component';
import { BREAKPOINTS } from '../../layout/breakpoints';
import { ButtonsMenuComponent } from '../../buttons-menu/buttons-menu.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatRadioModule } from '@angular/material/radio';
import { LocalStorageService } from '../../services/local-storage.service';
import { TableOfContentsComponent } from '../../shared/table-of-contents/table-of-contents.component';
import { MatToolbarModule } from '@angular/material/toolbar';
import { DoiStatusComponent } from '../../shared/doi-status/doi-status.component';

/**
 * Interface representing the ORCID data structure for an individual, providing structured information about their names and emails.
 *
 * @property {Object} names - Names of the individual, possibly including given names and family name.
 * @property {Array} emails - Collection of email addresses associated with the individual's ORCID account.
 */
export interface OrcidData {
  names?: {
    givenNames?: {
      value: string;
    };
    familyName?: {
      value: string;
    };
  };
  emails?: {
    emails?: [
      {
        value: string;
      },
    ];
  };
}

/**
 * Interface representing form controls for extra metadata associated with a deposit, including publication and institutional details.
 *
 * @property {FormControl<string|null>} conferenceTitle - Title of the conference associated with the deposit.
 * @property {FormControl<string|null>} issn - International Standard Serial Number for periodicals.
 * @property {FormControl<string|null>} isbn - International Standard Book Number.
 * @property {FormControl<number|null>} volume - Volume number of the publication.
 * @property {FormControl<number|null>} issue - Issue number of the publication.
 * @property {FormControl<number|null>} firstpage - The first page of the publication.
 * @property {FormControl<number|null>} lastpage - The last page of the publication.
 * @property {FormControl<string|null>} publisher - The publisher of the work.
 * @property {FormControl<string|null>} journalTitle - The title of the journal where the work is published.
 * @property {FormControl<string|null>} dissertationName - Name of the dissertation.
 * @property {FormControl<string|null>} inbookTitle - Title of the book chapter.
 * @property {FormControl<string|null>} language - The language of the publication.
 * @property {FormControl<string|null>} dissertationInstitution - The institution awarding the degree.
 * @property {FormControl<string|null>} technicalReportInstitution - The institution issuing the technical report.
 * @property {FormControl<string|null>} canonical - The canonical URL of the publication.
 */
interface ExtraMetadataForm {
  conferenceTitle: FormControl<string | null>;
  issn: FormControl<string | null>;
  isbn: FormControl<string | null>;
  volume: FormControl<number | null>;
  issue: FormControl<number | null>;
  firstpage: FormControl<number | null>;
  lastpage: FormControl<number | null>;
  publisher: FormControl<string | null>;
  journalTitle: FormControl<string | null>;
  dissertationName: FormControl<string | null>;
  inbookTitle: FormControl<string | null>;
  language: FormControl<string | null>;
  dissertationInstitution: FormControl<string | null>;
  technicalReportInstitution: FormControl<string | null>;
  canonical: FormControl<string | null>;
}

/**
 * Interface representing form controls for author details within a deposit, capturing contact information, affiliations, and ORCID.
 *
 * @property {FormControl<string>} firstName - The author's first name.
 * @property {FormControl<string>} lastName - The author's last name.
 * @property {FormControl<string>} email - The author's email address.
 * @property {FormControl<string>} orcid - The ORCID identifier for the author.
 * @property {FormControl<CreditType[]>} credit - Roles the author has in the creation of the work.
 * @property {FormControl<number>} index - The order of the author in the author list.
 * @property {FormControl<string[]>} institutions - The institutions affiliated with the author.
 */
interface AuthorForm {
  firstName: FormControl<string>;
  lastName: FormControl<string>;
  email: FormControl<string>;
  orcid: FormControl<string>;
  credit: FormControl<CreditType[]>;
  index: FormControl<number>;
  institutions: FormControl<string[]>;
}

/**
 * Interface representing form controls for a reference, usually part of scholarly articles, including the reference text and associated URL.
 *
 * @property {FormControl<string>} reference - The full textual representation of the reference.
 * @property {FormControl<string>} url - Optional URL for online access to the referenced material.
 * @property {FormControl<number>} index - The order of the reference in the list of references.
 */
interface ReferenceForm {
  reference: FormControl<string>;
  url: FormControl<string>;
  index: FormControl<number>;
}

/**
 * Interface defining the form structure for a scholarly deposit, encompassing all necessary metadata for submission and publication.
 *
 * @property {FormControl<string>} title - The title of the deposit.
 * @property {FormControl<string>} abstract - A brief summary of the deposit.
 * @property {FormControl<AuthorDTO[]>} authors - List of authors involved in the deposit.
 * @property {FormControl<Reference[]>} references - List of references cited in the deposit.
 * @property {FormControl<PublicationType>} publicationType - The type of publication.
 * @property {FormControl<AccessRight|undefined>} accessRight - The access rights associated with the deposit.
 * @property {FormControl<string>} community - The community to which the deposit belongs.
 * @property {FormControl<number|undefined>} newTrackTimestamp - Timestamp for tracking new entries.
 * @property {FormControl<string[]>} keywords - Keywords related to the deposit.
 * @property {FormControl<string>} doi - The Digital Object Identifier for the deposit.
 * @property {FormControl<ReviewType>} reviewType - The type of review applicable to the deposit.
 * @property {FormControl<string[]>} disciplines - The academic disciplines relevant to the deposit.
 * @property {FormControl<boolean>} canBeReviewed - Whether the deposit can be reviewed.
 * @property {FormControl<string>} gitRepository - Link to the associated Git repository, if any.
 * @property {FormControl<string>} html - HTML content of the deposit.
 * @property {FormControl<DepositStatus>} status - The current status of the deposit.
 * @property {FormGroup<ExtraMetadataForm>} extraMetadata - Additional metadata related to the deposit.
 * @property {FormControl<boolean>} canAuthorInviteReviewers - Whether the author can invite reviewers.
 * @property {FormControl<BibtexReferences[]>} bibtexReferences - Bibtex formatted references associated with the deposit.
 */
interface DepositForm {
  title: FormControl<string>;
  abstract: FormControl<string>;
  authors: FormControl<AuthorDTO[]>;
  references: FormControl<Reference[]>;
  publicationType: FormControl<PublicationType>;
  accessRight: FormControl<AccessRight | undefined>;
  community: FormControl<string>;
  newTrackTimestamp: FormControl<number | undefined>;
  keywords: FormControl<string[]>;
  doi: FormControl<string>;
  reviewType: FormControl<ReviewType>;
  disciplines: FormControl<string[]>;
  canBeReviewed: FormControl<boolean>;
  gitRepository: FormControl<string>;
  html: FormControl<string>;
  status: FormControl<DepositStatus>;
  extraMetadata: FormGroup<ExtraMetadataForm>;
  canAuthorInviteReviewers: FormControl<boolean>;
  bibtexReferences: FormControl<BibtexReferences[]>;
}

/**
 * Component responsible for displaying detailed information about a specific deposit. It supports editing, validating,
 * and updating deposit details including metadata and ORV token management within a scholarly communication platform.
 */
@Component({
  selector: 'app-deposits-details',
  standalone: true,
  templateUrl: './deposit-details.component.html',
  styleUrls: ['./deposit-details.component.scss'],
  imports: [
    AccessDeniedComponent,
    MatMenuModule,
    NgTemplateOutlet,
    MatButtonModule,
    RouterLink,
    MatIconModule,
    InfoToolbarComponent,
    DescriptionLineComponent,
    MatChipsModule,
    TitleCasePipe,
    ReactiveFormsModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatSelectModule,
    InputWithChipsComponent,
    MatInputModule,
    MatAutocompleteModule,
    AsyncPipe,
    JsonPipe,
    CdkDropList,
    CdkDrag,
    FontAwesomeModule,
    FileuploadComponent,
    TrimDirective,
    EditorComponent,
    NgClass,
    MatCardModule,
    KeyValuePipe,
    AcknowledgementComponent,
    MatTooltipModule,
    OverlayLoadingDirective,
    AlertComponent,
    FileCardComponent,
    AvatarDirective,
    MatSlideToggleModule,
    BibtexEditComponent,
    ButtonsMenuComponent,
    MatRadioModule,
    FormsModule,
    TableOfContentsComponent,
    MatToolbarModule,
    DoiStatusComponent,
  ],
})
export class DepositDetailsComponent implements OnInit, OnExit {
  /**
   * Template reference for various dialog templates used within the component.
   */
  @ViewChild('inputComponent', { read: InputWithChipsComponent })
  inputComponent?: InputWithChipsComponent;
  @ViewChild('autoCompleteDisciplines', { read: MatAutocomplete })
  matAutocomplete?: MatAutocomplete;
  @ViewChild('acknowledgementDialogTemplate') acknowledgementDialogTemplate!: TemplateRef<unknown>;
  @ViewChild('approveORVtokensDialogTemplate')
  approveORVtokensDialogTemplate!: TemplateRef<unknown>;
  @ViewChild('depositORVtokensDialogTemplate')
  depositORVtokensDialogTemplate!: TemplateRef<unknown>;
  @ViewChild('ithenticateEULATemplate') ithenticateEULATemplate!: TemplateRef<unknown>;
  @ViewChild('doiMetadataTextTemplate') doiMetadataTextTemplate!: TemplateRef<unknown>;
  @ViewChild('doiMetadataJSONTemplate') doiMetadataJSONTemplate!: TemplateRef<unknown>;
  @ViewChild('toc') tableOfContents?: TableOfContentsComponent;
  @ViewChild('component') set taElement(element: ElementRef<HTMLElement> | undefined) {
    if (this.tableOfContents && element) {
      this.tableOfContents.addHeaders('Deposit Details', element.nativeElement);
    }
  }

  /** Deposit object for which details are being displayed. This object includes populated data necessary for detailed views. */
  deposit?: DepositPopulatedDTO;

  /** Profile of the currently logged-in user. */
  profile?: UserPrivateDTO;

  /** cached form data for the deposit, used to manage form state and changes. */
  cachedDepositForm!: UpdateDepositDTO;

  /** List of available publication types. */
  PUBLICATION_TYPE_LOV = PUBLICATIONTYPE_LOV;

  /** List of available access rights. */
  availableAccessRights = ACCESSRIGHT_LOV;

  /**  List of available credit types for authors. */
  CREDIT_LOV = CREDITTYPE_LOV;

  /**  List of possible deposit statuses. */
  DEPOSIT_STATUS_LOV = DEPOSITSTATUS_LOV;

  /** Enumeration for submission status, draft,published, accepted, ect */
  SubmissionStatusEnum = SubmissionStatusEnum;

  /** Injectable reference for destroying subscriptions and avoiding memory leaks. */
  private destroyRef = inject(DestroyRef);

  /**  The current environment settings, based on the .env file */
  environment = environment;

  /** Observable for filtered disciplines based on user input. */
  filteredDisciplines$?: Observable<DisciplineDTO[]>;

  /** Form control for managing the disciplines input field. */
  disciplinesControl = new FormControl('');

  /** Current balance of ORV tokens. Blockchain functionality */
  balanceTokens = '0';

  /** Current allowance of ORV tokens.  Blockchain functionality  */
  allowanceTokens = '0';

  /**
   * Form group for handling extra metadata related to the deposit.
   */
  extraMetadataForm = this.formBuilder.nonNullable.group<ExtraMetadataForm>({
    conferenceTitle: new FormControl<string>('', { nonNullable: true }),
    issn: new FormControl<string>('', {
      nonNullable: true,
      validators: validateISSN,
    }),
    isbn: new FormControl<string>('', { nonNullable: true }),
    volume: new FormControl<number | null>(null, {
      nonNullable: true,
      validators: Validators.min(0),
    }),
    issue: new FormControl<number | null>(null, {
      nonNullable: true,
      validators: Validators.min(0),
    }),
    firstpage: new FormControl<number | null>(null, {
      nonNullable: true,
      validators: Validators.min(0),
    }),
    lastpage: new FormControl<number | null>(null, {
      nonNullable: true,
      validators: Validators.min(0),
    }),
    publisher: new FormControl<string>('', { nonNullable: true }),
    journalTitle: new FormControl<string>('', { nonNullable: true }),
    dissertationName: new FormControl<string>('', { nonNullable: true }),
    inbookTitle: new FormControl<string>('', { nonNullable: true }),
    canonical: new FormControl<string>('', {
      nonNullable: true,
      validators: validateURL,
    }),
    language: new FormControl<string>('', {
      nonNullable: true,
      validators: validateLanguage,
    }),
    dissertationInstitution: new FormControl<string>('', { nonNullable: true }),
    technicalReportInstitution: new FormControl<string>('', { nonNullable: true }),
  });

  /**
   * Form group for handling information related to the deposit.
   */
  depositForm = this.formBuilder.nonNullable.group<DepositForm>({
    title: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, validateIsNotBlank],
    }),
    abstract: new FormControl<string>('', { nonNullable: true }),
    authors: new FormControl<AuthorDTO[]>([], { nonNullable: true }),
    references: new FormControl<Reference[]>([], { nonNullable: true }),
    publicationType: new FormControl<PublicationType>(PublicationType.Article, {
      nonNullable: true,
    }),
    accessRight: new FormControl<AccessRight>(AccessRight.CcBy, { nonNullable: true }),
    community: new FormControl<string>({ value: '', disabled: true }, { nonNullable: true }),
    newTrackTimestamp: new FormControl<number | undefined>(undefined, { nonNullable: true }),
    keywords: new FormControl<string[]>([], { nonNullable: true }),
    doi: new FormControl<string>('', {
      nonNullable: true,
      validators: validateDOI,
    }),
    reviewType: new FormControl<ReviewType>(ReviewType.OpenReview, { nonNullable: true }),
    disciplines: new FormControl<string[]>([], { nonNullable: true }),
    canBeReviewed: new FormControl<boolean>(true, { nonNullable: true }),
    gitRepository: new FormControl<string>('', {
      nonNullable: true,
      validators: validateGithubURL,
    }),
    html: new FormControl<string>('', { nonNullable: true }),
    status: new FormControl<DepositStatus>(DepositStatus.Draft, { nonNullable: true }),
    extraMetadata: this.extraMetadataForm,
    canAuthorInviteReviewers: new FormControl<boolean>(false, { nonNullable: true }),
    bibtexReferences: new FormControl<BibtexReferences[]>([], { nonNullable: true }),
  });

  /**
   * Form group for handling information related authors.
   */
  authorsForm = this.formBuilder.nonNullable.group<AuthorForm>({
    firstName: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, validateIsNotBlank],
    }),
    lastName: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, validateIsNotBlank],
    }),
    email: new FormControl<string>('', {
      nonNullable: true,
      validators: validateEmail,
    }),
    orcid: new FormControl<string>('', {
      nonNullable: true,
      validators: validateOrcid,
    }),
    credit: new FormControl<CreditType[]>([], { nonNullable: true }),
    index: new FormControl<number>(-1, { nonNullable: true }),
    institutions: new FormControl<string[]>([], { nonNullable: true }),
  });

  /**
   * Form group for handling information related references of the submission.
   */
  referencesForm = this.formBuilder.nonNullable.group<ReferenceForm>({
    reference: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, validateIsNotBlank],
    }),
    url: new FormControl<string>('', {
      nonNullable: true,
      validators: validateURL,
    }),
    index: new FormControl<number>(-1, { nonNullable: true }),
  });

  /** Form control for the number of tokens to approve. Blockchain functionality. */
  numberApproveTokensControl = new FormControl('', [
    Validators.required,
    Validators.min(1),
    Validators.max(100),
  ]);

  /** Form control for the number of tokens to deposit. Blockchain functionality. */
  numberDepositTokensControl = new FormControl('', [
    Validators.required,
    Validators.min(1),
    Validators.max(100),
  ]);

  /** Enum for deposit statuses. */
  DepositStatus = DepositStatus;

  /** Enum for review types. */
  ReviewType = ReviewType;

  /** Accepted file types for deposits */
  ACCEPT_TYPES = ACCEPT_TYPES;

  /** Maximum file size for uploads, defaulting to 20 MB. */
  defaultMaxFileSize = MAX_FILE_SIZE.TWENTY_MB;

  /**  Flag indicating whether deposit tokens are being managed. Blockchain functionality */
  depositTokensFlag = false;

  /**  Flag indicating whether deposit tokens are being unlock. Blockchain functionality */
  unlockTokensFlag = false;

  /** Separators for institution input fields. */
  institutionSeparators = [ENTER, SEMICOLON];

  /** Flag indicating whether to save ownership information. */
  saveOwnershipFlag = false;

  /**
   * Permissions and actions related to the deposit. All default values to false
   */
  canUpdateDeposit = false;
  canManageDeposit = false;
  canDeleteDeposit = false;
  canModerateDeposit = false;

  /**
   * File extension management.
   */
  isPreferredFileExtension = true;
  showOptionalFields = false;
  uploadedExtension?: string;

  /** Selected community for the deposit as a DTO */
  selectedCommunity?: CommunityDTO;

  /** Metadata for DOI in text format. */
  doiMetadataText = '';

  /** Metadata for DOI in JSON format. */
  doiMetadataJson: unknown = {};

  /**
   * Flags and state management for UI elements.
   */
  showAuthorEdit = false;
  showReferenceEdit = false;
  journalExpanded = false;
  detailsExpanded = true;
  authorsExpanded = true;
  fileExpanded = true;
  isMobile = false;
  loadingDeposit = true;

  /**
   * iThenticate integration and related state management.
   */
  iThenticateActive = false;
  iThenticateEULAAccepted = false;
  iThenticateEULA_URL: SafeResourceUrl = '';
  iThenticateSubmission?: SubmissionClass;
  iThenticateReport?: SimilarityMetadata;
  iThenticateWrongFile = false;

  /** List of disciplines associated to the deposit */
  private disciplines: DisciplineDTO[] = [];

  /** Message to update to the last version of the application used to be shown to the user */
  public messageUseLastVersion = `Remember to download the latest version of your article from the previous version when you create a revision. 
  Editors might have added changes to your file. 
  Discontinuation of these changes might be a reason for rejection.`;

  /** File extensions allowed also for ithenticates services */
  public fileExtensionsAllowed = ACCEPT_TYPES.PUBLICATIONS_EXTENSIONS_ALLOWED.toString();
  ITHENTICATE_EXTENSIONS_ALLOWED = '.docx, .doc, .xml, .pdf, .tex, .html, .rtf, .wpd, .odt';

  /** Private data for the community as a DTO */
  public privateCommunity?: CommunityPrivateDTO;

  /** flag related wiht ORCID status */
  public orcidLoading = false;

  /**
   * Initializes dependencies and services used in the component.
   *
   * @param {DefaultService} apiService - Service for API interactions.
   * @param {ProfileService} profileService - Service for user profile operations.
   * @param {BlockchainService} blockchainService - Service for blockchain-related operations.
   * @param {ActivatedRoute} route - Active route to fetch route parameters.
   * @param {Router} router - Router service for navigation.
   * @param {EthereumService} ethereumService - Service for Ethereum blockchain interactions.
   * @param {AppSnackBarService} snackBar - Service for displaying snack bar notifications.
   * @param {SpinnerService} spinnerService - Service for displaying loading spinners.
   * @param {NGXLogger} logger - Logger service for debugging and logging.
   * @param {FormBuilder} formBuilder - Service for creating form groups and controls.
   * @param {DisciplinesService} disciplinesService - Service for fetching discipline data.
   * @param {DepositsService} depositService - Service for managing deposit operations.
   * @param {DialogService} dialogService - Service for opening dialog windows.
   * @param {BreakpointObserver} breakpointObserver - Service for reacting to media query changes.
   * @param {DomSanitizer} domSanitizer - Service for sanitizing resources.
   * @param {LocalStorageService} storageService - Service for interacting with local storage.
   */
  constructor(
    private apiService: DefaultService,
    private profileService: ProfileService,
    public blockchainService: BlockchainService,
    private route: ActivatedRoute,
    private router: Router,
    public ethereumService: EthereumService,
    private snackBar: AppSnackBarService,
    private spinnerService: SpinnerService,
    private logger: NGXLogger,
    private formBuilder: FormBuilder,
    private disciplinesService: DisciplinesService,
    private depositService: DepositsService,
    public dialogService: DialogService,
    public breakpointObserver: BreakpointObserver,
    private domSanitizer: DomSanitizer,
    private storageService: LocalStorageService
  ) {}

  /**
   * Initializes the component by setting up observers for responsive layouts and fetching the deposit details from the API.
   * It also loads community details, initializes form controls, and sets up various conditions based on the deposit data.
   */
  ngOnInit(): void {
    this.breakpointObserver.observe(BREAKPOINTS.MOBILE).subscribe(result => {
      this.isMobile = result.matches;
    });
    this.route.paramMap
      .pipe(
        map(params => params.get('depositId')),
        isNotNullOrUndefined(),
        concatMap(depositId =>
          this.apiService.getDeposit({ id: depositId }).pipe(
            finalize(() => {
              this.loadingDeposit = false;
            })
          )
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(deposit => {
        this.refreshDeposit(deposit);
        this.showOptionalFields =
          this.storageService.read(LOCALSTORAGE_SHOWOPTIONALFIELDS) === 'true';
        assertIsDefined(this.deposit, 'deposit not defined');

        this.apiService
          .getCommunity({ id: this.deposit.communityPopulated._id })
          .subscribe(community => {
            // This check is made to narrow type to CommunityPrivateDTO
            if ('isPrivateDTO' in community) {
              this.privateCommunity = community;
            }
          });
        this.defaultMaxFileSize =
          this.deposit.communityPopulated.subscription === SubscriptionType.Premium
            ? MAX_FILE_SIZE.GB_10
            : MAX_FILE_SIZE.TWENTY_MB;
        // Set initial community to current deposit one
        this.selectedCommunity = this.deposit.communityPopulated;
        this.availableAccessRights = ACCESSRIGHT_LOV.filter(lov =>
          this.selectedCommunity?.customLicenses.includes(lov.value)
        );
        this.profile = this.profileService.profile.getValue();
        this.disciplinesService.getDisciplines().subscribe(disciplines => {
          this.disciplines = disciplines;

          this.filteredDisciplines$ = this.disciplinesControl.valueChanges.pipe(
            startWith(null),
            map(discipline => this.filterDisciplines(discipline))
          );
        });

        this.depositForm.controls.status.valueChanges.subscribe(selectedValue => {
          assertIsDefined(this.deposit, 'deposit not found');
          if (selectedValue === this.deposit.status) {
            this.depositForm.controls.status.markAsPristine();
          }
        });
        extractDOIFromURL(this.depositForm.controls.doi);
        if (this.canModerateDeposit && this.deposit.iThenticate) {
          this.apiService
            .getIThenticateStatus({ communityId: this.deposit.communityPopulated._id })
            .subscribe(response => {
              this.iThenticateActive = response.active;

              if (this.iThenticateActive) {
                this.iThenticateActive = true;
                assertIsDefined(this.deposit, 'deposit not found');
                this.apiService
                  .getIThenticateEULAAcceptance({
                    communityId: this.deposit.communityPopulated._id,
                  })
                  .subscribe(acceptance => {
                    if (acceptance.length > 0) {
                      this.iThenticateEULAAccepted = true;
                    }
                  });

                if (this.deposit.iThenticate?.submissionId) {
                  this.checkSubmissionStatus();
                }

                if (this.deposit.iThenticate?.similarityReportStatus) {
                  this.checkReportStatus();
                }

                if (this.deposit.publicationFile) {
                  this.iThenticateWrongFile = this.isWrongIThenticateExtension();
                }
              }
            });
        }
      });
  }

  /**
   * Handles the component's onExit functionality to warn the user about unsaved changes before navigating away.
   *
   * @returns {Observable<boolean> | boolean} - Observable resolving to a boolean value indicating if navigation can proceed.
   */
  onExit(): Observable<boolean> | boolean {
    if (!this.depositForm.dirty) {
      return true;
    }
    const dialog = this.dialogService
      .openConfirm({
        title: 'Exit publication',
        content: 'Are you sure you want to exit? You have unsaved changes that will be lost.',
        cancelMessage: 'Cancel',
        acceptMessage: 'Ok',
      })
      .afterClosed()
      .pipe(map(value => !!value));

    return dialog;
  }

  /**
   * Triggers whenever an input value changes, updating the corresponding form control.
   *
   * @param {string} value - The new value for the control.
   */
  onInputValueChange(value: string): void {
    this.disciplinesControl.setValue(value);
  }

  /**
   * Refreshes the action permissions based on the provided deposit.
   *
   * @param {DepositPopulatedDTO} deposit - The deposit for which to refresh actions.
   */
  refreshActions(deposit: DepositPopulatedDTO): void {
    this.canManageDeposit = this.depositService.canEditDeposit(deposit);
    this.canUpdateDeposit = this.depositService.canUpdateDeposit(deposit);
    this.canDeleteDeposit = this.depositService.canDeleteDeposit(deposit);
    this.canModerateDeposit = this.depositService.canModerateDeposit(deposit);
  }

  /**
   * Validates the selected licenses against the available access rights and adjusts the form control accordingly.
   */
  validateLicenses(): void {
    if (!this.availableAccessRights.find(option => option.value === this.deposit?.accessRight)) {
      this.depositForm.controls.accessRight.setValue(undefined);
      this.depositForm.controls.accessRight.markAsTouched();
    }
  }

  /**
   * Refreshes the component's state with the provided deposit data.
   * Updates the form and checks the file extensions based on the deposit's community settings.
   * It also handles enabling or disabling form fields based on user permissions.
   *
   * @param {DepositPopulatedDTO} deposit - The deposit data used to refresh the component state.
   */
  refreshDeposit(deposit: DepositPopulatedDTO): void {
    this.deposit = deposit;
    this.refreshActions(deposit);

    this.depositForm.reset({
      ...this.deposit,
      ...{ community: deposit.communityPopulated._id },
    });
    this.depositForm.markAsPristine();
    // TODO check why keywords and disciplines get dirty after form has been reset
    // for (const [key, control] of Object.entries(this.depositForm.controls)) {
    //   if (control.dirty) {
    //     console.log(key, control);
    //   }
    // }

    if (
      this.deposit.communityPopulated.preferredFileExtensions &&
      this.deposit.communityPopulated.preferredFileExtensions.length > 0
    ) {
      const uploadedFileExtension = this.deposit.publicationFile?.filename.split('.').pop() || '';
      const extensionFound = this.deposit.communityPopulated.preferredFileExtensions.find(
        extension => extension.toString() === uploadedFileExtension
      );
      this.isPreferredFileExtension = !!extensionFound;
      this.fileExtensionsAllowed =
        this.deposit.communityPopulated.preferredFileExtensions.join(', ');
      this.uploadedExtension = uploadedFileExtension;
    } else {
      this.fileExtensionsAllowed = ACCEPT_TYPES.PUBLICATIONS_EXTENSIONS_ALLOWED;
      this.isPreferredFileExtension = true;
    }

    if (this.deposit.publicationFile) {
      this.iThenticateWrongFile = this.isWrongIThenticateExtension();
    }

    this.validateLicenses();

    if (this.canUpdateDeposit) {
      this.depositForm.enable();
      this.authorsForm.enable();
      this.extraMetadataForm.enable();
      this.referencesForm.enable();
    } else {
      this.depositForm.disable();
      this.authorsForm.disable();
      this.referencesForm.disable();
      this.extraMetadataForm.disable();
    }

    if (this.ethereumService.isInitialized && this.ethereumService.account) {
      this.ethereumService
        .getUserTokenBalance(this.ethereumService.account, this.deposit)
        .subscribe(result => {
          this.balanceTokens = result.toString();
        });
      this.ethereumService
        .getUserTokenAllowance(this.ethereumService.account)
        .subscribe(result => (this.allowanceTokens = result.toString()));
    }
    this.cachedDepositForm = structuredClone(this.depositForm.getRawValue());
  }

  /**
   * Saves the changes made to the deposit by sending an update request to the API.
   * Logs the result and shows a notification to the user.
   */
  save(): void {
    assertIsDefined(this.deposit, 'deposit not found');
    this.deposit = Object.assign(this.deposit, this.depositForm.value);
    const delta = getDelta(this.depositForm.value, this.cachedDepositForm);
    this.spinnerService.show();
    this.apiService
      .updateDeposit({ id: this.deposit._id, updateDepositDTO: delta })
      .pipe(
        finalize(() => {
          this.spinnerService.hide();
        })
      )
      .subscribe(response => {
        this.refreshDeposit(response);
        this.depositForm.markAsPristine();
        this.snackBar.info('Saved! Press submit when you finish');
        this.logger.debug('Deposit saved');
      });
  }

  /**
   * Saves the changes made to the deposit by sending an update request to the API.
   * Logs the result and shows a notification to the user.
   */
  openAcknowledgementModal(): void {
    if (this.canBeSentToPendingApproval()) {
      this.dialogService
        .openCustom({
          title: 'Acknowledgement',
          template: this.acknowledgementDialogTemplate,
          showActionButtons: true,
          acceptMessage: 'Accept',
        })
        .afterClosed()
        .pipe(isNotNullOrUndefined())
        .subscribe(accept => {
          if (accept) {
            this.sendToPendingApproval();
          }
        });
    }
  }

  /**
   * Submits the deposit for approval if eligible, updates the user profile, and navigates to the submitted deposits view.
   */
  sendToPendingApproval(): void {
    if (this.canBeSentToPendingApproval()) {
      this.dialogService.closeAll();
      assertIsDefined(this.deposit, 'deposit not found');
      this.apiService.submitDeposit({ id: this.deposit._id }).subscribe(() => {
        this.snackBar.info('Deposit submitted');
        this.profileService.getProfileFromApi().subscribe();
        void this.router.navigateByUrl('deposits/submitted', { state: { deposit: this.deposit } });
      });
    }
  }

  /**
   * Checks if the deposit meets all the requirements to be sent for pending approval.
   *
   * @returns {boolean} - True if the deposit can be sent to pending approval, otherwise false.
   */
  canBeSentToPendingApproval(): boolean {
    assertIsDefined(this.deposit, 'deposit not found');
    if (!this.deposit.publicationFile) {
      this.fileExpanded = true;
      this.snackBar.error('Upload your publication file');
      return false;
    }
    if (!this.depositForm.pristine) {
      this.snackBar.error('Save all your changes first');
      return false;
    }
    if (this.deposit.authors.length === 0) {
      this.authorsExpanded = true;
      this.snackBar.error('Add publication authors');
      return false;
    }
    [
      'abstract',
      'authors',
      'keywords',
      'publicationType',
      'accessRight',
      'reviewType',
      'disciplines',
    ].forEach(control => {
      const ctr = this.depositForm.get(control);
      ctr?.setValidators(Validators.required);
      ctr?.updateValueAndValidity();
      ctr?.markAsTouched();
    });

    if (!this.depositForm.valid) {
      this.detailsExpanded = true;
      this.snackBar.error('Please complete all required information');
    }
    return this.depositForm.valid;
  }

  /**
   * Deletes the current deposit after user confirmation.
   */
  deleteDeposit(): void {
    this.dialogService
      .openConfirm({
        title: 'Delete publication',
        content: 'Are you sure you want to delete this publication?',
        cancelMessage: 'Cancel',
        acceptMessage: 'Delete',
      })
      .afterClosed()
      .pipe(isNotNullOrUndefined())
      .subscribe(accept => {
        if (accept) {
          this.spinnerService.show();
          assertIsDefined(this.deposit, 'deposit not found');
          this.apiService
            .deleteDeposit({ id: this.deposit._id })
            .pipe(
              finalize(() => {
                this.spinnerService.hide();
              })
            )
            .subscribe(response => {
              this.snackBar.info('Publication deleted');
              void this.router.navigate(['/publications'], {
                queryParams: { query: '', size: 10, drafts: 'yes' },
              });
            });
        }
      });
  }

  /**
   * Deletes a specific file from the deposit after user confirmation.
   *
   * @param {string} filename - The name of the file to delete.
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
          assertIsDefined(this.deposit, 'deposit not found');
          this.apiService
            .deleteDepositFile({ id: this.deposit._id, filename: filename })
            .pipe(
              finalize(() => {
                this.spinnerService.hide();
              })
            )
            .subscribe(response => {
              this.snackBar.info('File deleted');
              this.refreshDeposit(response);
            });
        }
      });
  }

  /**
   * Adds a new author to the deposit or updates an existing one if an index is provided.
   */
  addAuthor(): void {
    if (this.authorsForm.valid) {
      const newAuthor: AuthorDTO = {
        firstName: this.authorsForm.getRawValue().firstName,
        lastName: this.authorsForm.getRawValue().lastName,
        email: this.authorsForm.getRawValue().email,
        orcid: this.authorsForm.getRawValue().orcid,
        credit: this.authorsForm.getRawValue().credit,
        institutions: this.authorsForm.getRawValue().institutions,
      };

      const index = this.authorsForm.controls.index.value;
      if (index >= 0) {
        this.depositForm.controls.authors.value[index] = newAuthor;
      } else {
        this.depositForm.controls.authors.value.push(newAuthor);
      }
      this.depositForm.markAsDirty();
      this.authorsForm.reset({ institutions: [], credit: [] });
      this.showAuthorEdit = false;
    }
  }

  /**
   * Removes an author from the deposit based on the index provided in the author form.
   */
  removeAuthor(): void {
    const index = this.authorsForm.getRawValue().index;

    if (index >= 0) {
      this.deposit?.authors.splice(index, 1);
      this.depositForm.markAsDirty();
      this.authorsForm.reset({ institutions: [], credit: [] });
      this.showAuthorEdit = false;
    }
  }

  /**
   * Handles file uploads for deposits by confirming the upload on the server and refreshing deposit details.
   *
   * @param {$event} event - Contains the original HTTP response, the list of files, and payload details.
   * @param {boolean} [replacePdf=false] - Flag to indicate if the existing PDF should be replaced.
   */
  async filesUploaded(
    $event: {
      originalEvent: HttpResponse<unknown>;
      files: File[];
      payload: SignedUrlDTO;
    },
    replacePdf = false
  ): Promise<void> {
    const upload: UploadFilePayload = {
      fileMetadata: $event.payload.fileMetadata,
      isMainFile: $event.payload.isMainFile,
      replacePDF: replacePdf,
    };
    assertIsDefined(this.deposit, 'deposit not found');
    const updatedDeposit = await lastValueFrom(
      this.apiService.uploadFileConfirmationDeposit({
        id: this.deposit._id,
        uploadFilePayload: upload,
      })
    );

    assertIsDefined(updatedDeposit, 'Deposit not found');
    this.refreshDeposit(updatedDeposit);
    this.snackBar.info('File uploaded');
  }

  /**
   * Handles the selection and upload of a Bibtex file, appending its content to the deposit's references.
   *
   * @param {$event} event - Contains the file object and form data.
   * @param {FileuploadComponent} bibtexFiles - Component handling file uploads.
   */
  selectBibtexFileToImport(
    $event: { fileObject: File; formData: FormData },
    bibtexFiles: FileuploadComponent
  ): void {
    const fileReader = new FileReader();
    fileReader.readAsText($event.fileObject);
    fileReader.onload = (): string | ArrayBuffer | null => {
      this.apiService
        .uploadBibtexFile({
          uploadBibtexFilePayload: { bibtexReferences: fileReader.result as string },
        })
        .subscribe(bibtexData => {
          this.depositForm.controls.bibtexReferences.setValue(
            this.depositForm.controls.bibtexReferences.value.concat(bibtexData)
          );
          this.depositForm.controls.bibtexReferences.markAsDirty();
          this.snackBar.info('Bibtex file uploaded');
        });
      return fileReader.result;
    };
  }

  /**
   * Adds a new reference to the deposit's reference list if the form is valid.
   */
  addReference(): void {
    if (this.referencesForm.valid) {
      const newReference: Reference = {
        reference: this.referencesForm.getRawValue().reference,
        url: this.referencesForm.getRawValue().url,
      };
      const index = this.referencesForm.controls.index.value;
      if (index >= 0) {
        this.depositForm.controls.references.value[index] = newReference;
      } else {
        this.depositForm.controls.references.value.push(newReference);
      }
      this.depositForm.markAsDirty();
      this.referencesForm.reset();
      this.showReferenceEdit = false;
    }
  }

  /**
   * Removes a reference from the deposit based on the index specified in the references form.
   */
  removeReference(): void {
    if (!this.deposit?.references) {
      this.snackBar.error('No references found');
      return;
    }
    const index = this.referencesForm.getRawValue().index;
    if (index >= 0) {
      this.deposit.references.splice(index, 1);
      this.depositForm.markAsDirty();
      this.referencesForm.reset();
      this.showReferenceEdit = false;
    }
  }

  /**
   * Ensures data is saved before uploading a file, returning false if the form is not pristine.
   *
   * @param {$event} event - The event object associated with the file upload.
   * @returns {boolean} - True if the deposit form is pristine, false otherwise.
   */
  beforeUpload($event: unknown): boolean {
    if (!this.depositForm.pristine) {
      this.snackBar.error('Save your data first');
      return false;
    } else {
      return true;
    }
  }

  /**
   * Adjusts the order of authors within the deposit based on drag-and-drop actions.
   *
   * @param {CdkDragDrop<AuthorDTO[]>} event - Contains information about the drag-and-drop operation.
   */
  drop(event: CdkDragDrop<AuthorDTO[]>): void {
    assertIsDefined(this.deposit, 'deposit not found');
    moveItemInArray(this.deposit.authors, event.previousIndex, event.currentIndex);
    this.depositForm.markAsDirty();
  }

  /**
   * Generates a URL to open a Jupyter notebook via MyBinder based on the provided GitHub repository URL.
   *
   * @param {string} gitRepositoryURL - The GitHub repository URL.
   * @returns {string} - The MyBinder URL if valid, otherwise an error URL.
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
   * Blockchain Functions - Attempts to prove the ownership of the deposit's publication by recording it on the blockchain.
   * Validates the availability of a blockchain provider and the existence of a publication file.
   * If conditions are met, it processes the transaction, updates the deposit with the transaction details, and saves the deposit.
   */
  async proofOwnership(): Promise<void> {
    assertIsDefined(this.deposit, 'deposit not found');
    if (!this.ethereumService.isReady()) {
      this.snackBar.error('No Ethereum provider detected, check if blockchain is activated');
      return;
    }

    if (!this.deposit.publicationFile?.url) {
      this.snackBar.error('Upload a file first to publish to blockchain');
      return;
    }

    // Calculate hash
    const responseFile = await fetch(this.deposit.publicationFile.url);
    const arrayBuffer = await responseFile.arrayBuffer();
    const fileHash = this.ethereumService.hashFile(arrayBuffer);

    if (!fileHash) {
      this.snackBar.error('Incorrect publication hash');
      return;
    }

    this.ethereumService.publicationProofOwnership(fileHash).subscribe(transaction => {
      this.logger.debug('Transaction', transaction);
      this.saveOwnershipFlag = true;
      assertIsDefined(this.deposit, 'deposit not found');
      if (!this.deposit.transactions) {
        this.deposit.transactions = {};
      }

      if (this.ethereumService.currentNetwork.value) {
        const blockchainNetwork = this.ethereumService.currentNetwork.value.name;
        const update: UpdateDepositDTO = {};
        update.transactions = {};
        update.transactions[blockchainNetwork] = transaction;
        update.keccak256 = fileHash;
        this.apiService
          .updateDeposit({ id: this.deposit._id, updateDepositDTO: update })
          .subscribe(response => {
            this.refreshDeposit(response);
            this.depositForm.markAsPristine();
            this.snackBar.info('Publication saved');
            this.logger.debug('Deposit saved');
          });
      }

      void transaction.wait().then(receipt => {
        this.logger.debug('Receipt', receipt);
        const update: UpdateDepositDTO = {};
        update.transactions = {};

        this.saveOwnershipFlag = false;

        if (this.deposit?.transactions) {
          update.transactions = {};
        }
        if (this.ethereumService.currentNetwork.value) {
          const blockchainNetwork = this.ethereumService.currentNetwork.value.name;
          update.transactions[blockchainNetwork] = receipt;
        }
        assertIsDefined(this.deposit, 'deposit not found');
        this.apiService
          .updateDeposit({ id: this.deposit._id, updateDepositDTO: update })
          .subscribe(response => {
            this.refreshDeposit(response);
            this.depositForm.markAsPristine();
            this.snackBar.info('Publication saved');
            this.logger.debug('Deposit saved');
          });
      });
    });
  }

  /**
   * Blockchain Functions - Opens a custom dialog for depositing ORV tokens, providing a user interface to input the number of tokens to deposit.
   */
  showDepositTokensDialog(): void {
    if (!this.ethereumService.isReady()) {
      this.snackBar.error('No Ethereum provider detected, check if blockchain is activated');
      return;
    }
    this.dialogService
      .openCustom({
        title: 'Deposit ORV tokens',
        content:
          'Please enter the number of ORV tokens that will be sent from your wallet to the platform',
        template: this.depositORVtokensDialogTemplate,
        showActionButtons: false,
      })
      .afterClosed()
      .subscribe();
  }

  /**
   * Blockchain Functions - Deposits the specified amount of ORV tokens into the platform's account from the user's wallet, handling blockchain transactions.
   *
   * @param {string} value - The number of ORV tokens to deposit.
   */
  depositTokens(value: string): void {
    assertIsDefined(this.deposit, 'deposit not found');
    this.ethereumService.depositTokens(value, this.deposit).subscribe(transaction => {
      this.logger.debug('Transaction', transaction);
      this.depositTokensFlag = true;
      void transaction.wait().then(receipt => {
        this.logger.debug('Receipt', receipt);
        this.depositTokensFlag = false;
        assertIsDefined(this.deposit, 'deposit not found');
        this.refreshDeposit(this.deposit);
        this.dialogService.closeAll();
      });
    });
  }

  /**
   * Blockchain Functions - Opens a custom dialog for approving ORV tokens for use on the platform,
   * providing a user interface to specify the amount of tokens to approve.
   */
  showApproveDepositTokensDialog(): void {
    if (!this.ethereumService.isReady()) {
      this.snackBar.error('No Ethereum provider detected, check if blockchain is activated');
      return;
    }
    this.dialogService
      .openCustom({
        title: 'Approve ORV tokens',
        content:
          'Please enter the number of ORV tokens that you would like to approve in your wallet for the platform',
        template: this.approveORVtokensDialogTemplate,
        showActionButtons: false,
      })
      .afterClosed()
      .subscribe();
  }

  /**
   * Blockchain Functions - Approves a specific amount of deposit tokens for use within the platform using the Ethereum blockchain service.
   *
   * @param {string} value - The number of tokens to approve.
   */
  approveDepositTokens(value: string): void {
    this.ethereumService.approveDepositTokens(value).subscribe(transaction => {
      this.logger.debug('Transaction', transaction);
      this.unlockTokensFlag = true;
      void transaction.wait().then(receipt => {
        this.logger.debug('Receipt', receipt);
        this.unlockTokensFlag = false;
        assertIsDefined(this.deposit, 'deposit not found');
        this.refreshDeposit(this.deposit);
        this.dialogService.closeAll();
      });
    });
  }

  /**
   * Previews the DOI metadata by fetching a preview from the server and displaying it in a custom dialog.
   */
  previewDOI(): void {
    assertIsDefined(this.deposit, 'deposit not found');
    this.apiService.previewDOIRegistration({ id: this.deposit._id }).subscribe(result => {
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
   * Registers a DOI for the deposit and updates the deposit form with the DOI if successful.
   */
  registerDOI(): void {
    assertIsDefined(this.deposit, 'deposit not found');
    this.apiService.createDoi({ id: this.deposit._id }).subscribe(result => {
      this.doiMetadataText = result.data;
      if (DOI_REGEXP.test(result.data)) {
        this.depositForm.controls.doi.setValue(result.data);
        this.depositForm.controls.doi.markAsDirty();
      }
      this.dialogService.openCustom({
        template: this.doiMetadataTextTemplate,
      });
    });
  }

  /**
   * Fetches and displays the registered DOI metadata in a custom dialog.
   */
  getRegisteredDOIMetadata(): void {
    assertIsDefined(this.deposit, 'deposit not found');
    this.apiService.getDoi({ id: this.deposit._id }).subscribe(data => {
      this.doiMetadataJson = data;
      this.dialogService.openCustom({
        template: this.doiMetadataJSONTemplate,
      });
    });
  }

  /**
   * Enables the editing interface for adding or modifying an author.
   */
  editAuthor(): void {
    this.showAuthorEdit = true;
  }

  /**
   * Enables the editing interface for adding or modifying a reference.
   */
  editReference(): void {
    this.showReferenceEdit = true;
  }

  /**
   * Prepopulates the author form with the logged-in user's profile data to add them as an author.
   */
  addMe(): void {
    const profile = this.profileService.profile.getValue();
    this.showAuthorEdit = true;
    assertIsDefined(profile);

    this.authorsForm.patchValue({
      firstName: profile.firstName,
      lastName: profile.lastName,
      institutions: profile.institutions,
      email: profile.email ?? '',
      orcid: profile.orcid ?? '',
    });
  }

  /**
   * Handles selection changes on author chips to edit or reset the author form based on the selection.
   *
   * @param {$event} MatChipSelectionChange - The event object containing selection details.
   * @param {number} index - The index of the author in the authors array.
   */
  selectAuthor($event: MatChipSelectionChange, index: number): void {
    assertIsDefined(this.deposit, 'deposit not found');
    const author = this.deposit.authors[index];
    this.showAuthorEdit = true;

    if ($event.selected) {
      this.authorsForm.patchValue({
        firstName: author.firstName,
        lastName: author.lastName,
        email: author.email,
        orcid: author.orcid,
        credit: author.credit,
        institutions: author.institutions,
        index: index,
      });
    } else {
      this.authorsForm.reset({ institutions: [], credit: [] });
      this.showAuthorEdit = false;
    }
  }

  /**
   * Handles selection changes on reference chips to edit or reset the reference form based on the selection.
   *
   * @param {$event} MatChipSelectionChange - The event object containing selection details.
   * @param {number} index - The index of the reference in the references array.
   */
  selectReference($event: MatChipSelectionChange, index: number): void {
    assertIsDefined(this.deposit, 'deposit not found');
    const reference = this.deposit.references[index];
    this.showReferenceEdit = true;

    if ($event.selected) {
      this.referencesForm.patchValue({
        reference: reference.reference,
        url: reference.url,
        index: index,
      });
    } else {
      this.referencesForm.reset();
      this.showReferenceEdit = false;
    }
  }

  /**
   * Cancels the author editing process and resets the author form. It also deselects any selected author chips.
   *
   *  @param {MatChipListbox} authorsChips - Component reference for the list of author chips.
   */
  cancelAuthorEdit(authorsChips: MatChipListbox): void {
    this.authorsForm.reset({ institutions: [], credit: [] });
    this.showAuthorEdit = false;
    if (authorsChips.selected instanceof MatChipOption) {
      authorsChips.selected.toggleSelected(false);
    }
  }

  /**
   * Cancels the reference deletion process and resets the reference form. It also deselects any selected reference chips.
   *
   * @param {MatChipListbox} referencesChips - Component reference for the list of reference chips.
   */
  cancelReferenceDelete(referencesChips: MatChipListbox): void {
    this.referencesForm.reset();
    this.showReferenceEdit = false;
    if (referencesChips.selected instanceof MatChipOption) {
      referencesChips.selected.toggleSelected(false);
    }
  }

  /**
   * Filters disciplines based on input value or existing selection. It's used for discipline autocomplete functionality.
   *
   * @param {string | null} value - The current input value for filtering.
   * @returns {DisciplineDTO[]} - An array of filtered disciplines.
   */
  private filterDisciplines(value: string | null): DisciplineDTO[] {
    if (value) {
      const filterValue = value.toLowerCase();

      return this.disciplines
        .filter(
          discipline =>
            discipline.name.toLowerCase().includes(filterValue) &&
            !this.depositForm.controls.disciplines.value.includes(discipline.name)
        )
        .slice(0, 50);
    } else {
      return this.disciplines
        .filter(
          discipline => !this.depositForm.controls.disciplines.value.includes(discipline.name)
        )
        .slice(0, 50);
    }
  }

  /**
   * Initiates a new iThenticate submission for the current deposit.
   */
  createIThenticateSubmission(): void {
    assertIsDefined(this.deposit, 'deposit not found');
    this.apiService
      .createIThenticateSubmission({
        communityId: this.deposit.communityPopulated._id,
        ithenticatePayload: {
          depositId: this.deposit._id,
        },
      })
      .subscribe(response => {
        this.snackBar.info('Submission generated');
        this.checkSubmissionStatus();
      });
  }

  /**
   * Uploads the main file to an existing iThenticate submission.
   */
  uploadFileToSubmission(): void {
    assertIsDefined(this.deposit, 'deposit not found');
    if (
      this.deposit.iThenticate?.submissionId &&
      this.deposit.iThenticate.submissionStatus === SimpleSubmissionResponseStatusEnum.Created
    ) {
      this.apiService
        .uploadFileToSubmission({
          communityId: this.deposit.communityPopulated._id,
          submissionId: this.deposit.iThenticate.submissionId,
          ithenticatePayload: {
            depositId: this.deposit._id,
          },
        })
        .subscribe(() => {
          this.snackBar.info('File submitted');
          this.checkSubmissionStatus();
        });
    }
  }

  /**
   * Generates a similarity report for an existing iThenticate submission.
   */
  generateSimilarityReport(): void {
    assertIsDefined(this.deposit, 'deposit not found');
    if (
      this.deposit.iThenticate?.submissionId &&
      this.deposit.iThenticate.submissionStatus === SimpleSubmissionResponseStatusEnum.Complete
    ) {
      this.apiService
        .generateSimilarityReport({
          communityId: this.deposit.communityPopulated._id,
          submissionId: this.deposit.iThenticate.submissionId,
        })
        .subscribe(response => {
          this.snackBar.info('Similarity report is being generated');
          this.checkReportStatus();
        });
    }
  }

  /**
   * Retrieves and displays the similarity report URL for a completed iThenticate submission.
   */
  getSimilarityReportURL(): void {
    assertIsDefined(this.deposit, 'deposit not found');
    if (
      this.deposit.iThenticate?.submissionId &&
      this.deposit.iThenticate.similarityReportStatus ===
        IThenticateSimilarityReportStatusEnum.Complete
    ) {
      this.apiService
        .getSimilarityReportURL({
          communityId: this.deposit.communityPopulated._id,
          submissionId: this.deposit.iThenticate.submissionId,
        })
        .subscribe(response => {
          if (response.viewer_url) {
            window.open(response.viewer_url);
          }
        });
    }
  }

  /**
   * Retrieves the iThenticate End User License Agreement (EULA) and presents it in a custom dialog for acceptance.
   */
  getIThenticateEULA(): void {
    assertIsDefined(this.deposit, 'deposit not found');
    this.apiService
      .getIThenticateEULA({ communityId: this.deposit.communityPopulated._id })
      .subscribe(response => {
        this.iThenticateEULA_URL = this.domSanitizer.bypassSecurityTrustResourceUrl(response.url);
        this.dialogService
          .openCustom({
            title: 'iThenticate End User License Agreement',
            template: this.ithenticateEULATemplate,
            showActionButtons: true,
            acceptMessage: 'Accept',
            cancelMessage: 'Reject',
          })
          .afterClosed()
          .pipe(isNotNullOrUndefined())
          .subscribe(accept => {
            if (accept) {
              this.acceptIThenticateEULA(response.version);
            }
          });
      });
  }

  /**
   * Accepts the iThenticate EULA with the specified version.
   *
   * @param {string} version - The version of the EULA being accepted.
   */
  acceptIThenticateEULA(version: string): void {
    if (this.profile) {
      assertIsDefined(this.deposit, 'deposit not found');
      this.apiService
        .acceptIThenticateEULA({
          communityId: this.deposit.communityPopulated._id,
          version: version,
        })
        .subscribe(data => {
          this.snackBar.info('End User License Agreement accepted');
        });
    } else {
      this.snackBar.error('Profile not defined');
    }
  }

  /**
   * Checks the status of the current iThenticate submission and updates the deposit information accordingly.
   */
  checkSubmissionStatus(): void {
    assertIsDefined(this.deposit, 'deposit not found');
    this.apiService
      .getIThenticateSubmissionInfo({
        communityId: this.deposit.communityPopulated._id,
        depositId: this.deposit._id,
      })
      .subscribe(response => {
        assertIsDefined(this.deposit, 'deposit not found');
        this.iThenticateSubmission = response;
        this.deposit.iThenticate = {
          ...this.deposit.iThenticate,
          submissionId: response.id,
          // @ts-expect-error
          submissionStatus: response.status,
        };
      });
  }

  /**
   * Checks the status of the iThenticate similarity report and updates the deposit information accordingly.
   */
  checkReportStatus(): void {
    assertIsDefined(this.deposit, 'deposit not found');
    this.apiService
      .getIThenticateReport({
        communityId: this.deposit.communityPopulated._id,
        depositId: this.deposit._id,
      })
      .subscribe(response => {
        assertIsDefined(this.deposit, 'deposit not found');
        this.iThenticateReport = response;
        this.deposit.iThenticate = {
          ...this.deposit.iThenticate,
          // @ts-expect-error
          similarityReportStatus: this.iThenticateReport.status,
        };
      });
  }

  /**
   * Refreshes the status of iThenticate submissions and reports if they exist.
   */
  refreshIThenticate(): void {
    if (this.iThenticateSubmission) {
      this.checkSubmissionStatus();
    }

    if (this.iThenticateReport) {
      this.checkReportStatus();
    }
  }

  /**
   * Checks if the file extension of the uploaded publication file is not allowed for iThenticate submissions.
   *
   *  @returns {boolean} True if the file extension is not allowed, otherwise false.
   */
  isWrongIThenticateExtension(): boolean {
    assertIsDefined(this.deposit, 'deposit not found');
    const uploadedFileExtension = this.deposit.publicationFile?.filename.split('.').pop() || '';
    return !this.ITHENTICATE_EXTENSIONS_ALLOWED.includes(uploadedFileExtension);
  }

  /**
   * Generates a signed URL for uploading a file and then uploads it.
   *
   * @param {$event} event - The event object containing the file and form data.
   * @param {boolean} isMainFile - Indicates if the file is the main file for the deposit.
   * @param {boolean} replacePdf - Indicates if the existing PDF should be replaced.
   * @param {FileuploadComponent} mainReviewFileUpload - The file upload component.
   */
  async generateSignedUrl(
    $event: { fileObject: File; formData: FormData },
    isMainFile: boolean,
    replacePdf: boolean,
    mainReviewFileUpload: FileuploadComponent
  ): Promise<void> {
    assertIsDefined(this.deposit);
    const file = {
      name: $event.fileObject.name,
      type: $event.fileObject.type,
      size: $event.fileObject.size,
      lastModified: $event.fileObject.lastModified,
    };
    const signedUrl = await lastValueFrom(
      this.apiService.uploadFile({
        id: this.deposit._id,
        isMainFile: isMainFile,
        createFileDTO: {
          file: file,
        },
        replacePDF: replacePdf,
      })
    );
    mainReviewFileUpload.uploadFile(signedUrl, $event.fileObject, $event.formData);
  }

  /**
   * Toggles the display of optional fields based on the user's interaction with a toggle switch.
   *
   * @param {$event} event - The event object containing the toggle state.
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
   * Sets ORCID data to the author form fields based on the retrieved ORCID information.
   */
  setOrcidData(): void {
    if (this.authorsForm.controls.orcid.value && this.authorsForm.controls.orcid.valid) {
      const orcidURL = this.authorsForm.controls.orcid.value;
      const orcidID = orcidURL.substring(orcidURL.lastIndexOf('/') + 1);
      this.orcidLoading = true;

      this.apiService
        .getOrcidData({ id: orcidID })
        .pipe(finalize(() => (this.orcidLoading = false)))
        .subscribe(data => {
          const orcidData = data as OrcidData | undefined;
          if (orcidData) {
            const { names, emails } = orcidData;

            if (names?.givenNames?.value) {
              this.authorsForm.controls.firstName.setValue(names.givenNames.value);
            }
            if (names?.familyName?.value) {
              this.authorsForm.controls.lastName.setValue(names.familyName.value);
            }

            if (emails?.emails?.[0].value) {
              this.authorsForm.controls.email.setValue(emails.emails[0].value);
            }
          }
        });
    }
  }

  /**
   * Adds a BibTeX reference to the deposit form and marks it as dirty.
   */
  addBibtexReference(): void {
    this.dialogService
      .open(BibtexEditComponent, {
        maxHeight: '90vh',
        data: null as BibtexReferences | null,
      })
      .afterClosed()
      .pipe(isNotNullOrUndefined())
      .subscribe(reference => {
        this.depositForm.controls.bibtexReferences.getRawValue().push(reference);
        this.depositForm.controls.bibtexReferences.markAsDirty();
      });
  }

  /**
   * Selects a BibTeX reference for editing.
   *
   * @param {$event} event - The mouse event.
   * @param {BibtexReferences} reference - The reference to edit.
   * @param {number} indexOfelement - The index of the element in the references array.
   */
  selectBibtexReference(
    $event: MouseEvent,
    reference: BibtexReferences,
    indexOfelement: number
  ): void {
    this.dialogService
      .open(BibtexEditComponent, {
        maxHeight: '90vh',
        data: reference,
      })
      .afterClosed()
      .pipe(isNotNullOrUndefined())
      .subscribe(reference => {
        assertIsDefined(this.deposit, 'Deposit not found');
        this.depositForm.controls.bibtexReferences.getRawValue()[indexOfelement] = reference;
        this.depositForm.controls.bibtexReferences.markAsDirty();
      });
  }

  /**
   * Removes a BibTeX reference from the deposit form.
   *
   * @param {number} index - The index of the reference to remove.
   */
  removeBibtexReference(index: number): void {
    assertIsDefined(this.deposit, 'Deposit not found');
    this.depositForm.controls.bibtexReferences.getRawValue().splice(index, 1);
    this.depositForm.controls.bibtexReferences.markAsDirty();
  }

  /**
   * Opens a dialog allowing users to import citations into BibTeX format. Users can paste their
   * references into a text area, which are then processed into BibTeX entries.
   */
  openImportCitationToBibtexDialog(): void {
    this.dialogService
      .openInputDialog({
        title: 'Import citations to bibtex',
        acceptMessage: 'Accept',
        content: 'Paste your references here, separating them by each line.',
        useTextarea: true,
        inputLabel: 'Text citations',
      })
      .afterClosed()
      .pipe(isNotNullOrUndefined())
      .subscribe(response => {
        if (response.action && response.inputValue) {
          const rawCitations = response.inputValue.split('\n');

          if (rawCitations.length > 0) {
            this.apiService
              .transformCitationsToBibtex({ citationsToBibtexBody: { citations: rawCitations } })
              .subscribe(bibtexCitations => {
                const previousCitations = this.depositForm.controls.bibtexReferences.getRawValue();
                this.depositForm.controls.bibtexReferences.setValue([
                  ...previousCitations,
                  ...bibtexCitations,
                ]);
              });
          }
        }
      });
  }
}
