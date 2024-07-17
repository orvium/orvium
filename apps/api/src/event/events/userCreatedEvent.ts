import { AppNotification } from '../../notification/notification.schema';
import Mail from 'nodemailer/lib/mailer';
import { AppSystemEvent } from '../event';
import { UserDocument } from '../../users/user.schema';
import { EventType } from '../event.schema';
import { HistoryLogLine } from '../../deposit/deposit.schema';
import { AnyKeys, FlattenMaps } from 'mongoose';

/**
 * Interface representing data for a user created event.
 * Contains details of the newly created user.
 */
export interface IUserCreatedEventData {
  user: FlattenMaps<UserDocument>;
}

/**
 * Event class representing a user created event.
 * Generates notifications for newly created users.
 */
export class UserCreatedEvent extends AppSystemEvent {
  type = EventType.USER_CREATED;
  emailTemplateName = undefined;
  internalType = 'system' as const;

  /**
   * Initializes the event with the provided data for a user created event.
   *
   * @param {IUserCreatedEventData} data - The data for the user created event.
   */
  constructor(readonly data: IUserCreatedEventData) {
    super();
  }

  /**
   * Generates and returns an in-app notification template for the user created event.
   *
   * @param {string} userId - The user ID receiving the notification.
   * @returns {AnyKeys<AppNotification> | undefined} The in-app notification template.
   */
  getAppNotificationTemplate(userId: string): AnyKeys<AppNotification> | undefined {
    const inAppNotification = {
      userId: userId,
      title: 'Complete your profile',
      body: 'Your profile is not complete, click here to fix it!',
      icon: 'person',
      createdOn: new Date(),
      isRead: false,
      action: 'profile',
    };

    return inAppNotification;
  }

  /**
   * No email template is provided for this event.
   *
   * @returns {Mail.Options | undefined} Undefined as no email template is provided.
   */
  getEmailTemplate(): Mail.Options | undefined {
    return undefined;
  }

  /**
   * No push notification template is provided for this event.
   *
   * @returns {unknown} Undefined as no push notification template is provided.
   */
  getPushNotificationTemplate(): unknown {
    return undefined;
  }

  /**
   * No history log template is provided for this event.
   *
   * @returns {HistoryLogLine | undefined} Undefined as no history log is generated.
   */
  getHistoryTemplate(): HistoryLogLine | undefined {
    return undefined;
  }
}
