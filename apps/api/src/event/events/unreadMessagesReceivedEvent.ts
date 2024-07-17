import { AnyKeys, FlattenMaps } from 'mongoose';
import { UserDocument } from '../../users/user.schema';
import { AppSystemEvent, convertToEmailUser, getCommonEmailVariables } from '../event';
import { EventType } from '../event.schema';
import { AppNotification } from '../../notification/notification.schema';
import Mail from 'nodemailer/lib/mailer';
import handlebars from 'handlebars';
import { HistoryLogLine } from '../../deposit/deposit.schema';
import { ConversationDocument } from '../../conversations/conversations.schema';
import { IEmailCommon, IEmailUser } from '../../template/model';
import { environment } from '../../environments/environment';

/**
 * Interface representing data for an unread message received event.
 * Contains details of the user, recipient user, and conversation.
 */
export interface IUnreadMessageReceivedData {
  user: FlattenMaps<UserDocument>;
  recipientUser: FlattenMaps<UserDocument>;
  conversation: FlattenMaps<ConversationDocument>;
}

/**
 * Event class representing an unread message received event.
 * Generates notifications and emails for unread messages.
 */
export class unreadMessagesReceiveEvent extends AppSystemEvent {
  type = EventType.UNREAD_MESSAGE;
  emailTemplateName = 'unread-message';
  internalType = 'system' as const;

  /**
   * Initializes the event with the provided data for an unread message received event.
   *
   * @param {IUnreadMessageReceivedData} data - The data for the unread message received event.
   */
  constructor(readonly data: IUnreadMessageReceivedData) {
    super();
  }

  /**
   * Generates and returns an in-app notification template for the unread message received event.
   * @param {string} userId - The user ID receiving the notification.
   * @returns {AnyKeys<AppNotification> | undefined} The in-app notification template.
   */
  getAppNotificationTemplate(userId: string): AnyKeys<AppNotification> | undefined {
    const inAppNotification = {
      userId: userId,
      title: 'Unread messages',
      body: 'Somebody has sent a message and you have not read it',
      icon: 'chat',
      createdOn: new Date(),
      isRead: false,
      action: `/chat?conversationId=${this.data.conversation._id.toHexString()}`,
    };

    return inAppNotification;
  }

  /**
   * Generates and returns an email template for the unread message received event.
   *
   * @param {string} templateSource - The source string of the email template.
   * @param {boolean} [strict=false] - Whether strict mode should be used for handlebars.
   * @returns {Mail.Options | undefined} The email template.
   */
  getEmailTemplate(templateSource: string, strict = false): Mail.Options | undefined {
    const template = handlebars.compile<IEmailCommon & IEmailUser>(templateSource, {
      strict: strict,
    });
    const emailTemplate = {
      subject: 'You have a new message available in orvium',
      html: template({
        ...getCommonEmailVariables(this.emailTemplateName),
        ...convertToEmailUser(this.data.user),
      }),
    };

    return emailTemplate;
  }

  /**
   * Generates and returns a push notification template for the unread message received event.
   *
   * @returns {unknown} The push notification template.
   */
  getPushNotificationTemplate(): unknown {
    const pushNotification = {
      notification: {
        title: 'Orvium chat message notification',
        body: 'You have unread messages',
        icon: 'icon-96x96.png',
        vibrate: [100, 50, 100],
        data: {
          dateOfArrival: Date.now(),
          primaryKey: 1,
          onActionClick: {
            default: {
              operation: 'openWindow',
              url: `${
                environment.publicUrl
              }/chat?conversationId=${this.data.conversation._id.toHexString()}`,
            },
          },
        },
        actions: [],
      },
    };

    return pushNotification;
  }

  /**
   * No history log template is provided for this event.
   *
   * @returns {HistoryLogLine | undefined} Undefined as no history log is generated.
   */
  getHistoryTemplate(): HistoryLogLine | undefined {
    return undefined;
  }
}
