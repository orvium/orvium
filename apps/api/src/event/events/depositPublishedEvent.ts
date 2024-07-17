import { AppNotification } from '../../notification/notification.schema';
import { AppCommunityEvent } from '../event';
import { DepositDocument, HistoryLogLine } from '../../deposit/deposit.schema';
import { EventType } from '../event.schema';
import { CommunityDocument } from '../../communities/communities.schema';
import { UserDocument } from '../../users/user.schema';
import { AnyKeys, FlattenMaps } from 'mongoose';

/**
 * Interface representing data when a deposit is published.
 * Contains details of the deposit, associated community, responsible user, and an optional reason.
 */
export interface IDepositPublishedData {
  deposit: FlattenMaps<DepositDocument>;
  community: FlattenMaps<CommunityDocument>;
  user: FlattenMaps<UserDocument>;
  reason?: string;
}

/**
 * Event class representing a deposit being published.
 * Provides methods to create in-app notifications, history logs, and other notifications.
 */
export class DepositPublishedEvent extends AppCommunityEvent {
  type = EventType.DEPOSIT_PUBLISHED;
  emailTemplateName = 'deposit-accepted';
  internalType = 'community' as const;

  /**
   * Initializes the event with data indicating a deposit is published.
   *
   * @param {IDepositPublishedData} data - The data related to the publication event.
   */
  constructor(readonly data: IDepositPublishedData) {
    super();
  }

  /**
   * Generates an in-app notification template for this event with a specific user ID.
   *
   * @param {string} userId - The user ID to receive the notification.
   * @returns {AnyKeys<AppNotification> | undefined} The in-app notification template or undefined if not applicable.
   */
  getAppNotificationTemplate(userId: string): AnyKeys<AppNotification> | undefined {
    const inAppNotification = {
      userId: userId,
      title: 'Your publication has been published',
      body: ` Your publication status is now published!. Click to access to ${this.data.deposit.title}.`,
      icon: 'check_circle',
      createdOn: new Date(),
      isRead: false,
      action: `/deposits/${this.data.deposit._id.toHexString()}/view`,
    };

    return inAppNotification;
  }

  /**
   * This event doesn't generate an email template.
   *
   * @returns {undefined} Always returns undefined.
   */
  getEmailTemplate(): undefined {
    return undefined;
  }

  /**
   * This event doesn't generate a push notification template.
   *
   * @returns {unknown} Always returns undefined.
   */
  getPushNotificationTemplate(): unknown {
    return undefined;
  }

  /**
   * Generates a history log template for this event.
   *
   * @returns {HistoryLogLine} The history log line representing the publication event.
   */
  getHistoryTemplate(): HistoryLogLine {
    const description = `Publication published in ${this.data.community.name}.`;
    return {
      createdAt: new Date(),
      username: `${this.data.user.firstName} ${this.data.user.lastName}`,
      description: description,
    };
  }
}
