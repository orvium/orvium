import { AppNotification } from '../../notification/notification.schema';
import Mail from 'nodemailer/lib/mailer';
import { AppSystemEvent } from '../event';
import { EventType } from '../event.schema';
import { Commentary } from '../../comments/comments.schema';
import { User } from '../../users/user.schema';
import { HistoryLogLine } from '../../deposit/deposit.schema';
import { AnyKeys, Require_id } from 'mongoose';

/**
 * Interface representing the data for a comment creation event.
 * Contains user and comment information.
 */
export interface ICommentCreatedData {
  user: Require_id<User>;
  comment: Require_id<Commentary>;
}

/**
 * Event class representing a comment created.
 * Provides methods to generate notifications for app, email, push, and history logs.
 */
export class CommentCreatedEvent extends AppSystemEvent {
  type = EventType.COMMENT_CREATED;
  emailTemplateName = undefined;
  internalType = 'system' as const;

  /**
   * Initializes the event with comment data.
   *
   * @param {ICommentCreatedData} data - The comment creation data.
   */
  constructor(readonly data: ICommentCreatedData) {
    super();
  }

  /**
   * Generates an in-app notification template for a user.
   *
   * @param {string} userId - The ID of the user receiving the notification.
   * @returns {AnyKeys<AppNotification> | undefined} An object representing the in-app notification or undefined if not applicable.
   */
  getAppNotificationTemplate(userId: string): AnyKeys<AppNotification> | undefined {
    const inAppNotification = {
      userId: userId,
      title: 'New comment received',
      body: 'Somebody has commented one of your publications',
      icon: 'chat',
      createdOn: new Date(),
      isRead: false,
      action: `/deposits/${this.data.comment.resource.toHexString()}/view`,
    };

    return inAppNotification;
  }

  /**
   * Generates an email notification template.
   *
   * @returns {Mail.Options | undefined} An object representing the email template, or undefined if not applicable.
   */
  getEmailTemplate(): Mail.Options | undefined {
    return undefined;
  }

  /**
   * Generates a push notification template.
   *
   * @returns {unknown} An object representing the push notification.
   */
  getPushNotificationTemplate(): unknown {
    const pushNotification = {
      notification: {
        title: 'Orvium notification',
        body: 'Somebody has commented one of your publications',
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
   * Generates a history log template.
   *
   * @returns {HistoryLogLine | undefined} The history log line template, or undefined if not applicable.
   */
  getHistoryTemplate(): HistoryLogLine | undefined {
    return undefined;
  }
}
