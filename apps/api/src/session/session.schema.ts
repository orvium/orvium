import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { CommunityCLASSNAME, removeExcessSpaces, UserCLASSNAME } from '../utils/utils';

/**
 * Represents a speaker within a session. Includes details such as name, identifiers, and associated tags.
 */
export class Speaker {
  /**
   * Optional unique identifier for the user
   */
  userId?: string;

  /**
   * First name of the speaker
   */
  firstName!: string;

  /**
   * Last name of the speaker
   */
  lastName!: string;

  /**
   * Optional nickname for the speaker.
   */
  nickname?: string;

  /**
   * Optional ORCID identifier for academic publishing.
   */
  orcid?: string;

  /**
   * Tags related to the speaker's expertise or topics.
   */
  tags!: string[];

  /**
   *  Optional URL to the speaker's Gravatar.
   */
  gravatar?: string;

  /**
   * Optional URL to an alternative avatar image.
   */
  avatar?: string;

  /**
   * List of institutions the speaker is associated with.
   */
  institutions!: string[];
}

/**
 * Type alias for a hydrated document of a Session, which includes methods like save(),
 * find(), etc.
 */
export type SessionDocument = HydratedDocument<Session>;

/**
 * Represents a session within the system. A session can include multiple talks or presentations
 * and is associated with a specific community.
 */
@Schema({ collection: 'session', timestamps: true, toJSON: { virtuals: true } })
export class Session {
  /**
   * The title of the session, trimmed and cleaned of excess spaces.
   */
  @Prop({ required: true, trim: true, set: removeExcessSpaces })
  title!: string;

  /**
   * The ObjectId of the user who created the session.
   */
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: UserCLASSNAME,
  })
  creator!: Types.ObjectId;

  /**
   * The ObjectId of the community where the session is held.
   */
  @Prop({
    required: true,
    type: MongooseSchema.Types.ObjectId,
    ref: CommunityCLASSNAME,
  })
  community!: Types.ObjectId;

  /**
   * The starting date and time of the session.
   */
  @Prop({
    type: Date,
  })
  dateStart?: Date;

  /**
   * The ending date and time of the session.
   */
  @Prop({
    type: Date,
  })
  dateEnd?: Date;

  /**
   * Optional detailed description of the session.
   */
  @Prop({ trim: true })
  description?: string;

  /**
   * List of deposit Ids associated with this session.
   */
  @Prop([
    {
      type: MongooseSchema.Types.ObjectId,
      default: [],
      ref: 'DepositDocument',
    },
  ])
  deposits!: Types.ObjectId[];

  /**
   * List of speakers participating in the session.
   */
  @Prop([{ required: true, type: MongooseSchema.Types.Mixed, default: [] }])
  speakers!: Speaker[];

  /**
   * Optional timestamp for a new track in the session.
   */
  @Prop() newTrackTimestamp?: number;
}

/**
 * Schema definition for the Session class
 */
export const SessionSchema = SchemaFactory.createForClass(Session);

SessionSchema.index({
  title: 'text',
  description: 'text',
  'speakers.firstName': 'text',
  'speakers.lastName': 'text',
});
