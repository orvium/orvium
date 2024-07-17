import Mail from 'nodemailer/lib/mailer';
import handlebars from 'handlebars';
import { AppSystemEvent } from '../event';
import { DepositDocument, HistoryLogLine } from '../../deposit/deposit.schema';
import { EventType } from '../event.schema';
import { UserDocument } from '../../users/user.schema';
import { environment } from '../../environments/environment';
import { FlattenMaps } from 'mongoose';

/**
 * Interface representing data required for a reminder event for a draft deposit.
 * Contains the user and deposit information relevant to the event.
 */
export interface IReminderDraftDeposit {
  user: FlattenMaps<UserDocument>;
  deposit: FlattenMaps<DepositDocument>;
}

/**
 * Event class representing a reminder event for a draft deposit.
 * Generates an email template to remind users of their unfinished drafts.
 */
export class ReminderDraftDepositEvent extends AppSystemEvent {
  type = EventType.REMINDER_DRAFT_DEPOSIT;
  emailTemplateName = 'reminder-draft';
  internalType = 'system' as const;

  /**
   * Initializes the event with the provided data indicating a reminder for a draft deposit.
   *
   * @param {IReminderDraftDeposit} data - The data required for the reminder event.
   */
  constructor(readonly data: IReminderDraftDeposit) {
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
   * Generates and returns an email template for the reminder draft deposit notification.
   *
   * @param {string} templateSource - The source template string for the email.
   * @param {boolean} [strict] - Strict compilation mode for handlebars.
   * @returns {Mail.Options | undefined} An object with the email options or undefined.
   */
  getEmailTemplate(templateSource: string, strict = false): Mail.Options | undefined {
    const depositLink = `${
      environment.publicUrl
    }/deposits/${this.data.deposit._id.toHexString()}/view`;
    const template = handlebars.compile<{
      userName: string;
      depositTitle: string;
      depositLink: string;
    }>(templateSource, { strict: strict });

    const emailTemplate = {
      subject: 'Just a friendly reminder',
      html: template({
        userName: `${this.data.user.firstName} ${this.data.user.lastName}`,
        depositTitle: this.data.deposit.title,
        depositLink: depositLink,
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
