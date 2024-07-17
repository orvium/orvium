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
 * Interface representing data related to the acceptance of a deposit.
 * Includes the deposit details, the associated community, the user, and optionally the reason for acceptance.
 */
export interface IDepositAcceptedData {
  deposit: DepositPopulatedDTO;
  community: FlattenMaps<CommunityDocument>;
  user: FlattenMaps<UserDocument>;
  reason?: string;
}

/**
 * Event class representing the acceptance of a deposit.
 * Generates appropriate notifications and templates for the accepted deposit.
 */
export class DepositAcceptedEvent extends AppCommunityEvent {
  type = EventType.DEPOSIT_ACCEPTED;
  emailTemplateName = 'deposit-accepted';
  internalType = 'community' as const;

  /**
   * Initializes the event with deposit acceptance data.
   *
   * @param {IDepositAcceptedData} data - The deposit acceptance data.
   */
  constructor(readonly data: IDepositAcceptedData) {
    super();
  }

  /**
   * Generates an in-app notification template for the accepted deposit event.
   *
   * @param {string} userId - The ID of the user who will receive the notification.
   * @returns {AnyKeys<AppNotification> | undefined} The notification template for the event, or undefined if not applicable.
   */
  getAppNotificationTemplate(userId: string): AnyKeys<AppNotification> | undefined {
    const inAppNotification = {
      userId: userId,
      title: 'Your publication has been accepted',
      body: ` Your publication is now available in Orvium. Click to access to ${this.data.deposit.title}.`,
      icon: 'check_circle',
      createdOn: new Date(),
      isRead: false,
      action: `/deposits/${this.data.deposit._id}/view`,
    };

    return inAppNotification;
  }

  /**
   * Generates an email notification template for the accepted deposit event using a specific template source.
   *
   * @param {string} templateSource - The source template string used for email generation.
   * @param {boolean} [strict=false] - Whether to use strict template compilation.
   * @returns {Mail.Options | undefined} An object representing the email template, or undefined if not applicable.
   */
  getEmailTemplate(templateSource: string, strict = false): Mail.Options | undefined {
    const template = handlebars.compile<
      IEmailCommon & IEmailUser & IEmailCommunity & IEmailPublication & IEmailEditorMessage
    >(templateSource, { strict: strict });
    const emailTemplate = {
      subject: 'Your publication is now available in Orvium',
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
   * Generates a push notification template for the accepted deposit event.
   *
   * @returns {unknown} Always returns undefined as no push notification is generated.
   */
  getPushNotificationTemplate(): unknown {
    return undefined;
  }

  /**
   * Generates a history log template for the accepted deposit event.
   *
   * @returns {HistoryLogLine} The history log line template with event description.
   */
  getHistoryTemplate(): HistoryLogLine {
    let description = `Publication accepted in ${this.data.community.name}.`;
    if (this.data.reason) {
      description += ` Feedback: ${this.data.reason}`;
    }
    return {
      createdAt: new Date(),
      username: `${this.data.user.firstName} ${this.data.user.lastName}`,
      description: description,
    };
  }
}
