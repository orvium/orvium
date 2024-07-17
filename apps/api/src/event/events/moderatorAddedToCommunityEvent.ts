import { AppNotification } from '../../notification/notification.schema';
import Mail from 'nodemailer/lib/mailer';
import {
  AppCommunityEvent,
  convertToEmailCommunity,
  convertToEmailUser,
  getCommonEmailVariables,
} from '../event';
import handlebars from 'handlebars';
import { EventType } from '../event.schema';
import { UserDocument } from '../../users/user.schema';
import { HistoryLogLine } from '../../deposit/deposit.schema';
import { AnyKeys, FlattenMaps } from 'mongoose';
import { CommunityDocument } from '../../communities/communities.schema';
import { IEmailCommon, IEmailCommunity, IEmailUser } from '../../template/model';

/**
 * Interface representing data required for assigning a moderator to a community.
 * Contains the user and community details relevant to the event.
 */
export interface IModeratorAssignedData {
  user: FlattenMaps<UserDocument>;
  community: FlattenMaps<CommunityDocument>;
}

/**
 * Event class representing the assignment of a moderator to a community.
 * Generates in-app notifications and email templates for notifying users of their new moderator status.
 */
export class ModeratorAddedToCommunityEvent extends AppCommunityEvent {
  type = EventType.MODERATOR_ASSIGNED;
  emailTemplateName = 'moderator-assigned';
  internalType = 'community' as const;

  /**
   * Initializes the event with the provided data indicating a moderator has been added to a community.
   *
   * @param {IModeratorAssignedData} data - The data required for the moderator assignment event.
   */
  constructor(readonly data: IModeratorAssignedData) {
    super();
  }

  /**
   * Returns an in-app notification template for the moderator assignment event.
   *
   * @param {string} userId - The user ID to whom the notification will be sent.
   * @returns {AnyKeys<AppNotification> | undefined} An object with the notification options or undefined.
   */
  getAppNotificationTemplate(userId: string): AnyKeys<AppNotification> | undefined {
    const inAppNotification = {
      userId: userId,
      title: 'You are now a moderator',
      body: `You are now a moderator of ${this.data.community.name} community. Go to the community page and click on the button "Moderate" to
        access to the moderator panel.`,
      icon: 'assignment_ind',
      createdOn: new Date(),
      isRead: false,
      action: 'communities/' + this.data.community._id.toHexString() + '/moderate',
    };

    return inAppNotification;
  }

  /**
   * Generates and returns an email template for the moderator assignment notification.
   *
   * @param {string} templateSource - The source template string for the email.
   * @param {boolean} [strict] - Strict compilation mode for handlebars.
   * @returns {Mail.Options | undefined} An object with the email options or undefined.
   */
  getEmailTemplate(templateSource: string, strict = false): Mail.Options | undefined {
    const template = handlebars.compile<IEmailCommon & IEmailUser & IEmailCommunity>(
      templateSource,
      { strict: strict }
    );
    const emailTemplate = {
      subject: 'You have been upgraded to moderator',
      html: template({
        ...getCommonEmailVariables(this.emailTemplateName),
        ...convertToEmailUser(this.data.user),
        ...convertToEmailCommunity(this.data.community, this.emailTemplateName),
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
