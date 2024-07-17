import { UserDocument } from '../../users/user.schema';
import { AppNotification } from '../../notification/notification.schema';
import Mail from 'nodemailer/lib/mailer';
import { Invite } from '../../invite/invite.schema';
import handlebars from 'handlebars';
import {
  AppCommunityEvent,
  convertToEmailCommunity,
  convertToEmailPublication,
  convertToEmailUser,
  getCommonEmailVariables,
} from '../event';
import { HistoryLogLine } from '../../deposit/deposit.schema';
import { EventType } from '../event.schema';
import { CommunityDocument } from '../../communities/communities.schema';
import { AnyKeys, FlattenMaps, Require_id } from 'mongoose';
import { DepositPopulatedDTO } from '../../dtos/deposit/deposit-populated.dto';
import { IEmailCommon, IEmailCommunity, IEmailPublication, IEmailUser } from '../../template/model';

/**
 * Interface representing the data needed for a review invitation email event.
 * Contains details of the sender, deposit, destination email, destination name, invite, community, and optional date limit.
 */
export interface IReviewInvitationEmailData {
  sender: FlattenMaps<UserDocument>;
  deposit: DepositPopulatedDTO;
  destinationEmail: string;
  destinationName: string;
  invite: Require_id<Invite>;
  community: FlattenMaps<CommunityDocument>;
  dateLimit?: Date;
}

/**
 * Event class representing a review invitation email.
 * Generates notifications, emails, and history logs upon sending a review invitation.
 */
export class ReviewInvitationEmailEvent extends AppCommunityEvent {
  type = EventType.REVIEW_INVITATION_EMAIL;
  emailTemplateName = 'review-invitation';
  internalType = 'community' as const;

  /**
   * Initializes the event with the provided data indicating the sending of a review invitation email.
   *
   * @param {IReviewInvitationEmailData} data - The data required for the review invitation email event.
   */
  constructor(readonly data: IReviewInvitationEmailData) {
    super();
  }

  /**
   * Generates and returns an in-app notification template for the review invitation email event.
   *
   * @param {string} userId - The user ID receiving the notification.
   * @returns {AnyKeys<AppNotification> | undefined} The in-app notification.
   */
  getAppNotificationTemplate(userId: string): AnyKeys<AppNotification> | undefined {
    const notification = {
      userId: userId,
      title: 'New review invite received',
      body: `Create a review for ${this.data.deposit.title} publication now!`,
      icon: 'rate_review',
      createdOn: new Date(),
      isRead: false,
      action: `/deposits/${this.data.deposit._id}/view`,
    };

    return notification;
  }

  /**
   * Generates and returns an email template for the review invitation email event.
   *
   * @param {string} templateSource - The source string of the email template.
   * @param {boolean} [strict=false] - Whether strict mode should be used for handlebars.
   * @returns {Mail.Options | undefined} The email notification.
   */
  getEmailTemplate(templateSource: string, strict = false): Mail.Options | undefined {
    const template = handlebars.compile<
      IEmailCommon &
        IEmailPublication &
        IEmailCommunity &
        IEmailUser & {
          REVIEWER_NAME: string;
          USER_MESSAGE?: string;
          INVITATION_DEADLINE?: Date;
        }
    >(templateSource, {
      strict: strict,
    });

    const emailTemplate = {
      subject: 'New review invitation received',
      html: template({
        ...getCommonEmailVariables(this.emailTemplateName),
        ...convertToEmailUser(this.data.sender),
        ...convertToEmailPublication(this.data.deposit, this.emailTemplateName),
        ...convertToEmailCommunity(this.data.community, this.emailTemplateName),
        REVIEWER_NAME: this.data.destinationName,
        USER_MESSAGE: this.data.invite.message,
        INVITATION_DEADLINE: this.data.dateLimit,
      }),
    };

    return emailTemplate;
  }

  /**
   * Generates and returns a push notification template for the review invitation email event.
   *
   * @returns {unknown} The push notification data.
   */
  getPushNotificationTemplate(): unknown {
    const pushNotification = {
      notification: {
        title: 'Orvium notification',
        body: 'You have been invited to review a publication',
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
   * Generates and returns a history log line for the review invitation email event.
   *
   * @returns {HistoryLogLine} The history log line.
   */
  getHistoryTemplate(): HistoryLogLine {
    return {
      createdAt: new Date(),
      username: `${this.data.sender.firstName} ${this.data.sender.lastName}`,
      description: `Invitation to ${this.data.invite.inviteType} sent to ${this.data.invite.addressee}`,
    };
  }
}
