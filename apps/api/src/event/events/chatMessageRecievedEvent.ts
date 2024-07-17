import { AppNotification } from '../../notification/notification.schema';
import Mail from 'nodemailer/lib/mailer';
import { AppSystemEvent, convertToEmailUser, getCommonEmailVariables } from '../event';
import { EventType } from '../event.schema';
import { UserDocument } from '../../users/user.schema';
import { HistoryLogLine } from '../../deposit/deposit.schema';
import handlebars from 'handlebars';
import { AnyKeys, FlattenMaps } from 'mongoose';
import { ConversationDocument } from '../../conversations/conversations.schema';
import { IEmailCommon, IEmailUser } from '../../template/model';
import { environment } from '../../environments/environment';

/**
 * Interface representing the data for a chat message creation event.
 * Contains details about the user, recipient, and the conversation.
 */
export interface IChatMessageCreatedData {
  user: FlattenMaps<UserDocument>;
  recipientUser: FlattenMaps<UserDocument>;
  conversation: FlattenMaps<ConversationDocument>;
}

/**
 * Class representing the event of a received chat message.
 * Generates notifications for various platforms and logs the event.
 */
export class ChatMessageReceivedEvent extends AppSystemEvent {
  type = EventType.CHAT_MESSAGE;
  emailTemplateName = 'chat-message';
  internalType = 'system' as const;

  /**
   * Initializes the event with chat message data.
   *
   * @param {IChatMessageCreatedData} data - The chat message data.
   */
  constructor(readonly data: IChatMessageCreatedData) {
    super();
  }

  /**
   * Generates an in-app notification template for a user.
   *
   * @param {string} userId - The ID of the user receiving the notification.
   * @returns {AnyKeys<AppNotification> | undefined} An object representing the in-app notification or undefined if not applicable.
   */
  getAppNotificationTemplate(userId: string): AnyKeys<AppNotification> | undefined {
    const inAppNotification = {
      userId: userId,
      title: 'New chat started',
      body: 'Somebody has started a chat with you',
      icon: 'chat',
      createdOn: new Date(),
      isRead: false,
      action: `/chat?conversationId=${this.data.conversation._id.toHexString()}`,
    };

    return inAppNotification;
  }

  /**
   * Generates an email notification template based on a source template.
   *
   * @param {string} templateSource - The template source string.
   * @param {boolean} [strict=false] - If true, enforces strict template compilation.
   * @returns {Mail.Options | undefined} An object representing the email template, or undefined if not applicable.
   */
  getEmailTemplate(templateSource: string, strict = false): Mail.Options | undefined {
    const template = handlebars.compile<IEmailCommon & IEmailUser>(templateSource, {
      strict: strict,
    });
    const emailTemplate = {
      subject: 'You have a new chat available on orvium',
      html: template({
        ...getCommonEmailVariables(this.emailTemplateName),
        ...convertToEmailUser(this.data.user),
      }),
    };

    return emailTemplate;
  }

  /**
   * Generates a push notification template.
   *
   * @returns {unknown} An object representing the push notification.
   */
  getPushNotificationTemplate(): unknown {
    const pushNotification = {
      notification: {
        title: 'Orvium chat message notification',
        body: 'Somebody has send you a message',
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
   * Generates a history log template.
   *
   * @returns {HistoryLogLine | undefined} The history log line template, or undefined if not applicable.
   */
  getHistoryTemplate(): HistoryLogLine | undefined {
    return undefined;
  }
}
