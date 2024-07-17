import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { User } from '../users/user.schema';
import { FileMetadata } from '../dtos/filemetadata.dto';
import {
  CommentaryCLASSNAME,
  CommunityCLASSNAME,
  DepositCLASSNAME,
  removeExcessSpaces,
  UserCLASSNAME,
} from '../utils/utils';
import { DoiStatus } from '../doi/doi-log.schema';

/**
 * Enum for defining the kind of review being conducted.
 *
 * @enum {string}
 * @property {string} peerReview - peer-review standard review type
 * @property {string} copyEdition - copy editing review
 */
export enum ReviewKind {
  peerReview = 'peer review',
  copyEditing = 'copy editing',
}

/**
 * Enum for the status of the review within the workflow process.
 *
 * @enum {string}
 * @property {string} draft - Indicates that the review is in progress and not yet ready for final consideration.
 * @property {string} published - Signifies that the review has been finalized and is publicly accessible, if applicable.
 * @property {string} pendingApproval - Represents a state where the review is awaiting approval from necessary stakeholders.
 */
export enum ReviewStatus {
  draft = 'draft',
  published = 'published',
  pendingApproval = 'pending approval',
}

/**
 * Enum representing the possible decisions that can be made following a review process.
 * This helps to standardize the outcomes of review sessions across the application, facilitating
 * consistent handling of review results and clear communication of outcomes.
 *
 * @enum {string}
 * @property {string} accepted - Indicates that the reviewed content has been accepted without any need for revisions.
 * @property {string} minorRevision - Generally acceptable but requires minor revisions before it can be accepted.
 * @property {string} majorRevision - Signifies that the reviewed content requires major revisions to be acceptable.
 */
export enum ReviewDecision {
  accepted = 'accepted',
  minorRevision = 'minor revision',
  majorRevision = 'major revision',
}

/**
 * Represents a single entry in a history log. This class is typically used to record significant events or changes
 * related to other entities in the application, such as changes in a review's status, updates to user profiles, etc.
 */
export class HistoryLogLine {
  /**
   * The timestamp at which the event was recorded. This provides a precise record of when the event occurred.
   */
  createdAt!: Date;

  /**
   * Username of the user who was responsible for the event. Helps tracking who made certain changes or actions within the system
   */
  username!: string;

  /**
   * A brief description of the event or action taken.
   */
  description!: string;
}

/**
 * Type alias for a hydrated document of a Review, which includes methods like save(),
 * find(), etc., from Mongoose.
 */
export type ReviewDocument = HydratedDocument<Review>;

/**
 * Represents a review within the system. This class encapsulates all the data for a review,
 * including the user who created it, the content of the review, associated metadata, and historical logs.
 */
@Schema({
  collection: 'peer_review',
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Review {
  /**
   * The user ID of the review's creator, referencing the User schema.
   */
  @Prop({
    required: true,
    type: MongooseSchema.Types.ObjectId,
    ref: UserCLASSNAME,
  })
  creator!: Types.ObjectId;

  /**
   * The name of the author of the review
   */
  @Prop({ required: true, trim: true }) author!: string;

  /**
   * Additional comments provided by the reviewer, processed to remove excess spaces.
   */
  @Prop({ trim: true, set: removeExcessSpaces })
  comments?: string;

  /**
   * The current status of the review, indicating its stage in the review process.
   */
  @Prop({
    required: true,
    enum: Object.values(ReviewStatus),
    default: ReviewStatus.draft,
  })
  status!: ReviewStatus;

  /**
   *  The type of review being conducted (e.g., peer review, copy editing).
   */
  @Prop({
    required: true,
    enum: Object.values(ReviewKind),
    default: ReviewKind.peerReview,
  })
  kind!: ReviewKind;

  /**
   * Optional monetary reward for the reviewer, if applicable
   */
  @Prop() reward?: number;

  /**
   * Reference to the deposit this review is associated with.
   */
  @Prop({
    required: true,
    type: MongooseSchema.Types.ObjectId,
    ref: DepositCLASSNAME,
  })
  deposit!: Types.ObjectId;

  /**
   * Digital Object Identifier for the review, if it has been registered.
   */
  @Prop({ trim: true })
  doi?: string;

  /**
   * The status of the DOI registration
   */
  @Prop({
    enum: Object.values(DoiStatus),
    type: String,
  })
  doiStatus?: DoiStatus;

  /**
   * URL to the Gravatar image of the reviewer
   */
  @Prop() gravatar?: string;

  /**
   * URL to an alternative avatar image of the reviewer
   */
  @Prop() avatar?: string;

  /**
   * The decision made based on the review (e.g., accepted, requires revision).
   */
  @Prop({
    required: true,
    enum: Object.values(ReviewDecision),
    default: ReviewDecision.accepted,
  })
  decision!: ReviewDecision;

  /**
   * Metadata about any primary file associated with the review.
   */
  @Prop({ type: MongooseSchema.Types.Mixed }) file?: FileMetadata;

  /**
   * List of additional files related to the review
   */
  @Prop({ required: true, type: Array, default: [] }) extraFiles!: FileMetadata[];

  /**
   * Record of any transactions related to the review.
   */
  @Prop({ type: MongooseSchema.Types.Mixed }) transactions?: unknown;

  /**
   * The date when the review was created.
   */
  @Prop({ required: true, default: Date.now }) creationDate!: Date;

  /**
   * The date when the review was published, if applicable.
   */
  @Prop() publicationDate?: Date;

  /**
   * Indicates whether the reviewer was formally invited to conduct the review.
   */
  @Prop({ required: true, default: false }) wasInvited!: boolean;

  /**
   * Flag indicating whether the reviewer’s identity should be disclosed to the author.
   */
  @Prop({ required: true, default: false }) showIdentityToAuthor!: boolean;

  /**
   * Flag indicating whether the reviewer’s identity should be publicly disclosed.
   */
  @Prop({ required: true, default: false }) showIdentityToEveryone!: boolean;

  /**
   * A cryptographic hash of the review content (for integrity verification).
   */
  @Prop() keccak256?: string;

  /**
   * The HTML content of the review.
   */
  @Prop() html?: string;

  /**
   * URLs to any images associated with the review.
   */
  @Prop({ required: true, default: [], trim: true })
  images!: string[];

  /**
   * URL to a PDF version of the review
   */
  @Prop() pdfUrl?: string;

  /**
   * A log of historical entries related to the review for auditing and tracking changes.
   */
  @Prop({ type: MongooseSchema.Types.Mixed, required: true, default: [] })
  history!: HistoryLogLine[];

  /**
   * The ID of the community within which the review was conducted.
   */
  @Prop({
    required: true,
    ref: CommunityCLASSNAME,
    type: MongooseSchema.Types.ObjectId,
  })
  community!: Types.ObjectId;

  /**
   * Indicates if the review should be visible to the author.
   */
  @Prop({ required: true, default: false }) showReviewToAuthor!: boolean;

  /**
   * Indicates if the review should be publicly visible
   */
  @Prop({ required: true, default: false }) showReviewToEveryone!: boolean;

  /**
   * The number of times the review has been viewed
   */
  @Prop({ required: true, default: 0 })
  views!: number;
}

/**
 * Schema factory for class Review
 */
export const ReviewSchema = SchemaFactory.createForClass(Review);

ReviewSchema.pre<ReviewDocument>('save', function (next) {
  if (this.showReviewToEveryone && !this.showReviewToAuthor) {
    throw new Error('Show review to author must be true when show review to everyone is true.');
  }

  if (this.showIdentityToEveryone && !this.showIdentityToAuthor) {
    throw new Error(
      'Show review identity to author must be true when show review identity to everyone is true.'
    );
  }

  next();
});

ReviewSchema.virtual('ownerProfile', {
  ref: User.name,
  localField: 'creator',
  foreignField: '_id',
  justOne: true,
});

ReviewSchema.virtual('depositPopulated', {
  ref: DepositCLASSNAME,
  localField: 'deposit',
  foreignField: '_id',
  justOne: true,
});

ReviewSchema.virtual('communityPopulated', {
  ref: CommunityCLASSNAME,
  localField: 'community',
  foreignField: '_id',
  justOne: true,
});

ReviewSchema.virtual('socialComments', {
  ref: CommentaryCLASSNAME,
  localField: '_id',
  foreignField: 'resource',
  justOne: false,
  count: true,
});
