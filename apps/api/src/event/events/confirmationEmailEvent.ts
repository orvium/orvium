import Mail from 'nodemailer/lib/mailer';
import { AppSystemEvent } from '../event';
import handlebars from 'handlebars';
import { EventType } from '../event.schema';
import { HistoryLogLine } from '../../deposit/deposit.schema';

/**
 * Interface representing the data required to confirm an email.
 * Contains the user's email address and confirmation code.
 */
export interface IConfirmEmailData {
  email: string;
  code: string;
}

/**
 * Event class representing a request to confirm an email.
 * Provides methods to generate notifications for email, push, and history logs.
 */
export class ConfirmationEmailEvent extends AppSystemEvent {
  type = EventType.CONFIRM_EMAIL;
  emailTemplateName = 'confirm-email';
  internalType = 'system' as const;

  /**
   * Initializes the event with confirmation email data.
   *
   * @param {IConfirmEmailData} data - The confirmation email data.
   */
  constructor(readonly data: IConfirmEmailData) {
    super();
  }

  /**
   * Generates an in-app notification template.
   *
   * @returns {undefined} Always returns undefined as no in-app notification is generated.
   */
  getAppNotificationTemplate(): undefined {
    return undefined;
  }

  /**
   * Generates an email notification template using a specific template source.
   *
   * @param {string} templateSource - The source template string used for email generation.
   * @param {boolean} [strict=false] - Whether to use strict template compilation.
   * @returns {Mail.Options | undefined} An object representing the email template, or undefined if not applicable.
   */
  getEmailTemplate(templateSource: string, strict = false): Mail.Options | undefined {
    const template = handlebars.compile<{ confirmCode: string }>(templateSource, {
      strict: strict,
    });
    const emailTemplate = {
      subject: 'Please confirm your email',
      html: template({ confirmCode: this.data.code }),
    };

    return emailTemplate;
  }

  /**
   * Generates a push notification template.
   *
   * @returns {unknown} Always returns undefined as no push notification is generated.
   */
  getPushNotificationTemplate(): unknown {
    return undefined;
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
