import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { User } from '../users/user.schema';
import { CommunityCLASSNAME, UserCLASSNAME } from '../utils/utils';

/**
 * Interface representing the data structure for an invite.
 */
export interface IInviteData {
  /**
   * The ObjectId of the deposit related to the invite.
   */
  depositId: Types.ObjectId;

  /**
   * The title of the deposit
   */
  depositTitle: string;

  /**
   * Optional ObjectId of the review if applicable.
   */
  reviewId?: Types.ObjectId;
}

/**
 * Enum for possible types of invites within the system.
 *
 * @enum {string}
 * @property {string} review - peer-review
 * @property {string} copy editing
 */
export enum InviteType {
  review = 'review',
  copyEditing = 'copy editing',
}

/**
 * Enum for tracking the status of an invite.
 * @enum {string}
 */
export enum InviteStatus {
  pending = 'pending',
  accepted = 'accepted',
  rejected = 'rejected',
}

/**
 * Type alias for a hydrated document of an Invite.
 */
export type InviteDocument = HydratedDocument<Invite>;

/**
 * Represents an invitation within the system, used to manage and track invites to various activities like reviews.
 */
@Schema({ collection: 'invite', timestamps: true, toJSON: { virtuals: true } })
export class Invite {
  /**
   * The type of invite, determining the activity involved, reference to enum InviteType
   */
  @Prop({ required: true, trim: true })
  inviteType!: InviteType;

  /**
   * Current status of the invite, reference to enum InviteStatus
   */
  @Prop({ required: true, default: InviteStatus.pending })
  status!: InviteStatus;

  /**
   * The ObjectId of the user who sent the invite
   */
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: User.name })
  sender!: Types.ObjectId;

  /**
   * The email address of the user being invited. Stored in lowercase
   */
  @Prop({ required: true, trim: true, lowercase: true })
  addressee!: string;

  /**
   * The date and time when the invite was created.
   */
  @Prop({ required: true, default: Date.now })
  createdOn!: Date;

  /**
   * Optional date specifying when the invite expires
   */
  @Prop({ type: Date })
  dateLimit?: Date;

  /**
   * The ObjectId of the community related to the invite
   */
  @Prop({
    required: true,
    ref: CommunityCLASSNAME,
    type: MongooseSchema.Types.ObjectId,
  })
  community!: Types.ObjectId;

  /**
   * Structured data containing details relevant to the invite, such as deposit and review IDs
   */
  @Prop({ required: true, type: MongooseSchema.Types.Mixed, default: {} })
  data!: IInviteData;

  /**
   * Optional message included with the invite.
   */
  @Prop({ required: false }) message?: string;
}

/**
 * Schema for the Invite class
 */
export const InviteSchema = SchemaFactory.createForClass(Invite);

InviteSchema.virtual('senderPopulated', {
  ref: UserCLASSNAME,
  localField: 'sender',
  foreignField: '_id',
  justOne: true,
});

InviteSchema.index({
  'data.depositTitle': 'text',
  addressee: 'text',
});
