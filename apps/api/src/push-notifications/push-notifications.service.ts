import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AnyKeys, Model, Types } from 'mongoose';
import { AppPushSubscription, AppPushSubscriptionDocument } from './push-notification.schema';
import { assertIsDefined } from '../utils/utils';
import { environment } from '../environments/environment';
import { StrictFilterQuery } from '../utils/types';
import { sendNotification, setVapidDetails } from 'web-push';

/**
 * Service for handling PushNotificationsService.
 */
@Injectable()
export class PushNotificationsService {
  /**
   * Constructs an instance of PushNotificationsService with required services.
   *
   * @param {Model<AppPushSubscription>} pushNotificationModel - Model for push notification subscriptions.
   */
  constructor(
    @InjectModel(AppPushSubscription.name)
    public pushNotificationModel: Model<AppPushSubscription>
  ) {}

  /**
   * Creates a new push notification subscription in the database.
   *
   * @param {AnyKeys<AppPushSubscription>} filter - The subscription details to create.
   * @returns {Promise<AppPushSubscriptionDocument>} The created push subscription document.
   */
  async create(filter: AnyKeys<AppPushSubscription>): Promise<AppPushSubscriptionDocument> {
    return this.pushNotificationModel.create(filter);
  }

  /**
   * Finds a push subscription by its ID.
   *
   * @param {string | Types.ObjectId} id - The ID of the subscription to find.
   * @returns {Promise<AppPushSubscriptionDocument | null>} The found subscription document or null if not found.
   */
  async findById(id: string | Types.ObjectId): Promise<AppPushSubscriptionDocument | null> {
    return this.pushNotificationModel.findById(id).exec();
  }

  /**
   * Finds a single push subscription based on a query.
   *
   * @param {StrictFilterQuery<AppPushSubscriptionDocument>} filter - The filter criteria to use.
   * @returns {Promise<AppPushSubscriptionDocument | null>} The found subscription document or null if not found.
   */
  async findOne(
    filter: StrictFilterQuery<AppPushSubscriptionDocument>
  ): Promise<AppPushSubscriptionDocument | null> {
    return this.pushNotificationModel.findOne(filter).exec();
  }

  /**
   * Finds multiple push subscriptions based on a query.
   *
   * @param {StrictFilterQuery<AppPushSubscriptionDocument>} filter - The filter criteria to use.
   * @returns {Promise<AppPushSubscriptionDocument[]>} An array of found subscription documents.
   */
  async find(
    filter: StrictFilterQuery<AppPushSubscriptionDocument>
  ): Promise<AppPushSubscriptionDocument[]> {
    return this.pushNotificationModel.find(filter).exec();
  }

  /**
   * Checks if a subscription exists based on a query.
   *
   * @param {StrictFilterQuery<AppPushSubscriptionDocument>} filter - The filter criteria to check against.
   * @returns {Promise<Pick<AppPushSubscriptionDocument, '_id'> | null>} The ID of the found subscription document or null if not found.
   */
  async exists(
    filter: StrictFilterQuery<AppPushSubscriptionDocument>
  ): Promise<Pick<AppPushSubscriptionDocument, '_id'> | null> {
    return this.pushNotificationModel.exists(filter);
  }

  /**
   * Sends a push notification to a user based on their subscription details.
   *
   * @param {string} userId - The user ID associated with the subscription.
   * @param {unknown} notificationPayload - The notification data to send.
   */
  async sendPushNotification(userId: string, notificationPayload: unknown): Promise<void> {
    const allSubscriptions = await this.find({ userId: userId });
    assertIsDefined(environment.push_notifications_public_key);
    assertIsDefined(environment.push_notifications_private_key);

    setVapidDetails(
      'mailto:info@orvium.io',
      environment.push_notifications_public_key,
      environment.push_notifications_private_key
    );
    for (const subscription of allSubscriptions) {
      try {
        await sendNotification(subscription, JSON.stringify(notificationPayload));
      } catch (e) {
        console.log(e);
      }
    }
  }
}
