import Mail from 'nodemailer/lib/mailer';
import { AppSystemEvent, convertToEmailPublication } from '../event';
import handlebars from 'handlebars';
import { HistoryLogLine } from '../../deposit/deposit.schema';
import { EventType } from '../event.schema';
import { UserDocument } from '../../users/user.schema';
import { FlattenMaps } from 'mongoose';
import { DepositPopulatedDTO } from '../../dtos/deposit/deposit-populated.dto';
import { IEmailPublication } from '../../template/model';

/**
 * Interface representing the data required for an iThenticate report ready event.
 * Contains the deposit information and the user who submitted the report request.
 */
export interface IIThenticateReportReadyData {
  deposit: DepositPopulatedDTO;
  submitter: FlattenMaps<UserDocument>;
}

/**
 * Event class representing that an iThenticate report is ready.
 * Generates email templates for notifying users about the availability of their similarity reports.
 */
export class IThenticateReportReadyEvent extends AppSystemEvent {
  type = EventType.ITHENTICATE_REPORT_READY;
  emailTemplateName = 'ithenticate-report-ready';
  internalType = 'system' as const;

  /**
   * Initializes the event with the provided data indicating the iThenticate report is ready.
   *
   * @param {IIThenticateReportReadyData} data - The data required for the iThenticate report ready event.
   */
  constructor(readonly data: IIThenticateReportReadyData) {
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
   * Generates and returns an email template for the iThenticate report ready notification.
   *
   * @param {string} templateSource - The source template string for the email.
   * @param {boolean} [strict] - Strict compilation mode for handlebars.
   * @returns {Mail.Options | undefined} An object with the email options or undefined.
   */
  getEmailTemplate(templateSource: string, strict = false): Mail.Options | undefined {
    const template = handlebars.compile<IEmailPublication>(templateSource, { strict: strict });
    const emailTemplate = {
      subject: 'Similarity Report Ready',
      html: template({
        ...convertToEmailPublication(this.data.deposit, this.emailTemplateName),
      }),
    };

    return emailTemplate;
  }

  /**
   * Returns undefined as no push notification is required for this event.
   *
   * @returns {unknown} Always returns undefined.
   */
  getPushNotificationTemplate(): unknown {
    return undefined;
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
