import { AppNotification } from '../../notification/notification.schema';
import Mail from 'nodemailer/lib/mailer';
import {
  AppEvent,
  convertToEmailCommunity,
  convertToEmailPublication,
  convertToEmailReview,
  convertToEmailUser,
  getCommonEmailVariables,
} from '../event';
import { HistoryLogLine } from '../../deposit/deposit.schema';
import { EventType } from '../event.schema';
import { UserDocument } from '../../users/user.schema';
import handlebars from 'handlebars';
import { CommunityDocument } from '../../communities/communities.schema';
import { AnyKeys, FlattenMaps } from 'mongoose';
import { DepositPopulatedDTO } from '../../dtos/deposit/deposit-populated.dto';
import { ReviewPopulatedDTO } from '../../dtos/review/review-populated.dto';
import {
  IEmailCommon,
  IEmailCommunity,
  IEmailEditorMessage,
  IEmailPublication,
  IEmailReview,
  IEmailUser,
} from '../../template/model';

/**
 * Interface representing the data needed for a review accepted event.
 * Contains details of the deposit, review, user, and the community associated with the review.
 */
export interface IReviewAcceptedData {
  deposit: DepositPopulatedDTO;
  review: ReviewPopulatedDTO;
  user: FlattenMaps<UserDocument>;
  community: FlattenMaps<CommunityDocument>;
  reason?: string;
}

/**
 * Event class representing a review published confirmation to the reviewer.
 * Generates notifications, emails, and history logs upon acceptance of a review.
 */
export class ReviewPublishedConfirmationToReviewerEvent extends AppEvent {
  type = EventType.REVIEW_ACCEPTED;
  emailTemplateName = 'review-accepted';
  internalType = 'community' as const;

  /**
   * Initializes the event with the provided data indicating the acceptance of a review.
   *
   * @param {IReviewAcceptedData} data - The data required for the review accepted event.
   */
  constructor(readonly data: IReviewAcceptedData) {
    super();
  }

  /**
   * Generates and returns an in-app notification template for the review published confirmation event.
   *
   * @param {string} userId - The user ID receiving the notification.
   * @returns {AnyKeys<AppNotification> | undefined} The in-app notification.
   */
  getAppNotificationTemplate(userId: string): AnyKeys<AppNotification> | undefined {
    const inAppNotification = {
      userId: userId,
      title: 'Your review has been accepted',
      body: 'The editorial board has accepted your peer review',
      icon: 'check_circle',
      createdOn: new Date(),
      isRead: false,
      action: `/reviews/${this.data.review._id}/view`,
    };

    return inAppNotification;
  }

  /**
   * Generates and returns an email template for the review published confirmation event.
   *
   * @param {string} templateSource - The source string of the email template.
   * @param {boolean} [strict=false] - Whether strict mode should be used for handlebars.
   * @returns {Mail.Options | undefined} The email notification.
   */
  getEmailTemplate(templateSource: string, strict = false): Mail.Options | undefined {
    const template = handlebars.compile<
      IEmailCommon &
        IEmailUser &
        IEmailPublication &
        IEmailReview &
        IEmailCommunity &
        IEmailEditorMessage
    >(templateSource, { strict: strict });
    const emailTemplate = {
      subject: 'Your review has been accepted',
      html: template({
        ...getCommonEmailVariables(this.emailTemplateName),
        ...convertToEmailUser(this.data.user),
        ...convertToEmailCommunity(this.data.community, this.emailTemplateName),
        ...convertToEmailPublication(this.data.deposit, this.emailTemplateName),
        ...convertToEmailReview(this.data.review, this.emailTemplateName),
        EDITOR_MESSAGE: this.data.reason,
      }),
    };

    return emailTemplate;
  }

  /**
   * No push notification template is provided for this event.
   *
   * @returns {undefined} Undefined as no push notification is generated.
   */
  getPushNotificationTemplate(): unknown {
    return undefined;
  }

  /**
   * Generates and returns a history log line for the review published confirmation event.
   *
   * @returns {HistoryLogLine} The history log line.
   */
  getHistoryTemplate(): HistoryLogLine {
    return {
      createdAt: new Date(),
      username: `${this.data.user.firstName} ${this.data.user.lastName}`,
      description: `Review by ${this.data.review.ownerProfile.firstName} ${this.data.review.ownerProfile.lastName} published`,
    };
  }
}
