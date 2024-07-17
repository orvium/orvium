import Mail from 'nodemailer/lib/mailer';
import { AppSystemEvent } from '../event';
import handlebars from 'handlebars';
import { environment } from '../../environments/environment';
import { UserDocument } from '../../users/user.schema';
import { EventType } from '../event.schema';
import { HistoryLogLine } from '../../deposit/deposit.schema';
import { FlattenMaps } from 'mongoose';

/**
 * Interface representing the data required for an invitation event.
 * Contains the list of emails to invite and the sender's information.
 */
export interface IInviteEventData {
  emails: string[];
  sender: FlattenMaps<UserDocument>;
}

/**
 * Event class representing an invitation sent to multiple users.
 * It generates email templates for inviting users to join the platform.
 */
export class InvitationEvent extends AppSystemEvent {
  type = EventType.INVITE;
  emailTemplateName = 'invite';
  internalType = 'system' as const;

  /**
   * Initializes the event with the provided invitation data.
   *
   * @param {IInviteEventData} data - The data required for the invitation event.
   */
  constructor(readonly data: IInviteEventData) {
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
   * Generates and returns an email template for the invitation.
   *
   * @param {string} templateSource - The source template string for the email.
   * @param {boolean} [strict] - Strict compilation mode for handlebars.
   * @returns {Mail.Options | undefined} An object with the email options or undefined.
   */
  getEmailTemplate(templateSource: string, strict = false): Mail.Options | undefined {
    const template = handlebars.compile<{ inviteLink: string }>(templateSource, { strict: strict });
    const inviteLink = `${environment.publicUrl}/profile/invite?inviteToken=${this.data.sender.inviteToken}&utm_source=notification-emails&utm_medium=email&utm_campaign=invitation`;

    let fullname = 'Someone';
    if (this.data.sender.firstName || this.data.sender.lastName) {
      fullname = `${this.data.sender.firstName} ${this.data.sender.lastName}`;
    }
    const emailTemplate = {
      subject: `${fullname} has invited you to join Orvium`,
      html: template({ inviteLink }),
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
