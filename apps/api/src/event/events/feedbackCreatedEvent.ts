import { EventType } from '../event.schema';
import Mail from 'nodemailer/lib/mailer';
import { AppSystemEvent } from '../event';
import handlebars from 'handlebars';
import { Feedback } from '../../feedback/feedback.schema';
import { HistoryLogLine } from '../../deposit/deposit.schema';

/**
 * Interface representing data required for the feedback event.
 * Contains information about the feedback provided.
 */
export interface IFeedbackEventData {
  feedback: Feedback;
}

/**
 * Event class representing the creation of feedback.
 * Provides methods for email notifications, but not for in-app or push notifications.
 */
export class FeedbackCreatedEvent extends AppSystemEvent {
  type = EventType.FEEDBACK;
  emailTemplateName = undefined;
  internalType = 'system' as const;

  /**
   * Initializes the event with feedback data.
   *
   * @param {IFeedbackEventData} data - The data related to the feedback event.
   */
  constructor(readonly data: IFeedbackEventData) {
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
   * Prepares an email template for feedback notifications.
   * The email includes information about the feedback email, description, and data, and may include a screenshot attachment.
   *
   * @param {unknown} templateSource - The source template for the email, not used in this method.
   * @param {boolean} strict - Whether to enable strict mode for Handlebars compilation.
   * @returns {Mail.Options | undefined} Returns email options or undefined if no email is required.
   */
  getEmailTemplate(templateSource: unknown, strict = false): Mail.Options | undefined {
    // Prepare email template and smtp mailer
    const template = handlebars.compile<{ email?: string; description: string; data: string }>(
      `<p>Email: {{ email }}</p>
        <p>Description: {{ description }}</p>
        <p>Data:</p><pre>{{ data }}</pre>`,
      { strict: strict }
    );

    const emailTemplate = {
      subject: 'New feedback received',
      html: template({
        email: this.data.feedback.email,
        description: this.data.feedback.description,
        data: JSON.stringify(this.data.feedback.data, null, 2),
      }),
      attachments: this.data.feedback.screenshot
        ? [
            {
              filename: 'screenshot.jpeg',
              content: this.data.feedback.screenshot.toString('base64'),
              encoding: 'base64',
              contentType: 'image/jpeg',
            },
          ]
        : undefined,
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
