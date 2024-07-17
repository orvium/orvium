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
import { UserDocument } from '../../users/user.schema';
import { CommunityDocument } from '../../communities/communities.schema';
import { FlattenMaps } from 'mongoose';
import { DepositPopulatedDTO } from '../../dtos/deposit/deposit-populated.dto';
import { ReviewDocumentPopulated } from '../../review/review.service';
import {
  IEmailCommon,
  IEmailCommunity,
  IEmailPublication,
  IEmailReview,
  IEmailUser,
} from '../../template/model';

/**
 * Interface representing the data needed for a review submitted event.
 * Contains details of the deposit, review, user, and the community associated with the review.
 */
export interface IReviewSubmittedData {
  deposit: DepositPopulatedDTO;
  review: FlattenMaps<ReviewDocumentPopulated>;
  user: FlattenMaps<UserDocument>;
  community: FlattenMaps<CommunityDocument>;
}

/**
 * Event class representing a review submitted confirmation.
 * Generates an email and a history log upon submitting a review.
 */
export class ReviewSubmittedConfirmationEvent extends AppCommunityEvent {
  type = EventType.REVIEW_SUBMITTED;
  emailTemplateName = 'review-submitted';
  internalType = 'community' as const;

  /**
   * Initializes the event with the provided data indicating the submission of a review.
   *
   * @param {IReviewSubmittedData} data - The data required for the review submitted event.
   */
  constructor(readonly data: IReviewSubmittedData) {
    super();
  }

  /**
   * No in-app notification template is provided for this event.
   *
   * @returns {undefined} Undefined as no in-app notification is generated.
   */
  getAppNotificationTemplate(): undefined {
    return undefined;
  }

  /**
   * Generates and returns an email template for the review submitted confirmation event.
   *
   * @param {string} templateSource - The source string of the email template.
   * @param {boolean} [strict=false] - Whether strict mode should be used for handlebars.
   * @returns {Mail.Options | undefined} The email notification.
   */
  getEmailTemplate(templateSource: string, strict = false): Mail.Options | undefined {
    const template = handlebars.compile<
      IEmailCommon & IEmailCommunity & IEmailUser & IEmailPublication & IEmailReview
    >(templateSource, { strict: strict });
    const emailTemplate = {
      subject: 'Your review has been submitted to Orvium',
      html: template({
        ...getCommonEmailVariables(this.emailTemplateName),
        ...convertToEmailUser(this.data.user),
        ...convertToEmailCommunity(this.data.community, this.emailTemplateName),
        ...convertToEmailPublication(this.data.deposit, this.emailTemplateName),
        ...convertToEmailReview(this.data.review, this.emailTemplateName),
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
   * Generates and returns a history log line for the review submitted confirmation event.
   *
   * @returns {HistoryLogLine} The history log line.
   */
  getHistoryTemplate(): HistoryLogLine {
    return {
      createdAt: new Date(),
      username: `${this.data.user.firstName} ${this.data.user.lastName}`,
      description: `Review by ${this.data.review.ownerProfile.firstName} submitted`,
    };
  }
}
