import Mail from 'nodemailer/lib/mailer';
import { AppCommunityEvent, convertToEmailCommunity, getCommonEmailVariables } from '../event';
import handlebars from 'handlebars';
import { HistoryLogLine } from '../../deposit/deposit.schema';
import { EventType } from '../event.schema';
import { UserDocument } from '../../users/user.schema';
import { FlattenMaps } from 'mongoose';
import { CommunityDocument } from '../../communities/communities.schema';
import { IEmailCommon, IEmailCommunity } from '../../template/model';
/**
 * Interface representing the data for a comment creation event.
 * Contains user and community information.
 */
export interface ICommunityPendingApprovalData {
  user: FlattenMaps<UserDocument>;
  community: FlattenMaps<CommunityDocument>;
}

/**
 * Event class representing a community that has changed to pending approval.
 * Provides methods to generate notifications for app, email, push, and history logs.
 */
export class CommunityChangedToPendingApprovalEvent extends AppCommunityEvent {
  type = EventType.COMMUNITY_PENDING_APPROVAL;
  emailTemplateName = 'pending-approval-community';
  internalType = 'community' as const;

  /**
   * Initializes the event with community data.
   *
   * @param {ICommunityPendingApprovalData} data - The community pending approval data.
   */
  constructor(readonly data: ICommunityPendingApprovalData) {
    super();
  }

  /**
   * Generates an in-app notification template.
   *
   * @returns {undefined} Always returns undefined as no in-app notification is generated.
   */
  getAppNotificationTemplate(): undefined {
    return undefined;
  }

  /**
   * Generates an email notification template using a specific template source.
   *
   * @param {string} templateSource - The source template string used for email generation.
   * @param {boolean} [strict=false] - Whether to use strict template compilation.
   * @returns {Mail.Options | undefined} An object representing the email template, or undefined if not applicable.
   */
  getEmailTemplate(templateSource: string, strict = false): Mail.Options | undefined {
    const template = handlebars.compile<IEmailCommon & IEmailCommunity>(templateSource, {
      strict: strict,
    });
    const emailTemplate = {
      subject: 'New communities are pending approval',
      html: template({
        ...getCommonEmailVariables(this.emailTemplateName),
        ...convertToEmailCommunity(this.data.community, this.emailTemplateName),
      }),
    };

    return emailTemplate;
  }

  /**
   * Generates a push notification template.
   *
   * @returns {unknown} Always returns undefined as no push notification is generated.
   */
  getPushNotificationTemplate(): unknown {
    return undefined;
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
