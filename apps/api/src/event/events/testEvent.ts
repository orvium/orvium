import Mail from 'nodemailer/lib/mailer';
import { AppSystemEvent } from '../event';
import { HistoryLogLine } from '../../deposit/deposit.schema';
import { EventType } from '../event.schema';
import { FlattenMaps } from 'mongoose';
import { UserDocument } from '../../users/user.schema';

/**
 * Interface representing fake event data.
 * Contains details of the user associated with the event.
 */
export interface FakeEventData {
  user: FlattenMaps<UserDocument>;
}

/**
 * Event class representing a test event.
 * Generates a push notification template for testing purposes.
 */
export class TestEvent extends AppSystemEvent {
  emailTemplateName = undefined;
  internalType = 'system' as const;
  type = EventType.FAKE_EVENT;

  /**
   * Initializes the event with the provided fake data.
   *
   * @param {FakeEventData} data - The fake data for the test event.
   */
  constructor(readonly data: FakeEventData) {
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
   * No email template is provided for this event.
   *
   * @returns {Mail.Options | undefined} Undefined as no email template is generated.
   */
  getEmailTemplate(): Mail.Options | undefined {
    return undefined;
  }

  /**
   * Generates and returns a push notification template for the test event.
   *
   * @returns {unknown} The push notification template.
   */
  getPushNotificationTemplate(): unknown {
    const pushNotification = {
      notification: {
        title: 'Test Notification',
        body: 'This is how notifications will look like',
        icon: 'icon-96x96.png',
        vibrate: [100, 50, 100],
        data: {
          dateOfArrival: Date.now(),
          primaryKey: 1,
        },
        actions: [
          {
            action: 'coffee-action',
            title: 'Coffee',
            type: 'button',
            icon: '/images/demos/action-1-128x128.png',
          },
        ],
      },
    };

    return pushNotification;
  }

  /**
   * No history log template is provided for this event.
   *
   * @returns {HistoryLogLine | undefined} Undefined as no history log is generated.
   */
  getHistoryTemplate(): HistoryLogLine | undefined {
    return undefined;
  }
}
