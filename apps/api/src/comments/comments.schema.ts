import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import {
  CommentaryCLASSNAME,
  CommunityCLASSNAME,
  DepositCLASSNAME,
  ReviewCLASSNAME,
  UserCLASSNAME,
} from '../utils/utils';

/**
 * Tags used to categorize comments within the system
 * @enum {string}
 */
export enum CommentTags {
  author = 'author',
  reviewer = 'reviewer',
  admin = 'admin',
  moderator = 'moderator',
}

/**
 * Type alias for a hydrated document of a Commentary
 */
export type CommentaryDocument = HydratedDocument<Commentary>;

/**
 * Defines the schema for a commentary (comment) on various resources within the platform.
 * Comments can be linked to users, communities, and resources like deposits or reviews.
 */
@Schema({ collection: 'comments', timestamps: true, toJSON: { virtuals: true } })
export class Commentary {
  /**
   *  Reference to the User who made the comment
   */
  @Prop({
    required: true,
    type: MongooseSchema.Types.ObjectId,
    ref: UserCLASSNAME,
  })
  user_id!: Types.ObjectId;

  /**
   * Reference to the Community where the comment was made
   */
  @Prop({
    required: true,
    type: MongooseSchema.Types.ObjectId,
    ref: CommunityCLASSNAME,
  })
  community!: Types.ObjectId;

  /**
   * Generic reference to the resource (deposit or review) that the comment is attached to
   */
  @Prop({
    required: true,
    type: MongooseSchema.Types.ObjectId,
    refPath: 'resourceModel',
  })
  resource!: Types.ObjectId;

  /**
   * The model of the resource that is being commented on (either deposit or review)
   */
  @Prop({
    type: String,
    required: true,
    enum: [DepositCLASSNAME, ReviewCLASSNAME],
  })
  resourceModel!: typeof DepositCLASSNAME | typeof ReviewCLASSNAME;

  /**
   * The textual content of the comment, with whitespace trimmed
   */
  @Prop({ required: true, trim: true })
  content!: string;

  /**
   * Categorization tags for the comment (e.g., author, reviewer).
   */
  @Prop({
    required: true,
    default: [],
  })
  tags!: CommentTags[];

  /**
   * Optional reference to a parent comment if this is a reply.
   */
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: CommentaryCLASSNAME,
  })
  parent?: Types.ObjectId;

  /**
   * Indicator if the comment has replies (not stored in DB, used for app logic)
   */
  @Prop()
  hasReplies?: boolean; // We do not save hasReplies in BD, but we need it to use ActionsInterceptor
}

/**
 * schema factory for the Commentary class.
 */
export const CommentSchema = SchemaFactory.createForClass(Commentary);

/**
 * Define virtuals for user and parent comment references
 */
CommentSchema.virtual('user', {
  ref: UserCLASSNAME,
  localField: 'user_id',
  foreignField: '_id',
  justOne: true,
});

CommentSchema.virtual('parentPopulated', {
  ref: CommentaryCLASSNAME,
  localField: 'parent',
  foreignField: '_id',
  justOne: true,
});
