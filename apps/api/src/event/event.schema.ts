import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export const RETRY_NUMBER = 1;

/**
 * Enum representing the various statuses that an event can be in within the system.
 * This enumeration defines the lifecycle stages of events such as notifications, tasks, etc.
 *
 * @enum {string}
 * @property {string} PENDING - The event has been created and is waiting to be processed.
 * @property {string} PROCESSED - The event has been successfully processed.
 * @property {string} PROCESSING - The event is currently being processed.
 * @property {string} FAILED - The event failed to be processed successfully.
 */
export enum EventStatus {
  PENDING = 'pending',
  PROCESSED = 'processed',
  PROCESSING = 'processing',
  FAILED = 'failed',
}

//TODO comments
export enum EventType {
  INVITE = 'InviteUsers',
  FEEDBACK = 'Feedback',
  CONFIRM_EMAIL = 'ConfirmEmailAddress',
  GENERAL_NOTIFICATION = 'GeneralNotification',
  REVIEW_CREATED = 'ReviewCreated',
  COMMENT_CREATED = 'CommentCreated',
  REPLY_COMMENT_CREATED = 'ReplyCommentCreated',
  REVIEW_INVITATION = 'ReviewInvitation',
  REVIEW_INVITATION_EMAIL = 'ReviewInvitationEmail',
  REVIEW_INVITATION_ACCEPTED = 'ReviewInvitationAccepted',
  REVIEW_INVITATION_REJECTED = 'ReviewInvitationRejected',
  REVIEW_INVITATION_ACCEPTED_CONFIRMATION = 'ReviewInvitationAcceptedConfirmation',
  NEW_FILE = 'NewFile',
  USER_CREATED = 'UserCreated',
  COMMUNITY_PENDING_APPROVAL = 'CommunityPendingApproval',
  DEPOSIT_PENDING_APPROVAL = 'DepositPendingApproval',
  DEPOSIT_BACK_TO_PENDING_APPROVAL = 'DepositBackToPendingApproval',
  REVIEW_PENDING_APPROVAL = 'ReviewPendingApproval',
  REVIEW_TO_DRAFT = 'ReviewDraft',
  OPENAIRE_HARVESTER = 'OpenAireHarvester',
  IMPORT_DEPOSIT_VIEWS = 'ImportDepositViews',
  IMPORT_REVIEW_VIEWS = 'ImportReviewViews',
  IMPORT_COMMUNITY_VIEWS = 'ImportCommunityViews',
  DEPOSIT_SUBMITTED = 'DepositSubmitted',
  DEPOSIT_REJECTED = 'DepositRejected',
  DEPOSIT_DRAFTED = 'DepositDrafted',
  DEPOSIT_ACCEPTED = 'DepositAccepted',
  DEPOSIT_PUBLISHED = 'DepositPublished',
  MODERATOR_ASSIGNED = 'ModeratorAssigned',
  EDITOR_ASSIGNED = 'EditorAssigned',
  REVIEW_SUBMITTED = 'ReviewSubmitted',
  REVIEW_ACCEPTED = 'ReviewAccepted',
  CREATE_REMINDERS = 'CreateReminders',
  REMINDER_DRAFT_DEPOSIT = 'ReminderDraftDeposit',
  WRONG_PROVIDER = 'WrongProvider',
  EXTRACT_HTML = 'ExtractHTML',
  ITHENTICATE_REPORT_READY = 'iThenticateReportReady',
  COMMUNITY_SUBMITTED = 'CommunitySubmitted',
  COMMUNITY_ACCEPTED = 'CommunityAccepted',
  CHAT_MESSAGE = 'ChatMessage',
  UNREAD_MESSAGE = 'UnreadMessage',
  FAKE_EVENT = 'FakeEvent',
}

export interface IEvent {
  eventType: EventType;
  data: unknown;
  processedOn?: number;
  createdOn: Date;
  scheduledOn: Date;
  retryCount: number;
  status: EventStatus;
}

export class EventDTO {
  eventType!: EventType;
  scheduledOn?: Date;
  data: unknown;
}

export type EventDocument = HydratedDocument<AppEvent>;

/**
 * Represents an event within the system. Events are used to track and manage asynchronous actions,
 * such as sending emails, generating reports, etc.
 *
 */
@Schema({ collection: 'events', timestamps: true, toJSON: { virtuals: true } })
export class AppEvent implements IEvent {
  /**
   * The type of event, which determines the action to be performed, trimmed whitespaces
   */
  @Prop({ required: true, trim: true }) eventType!: EventType;

  /**
   * Data associated with the event, can be any type depending on the eventType
   */
  @Prop({ type: MongooseSchema.Types.Mixed }) data!: unknown;

  /**
   * Timestamp when the event was processed. Optional.
   */
  @Prop() processedOn?: number;

  /**
   * Timestamp when the event was created. Automatically set to current time
   */
  @Prop({ required: true, default: Date.now }) createdOn!: Date;

  /**
   * Timestamp when the event is scheduled to be processed. Defaults to current time.
   */
  @Prop({ required: true, default: Date.now }) scheduledOn!: Date;

  /**
   * Number of times the event has been retried. Starts at 0.
   */
  @Prop({ required: true, default: 0 }) retryCount!: number;

  /**
   * Current status of the event (e.g., pending, processed).
   */
  @Prop({ required: true, default: EventStatus.PENDING }) status!: EventStatus;
}

/**
 * Schema for the AppEvent class.
 */
export const EventSchema = SchemaFactory.createForClass(AppEvent);

EventSchema.index({ status: 1, retryCount: 1, scheduledOn: 1 });
