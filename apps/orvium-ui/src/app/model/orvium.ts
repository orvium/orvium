import {
  AcceptedFor,
  AccessRight,
  CallType,
  CommunityType,
  CreditType,
  DepositStatus,
  FileExtensions,
  InviteStatus,
  ModeratorRole,
  PublicationType,
  ReviewDecision,
  ReviewKind,
  ReviewStatus,
  UserType,
} from '@orvium/api';
import { ThemePalette } from '@angular/material/core';

/**
 * Data transfer object for reviews, providing access to review actions.
 *
 * @property {string} _id - id of the discipline
 * @property {number} - number of times the discipline has benn tagged.
 */
export class TopDisciplinesQuery {
  _id!: string;
  count!: number;
}

/**
 * Data transfer object for citations, specifically handling APA citation style.
 *
 * @property {string} apa - citation data following APA format.
 */
export class Citation {
  apa!: string;
}

/**
 * List of user types with localized display values.
 */
export const USERTYPE_LOV = [
  { value: UserType.Student, viewValue: $localize`Student` },
  { value: UserType.Medical, viewValue: $localize`Medical` },
  { value: UserType.Business, viewValue: $localize`Business` },
  { value: UserType.Researcher, viewValue: $localize`Researcher` },
  { value: UserType.Citizen, viewValue: $localize`Citizen` },
  { value: UserType.Academic, viewValue: $localize`Academic` },
];

/**
 * List of call types for publications with localized display values.
 */
export const CALLTYPE_LOV = [
  { value: CallType.Papers, viewValue: $localize`Call for papers` },
  { value: CallType.Abstracts, viewValue: $localize`Call for abstracts` },
];

/**
 * List of publication types with localized display values.
 */
export const PUBLICATIONTYPE_LOV = [
  { value: PublicationType.ConferencePaper, viewValue: $localize`Conference paper` },
  { value: PublicationType.Article, viewValue: $localize`Research article` },
  { value: PublicationType.Preprint, viewValue: $localize`Preprint` },
  { value: PublicationType.Poster, viewValue: $localize`Poster` },
  { value: PublicationType.Report, viewValue: $localize`Research report` },
  { value: PublicationType.Dataset, viewValue: $localize`Dataset` },
  { value: PublicationType.SoftwareDocumentation, viewValue: $localize`Software documentation` },
  { value: PublicationType.TechnicalNote, viewValue: $localize`Method paper` },
  { value: PublicationType.PolicyReport, viewValue: $localize`Policy report` },
  { value: PublicationType.RegisteredReport, viewValue: $localize`Registered report` },
  { value: PublicationType.Proposal, viewValue: $localize`Research proposal` },
  { value: PublicationType.ReviewArticle, viewValue: $localize`Review article` },
  { value: PublicationType.Video, viewValue: $localize`Video abstract` },
  { value: PublicationType.Abstract, viewValue: $localize`Abstract` },
  { value: PublicationType.ExtendedAbstract, viewValue: $localize`Extended abstract` },
  { value: PublicationType.Other, viewValue: $localize`Other` },
].sort((a, b) => a.viewValue.localeCompare(b.viewValue));

/**
 * List of access rights ranging from Creative Commons to more elaborated ones.
 */
export const ACCESSRIGHT_LOV = [
  { value: AccessRight.Cc0, viewValue: 'CC0' },
  { value: AccessRight.CcBy, viewValue: 'CC BY' },
  { value: AccessRight.CcByNd, viewValue: 'CC BY-ND' },
];

/**
 * List of posible file extentions.
 */
export const FILEEXTENSION_LOV = [
  { value: FileExtensions.Pdf, viewValue: 'PDF' },
  { value: FileExtensions.Docx, viewValue: 'DOCX' },
  { value: FileExtensions.Doc, viewValue: 'DOC' },
  { value: FileExtensions.Rtf, viewValue: 'RTF' },
  { value: FileExtensions.Tex, viewValue: 'TEX' },
  { value: FileExtensions.Epub, viewValue: 'EPUB' },
  { value: FileExtensions.Odt, viewValue: 'ODT' },
  { value: FileExtensions.Zip, viewValue: 'ZIP' },
];

/**
 * List of values for the posible statuses of the deposits.
 */
export const DEPOSITSTATUS_LOV = [
  { value: DepositStatus.Draft, viewValue: $localize`Draft` },
  { value: DepositStatus.PendingApproval, viewValue: $localize`Pending approval` },
  { value: DepositStatus.Preprint, viewValue: $localize`Preprint` },
  { value: DepositStatus.Published, viewValue: $localize`Published` },
  { value: DepositStatus.Rejected, viewValue: $localize`Rejected` },
  { value: DepositStatus.Merged, viewValue: $localize`Merged` },
];

/**
 * List of potential review types.
 */
export const REVIEWKIND_LOV = [
  { value: ReviewKind.PeerReview, viewValue: $localize`Peer review` },
  { value: ReviewKind.CopyEditing, viewValue: $localize`Copy Editing` },
];

/**
 * List of CRediT (Contributor Roles Taxonomy) types with descriptions, providing a standardized way
 * to represent contributions to scholarly published work.
 */
export const CREDITTYPE_LOV = [
  {
    value: CreditType.Conceptualization,
    viewValue: 'Conceptualization',
    description: 'Ideas; formulation or evolution of overarching research goals and aims',
  },
  {
    value: CreditType.Methodology,
    viewValue: 'Methodology',
    description: 'Development or design of methodology; creation of models',
  },
  {
    value: CreditType.Software,
    viewValue: 'Software',
    description:
      'Programming, software development; designing computer programs; ' +
      'implementation of the computer code and supporting algorithms; testing of existing code components',
  },
  {
    value: CreditType.Validation,
    viewValue: 'Validation',
    description:
      'Verification, whether as a part of the activity or separate, of the overall replication/ reproducibility ' +
      'of results/experiments and other research outputs',
  },
  {
    value: CreditType.FormalAnalysis,
    viewValue: 'Formal analysis',
    description:
      'Application of statistical, mathematical, computational, or other formal techniques to analyze or synthesize study data',
  },
  {
    value: CreditType.Investigation,
    viewValue: 'Investigation',
    description:
      'Conducting a research and investigation process, specifically performing the experiments, or data/evidence collection',
  },
  {
    value: CreditType.Resources,
    viewValue: 'Resources',
    description:
      'Provision of study materials, reagents, materials, patients, laboratory samples, animals, instrumentation, ' +
      'computing resources, or other analysis tools',
  },
  {
    value: CreditType.DataCuration,
    viewValue: 'Data Curation',
    description:
      'Management activities to annotate (produce metadata), scrub data and maintain research data ' +
      '(including software code, where it is necessary for interpreting the data itself) for initial use and later reuse',
  },
  {
    value: CreditType.WritingOriginalDraft,
    viewValue: 'Writing - Original Draft',
    description:
      'Preparation, creation and/or presentation of the published work, specifically writing the initial draft ' +
      '(including substantive translation)',
  },
  {
    value: CreditType.WritingReviewAndEditing,
    viewValue: 'Writing - Review & Editing',
    description:
      'Preparation, creation and/or presentation of the published work by those from the original research group, ' +
      'specifically critical review, commentary or revision – including pre-or postpublication stages',
  },
  {
    value: CreditType.Visualization,
    viewValue: 'Visualization',
    description:
      'Preparation, creation and/or presentation of the published work, specifically visualization/ data presentation',
  },
  {
    value: CreditType.Supervision,
    viewValue: 'Supervision',
    description:
      'Oversight and leadership responsibility for the research activity planning and execution, including mentorship ' +
      'external to the core team',
  },
  {
    value: CreditType.ProjectAdministration,
    viewValue: 'Project administration',
    description:
      'Management and coordination responsibility for the research activity planning and execution',
  },
  {
    value: CreditType.FundingAcquisition,
    viewValue: 'Funding acquisition',
    description: 'Acquisition of the financial support for the project leading to this publication',
  },
];

/**
 * Defines the structure for storing localized view options for review decisions, including descriptions and UI customization properties.
 * This interface is used to facilitate display and selection of review outcomes in user interfaces.
 *
 * @property {ReviewDecision} value - The enumerated value representing the specific review decision.
 * @property {string} viewValue - The localized string to display in the UI, representing the review decision.
 * @property {string} description - A brief description of what the review decision entails, aiding user understanding.
 * @property {string} icon - The name of the icon to be displayed alongside the view value in the UI, enhancing visual representation.
 * @property {ThemePalette} color - The color associated with the review decision, used to theme the UI element for this decision.
 */
export interface ReviewDecisionLov {
  value: ReviewDecision;
  viewValue: string;
  description: string;
  icon: string;
  color: ThemePalette;
}

/**
 * List of review decisions with their descriptions, icons, and color themes for UI presentation.
 */
export const REVIEWDECISION_LOV: ReviewDecisionLov[] = [
  {
    value: ReviewDecision.Accepted,
    viewValue: $localize`Accepted`,
    description: $localize`The publication is ready to be published`,
    icon: 'verified',
    color: 'primary',
  },
  {
    value: ReviewDecision.MinorRevision,
    viewValue: $localize`Minor Revision Required`,
    description: $localize`The publication needs some small changes to be published`,
    icon: 'published_with_changes',
    color: 'accent',
  },
  {
    value: ReviewDecision.MajorRevision,
    viewValue: $localize`Major Revision Required`,
    description: $localize`The publication contains errors that must be corrected`,
    icon: 'error',
    color: 'warn',
  },
];

/**
 * List of community types available within the application, each with a localized display value.
 */
export const COMMUNITYTYPE_LOV = [
  {
    value: CommunityType.Community,
    viewValue: $localize`Community`,
  },
  {
    value: CommunityType.Journal,
    viewValue: $localize`Journal`,
  },
  {
    value: CommunityType.Conference,
    viewValue: $localize`Conference`,
  },
];

/**
 * List of roles a moderator can hold within a community, each defined with a localized display value.
 */
export const MODERATOR_ROLE_LOV = [
  {
    value: ModeratorRole.Owner,
    viewValue: $localize`Owner`,
  },
  {
    value: ModeratorRole.Moderator,
    viewValue: $localize`Moderator`,
  },
];

/**
 * List of statuses that a review can hold within the workflow of submission review and publication, each with a localized display value.
 */
export const REVIEWSTATUS_LOV = [
  {
    value: ReviewStatus.Draft,
    viewValue: $localize`Draft`,
  },
  {
    value: ReviewStatus.PendingApproval,
    viewValue: $localize`Pending approval`,
  },
  {
    value: ReviewStatus.Published,
    viewValue: $localize`Published`,
  },
];

/**
 * List of statuses for invitations to participate in certain activities within the application, such as reviewing or collaborating.
 */
export const INVITESTATUS_LOV = [
  { value: InviteStatus.Pending, viewValue: 'Pending' },
  { value: InviteStatus.Accepted, viewValue: 'Accepted' },
  { value: InviteStatus.Rejected, viewValue: 'Rejected' },
];

/**
 * List of statuses for tracking the progress of financial transactions or payments within the application.
 */
export const PAYMENTSTATUS_LOV = [
  { value: 'open', viewValue: 'Open' },
  { value: 'complete', viewValue: 'Complete' },
];

/**
 * List of decisions for deposit handling, such as acceptance for presentation or as a poster, each with a localized display value.
 */
export const DEPOSITDECISION_LOV = [
  {
    value: AcceptedFor.Poster,
    viewValue: $localize`Poster`,
  },
  {
    value: AcceptedFor.Presentation,
    viewValue: $localize`Presentation`,
  },
  {
    value: AcceptedFor.None,
    viewValue: $localize`None`,
  },
];

/**
 * List of BibTeX entry types supported within the application for referencing and citation purposes, each with a display value.
 */
export const BIBTEXPUBLICATIONTYPES_LOV = [
  {
    value: 'article',
    viewValue: 'article',
  },
  {
    value: 'book',
    viewValue: 'book',
  },
  {
    value: 'booklet',
    viewValue: 'booklet',
  },
  {
    value: 'conference',
    viewValue: 'conference',
  },
  {
    value: 'inbook',
    viewValue: 'inbook',
  },
  {
    value: 'incollection',
    viewValue: 'incollection',
  },
  {
    value: 'inproccedings',
    viewValue: 'inproccedings',
  },
  {
    value: 'manual',
    viewValue: 'manual',
  },
  {
    value: 'masterthesis',
    viewValue: 'masterthesis',
  },
  {
    value: 'misc',
    viewValue: 'misc',
  },
  {
    value: 'patent',
    viewValue: 'patent',
  },
  {
    value: 'phdthesis',
    viewValue: 'phdthesis',
  },
  {
    value: 'poster',
    viewValue: 'poster',
  },
  {
    value: 'proceedings',
    viewValue: 'proceedings',
  },
  {
    value: 'techreport',
    viewValue: 'techreport',
  },
  {
    value: 'unpublished',
    viewValue: 'unpublished',
  },
];

/**
 * Key used for local storage to toggle the display of optional fields in forms or interfaces within the application.
 */
export const LOCALSTORAGE_SHOWOPTIONALFIELDS = 'showOptionalFields';
