import Mail from 'nodemailer/lib/mailer';
import { AppSystemEvent } from '../event';
import { HistoryLogLine } from '../../deposit/deposit.schema';
import { EventType } from '../event.schema';
import { FlattenMaps } from 'mongoose';
import { PopulatedDepositDocument } from '../../deposit/deposit.service';
import { ReviewDocumentPopulated } from '../../review/review.service';

/**
 * Interface representing the data required to extract HTML from a document.
 * Contains information about the deposit or review and the filename to be processed.
 */
export interface IExtractHTMLEventData {
  depositOrReview: FlattenMaps<PopulatedDepositDocument> | FlattenMaps<ReviewDocumentPopulated>;
  filename: string;
}

/**
 * Event class for extracting HTML from a document.
 * Provides methods to handle notifications and history logging, though none are used for this event.
 */
export class ExtractHTMLEvent extends AppSystemEvent {
  type = EventType.EXTRACT_HTML;
  emailTemplateName = undefined;
  internalType = 'system' as const;

  /**
   * Initializes the event with data related to HTML extraction.
   *
   * @param {IExtractHTMLEventData} data - The data related to the HTML extraction event.
   */
  constructor(readonly data: IExtractHTMLEventData) {
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
   * Returns undefined as no email notification is required for this event.
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
