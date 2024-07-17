import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { FileMetadata } from '../dtos/filemetadata.dto';
import { Reference } from '../dtos/reference.dto';
import {
  CommentaryCLASSNAME,
  CommunityCLASSNAME,
  removeExcessSpaces,
  ReviewCLASSNAME,
  UserCLASSNAME,
} from '../utils/utils';
import { ExtraMetadata } from '../dtos/extrametadata.dto';
import { ApiProperty } from '@nestjs/swagger';
import { SimpleSubmissionResponseStatusEnum } from '@orvium/ithenticate-client';
import { DoiStatus } from '../doi/doi-log.schema';

/**
 * Enum for categorizing the types of publications that can be handled within the system.
 * Each type represents a different form of publication, usually distinguished by its content,
 * purpose, or publication venue.
 *
 * @enum {string}
 * @property {string} book - Traditional books, typically involving extensive discussion or research on a specific topic.
 * @property {string} bookSection - A specific chapter or section of a book, often cited separately in academic contexts.
 * @property {string} conferencePaper - Papers presented at conferences, often peer-reviewed and published in conference proceedings.
 * @property {string} article - Articles published in journals or magazines, covering various topics from news to science and academic research.
 * @property {string} patent - Official documents granting exclusive rights to inventions, typically detailed descriptions of the invention processes.
 * @property {string} poster - Posters presented at scientific or academic conferences, summarizing research or data in a visually engaging format.
 * @property {string} preprint - Early versions of scholarly papers posted on public platforms prior to peer review and publication in journals.
 * @property {string} report - Detailed and structured presentation of research findings, often associated with academic, scientific, or government research.
 * @property {string} dataset - Collections of data, often published in digital formats for use by other researchers in further studies or analyses.
 * @property {string} softwareDocumentation - Manuals, user guides, and other documentation for software applications, detailing features, usage, and setup.
 * @property {string} thesis - Academic documents submitted in support of candidature for degrees or professional qualifications, detailing the author's research.
 * @property {string} technicalNote - Brief articles or reports that describe current research findings or provide updates on ongoing research.
 * @property {string} workingPaper - In-progress reports on current research intended to invite feedback before final publication.
 * @property {string} policyReport - Reports that provide insights or recommendations on specific policy issues, aimed at influencing policy decisions.
 * @property {string} registeredReport - Detailed plans for research projects that are reviewed and registered by a journal before the research begins.
 * @property {string} proposal - Proposals for academic or scientific projects, often submitted to seek funding or permission to undertake a project.
 * @property {string} reviewArticle - Articles that survey and summarize previously published studies rather than reporting new facts or analysis.
 * @property {string} video - Video publications, which could include documentary-style videos, academic lecture recordings, or other informational videos.
 * @property {string} abstract - A brief summary of the content of a document or presentation, typically one paragraph that encapsulates the main points.
 * @property {string} extendedAbstract - A longer form of abstract that provides more detail, often used in academic conferences to describe presentation contents.
 * @property {string} other - A category for any other types of publications that do not fit into the provided categories, used for miscellaneous purposes.
 */
export enum PublicationType {
  book = 'book',
  bookSection = 'book section',
  conferencePaper = 'conference paper',
  article = 'article',
  patent = 'patent',
  poster = 'poster',
  preprint = 'preprint',
  report = 'report',
  dataset = 'dataset',
  softwareDocumentation = 'software documentation',
  thesis = 'thesis',
  technicalNote = 'technical note',
  workingPaper = 'working paper',
  policyReport = 'policy report',
  registeredReport = 'registered report',
  proposal = 'proposal',
  reviewArticle = 'review article',
  video = 'video',
  abstract = 'abstract',
  extendedAbstract = 'extended abstract',
  other = 'other',
}

/**
 * Community Access Right (all based on Creative Commons)
 *
 * @enum {string}
 * @property {string} CCBY - freedom to use, attribution required, no additional restrictions
 * @property {string} CCBYND - allows redistribution, attribution Required, no derivatives
 * @property {string} CC0 - freedom to use, no copyrights, no restrictions
 */
export enum AccessRight {
  CCBY = 'cc by',
  CCBYND = 'cc by-nd',
  CC0 = 'cc0',
}

/**
 * Enum for types of reviews.
 * @enum {string}
 * @property {string} openReview - open peer-review
 */
export enum ReviewType {
  openReview = 'open review',
  // singleBlind = 'single blind',
  // doubleBlind = 'double blind'
}

/**
 * Community Status - community publication lifecycle
 *
 * @enum{string}
 * @property {string} draft -  just created, before sending for approval
 * @property {string} pendingApproval - waiting for platform admin review and approval
 * @property {string} published - after approval and public community
 * @property {string} preprint - preprint status
 * @property {merged} merged - merged status
 */
export enum DepositStatus {
  draft = 'draft',
  pendingApproval = 'pending approval',
  published = 'published',
  preprint = 'preprint',
  rejected = 'rejected',
  merged = 'merged',
}

/**
 * Enum for Contributor Roles Taxonomy (CRediT) types in scholarly communications.
 * These roles are intended to describe all the types of contributions that can be recognized in academic publications,
 * helping to provide precise attribution of contributions to scholarly published work.
 *
 * @enum {string}
 * @property {string} methodology - Development or design of methodology; creation of models.
 * @property {string} conceptualization - Ideas; formulation or evolution of overarching research goals and aims.
 * @property {string} software - Programming, software development; designing computer programs; implementation of the computer code and supporting algorithms.
 * @property {string} validation - Verification, whether as part of the activity or separate, of the overall replication/reproducibility of results/experiments and other research outputs.
 * @property {string} formalAnalysis - Application of statistical, mathematical, computational, or other formal techniques to analyze or synthesize study data.
 * @property {string} investigation - Conducting a research and investigation process, specifically performing the experiments, or data/evidence collection.
 * @property {string} resources - Provision of study materials, reagents, materials, patients, laboratory samples, animals, instrumentation, computing resources, or other analysis tools.
 * @property {string} dataCuration - Management activities to annotate (produce metadata), scrub data and maintain research data (including software code, where it is necessary for interpreting the data itself) for initial use and later re-use.
 * @property {string} writingOriginalDraft - Preparation, creation and/or presentation of the published work, specifically writing the initial draft (including substantive translation).
 * @property {string} writingReviewEditing - Preparation, creation and/or presentation of the published work by those from the original research group, specifically critical review, commentary or revision – including pre- or post-publication stages.
 * @property {string} visualization - Preparation, creation and/or presentation of the published work, specifically visualization/data presentation.
 * @property {string} supervision - Oversight and leadership responsibility for the research activity planning and execution, including mentorship external to the core team.
 * @property {string} projectAdministration - Management and coordination responsibility for the research activity planning and execution.
 * @property {string} fundingAcquisition - Acquisition of the financial support for the project leading to this publication.
 */
export enum CreditType {
  methodology = 'methodology',
  conceptualization = 'conceptualization',
  software = 'software',
  validation = 'validation',
  formalAnalysis = 'formal analysis',
  investigation = 'investigation',
  resources = 'resources',
  dataCuration = 'data curation',
  writingOriginalDraft = 'writing original draft',
  writingReviewEditing = 'writing review and editing',
  visualization = 'visualization',
  supervision = 'supervision',
  projectAdministration = 'project administration',
  fundingAcquisition = 'funding acquisition',
}

/**
 * Enum for acceptance status for presentations and posters.
 * @enum {string}
 */
export enum AcceptedFor {
  Presentation = 'presentation',
  Poster = 'poster',
  None = 'none',
}

export class BibtexReferences {
  /**
   * ID to reference
   */
  id!: string;
  /**
   * Reference type
   * example: article
   */
  type!: string;
  /**
   * The raw format of the bibtex citation
   * example: @article{knuth:1984, ...
   */
  raw!: string;
  /**
   * Reference title
   * example: The independence of the continuum hypothesis
   */
  title!: string;
  /**
   * The names and surnames of the current reference authors
   * example: Lisa A. Urry and Michael L. Cain and Steven A. Wasserman and Peter V. Minorsky and Jane B. Reece
   */
  author?: string;
  /**
   * Names and surnames of the editors
   * example: Hawley, Teresa S. and Hawley, Robert G.
   */
  editor?: string;
  /**
   * The title of the inbook refered in the publication
   * example: Campbell Biology
   */
  booktitle?: string;
  /**
   * The url of the reference
   * example: https://www.example.com/
   */
  publisher?: string;
  /**
   * The name of the university or degree awarding institution where the thesis was written
   * example: Massachusetts Institute of Technology
   */
  school?: string;
  /**
   * The address of the publisher or the institution
   * example: New York, NY
   */
  address?: string;
  /**
   * The year of the reference
   * example: 1998
   */
  @ApiProperty({ oneOf: [{ type: 'string' }, { type: 'number' }] })
  year?: string | number;
  /**
   * The month of the reference
   * example: jul
   */
  month?: string;
  /**
   * The pages of that appear the reference in an article...
   * example: 1143--1148
   */
  pages?: string;
  /**
   * The name of the journal
   * example: Proceedings of the National Academy of Sciences
   */
  journal?: string;

  /**
   * The volume of the article... that appear the reference
   * example: 10867
   */
  volume?: string;
  /**
   * The primary means of identifying a specific technical report
   * example: DOE-SLC-6903-1
   */
  @ApiProperty({ oneOf: [{ type: 'string' }, { type: 'number' }] })
  number?: string | number;
  /**
   * The name of the series or set of books
   * example: NordiCHI
   */
  series?: string;
  /**
   * The doi of the reference
   * example: "https://doi.org/10.0000/0000"
   */
  doi?: string;
  /**
   * Eight-digit serial number used to uniquely identify a serial publication, such as a magazine
   * example: 2049-3630
   */
  issn?: string;
  /**
   * The url of the reference
   * example: https://www.example.com/
   */
  url?: string;
  /**
   * The url of the reference
   * example: https://www.example.com/
   */
  urldate?: string;
  /**
   * The language of the reference
   * example: English
   */
  language?: string;
  /**
   * Copyright type of the reference
   * example: All rights reserved
   */
  copyright?: string;
  /**
   * Any information that might be interesting to the reader and did not fit into any of the other fields
   * example: Accessed: 2018-12-06
   */
  note?: string;
  /**
   * Keywords used for searching or possibly for annotation.
   * example: AI
   */
  keyword?: string;
  /**
   * An abstract of the work.
   * example: An Analysis of Yukon Delta Salmon Management Rita Asgeirsson, Western Washington University
   */
  abstract?: string;
}

export class iThenticate {
  /**
   * iThenticate submission ID
   */
  submissionId?: string;

  /**
   * Submission status
   */
  @ApiProperty({
    enum: SimpleSubmissionResponseStatusEnum,
    enumName: 'SimpleSubmissionResponseStatusEnum',
  })
  submissionStatus?: SimpleSubmissionResponseStatusEnum;

  /**
   * iThenticate Similarity Report status
   */
  @ApiProperty({ enum: ['PENDING', 'COMPLETE'] })
  similarityReportStatus?: 'PENDING' | 'COMPLETE';

  /**
   * User ID of the submitter
   */
  submitter?: string;
}

/**
 * Represents an author of a publication or a contributor to a project within the system.
 * This class is used to store personal and professional details about individuals who contribute to content.
 */
@Schema({ _id: false })
export class Author {
  /**
   *  Optional identifier for the user in the system, typically used for linking with user accounts
   */
  @Prop() userId?: string;

  /**
   * Optional ObjectID linking to the user’s document in the database.
   */
  @Prop() userObjectId?: Types.ObjectId;

  /**
   * First name of the author.
   */
  @Prop({ required: true }) firstName!: string;

  /**
   * Last name of the author.
   */
  @Prop({ required: true }) lastName!: string;

  /**
   * Optional nickname or alias used by the author.
   */
  @Prop() nickname?: string;

  /**
   * Optional email address of the author.
   */
  @Prop() email?: string;

  /**
   * Optional ORCID identifier for the author, providing a persistent digital identifier.
   */
  @Prop() orcid?: string;

  /**
   * List of roles or contributions the author has made, categorized by standardized CRediT taxonomy.
   */
  @Prop({ required: true, default: [] }) credit: CreditType[] = [];

  /**
   * Optional URL to the author's Gravatar image.
   */
  @Prop() gravatar?: string;

  /**
   * Optional URL to the author's avatar image.
   */
  @Prop() avatar?: string;

  /**
   * List of institutions or organizations the author is affiliated with.
   */
  @Prop({ required: true, default: [] }) institutions: string[] = [];
}

/**
 * schema factory for the Author class.
 */
export const AuthorSchema = SchemaFactory.createForClass(Author);

export enum BibtexPublicationTypes {
  article = 'article',
  book = 'book',
  booklet = 'booklet',
  conference = 'conference',
  inbook = 'inbook',
  incollection = 'incollection',
  inproccedings = 'inproccedings',
  manual = 'manual',
  masterthesis = 'masterthesis',
  misc = 'misc',
  patent = 'patent',
  phdthesis = 'phdthesis',
  poster = 'poster',
  proceedings = 'proceedings',
  techreport = 'techreport',
  unpublished = 'unpublished',
}

export const bibtexPublicationType = new Map<PublicationType, BibtexPublicationTypes>([
  [PublicationType.book, BibtexPublicationTypes.book],
  [PublicationType.bookSection, BibtexPublicationTypes.inbook],
  [PublicationType.conferencePaper, BibtexPublicationTypes.conference],
  [PublicationType.article, BibtexPublicationTypes.article],
  [PublicationType.patent, BibtexPublicationTypes.patent],
  [PublicationType.poster, BibtexPublicationTypes.poster],
  [PublicationType.preprint, BibtexPublicationTypes.unpublished],
  [PublicationType.report, BibtexPublicationTypes.techreport],
  [PublicationType.thesis, BibtexPublicationTypes.phdthesis],
  [PublicationType.technicalNote, BibtexPublicationTypes.techreport],
  [PublicationType.workingPaper, BibtexPublicationTypes.techreport],
  [PublicationType.policyReport, BibtexPublicationTypes.misc],
  [PublicationType.registeredReport, BibtexPublicationTypes.misc],
  [PublicationType.proposal, BibtexPublicationTypes.misc],
  [PublicationType.reviewArticle, BibtexPublicationTypes.misc],
  [PublicationType.video, BibtexPublicationTypes.misc],
  [PublicationType.softwareDocumentation, BibtexPublicationTypes.misc],
  [PublicationType.abstract, BibtexPublicationTypes.misc],
  [PublicationType.extendedAbstract, BibtexPublicationTypes.misc],
  [PublicationType.other, BibtexPublicationTypes.misc],
]);

/**
 * Represents a single entry in a history log.
 * This class is used to record changes or significant actions related to various entities within the system,
 * providing a timestamp and a description of the event or change.
 */
export class HistoryLogLine {
  /**
   * Timestamp for when the log entry was created
   */
  createdAt!: Date;

  /**
   * Identifier for the user who made the change
   */
  username!: string;

  /**
   * Detailed description of the action taken
   */
  description!: string;
}

/**
 * Schema factory for the DepositDocument class.
 */
export type DepositDocument = HydratedDocument<Deposit>;

/**
 * Class defining a deposit which includes publication drafts, preprints, and other submissions.
 */
@Schema({
  collection: 'deposit',
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Deposit {
  updatedAt!: number;

  /**
   * Reference to the User who created the deposit.
   */
  @Prop({
    required: true,
    type: MongooseSchema.Types.ObjectId,
    ref: UserCLASSNAME,
  })
  creator!: Types.ObjectId;

  /**
   * Reference to the assignee for the deposit
   */
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: UserCLASSNAME,
  })
  assignee?: Types.ObjectId;

  /**
   * A nickname or short title for the deposit
   */
  @Prop({ required: true })
  nickname!: string;

  /**
   * The formal title of the deposit, with whitespace trimmed
   */
  @Prop({ required: true, trim: true, set: removeExcessSpaces })
  title!: string;

  /**
   * Abstract of the publication, with whitespace trimmed
   */
  @Prop({ trim: true, set: removeExcessSpaces })
  abstract?: string;

  /**
   * Type of publication (e.g., article, book), reference to enum PublicationType
   */
  @Prop({
    required: true,
    enum: Object.values(PublicationType),
    default: PublicationType.article,
  })
  publicationType!: PublicationType;

  /**
   * Rights for accessing the deposit reference to enum AccessRight
   */
  @Prop({
    required: true,
    enum: Object.values(AccessRight),
    default: AccessRight.CC0,
  })
  accessRight!: AccessRight;

  /**
   * Submission date
   */
  @Prop() submissionDate?: Date;

  /**
   * Publication date
   */
  @Prop() publicationDate?: Date;

  /**
   *  Current status of the deposit, reference to enum DepositStatus
   */
  @Prop({
    required: true,
    enum: Object.values(DepositStatus),
    default: DepositStatus.draft,
  })
  status!: DepositStatus;

  /**
   * References to peer review documents
   */
  @Prop([
    {
      required: true,
      type: MongooseSchema.Types.ObjectId,
      ref: ReviewCLASSNAME,
      default: [],
    },
  ])
  peerReviews!: Types.ObjectId[];

  /**
   * Type of review process applied (e.g., open review).
   */
  @Prop({
    required: true,
    enum: Object.values(ReviewType),
    default: ReviewType.openReview,
  })
  reviewType!: ReviewType;

  /**
   * What the submission is accepted for (e.g., presentation)
   */
  @Prop({
    required: true,
    enum: Object.values(AcceptedFor),
    default: AcceptedFor.None,
  })
  acceptedFor!: AcceptedFor;

  /**
   * Flag to determine Whether the author can invite reviewers
   */
  @Prop({
    required: true,
    default: false,
  })
  canAuthorInviteReviewers!: boolean;

  /**
   * List of authors associated with the deposit
   */
  @Prop({ required: true, type: [AuthorSchema], default: [] })
  authors!: Author[];

  /**
   *
   */
  @Prop({ type: MongooseSchema.Types.Mixed })
  transactions?: unknown;

  /**
   * Files associated with the deposit
   */
  @Prop({ required: true, type: Array, default: [] })
  files!: FileMetadata[];

  /**
   * Additional metadata for the deposit, required for confenrences and journal community types
   */
  @Prop({ required: true, type: MongooseSchema.Types.Mixed, default: {} })
  extraMetadata!: ExtraMetadata;

  /**
   * Optional URL to the author's Gravatar image.
   */
  @Prop() gravatar?: string;

  /**
   * Optional URL to the author's Avatar image.
   */
  @Prop() avatar?: string;

  /**
   *  Keywords for searching and categorization, with whitespace trimmed
   */
  @Prop({ required: true, default: [], trim: true })
  keywords!: string[];

  /**
   *
   */
  @Prop() keccak256?: string;

  /**
   * Digital Object Identifier for the deposit, with whitespace trimmed
   */
  @Prop({ trim: true })
  doi?: string;

  /**
   * Status of the DOI (e.g., registered, pending)
   */
  @Prop({
    enum: Object.values(DoiStatus),
  })
  doiStatus?: string;

  /**
   * Pdf url where the deposit is stored
   */
  @Prop() pdfUrl?: string;

  /**
   * Academic disciplines relevant to the deposit
   */
  @Prop({ required: true, default: [] })
  disciplines!: string[];

  /**
   * Scholarly references associated with the deposit
   */
  @Prop({ required: true, type: [MongooseSchema.Types.Mixed], default: [], trim: true })
  references!: Reference[];

  /**
   * Bibtex formatted references.
   */
  @Prop({ required: true, type: [MongooseSchema.Types.Mixed], default: [], trim: true })
  bibtexReferences!: BibtexReferences[];

  /**
   * The creation date of the deposit
   */
  @Prop({ required: true, default: Date.now })
  createdOn!: Date;

  /**
   * html associated wiht the deposit
   */
  @Prop() html?: string;

  /**
   * Images associated with the deposit, with whitespace trimmed
   */
  @Prop({ required: true, default: [], trim: true })
  images!: string[];

  /**
   * The file associated with the final publication
   */
  @Prop({ type: MongooseSchema.Types.Mixed })
  publicationFile?: FileMetadata;

  /**
   * Reference to the community to which the deposit belongs
   */
  @Prop({
    required: true,
    ref: CommunityCLASSNAME,
    type: MongooseSchema.Types.ObjectId,
  })
  community!: Types.ObjectId;

  /**
   * Flag that indicates if this is the latest version of the deposit
   */
  @Prop({ required: true, default: true })
  isLatestVersion!: boolean;

  /**
   * The version number of the deposit, allows version control
   */
  @Prop({ required: true, default: 1 })
  version!: number;

  /**
   *  A unique identifier for the deposit parent
   */
  @Prop({
    required: true,
    default: uuidv4(),
  })
  parent!: string;

  /**
   * Indicates if the deposit is open for review
   */
  @Prop({ required: true, default: true }) canBeReviewed!: boolean;

  /**
   * Git pository as url
   */
  @Prop() gitRepository?: string;

  /**
   * OpenAire identifier (https://www.openaire.eu/)
   */
  @Prop() openAireIdentifier?: string;

  /**
   * The number of times the deposit has been viewed
   */
  @Prop({ required: true, default: 0 })
  views!: number;

  /**
   * Reference to the plagiarism detection (https://www.ithenticate.com/)
   */
  @Prop({ type: MongooseSchema.Types.Mixed }) iThenticate?: iThenticate;

  /**
   * Conference tracks the deposit belong to (only used for conference deposit)
   */
  @Prop() track?: string;

  /**
   * Conference track timestap (only used for conference deposits)
   */
  @Prop() newTrackTimestamp?: number;

  /**
   * Log of historical changes to the deposit
   */
  @Prop({ type: MongooseSchema.Types.Mixed, required: true, default: [] })
  history!: HistoryLogLine[];
}

/**
 * Schema factory for the Deposit class.
 */
export const DepositSchema = SchemaFactory.createForClass(Deposit);

/**
 * Virtual fields and additional schema configurations
 */
DepositSchema.virtual('ownerProfile', {
  ref: UserCLASSNAME,
  localField: 'creator',
  foreignField: '_id',
  justOne: true,
});

DepositSchema.virtual('peerReviewsPopulated', {
  ref: ReviewCLASSNAME,
  localField: 'peerReviews',
  foreignField: '_id',
  justOne: false,
});

DepositSchema.virtual('communityPopulated', {
  ref: CommunityCLASSNAME,
  localField: 'community',
  foreignField: '_id',
  justOne: true,
});

DepositSchema.virtual('socialComments', {
  ref: CommentaryCLASSNAME,
  localField: '_id',
  foreignField: 'resource',
  justOne: false,
  count: true,
});

DepositSchema.index({
  title: 'text',
  abstract: 'text',
  doi: 'text',
  'authors.orcid': 'text',
  'authors.firstName': 'text',
  'authors.lastName': 'text',
});
