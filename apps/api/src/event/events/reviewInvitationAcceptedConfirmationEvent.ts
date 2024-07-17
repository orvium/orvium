import { EventType } from '../event.schema';
import { AppNotification } from '../../notification/notification.schema';
import Mail from 'nodemailer/lib/mailer';
import {
  AppCommunityEvent,
  convertToEmailCommunity,
  convertToEmailInvitation,
  convertToEmailPublication,
  convertToEmailUser,
  getCommonEmailVariables,
} from '../event';
import { HistoryLogLine } from '../../deposit/deposit.schema';
import { UserDocument } from '../../users/user.schema';
import handlebars from 'handlebars';
import { CommunityDocument } from '../../communities/communities.schema';
import { InviteDocument } from '../../invite/invite.schema';
import { DepositPopulatedDTO } from '../../dtos/deposit/deposit-populated.dto';
import { AnyKeys, FlattenMaps } from 'mongoose';
import {
  IEmailCommon,
  IEmailCommunity,
  IEmailInvitation,
  IEmailPublication,
} from '../../template/model';

/**
 * Interface representing the data needed for a review invitation acceptance confirmation.
 * Contains details of the sender, reviewer, deposit, community, and the invitation itself.
 */
export interface IReviewInvitationAcceptedConfirmationData {
  sender: FlattenMaps<UserDocument>;
  reviewer: FlattenMaps<UserDocument> | null;
  deposit: DepositPopulatedDTO;
  community: FlattenMaps<CommunityDocument>;
  invitation: FlattenMaps<InviteDocument>;
}

/**
 * Event class representing a review invitation acceptance confirmation.
 * Generates notifications and emails upon acceptance of a review invitation.
 */
export class ReviewInvitationAcceptedConfirmationEvent extends AppCommunityEvent {
  type = EventType.REVIEW_INVITATION_ACCEPTED_CONFIRMATION;
  emailTemplateName = 'review-invitation-accepted-confirmation';
  internalType = 'community' as const;
  private reviewerFullnameOrEmail: string;

  /**
   * Initializes the event with the provided data indicating the acceptance of a review invitation.
   *
   * @param {IReviewInvitationAcceptedConfirmationData} data - The data required for the review invitation acceptance confirmation event.
   */
  constructor(readonly data: IReviewInvitationAcceptedConfirmationData) {
    super();
    this.reviewerFullnameOrEmail = this.data.reviewer
      ? `${this.data.reviewer.firstName} ${this.data.reviewer.lastName}`
      : this.data.invitation.addressee;
  }

  /**
   * Generates and returns an in-app notification template for the review invitation acceptance confirmation event.
   *
   * @param {string} userId - The user ID receiving the notification.
   * @returns {AnyKeys<AppNotification>} The in-app notification.
   */
  getAppNotificationTemplate(userId: string): AnyKeys<AppNotification> {
    const inAppNotification = {
      userId: userId,
      title: 'You have accepted the review invitation',
      //TO DO cambiar el mensaje notificacion
      body: `Congratulations, user with email ${this.data.invitation.addressee} has accepted an invitation to review the ${this.data.deposit.title} publication!`,
      icon: 'rate_review',
      createdOn: new Date(),
      isRead: false,
      action: `/deposits/${this.data.deposit._id}/view`,
    };
    return inAppNotification;
  }

  /**
   * Generates and returns an email template for the review invitation acceptance confirmation event.
   *
   * @param {string} templateSource - The source string of the email template.
   * @param {boolean} strict - Whether strict mode should be used for handlebars.
   * @returns {Mail.Options | undefined} The email notification.
   */
  getEmailTemplate(templateSource: string, strict = false): Mail.Options | undefined {
    const template = handlebars.compile<
      IEmailCommon &
        IEmailCommunity &
        IEmailPublication &
        IEmailInvitation & { REVIEWER_FULLNAME_OR_EMAIL: string }
    >(templateSource, { strict: strict });
    const emailTemplate = {
      subject: 'You have accepted the review invitation',
      html: template({
        ...getCommonEmailVariables(this.emailTemplateName),
        ...convertToEmailUser(this.data.sender),
        ...convertToEmailCommunity(this.data.community, this.emailTemplateName),
        ...convertToEmailPublication(this.data.deposit, this.emailTemplateName),
        ...convertToEmailInvitation(this.data.invitation),
        REVIEWER_FULLNAME_OR_EMAIL: this.reviewerFullnameOrEmail,
      }),
    };
    return emailTemplate;
  }

  /**
   * Generates and returns a push notification template for the review invitation acceptance confirmation event.
   *
   * @returns {unknown} The push notification data.
   */
  getPushNotificationTemplate(): unknown {
    const pushNotification = {
      notification: {
        title: 'Orvium notification',
        body: 'You have accepted the review invitation',
        icon: 'assets/icon-96x96.png',
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
   * Generates and returns a history log line for the review invitation acceptance confirmation event.
   *
   * @returns {HistoryLogLine | undefined} The history log line.
   */
  getHistoryTemplate(): HistoryLogLine | undefined {
    return {
      createdAt: new Date(),
      username: this.reviewerFullnameOrEmail,
      description: 'You have accepted the review invitation',
    };
  }
}
