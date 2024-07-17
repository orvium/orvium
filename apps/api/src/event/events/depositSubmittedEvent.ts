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
import { UserDocument } from '../../users/user.schema';
import { CommunityDocument } from '../../communities/communities.schema';
import { FlattenMaps } from 'mongoose';
import { DepositPopulatedDTO } from '../../dtos/deposit/deposit-populated.dto';
import { IEmailCommon, IEmailCommunity, IEmailPublication, IEmailUser } from '../../template/model';

/**
 * Interface representing data when a deposit is submitted.
 * Contains the deposit, the associated user, and community details.
 */
export interface IDepositSubmittedData {
  deposit: DepositPopulatedDTO;
  user: FlattenMaps<UserDocument>;
  community: FlattenMaps<CommunityDocument>;
}

/**
 * Event class representing a deposit being submitted.
 * Provides methods to create email templates and history log entries.
 */
export class DepositSubmittedEvent extends AppCommunityEvent {
  type = EventType.DEPOSIT_SUBMITTED;
  emailTemplateName = 'deposit-submitted';
  internalType = 'community' as const;

  /**
   * Initializes the event with data indicating a deposit has been submitted.
   *
   * @param {IDepositSubmittedData} data - The data related to the submission event.
   */
  constructor(readonly data: IDepositSubmittedData) {
    super();
  }

  /**
   * Generates an in-app notification template for this event.
   *
   * @returns {undefined} Returns undefined, indicating no in-app notification is required.
   */
  getAppNotificationTemplate(): undefined {
    return undefined;
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
      IEmailCommon & IEmailUser & IEmailCommunity & IEmailPublication
    >(templateSource, { strict: strict });
    const emailTemplate = {
      subject: 'Your publication has been submitted to Orvium',
      html: template(
        {
          ...getCommonEmailVariables(this.emailTemplateName),
          ...convertToEmailUser(this.data.user),
          ...convertToEmailCommunity(this.data.community, this.emailTemplateName),
          ...convertToEmailPublication(this.data.deposit, this.emailTemplateName),
        },
        { allowProtoPropertiesByDefault: true }
      ),
    };

    return emailTemplate;
  }

  /**
   * Generates a push notification template for this event.
   *
   * @returns {unknown} Returns undefined, indicating no push notification is required.
   */
  getPushNotificationTemplate(): unknown {
    return undefined;
  }

  /**
   * Generates a history log template for this event.
   *
   * @returns {HistoryLogLine} The history log line representing the submission event.
   */
  getHistoryTemplate(): HistoryLogLine {
    return {
      createdAt: new Date(),
      username: `${this.data.user.firstName} ${this.data.user.lastName}`,
      description: 'Publication submitted',
    };
  }
}
