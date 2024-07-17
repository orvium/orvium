import { AppNotification } from '../../notification/notification.schema';
import Mail from 'nodemailer/lib/mailer';
import {
  AppCommunityEvent,
  convertToEmailCommunity,
  convertToEmailPublication,
  convertToEmailUser,
  getCommonEmailVariables,
} from '../event';
import handlebars from 'handlebars';
import { HistoryLogLine } from '../../deposit/deposit.schema';
import { EventType } from '../event.schema';
import { CommunityDocument } from '../../communities/communities.schema';
import { UserDocument } from '../../users/user.schema';
import { AnyKeys, FlattenMaps } from 'mongoose';
import { DepositPopulatedDTO } from '../../dtos/deposit/deposit-populated.dto';
import {
  IEmailCommon,
  IEmailCommunity,
  IEmailEditorMessage,
  IEmailPublication,
  IEmailUser,
} from '../../template/model';

/**
 * Interface representing data when a deposit is rejected.
 * Contains the deposit information, associated community, rejection reason, and the responsible user.
 */
export interface IDepositRejectedData {
  deposit: DepositPopulatedDTO;
  community: FlattenMaps<CommunityDocument>;
  reason: string;
  user: FlattenMaps<UserDocument>;
}

/**
 * Event class representing a deposit being rejected by a moderator.
 * Offers methods to create app notifications, email templates, and history log entries.
 */
export class DepositRejectedByModeratorEvent extends AppCommunityEvent {
  type = EventType.DEPOSIT_REJECTED;
  emailTemplateName = 'moderator-reject-deposit';
  internalType = 'community' as const;

  /**
   * Initializes the event with data indicating a deposit has been rejected.
   *
   * @param {IDepositRejectedData} data - The data related to the rejection event.
   */
  constructor(readonly data: IDepositRejectedData) {
    super();
  }

  /**
   * Generates an in-app notification template for this event with a specific user ID.
   *
   * @param {string} userId - The user ID to receive the notification.
   * @returns {AnyKeys<AppNotification> | undefined} The in-app notification template or undefined if not applicable.
   */
  getAppNotificationTemplate(userId: string): AnyKeys<AppNotification> | undefined {
    const notification = {
      userId: userId,
      title: 'Your publication has been rejected',
      body: `${this.data.community.name} community has rejected your publication ${this.data.deposit.title}.`,
      icon: 'highlight_off',
      createdOn: new Date(),
      isRead: false,
      action: `/deposits/${this.data.deposit._id}/view`,
    };

    return notification;
  }

  /**
   * Generates an email template for this event.
   *
   * @param {string} templateSource - The source of the email template.
   * @param {boolean} strict - Whether strict mode is enabled during template compilation.
   * @returns {Mail.Options | undefined} The email options or undefined if no email should be sent.
   */
  getEmailTemplate(templateSource: string, strict = false): Mail.Options | undefined {
    const template = handlebars.compile<
      IEmailCommon & IEmailUser & IEmailCommunity & IEmailPublication & IEmailEditorMessage
    >(templateSource, { strict: strict });
    const emailTemplate = {
      subject: 'Your publication has been rejected',
      html: template({
        ...getCommonEmailVariables(this.emailTemplateName),
        ...convertToEmailUser(this.data.user),
        ...convertToEmailCommunity(this.data.community, this.emailTemplateName),
        ...convertToEmailPublication(this.data.deposit, this.emailTemplateName),
        EDITOR_MESSAGE: this.data.reason,
      }),
    };

    return emailTemplate;
  }

  /**
   * Generates a push notification template for this event.
   *
   * @returns {unknown} The push notification template.
   */
  getPushNotificationTemplate(): unknown {
    const pushNotification = {
      notification: {
        title: 'Orvium notification',
        body: 'Your publication has been rejected',
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
   * Generates a history log template for this event.
   *
   * @returns {HistoryLogLine} The history log line representing the rejection event.
   */
  getHistoryTemplate(): HistoryLogLine {
    return {
      createdAt: new Date(),
      username: `${this.data.user.firstName} ${this.data.user.lastName}`,
      description: `Publication rejected in ${this.data.community.name}. Reason: ${this.data.reason}`,
    };
  }
}
