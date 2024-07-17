import Mail from 'nodemailer/lib/mailer';
import { AppSystemEvent } from '../event';
import { HistoryLogLine } from '../../deposit/deposit.schema';
import { EventType } from '../event.schema';
import { FlattenMaps } from 'mongoose';
import { ReviewDocumentPopulated } from '../../review/review.service';
import { PopulatedDepositDocument } from '../../deposit/deposit.service';

/**
 * Interface representing the data required for the new file event.
 * Contains information about the file and its association with a deposit or review.
 */
export interface INewFileEventData {
  depositOrReview: FlattenMaps<PopulatedDepositDocument> | FlattenMaps<ReviewDocumentPopulated>;
  filename: string;
}

/**
 * Event class representing the upload of a new file.
 * This event does not trigger notifications or email templates.
 */
export class FileUploadedEvent extends AppSystemEvent {
  type = EventType.NEW_FILE;
  emailTemplateName = undefined;
  internalType = 'system' as const;

  /**
   * Initializes the event with new file data.
   *
   * @param {INewFileEventData} data - The data related to the new file event.
   */
  constructor(readonly data: INewFileEventData) {
    super();
  }

  /**
   * Returns undefined as no in-app notification is required for this event.
   *
   * @returns {undefined} Always returns undefined.
   */
  getAppNotificationTemplate(): undefined {
    return undefined;
  }

  /**
   * Returns undefined as no email template is required for this event.
   *
   * @returns {Mail.Options | undefined} Always returns undefined.
   */
  getEmailTemplate(): Mail.Options | undefined {
    return undefined;
  }

  /**
   * Returns undefined as no push notification is required for this event.
   *
   * @returns {unknown} Always returns undefined.
   */
  getPushNotificationTemplate(): unknown {
    return undefined;
  }

  /**
   * Returns undefined as no history log line is required for this event.
   *
   * @returns {HistoryLogLine | undefined} Always returns undefined.
   */
  getHistoryTemplate(): HistoryLogLine | undefined {
    return undefined;
  }
}
