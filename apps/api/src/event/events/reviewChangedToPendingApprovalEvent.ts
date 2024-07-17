import Mail from 'nodemailer/lib/mailer';
import {
  AppCommunityEvent,
  convertToEmailCommunity,
  convertToEmailPublication,
  convertToEmailReview,
  getCommonEmailVariables,
} from '../event';
import handlebars from 'handlebars';
import { EventType } from '../event.schema';
import { HistoryLogLine } from '../../deposit/deposit.schema';
import { CommunityDocument } from '../../communities/communities.schema';
import { FlattenMaps } from 'mongoose';
import { DepositPopulatedDTO } from '../../dtos/deposit/deposit-populated.dto';
import { ReviewDocumentPopulated } from '../../review/review.service';
import {
  IEmailCommon,
  IEmailCommunity,
  IEmailPublication,
  IEmailReview,
} from '../../template/model';

/**
 * Interface representing the data required for a review moved to pending approval.
 * Contains the deposit, review, and community details.
 */
export interface IReviewPendingApprovalData {
  deposit: DepositPopulatedDTO;
  review: FlattenMaps<ReviewDocumentPopulated>;
  community: FlattenMaps<CommunityDocument>;
}

/**
 * Event class representing a review changed to pending approval.
 * Generates notifications when a review is pending approval.
 */
export class ReviewChangedToPendingApprovalEvent extends AppCommunityEvent {
  type = EventType.REVIEW_PENDING_APPROVAL;
  emailTemplateName = 'pending-approval-review';
  internalType = 'community' as const;

  /**
   * Initializes the event with the provided data indicating a review moved to pending approval.
   *
   * @param {IReviewPendingApprovalData} data - The data required for the review-to-pending-approval event.
   */
  constructor(readonly data: IReviewPendingApprovalData) {
    super();
  }

  /**
   * Generates and returns an in-app notification template for the review-to-pending-approval event.
   *
   * @returns {undefined} Always returns undefined since no in-app notification is created for this event.
   */
  getAppNotificationTemplate(): undefined {
    return undefined;
  }

  /**
   * Generates and returns an email template for the review-to-pending-approval event.
   *
   * @param {string} templateSource - The source string of the email template.
   * @param {boolean} strict - Whether strict mode should be used for handlebars.
   * @returns {Mail.Options | undefined} The email notification.
   */
  getEmailTemplate(templateSource: string, strict = false): Mail.Options | undefined {
    const template = handlebars.compile<
      IEmailCommon & IEmailCommunity & IEmailPublication & IEmailReview
    >(templateSource, { strict: strict });
    const emailTemplate = {
      subject: 'New reviews are pending approval',
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
   * Generates and returns a push notification template for the review-to-pending-approval event.
   *
   * @returns {unknown} Always returns undefined since no push notification is created for this event.
   */
  getPushNotificationTemplate(): unknown {
    return undefined;
  }

  /**
   * Generates and returns a history log line for the review-to-pending-approval event.
   *
   * @returns {HistoryLogLine | undefined} Always returns undefined since no history log line is created for this event.
   */
  getHistoryTemplate(): HistoryLogLine | undefined {
    return undefined;
  }
}
