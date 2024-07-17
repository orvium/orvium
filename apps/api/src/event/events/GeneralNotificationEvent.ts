import {
  AppCommunityEvent,
  convertToEmailCommunity,
  convertToEmailUser,
  getCommonEmailVariables,
} from '../event';
import { EventType } from '../event.schema';
import { FlattenMaps } from 'mongoose';
import Mail from 'nodemailer/lib/mailer';
import { HistoryLogLine } from '../../review/review.schema';
import { CommunityDocument } from '../../communities/communities.schema';
import { UserDocument } from '../../users/user.schema';
import handlebars from 'handlebars';
import { IEmailCommon, IEmailCommunity, IEmailUser } from '../../template/model';

/**
 * Interface representing the data required for a general notification event.
 * Contains information about the community, subject, message, recipients, and sender.
 */
export interface IGeneralNotificationData {
  community: FlattenMaps<CommunityDocument>;
  subject: string;
  message: string;
  recipients: string[];
  sender: FlattenMaps<UserDocument>;
}

/**
 * Event class representing a general notification sent by a moderator.
 * It allows generating email templates for community notifications.
 */
export class GeneralNotificationEvent extends AppCommunityEvent {
  emailTemplateName = 'moderator-general-notification';

  type = EventType.GENERAL_NOTIFICATION;
  internalType = 'community' as const;

  /**
   * Initializes the event with the provided general notification data.
   *
   * @param {IGeneralNotificationData} data - The data required for the general notification event.
   */
  constructor(readonly data: IGeneralNotificationData) {
    super();
  }

  /**
   * Returns undefined as no in-app notification is required for this event.
   *
   * @returns {undefined} Always returns undefined.
   */
  getAppNotificationTemplate(): undefined {
    return undefined;
  }

  /**
   * Generates and returns an email template for the general notification.
   *
   * @param {string} templateSource - The source template string for the email.
   * @param {boolean} [strict] - Strict compilation mode for handlebars.
   * @returns {Mail.Options | undefined} An object with the email options or undefined.
   */
  getEmailTemplate(templateSource: string, strict?: boolean): Mail.Options | undefined {
    const template = handlebars.compile<
      IEmailCommon &
        IEmailUser &
        IEmailCommunity & {
          MODERATOR_MESSAGE: string;
        }
    >(templateSource, { strict: strict });

    const emailTemplate = {
      subject: this.data.subject,
      html: template({
        ...getCommonEmailVariables(this.emailTemplateName),
        ...convertToEmailUser(this.data.sender),
        ...convertToEmailCommunity(this.data.community, this.emailTemplateName),
        MODERATOR_MESSAGE: this.data.message,
      }),
    };

    return emailTemplate;
  }

  /**
   * Returns undefined as no push notification is required for this event.
   *
   * @returns {unknown} Always returns undefined.
   */
  getHistoryTemplate(): HistoryLogLine | undefined {
    return undefined;
  }

  /**
   * Returns undefined as no history log line is required for this event.
   *
   * @returns {HistoryLogLine | undefined} Always returns undefined.
   */
  getPushNotificationTemplate(): unknown {
    return undefined;
  }
}
