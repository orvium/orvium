import { FlattenMaps } from 'mongoose';
import Mail from 'nodemailer/lib/mailer';
import {
  AppSystemEvent,
  convertToEmailCommunity,
  convertToEmailUser,
  getCommonEmailVariables,
} from '../event';
import handlebars from 'handlebars';
import { HistoryLogLine } from '../../deposit/deposit.schema';
import { UserDocument } from '../../users/user.schema';
import { EventType } from '../event.schema';
import { CommunityDocument } from '../../communities/communities.schema';
import { IEmailCommon, IEmailCommunity, IEmailUser } from '../../template/model';

/**
 * Interface representing the data for a community acceptance event.
 * Contains information about the community and the user who submitted it.
 */
export interface ICommunityAcceptedData {
  community: FlattenMaps<CommunityDocument>;
  user: FlattenMaps<UserDocument>;
}

/**
 * Event class representing a community that has been accepted.
 * Provides methods to generate notifications for email, push, and history logs.
 */
export class CommunityAcceptedEvent extends AppSystemEvent {
  type = EventType.COMMUNITY_ACCEPTED;
  emailTemplateName = 'community-accepted';
  internalType = 'system' as const;

  /**
   * Initializes the event with community acceptance data.
   *
   * @param {ICommunityAcceptedData} data - The community acceptance data.
   */
  constructor(readonly data: ICommunityAcceptedData) {
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
    const template = handlebars.compile<IEmailCommon & IEmailUser & IEmailCommunity>(
      templateSource,
      { strict: strict }
    );
    const emailTemplate = {
      subject: 'Your community has been accepted in Orvium',
      html: template({
        ...getCommonEmailVariables(this.emailTemplateName),
        ...convertToEmailUser(this.data.user),
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
