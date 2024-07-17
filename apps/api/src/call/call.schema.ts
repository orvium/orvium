import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { CommunityCLASSNAME } from '../utils/utils';

/**
 * Enum for identifying the type of call within the conference.
 *
 * @enum {string}
 * @property {string} papers - call for papers
 * @property {string} abstract - call for abstracts
 *
 */
export enum CallType {
  papers = 'call for papers',
  abstracts = 'call for abstracts',
}

/**
 * Represents a fully hydrated Mongoose document of the call.
 */
export type CallDocument = HydratedDocument<Call>;

/**
 * Represents a call for papers or abstracts for a conference managed within the platform.
 * This class models the data structure for storing call information in the database,
 * including details like title, deadline, type, and associated community.
 */
@Schema({ collection: 'call', timestamps: true, toJSON: { virtuals: true } })
export class Call {
  /**
   * The title of the call, with whitespace trimmed
   */
  @Prop({ trim: true })
  title!: string;

  /**
   * The submission deadline for the call (optional), with whitespace trimmed
   */
  @Prop({ trim: true })
  deadline?: Date;

  /**
   * A detailed description of what the call involves, with whitespace trimmed
   */
  @Prop({ trim: true })
  description!: string;

  /**
   * The type of call (papers or abstracts)
   */
  @Prop({
    required: true,
    enum: Object.values(CallType),
    default: CallType.papers,
  })
  callType!: CallType;

  /**
   * The scope or focus area of the call, with whitespace trimmed
   */
  @Prop({ trim: true })
  scope!: string;

  /**
   * Names of the guest editors for this call, with whitespace trimmed
   */
  @Prop({ trim: true })
  guestEditors!: string;

  /**
   * List of academic disciplines relevant to the call, with whitespace trimmed
   */
  @Prop({ trim: true })
  disciplines: string[] = [];

  /**
   * Name of the primary contact person for this call, with whitespace trimmed
   */
  @Prop({ trim: true })
  contact!: string;

  /**
   * Email address for the primary contact person, with whitespace trimmed
   */
  @Prop({ trim: true })
  contactEmail!: string;

  /**
   * Flag indicating whether the call is publicly visible, with whitespace trimmed
   */
  @Prop({ trim: true, default: false })
  visible!: boolean;

  /**
   * Reference to the associated community document
   */
  @Prop({
    required: true,
    ref: CommunityCLASSNAME,
    type: MongooseSchema.Types.ObjectId,
  })
  community!: Types.ObjectId;
}

/**
 * Schema factory for the Call class.
 */
export const CallSchema = SchemaFactory.createForClass(Call);
