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
import { UserDocument } from '../../users/user.schema';
import { CommunityDocument } from '../../communities/communities.schema';
import { AnyKeys, FlattenMaps } from 'mongoose';
import { DepositPopulatedDTO } from '../../dtos/deposit/deposit-populated.dto';
import { IEmailCommon, IEmailCommunity, IEmailPublication, IEmailUser } from '../../template/model';

/**
 * Interface representing data when an editor is assigned to a deposit.
 * Contains the user, deposit, and community information.
 */
export interface IEditorAssignedData {
  user: FlattenMaps<UserDocument>;
  deposit: DepositPopulatedDTO;
  community: FlattenMaps<CommunityDocument>;
}

/**
 * Event class representing the assignment of an editor to a deposit.
 * Provides methods to create notifications and email templates.
 */
export class EditorAssignedEvent extends AppCommunityEvent {
  type = EventType.EDITOR_ASSIGNED;
  emailTemplateName = 'editor-assigned';
  internalType = 'community' as const;

  /**
   * Initializes the event with data indicating an editor has been assigned.
   *
   * @param {IEditorAssignedData} data - The data related to the editor assignment event.
   */
  constructor(readonly data: IEditorAssignedData) {
    super();
  }

  /**
   * Generates an in-app notification template for this event.
   *
   * @param {string} userId - The ID of the user receiving the notification.
   * @returns {AnyKeys<AppNotification> | undefined} The notification data or undefined if none is required.
   */
  getAppNotificationTemplate(userId: string): AnyKeys<AppNotification> | undefined {
    const inAppNotification = {
      userId: userId,
      title: 'Publication assigned to you!',
      body: 'A publication has just been assigned to you, please take a look.',
      icon: 'assignment_ind',
      createdOn: new Date(),
      isRead: false,
      action: `deposits/${this.data.deposit._id}/view`,
    };

    return inAppNotification;
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
      subject: 'Publication assigned to you',
      html: template({
        ...getCommonEmailVariables(this.emailTemplateName),
        ...convertToEmailUser(this.data.user),
        ...convertToEmailCommunity(this.data.community, this.emailTemplateName),
        ...convertToEmailPublication(this.data.deposit, this.emailTemplateName),
      }),
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
   * @returns {HistoryLogLine | undefined} The history log line or undefined if none is needed.
   */
  getHistoryTemplate(): HistoryLogLine | undefined {
    return undefined;
  }
}
