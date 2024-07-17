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
 * Interface representing data when a deposit is moved to draft status by a moderator.
 * Contains details of the deposit, community, reason for the status change, and the user responsible.
 */
export interface IDepositDraftedData {
  deposit: DepositPopulatedDTO;
  community: FlattenMaps<CommunityDocument>;
  reason: string;
  user: FlattenMaps<UserDocument>;
}

/**
 * Event class representing a deposit moving to draft status by a moderator.
 * Creates email, in-app, and push notifications, and provides a history log.
 */
export class DepositDraftedByModeratorEvent extends AppCommunityEvent {
  type = EventType.DEPOSIT_DRAFTED;
  emailTemplateName = 'moderator-draft-deposit';
  internalType = 'community' as const;

  /**
   * Initializes the event with data indicating the deposit is moved to draft status by a moderator.
   *
   * @param {IDepositDraftedData} data - The data for the status change.
   */
  constructor(readonly data: IDepositDraftedData) {
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
      title: 'Your publication needs some changes',
      body: `${this.data.community.name} community has changed your publication ${this.data.deposit.title} to Draft status.`,
      icon: 'published_with_changes',
      createdOn: new Date(),
      isRead: false,
      action: `/deposits/${this.data.deposit._id}/view`,
    };

    return notification;
  }

  /**
   * Generates an email notification template for this event using the provided template source.
   *
   * @param {string} templateSource - The source of the template for the email notification.
   * @param {boolean} strict - Whether to use strict mode during template compilation.
   * @returns {Mail.Options | undefined} The email notification template or undefined if not applicable.
   */
  getEmailTemplate(templateSource: string, strict = false): Mail.Options | undefined {
    const template = handlebars.compile<
      IEmailCommon & IEmailUser & IEmailCommunity & IEmailPublication & IEmailEditorMessage
    >(templateSource, { strict: strict });
    const emailTemplate = {
      subject: 'Your publication needs some changes',
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
   * @returns {unknown} The push notification template object.
   */
  getPushNotificationTemplate(): unknown {
    const pushNotification = {
      notification: {
        title: 'Orvium notification',
        body: 'Your publication needs some changes',
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
   * @returns {HistoryLogLine} The history log line for this event.
   */
  getHistoryTemplate(): HistoryLogLine {
    return {
      createdAt: new Date(),
      username: `${this.data.user.firstName} ${this.data.user.lastName}`,
      description: `Publication moved to Draft in ${this.data.community.name}. Reason: ${this.data.reason}`,
    };
  }
}
