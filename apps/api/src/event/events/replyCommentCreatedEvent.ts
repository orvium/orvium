import { AppNotification } from '../../notification/notification.schema';
import Mail from 'nodemailer/lib/mailer';
import { AppSystemEvent } from '../event';
import { EventType } from '../event.schema';
import { Commentary } from '../../comments/comments.schema';
import { HistoryLogLine } from '../../deposit/deposit.schema';
import { AnyKeys, Require_id } from 'mongoose';

/**
 * Interface representing data required for a reply comment event.
 * Contains the user ID and the associated comment that received a reply.
 */
export interface IReplyCommentCreatedData {
  userId: string;
  comment: Require_id<Commentary>;
}

/**
 * Event class representing a reply comment event.
 * Generates notifications when someone replies to a user's comment.
 */
export class ReplyCommentCreatedEvent extends AppSystemEvent {
  type = EventType.REPLY_COMMENT_CREATED;
  emailTemplateName = undefined;
  internalType = 'system' as const;

  /**
   * Initializes the event with the provided data indicating a reply comment.
   *
   * @param {IReplyCommentCreatedData} data - The data required for the reply comment event.
   */
  constructor(readonly data: IReplyCommentCreatedData) {
    super();
  }

  /**
   * Generates and returns an in-app notification template for the reply comment event.
   *
   * @param {string} userId - The ID of the user who will receive the notification.
   * @returns {AnyKeys<AppNotification> | undefined} The in-app notification or undefined.
   */
  getAppNotificationTemplate(userId: string): AnyKeys<AppNotification> | undefined {
    const inAppNotification = {
      userId: userId,
      title: 'Somebody has replied to you',
      body: 'Somebody has replied to your comment',
      icon: 'chat',
      createdOn: new Date(),
      isRead: false,
      action: `/deposits/${this.data.comment.resource.toHexString()}/view`,
    };

    return inAppNotification;
  }

  /**
   * Returns undefined as no email notification is required for this event.
   *
   * @returns {Mail.Options | undefined} Always returns undefined.
   */
  getEmailTemplate(): Mail.Options | undefined {
    return undefined;
  }

  /**
   * Generates and returns a push notification template for the reply comment event.
   *
   * @returns {unknown} The push notification object.
   */
  getPushNotificationTemplate(): unknown {
    const pushNotification = {
      notification: {
        title: 'Orvium notification',
        body: 'Somebody has replied to your comment!',
        icon: 'icon-96x96.png',
        vibrate: [100, 50, 100],
        data: {
          dateOfArrival: Date.now(),
          primaryKey: 1,
        },
        actions: [],
      },
    };

    return pushNotification;
  }

  /**
   * Returns undefined as no history log line is required for this event.
   *
   * @returns {HistoryLogLine | undefined} Always returns undefined.
   */
  getHistoryTemplate(): HistoryLogLine | undefined {
    return undefined;
  }
}
