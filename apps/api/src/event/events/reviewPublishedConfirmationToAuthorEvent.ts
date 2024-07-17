import { EventType } from '../event.schema';
import { AppNotification } from '../../notification/notification.schema';
import Mail from 'nodemailer/lib/mailer';
import {
  AppCommunityEvent,
  convertToEmailCommunity,
  convertToEmailPublication,
  convertToEmailReview,
  getCommonEmailVariables,
} from '../event';
import { HistoryLogLine } from '../../deposit/deposit.schema';
import handlebars from 'handlebars';
import { CommunityDocument } from '../../communities/communities.schema';
import { AnyKeys, FlattenMaps } from 'mongoose';
import { ReviewPopulatedDTO } from '../../dtos/review/review-populated.dto';
import { DepositPopulatedDTO } from '../../dtos/deposit/deposit-populated.dto';
import {
  IEmailCommon,
  IEmailCommunity,
  IEmailPublication,
  IEmailReview,
} from '../../template/model';

/**
 * Interface representing the data needed for a review created event.
 * Contains details of the deposit, review, and the community associated with the review.
 */
export interface IReviewCreatedEventData {
  deposit: DepositPopulatedDTO;
  review: ReviewPopulatedDTO;
  community: FlattenMaps<CommunityDocument>;
}

/**
 * Event class representing a review published confirmation to the author.
 * Generates notifications and emails upon publishing a review.
 */
export class ReviewPublishedConfirmationToAuthorEvent extends AppCommunityEvent {
  type = EventType.REVIEW_CREATED;
  emailTemplateName = 'review-created';
  internalType = 'community' as const;

  /**
   * Initializes the event with the provided data indicating the publishing of a review.
   *
   * @param {IReviewCreatedEventData} data - The data required for the review created event.
   */
  constructor(readonly data: IReviewCreatedEventData) {
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
      title: 'New review created',
      body: `A review has been created for your publication ${this.data.deposit.title}`,
      icon: 'search',
      createdOn: new Date(),
      isRead: false,
      action: `/deposits/${this.data.deposit._id}/view`,
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
      IEmailCommon & IEmailCommunity & IEmailPublication & IEmailReview
    >(templateSource, { strict: strict });
    const emailTemplate = {
      subject: 'Your publication has received a new review',
      html: template({
        ...getCommonEmailVariables(this.emailTemplateName),
        ...convertToEmailCommunity(this.data.community, this.emailTemplateName),
        ...convertToEmailPublication(this.data.deposit, this.emailTemplateName),
        ...convertToEmailReview(this.data.review, this.emailTemplateName),
      }),
    };

    return emailTemplate;
  }

  /**
   * Generates and returns a push notification template for the review published confirmation event.
   *
   * @returns {unknown} The push notification data.
   */
  getPushNotificationTemplate(): unknown {
    const pushNotification = {
      notification: {
        title: 'Orvium notification',
        body: 'Somebody is reviewing your publication',
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
   * Generates and returns a history log line for the review published confirmation event.
   *
   * @returns {HistoryLogLine | undefined} The history log line.
   */
  getHistoryTemplate(): HistoryLogLine | undefined {
    return undefined;
  }
}
