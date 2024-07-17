import { AppNotification } from '../../notification/notification.schema';
import { AppCommunityEvent } from '../event';
import { HistoryLogLine } from '../../deposit/deposit.schema';
import { EventType } from '../event.schema';
import { CommunityDocument } from '../../communities/communities.schema';
import { UserDocument } from '../../users/user.schema';
import { CommunityDocumentPopulated } from '../../communities/communities.service';
import { AnyKeys, FlattenMaps } from 'mongoose';
import { DepositPopulatedDTO } from '../../dtos/deposit/deposit-populated.dto';

/**
 * Interface representing data when a deposit is returned to pending approval status.
 * Contains the deposit details, community information, user details, and optionally the reason for the status change.
 */
export interface DepositBackToPendingApprovalData {
  deposit: DepositPopulatedDTO;
  community: FlattenMaps<CommunityDocument> | FlattenMaps<CommunityDocumentPopulated>;
  user: FlattenMaps<UserDocument>;
  reason?: string;
}

/**
 * Interface representing data when a deposit is returned to pending approval status.
 * Contains the deposit details, community information, user details, and optionally the reason for the status change.
 */
export class DepositBackToPendingApprovalEvent extends AppCommunityEvent {
  type = EventType.DEPOSIT_BACK_TO_PENDING_APPROVAL;
  emailTemplateName = 'deposit-back-to-pending-approval';
  internalType = 'community' as const;

  /**
   * Initializes the event with data indicating the deposit is moving back to pending approval status.
   *
   * @param {DepositBackToPendingApprovalData} data - The data for the status change.
   */
  constructor(readonly data: DepositBackToPendingApprovalData) {
    super();
  }

  /**
   * Generates an in-app notification template for this event.
   *
   * @param {string} userId - The ID of the user who will receive the notification.
   * @returns {AnyKeys<AppNotification> | undefined} The notification template or undefined if not applicable.
   */
  getAppNotificationTemplate(userId: string): AnyKeys<AppNotification> | undefined {
    const inAppNotification = {
      userId: userId,
      title: 'Your publication has been returned to pending approval.',
      body: `Your publication status is now pending approval. Click to access to ${this.data.deposit.title}.`,
      icon: 'check_circle',
      createdOn: new Date(),
      isRead: false,
      action: `/deposits/${this.data.deposit._id}/view`,
    };

    return inAppNotification;
  }

  /**
   * This event does not generate an email notification template.
   *
   * @returns {undefined} Always returns undefined.
   */
  getEmailTemplate(): undefined {
    return undefined;
  }

  /**
   * This event does not generate a push notification template.
   *
   * @returns {unknown} Always returns undefined.
   */
  getPushNotificationTemplate(): unknown {
    return undefined;
  }

  /**
   * Generates a history log template for this event.
   *
   * @returns {HistoryLogLine} The history log line template with event description.
   */
  getHistoryTemplate(): HistoryLogLine {
    let description = `Publication returned to pending approval in ${this.data.community.name}.`;
    if (this.data.reason) {
      description += ` Reason: ${this.data.reason}`;
    }
    return {
      createdAt: new Date(),
      username: `${this.data.user.firstName} ${this.data.user.lastName}`,
      description: description,
    };
  }
}
