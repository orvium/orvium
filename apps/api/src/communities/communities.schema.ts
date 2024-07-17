import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { CalendarDTO } from '../dtos/calendar.dto';
import { StripeDTO } from '../dtos/stripe.dto';
import { CrossrefDTO } from '../dtos/crossref.dto';
import { CommunityModerator } from './communities-moderator.schema';
import { DataCiteDTO } from '../dtos/dataCite.dto';

/**
 * Enums for various configurable options of the community
 */

/**
 * Enum for defining the type of community (all the entities are communities,
 * depending on the type it behaves as standard community, scientific journal or
 * peer-review confenrence)
 *
 * @enum {string}
 * @property {string} community - Represents a general community, which could be a broad topic or interest group.
 * @property {string} journal - Represents an academic or professional journal, which is used primarily for publications.
 * @property {string} conference - Represents a conference, which could be linked to specific events or gatherings.
 */
export enum CommunityType {
  community = 'community',
  journal = 'journal',
  conference = 'conference',
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
 * Subscription type - Enables premium and paid communities
 *
 * @enum {string}
 * @property {string} free - free community
 * @property {string} paid - paid community
 */
export enum SubscriptionType {
  free = 'free',
  premium = 'premium',
}

/**
 * FileExtensions - Enum for supported file extensions within the application.
 * This enum defines the file types that can be processed, stored, or handled in various operations.
 *
 * @enum {string}
 * @property {string} PDF - Represents files with the .pdf extension, commonly used for documents in Portable Document Format.
 * @property {string} DOCX - Represents files with the .docx extension, commonly used for Microsoft Word documents post-2007.
 * @property {string} DOC - Represents files with the .doc extension, commonly used for Microsoft Word documents pre-2007.
 * @property {string} RTF - Represents files with the .rtf extension, used for Rich Text Format documents.
 * @property {string} TEX - Represents files with the .tex extension, commonly used for documents created in LaTeX.
 * @property {string} EPUB - Represents files with the .epub extension, used for eBook files in the EPUB format.
 * @property {string} ODT - Represents files with the .odt extension, used for OpenDocument Text documents.
 * @property {string} ZIP - Represents files with the .zip extension, used for compressed archives.
 */
export enum FileExtensions {
  PDF = 'pdf',
  DOCX = 'docx',
  DOC = 'doc',
  RTF = 'rtf',
  TEX = 'tex',
  EPUB = 'epub',
  ODT = 'odt',
  ZIP = 'zip',
}

/**
 * Community Status - community publication lifecycle
 *
 * @enum{string}
 * @property {string} draft -  just created, before sending for approval
 * @property {string} pendingApproval - waiting for platform admin review and approval
 * @property {string} published - after approval and public community
 */
export enum CommunityStatus {
  draft = 'draft',
  pendingApproval = 'pending approval',
  published = 'published',
}

/**
 * Type alias for a Mongoose Hydrated Document of a Community.
 */
export type CommunityDocument = HydratedDocument<Community>;

/**
 * Conference tracks
 * Subdocument used only by communities type conference
 */
export class Track {
  /**
   * Unix timestamp for the track
   */
  timestamp!: number;

  /**
   * Title of the track
   */
  title!: string;

  /**
   * Optional description of the track
   */
  description?: string;
}

/**
 * Schema definition for a community document
 */
@Schema({
  /**
   * Specifies the MongoDB collection name
   */
  collection: 'community',

  /** 
   * Automatically creates createdAt and updatedAt fields
  
   */
  timestamps: true,
  /**
   * Ensures virtuals are included when document is converted to JSON
   */
  toJSON: { virtuals: true },

  /**
   * Ensures virtuals are included when document is converted to a plain object
   */
  toObject: { virtuals: true },
})
export class Community {
  /**
   * Name of the community, trimming whitespace and required
   */
  @Prop({ trim: true, required: true })
  name!: string;

  /**
   * The creator's ObjectId, must be a valid and existing ID
   */
  @Prop({
    required: true,
    type: MongooseSchema.Types.ObjectId,
    ref: 'UserDocument', // References a UserDocument, enforcing data integrity
  })
  creator!: Types.ObjectId;

  /**
   * Current status of the community, default is 'draft'
   */
  @Prop({
    required: true,
    enum: Object.values(CommunityStatus),
    default: CommunityStatus.draft,
  })
  status!: CommunityStatus;

  /**
   * Optional community description, with whitespace trimmed
   */
  @Prop({ trim: true })
  description?: string;

  /**
   * Optional country, with whitespace trimmed
   */
  @Prop({ trim: true })
  country?: string;

  /**
   * Optional Twitter URL, with whitespace trimmed
   */
  @Prop({ trim: true })
  twitterURL?: string;

  /**
   * Optional Facebook URL, with whitespace trimmed
   */
  @Prop({ trim: true })
  facebookURL?: string;

  /**
   * Optional website URL, with whitespace trimmed
   */
  @Prop({ trim: true })
  websiteURL?: string;

  /**
   * Optional logo URL, with whitespace trimmed
   */
  @Prop({ trim: true })
  logoURL?: string;

  /**
   * Number of followers, defaulting to 0
   */
  @Prop({ default: 0, required: true })
  followersCount!: number;

  /**
   * Optional banner URL (head decoration), with whitespace trimmed
   */
  @Prop({ trim: true })
  bannerURL?: string;

  /**
   * Optional image URL for the community card, with whitespace trimmed
   */
  @Prop({ trim: true })
  cardImageUrl?: string;

  /**
   * Optional acknowledgement text, with whitespace trimmed
   */
  @Prop({ trim: true })
  acknowledgement?: string;

  /**
   * Type of community (enum CommunityType), default is 'community'
   */
  @Prop({
    required: true,
    enum: Object.values(CommunityType),
    default: CommunityType.community,
  })
  type!: CommunityType;

  /**
   * Subscription type (enum SubscriptionType), default is 'free'
   */
  @Prop({
    required: true,
    enum: Object.values(SubscriptionType),
    default: SubscriptionType.free,
  })
  subscription!: SubscriptionType;

  /**
   * Optional URL to guidelines document, with whitespace trimmed
   */
  @Prop({ trim: true })
  guidelinesURL?: string;

  /**
   * Unique codename for the community, required and must be unique in the database
   */
  @Prop({ trim: true, maxlength: 23, required: true, unique: true })
  codename!: string;

  /**
   * Optional API key for iThenticate plagiarism service, with whitespace trimmed
   */
  @Prop({ trim: true })
  iThenticateAPIKey?: string;

  /**
   * Optional webhook URL for iThenticate notifications, with whitespace trimmed
   */
  @Prop({ trim: true })
  iThenticateWebhook?: string;

  /**
   * Optional boolean to indicate if End User License Agreement (EULA) is needed for iThenticate
   */
  @Prop()
  iThenticateEULANeeded?: boolean;

  /**
   * Stores the number of views this community has garnered, initialized to 0
   */
  @Prop({ required: true, default: 0 })
  views!: number;

  /**
   * Array of ObjectIds linking to other Community documents that represent conference proceedings
   */
  @Prop([{ required: true, default: [], type: MongooseSchema.Types.ObjectId, ref: Community.name }])
  conferenceProceedings!: Types.ObjectId[];

  /**
   * Array of Track subdocuments (used for conferences), initialized to an empty array
   */
  @Prop({ required: true, default: [] })
  newTracks!: Track[];

  /**
   * Array of AccessRight enums, defaults include various Creative Commons licenses
   */
  @Prop({
    required: true,
    type: [String],
    enum: Object.values(AccessRight),
    default: [AccessRight.CC0, AccessRight.CCBY, AccessRight.CCBYND],
  })
  customLicenses!: AccessRight[];

  /**
   * Boolean to indicate if reviews should be private, default is false
   */
  @Prop({ required: true, default: false })
  privateReviews!: boolean;

  /**
   * Optional International Standard Serial Number (ISSN), with whitespace trimmed
   */
  @Prop({ trim: true })
  issn?: string;

  /**
   * Boolean flag to allow authors to invite reviewers, default is false
   */
  @Prop({
    required: true,
    default: false,
  })
  canAuthorInviteReviewers!: boolean;

  /**
   * Array of CalendarDTOs, used to store important dates, initialized to an empty array
   */
  @Prop([{ required: true, type: MongooseSchema.Types.Mixed, default: [] }])
  calendarDates!: CalendarDTO[];

  /**
   * Boolean to control visibility of the calendar, default is false
   */
  @Prop({ required: true, default: false })
  calendarVisible!: boolean;

  /**
   * Optional array of allowed file extensions from the FileExtensions enum
   */
  @Prop()
  preferredFileExtensions?: FileExtensions[];

  /**
   * Optional StripeDTO for storing associated Stripe account information
   */
  @Prop({ type: MongooseSchema.Types.Mixed })
  stripeAccount?: StripeDTO;

  /**
   * Boolean to control visibility of products associated with the community, default is false
   */
  @Prop({ required: true, default: false })
  productsVisible!: boolean;

  /**
   * Optional CrossrefDTO object, may be null, for storing Crossref-related data if applicable
   */
  @Prop({ type: MongooseSchema.Types.Mixed })
  crossref?: CrossrefDTO | null;

  /**
   * Optional DataCiteDTO object, may be null, used to store DataCite-related data if applicable
   */
  @Prop({ type: MongooseSchema.Types.Mixed })
  datacite?: DataCiteDTO | null;

  /**
   * Boolean indicating whether the author's identity should be shown, default is false (peer-review related)
   */
  @Prop({ required: true, default: false }) showIdentityToAuthor!: boolean;

  /**
   * Boolean indicating whether the author's identity should be shown to everyone, default is false (peer-review related)
   */
  @Prop({ required: true, default: false }) showIdentityToEveryone!: boolean;

  /**
   * Boolean indicating whether reviews should be visible to the author, default is false (peer-review related)
   */
  @Prop({ required: true, default: false }) showReviewToAuthor!: boolean;

  /**
   * Boolean indicating whether reviews should be visible to everyone, default is false (peer-review related)
   */
  @Prop({ required: true, default: false }) showReviewToEveryone!: boolean;
}

/**
 * Export the schema to be used in the application
 */
export const CommunitySchema = SchemaFactory.createForClass(Community);

/**
 * Pre-save hooks to perform validations before saving a document
 */
CommunitySchema.pre<CommunityDocument>('save', function (next) {
  /** Ensure that only one DOI provider can be active at a time */
  if (this.datacite && this.crossref) {
    throw new Error('Only one DOI provider can be active at the same time.');
  }

  /** Ensure consistency in review visibility settings */
  if (this.showReviewToEveryone && !this.showReviewToAuthor) {
    throw new Error('Show review to author must be true when show review to everyone is true.');
  }

  /** Ensure consistency in identity visibility settings */
  if (this.showIdentityToEveryone && !this.showIdentityToAuthor) {
    throw new Error(
      'Show review identity to author must be true when show review identity to everyone is true.'
    );
  }

  next();
});

/**
 * Virtuals to resolve references to other documents
 */
CommunitySchema.virtual('conferenceProceedingsPopulated', {
  ref: Community.name, // References the Community collection itself
  localField: 'conferenceProceedings', // Field in this collection
  foreignField: '_id', // Field in the referenced collection to match `localField`
  justOne: false, // Indicates that multiple documents can be returned
});

CommunitySchema.virtual('moderatorsPopulated', {
  ref: CommunityModerator.name, // Reference to the CommunityModerator collection
  localField: '_id', // Local field to match against
  foreignField: 'community', // Field in the CommunityModerator collection that holds the reference
  justOne: false, // Indicates that multiple documents can be returned
});
