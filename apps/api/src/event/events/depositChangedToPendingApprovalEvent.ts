import Mail from 'nodemailer/lib/mailer';
import {
  AppCommunityEvent,
  convertToEmailCommunity,
  convertToEmailPublication,
  getCommonEmailVariables,
} from '../event';
import handlebars from 'handlebars';
import { HistoryLogLine } from '../../deposit/deposit.schema';
import { EventType } from '../event.schema';
import { CommunityDocument } from '../../communities/communities.schema';
import { FlattenMaps } from 'mongoose';
import { DepositPopulatedDTO } from '../../dtos/deposit/deposit-populated.dto';
import { IEmailCommon, IEmailCommunity, IEmailPublication } from '../../template/model';

/**
 * Interface representing data when a deposit is moved to pending approval status.
 * Contains details of the deposit and the associated community.
 */
export interface IPendingApprovalData {
  deposit: DepositPopulatedDTO;
  community: FlattenMaps<CommunityDocument>;
}

/**
 * Event class representing a deposit moving to pending approval status.
 * Creates an email notification and may provide history logs.
 */
export class DepositChangedToPendingApprovalEvent extends AppCommunityEvent {
  type = EventType.DEPOSIT_PENDING_APPROVAL;
  emailTemplateName = 'pending-approval-deposit';
  internalType = 'community' as const;

  /**
   * Initializes the event with data indicating the deposit is moving to pending approval status.
   *
   * @param {IPendingApprovalData} data - The data for the status change.
   */
  constructor(readonly data: IPendingApprovalData) {
    super();
  }

  /**
   * This event does not generate an in-app notification template.
   *
   * @returns {undefined} Always returns undefined.
   */
  getAppNotificationTemplate(): undefined {
    return undefined;
  }

  /**
   * Generates an email notification template for this event using the provided template source.
   *
   * @param {string} templateSource - The source of the template for the email notification.
   * @param {boolean} strict - Whether to use strict mode during template compilation.
   * @returns {Mail.Options | undefined} The email notification template or undefined if not applicable.
   */
  getEmailTemplate(templateSource: string, strict = false): Mail.Options | undefined {
    const template = handlebars.compile<IEmailCommon & IEmailCommunity & IEmailPublication>(
      templateSource,
      { strict: strict }
    );
    const emailTemplate = {
      subject: 'New publication just received',
      html: template({
        ...getCommonEmailVariables(this.emailTemplateName),
        ...convertToEmailCommunity(this.data.community, this.emailTemplateName),
        ...convertToEmailPublication(this.data.deposit, this.emailTemplateName),
      }),
    };

    return emailTemplate;
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
   * This event does not generate a history log template.
   *
   * @returns {undefined} Always returns undefined.
   */
  getHistoryTemplate(): HistoryLogLine | undefined {
    return undefined;
  }
}
