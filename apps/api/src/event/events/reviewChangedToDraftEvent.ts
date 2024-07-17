import { AppNotification } from '../../notification/notification.schema';
import Mail from 'nodemailer/lib/mailer';
import {
  AppCommunityEvent,
  convertToEmailCommunity,
  convertToEmailPublication,
  convertToEmailReview,
  convertToEmailUser,
  getCommonEmailVariables,
} from '../event';
import handlebars from 'handlebars';
import { HistoryLogLine } from '../../deposit/deposit.schema';
import { EventType } from '../event.schema';
import { CommunityDocument } from '../../communities/communities.schema';
import { UserDocument } from '../../users/user.schema';
import { AnyKeys, FlattenMaps } from 'mongoose';
import { DepositPopulatedDTO } from '../../dtos/deposit/deposit-populated.dto';
import {
  IEmailCommon,
  IEmailCommunity,
  IEmailEditorMessage,
  IEmailPublication,
  IEmailReview,
} from '../../template/model';
import { ReviewDocumentPopulated } from '../../review/review.service';

/**
 * Interface representing the data required for a review moved to draft event.
 * Contains the review, deposit, community details, reason, and user.
 */
export interface IReviewToDraftData {
  review: FlattenMaps<ReviewDocumentPopulated>;
  deposit: DepositPopulatedDTO;
  community: FlattenMaps<CommunityDocument>;
  reason: string;
  user: FlattenMaps<UserDocument>;
}

/**
 * Event class representing a review being moved to draft.
 * Generates notifications when a review needs changes.
 */
export class ReviewChangedToDraftEvent extends AppCommunityEvent {
  type = EventType.REVIEW_TO_DRAFT;
  emailTemplateName = 'review-to-draft';
  internalType = 'community' as const;

  /**
   * Initializes the event with the provided data indicating a review moved to draft.
   *
   * @param {IReviewToDraftData} data - The data required for the review-to-draft event.
   */
  constructor(readonly data: IReviewToDraftData) {
    super();
  }

  /**
   * Generates and returns an in-app notification template for the review-to-draft event.
   *
   * @param {string} userId - The ID of the user who will receive the notification.
   * @returns {AnyKeys<AppNotification>} The in-app notification.
   */
  getAppNotificationTemplate(userId: string): AnyKeys<AppNotification> {
    const inAppNotification = {
      userId: userId,
      title: 'Your review needs changes',
      body: 'Your review is not ready to be published and available to everyone just yet. We need you to make some changes first on it.',
      icon: 'published_with_changes',
      createdOn: new Date(),
      isRead: false,
      action: '/reviews/myreviews',
    };

    return inAppNotification;
  }

  /**
   * Generates and returns an email template for the review-to-draft event.
   *
   * @param {string} templateSource - The source string of the email template.
   * @param {boolean} strict - Whether strict mode should be used for handlebars.
   * @returns {Mail.Options} The email notification.
   */
  getEmailTemplate(templateSource: string, strict = false): Mail.Options {
    const template = handlebars.compile<
      IEmailCommon & IEmailCommunity & IEmailPublication & IEmailReview & IEmailEditorMessage
    >(templateSource, { strict: strict });
    const emailTemplate = {
      subject: 'Your review needs changes',
      html: template({
        ...convertToEmailUser(this.data.user),
        ...getCommonEmailVariables(this.emailTemplateName),
        ...convertToEmailCommunity(this.data.community, this.emailTemplateName),
        ...convertToEmailPublication(this.data.deposit, this.emailTemplateName),
        ...convertToEmailReview(this.data.review, this.emailTemplateName),
        EDITOR_MESSAGE: this.data.reason, //TODO: remove in the future, is {{review.comments}}
      }),
    };

    return emailTemplate;
  }

  /**
   * Generates and returns a push notification template for the review-to-draft event.
   *
   * @returns {unknown} The push notification object.
   */
  getPushNotificationTemplate(): unknown {
    const pushNotification = {
      notification: {
        title: 'Orvium notification',
        body: 'Your review needs changes',
        icon: 'icon-96x96.png',
        vibrate: [100, 50, 100],
        data: {
          dateOfArrival: Date.now(),
          primaryKey: 1,
        },
        actions: [],
      },
    };

    return pushNotification;
  }

  /**
   * Generates and returns a history log line for the review-to-draft event.
   *
   * @returns {HistoryLogLine} The history log line.
   */
  getHistoryTemplate(): HistoryLogLine {
    return {
      createdAt: new Date(),
      username: `${this.data.user.firstName} ${this.data.user.lastName}`,
      description: `Review rejected and moved to Draft in ${this.data.community.name}. Reason: ${this.data.reason}`,
    };
  }
}
