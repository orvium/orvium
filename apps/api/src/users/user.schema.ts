import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { Logger } from '@nestjs/common';
import { CommunityCLASSNAME, getMd5Hash } from '../utils/utils';

/**
 * Enum representing the various categories or classifications of users within the application.
 * Each user type represents a specific group with potentially different roles, permissions, and access levels.
 * This classification can be used to tailor user experiences, manage access controls, and drive application logic.
 *
 * @enum {string}
 * @property {string} student - Represents users who are currently enrolled as students in educational institutions.
 * @property {string} medical - Represents users involved in the medical or healthcare fields.
 * @property {string} business - Users identified as part of the business community, such as entrepreneurs
 * @property {string} researcher - Includes individuals involved in research activities.
 * @property {string} citizen - General classification for users without specific professional or academic affiliations.
 * @property {string} academic - Specifically relates to users who are members of academic institutions.
 */
export enum UserType {
  student = 'student',
  medical = 'medical',
  business = 'business',
  researcher = 'researcher',
  citizen = 'citizen',
  academic = 'academic',
}

/**
 * Class to handle confirmation codes for email verification processes.
 */
export class ConfirmEmailCode {
  /**
   * The actual confirmation code sent via email.
   */
  codeEmail!: string;

  /**
   * The actual confirmation code sent via email.
   */
  attemptsLeft!: number;
}

/**
 * Type alias for a hydrated document of a User, providing methods like save(), find(), etc.
 */
export type UserDocument = HydratedDocument<User>;

/**
 * Represents a user profile within the system. This class includes comprehensive information
 * about the user, ranging from personal details to internal settings and permissions.
 */
@Schema({ collection: 'profile', timestamps: true, toJSON: { virtuals: true } })
export class User {
  /**
   * A unique identifier for the user
   */
  @Prop({ required: true }) userId!: string;

  /**
   * List of identifiers from different providers linked to this user profile.
   */
  @Prop({ required: true, default: [] }) providerIds!: string[];

  /**
   * User's chosen nickname, unique across the platform.
   */
  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  nickname!: string;

  /**
   * User's primary email address, unique and indexed.
   */
  @Prop({ unique: true, sparse: true, trim: true, lowercase: true })
  email?: string;

  /**
   * User Firsname, with trimmed whitespace
   */
  @Prop({ trim: true, default: '' }) firstName!: string;

  /**
   * User Lastname, with trimmed whitespace
   */
  @Prop({ trim: true, default: '' }) lastName!: string;

  /**
   * Optional short biography of the user, with trimmed whitespace
   */
  @Prop({ trim: true }) aboutMe?: string;

  /**
   * Optional ORCID identifier for researchers.
   */
  @Prop({ trim: true }) orcid?: string;

  /**
   * Optional LinkedIn profile URL.
   */
  @Prop({ trim: true }) linkedin?: string;

  /**
   * Optional user Blog Url
   */
  @Prop({ trim: true }) blog?: string;

  /**
   * Main role held by the user within the system
   */
  @Prop({ trim: true }) role?: string;

  /**
   * List of communities the user is associated with.
   */
  @Prop([
    {
      ref: CommunityCLASSNAME,
      required: true,
      type: MongooseSchema.Types.ObjectId,
      default: [],
    },
  ])
  communities!: Types.ObjectId[];

  // Internal fields

  /**
   * Email address pending confirmation.
   */
  @Prop() emailPendingConfirmation?: string;

  /**
   * Date and time when the email was confirmed.
   */
  @Prop() emailConfirmedOn?: Date;

  /**
   * Date and time when the email was last changed
   */
  @Prop() emailChangedOn?: Date;

  /**
   * Number of invitations the user can send to others to join the platform. Default 20
   */
  @Prop({ required: true, default: 20 }) invitationsAvailable!: number;

  /**
   * Token used for inviting others to the platform.
   */
  @Prop({ required: true }) inviteToken!: string;

  /**
   * Identifier of the user who invited this user, if applicable.
   */
  @Prop() invitedBy?: string;

  /**
   * URL to the user's Gravatar image.
   */
  @Prop() gravatar?: string;

  /**
   * URL to the user's Avatar image.
   */
  @Prop() avatar?: string;

  /**
   * Percentage of the user profile completion.
   */
  @Prop({ required: true, default: 0 }) percentageComplete!: number;

  /**
   * List of academic or professional disciplines associated with the user.
   */
  @Prop({ required: true, default: [] })
  disciplines!: string[];

  /**
   * Flag indicating whether the user has completed the onboarding process.
   */
  @Prop({ required: true, default: false })
  isOnboarded!: boolean;

  /**
   * Category of the user as defined by the UserType enum.
   */
  @Prop({
    required: true,
    enum: Object.values(UserType),
    default: UserType.citizen,
  })
  userType!: UserType;

  /**
   * List of institutions the user is associated with.
   */
  @Prop({ required: true, default: [] })
  institutions!: string[];

  /**
   * List of roles the user holds in various contexts within the platform.
   */
  @Prop({ required: true, default: [] })
  roles!: string[];

  /**
   * List of deposits that the user has starred or marked as favorite.
   */
  @Prop({ required: true, default: [] })
  starredDeposits!: string[];

  /**
   * Whether the user has accepted the terms and conditions.
   */
  @Prop({ required: true, default: false })
  acceptedTC!: boolean;

  /**
   * Optional URL to the user's banner image.
   */
  @Prop() bannerURL?: string;

  /**
   * Identifier of another user this user is impersonating, if any.
   */
  @Prop() impersonatedUser?: string;

  /**
   * Whether the user has accepted the End User License Agreement for iThenticate.
   */
  @Prop() iThenticateEULAAccepted?: boolean;

  /**
   * Object containing the code for confirming the user's email and the number of attempts left
   */
  @Prop({ type: MongooseSchema.Types.Mixed }) confirmEmailCode?: ConfirmEmailCode;
}

/**
 * Schema Factory for UserSchema
 */
export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre<UserDocument>('save', function (next) {
  Logger.debug('User document pre save hook');

  if (!this.email) {
    this.isOnboarded = false;
  }

  if (this.email) {
    this.gravatar = getMd5Hash(this.email);
  } else {
    this.gravatar = getMd5Hash(this.nickname);
  }

  // Percentage of profile complete
  this.percentageComplete = calculateProfileCompletion(this);

  next();
});

function calculateProfileCompletion(user: UserDocument): number {
  let fields = ['firstName', 'lastName', 'email', 'blog', 'aboutMe'];
  if (user.userType != UserType.citizen) {
    fields = fields.concat(['role', 'orcid', 'linkedin', 'disciplines']);
  }
  let counter = 0;
  for (const field of fields) {
    if (user.get(field)) {
      counter++;
    }
  }

  return (100 * counter) / fields.length;
}

UserSchema.index({
  userId: 'text',
  email: 'text',
  firstName: 'text',
  lastName: 'text',
});

UserSchema.index(
  {
    providerIds: 1,
  },
  { unique: true, sparse: true }
);
