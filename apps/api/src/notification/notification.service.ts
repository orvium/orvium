import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AnyKeys, Model, Require_id, UpdateQuery } from 'mongoose';
import { AppNotification, AppNotificationDocument } from './notification.schema';
import { User, UserDocument } from '../users/user.schema';
import { PushNotificationsService } from '../push-notifications/push-notifications.service';
import { TemplateService } from '../template/template.service';
import { EmailService } from '../email/email.service';
import { UserService } from '../users/user.service';
import { AppCommunityEvent, AppSystemEvent } from '../event/event';
import { environment } from '../environments/environment';
import { ConfigurationService } from '../configuration/configuration.service';
import { assertIsDefined } from '../utils/utils';
import { StrictFilterQuery } from '../utils/types';

/**
 * Service for handling NotificationService.
 */
@Injectable()
export class NotificationService {
  /**
   * Constructs an instance of NotificationService with required services.
   *
   * @param {Model<AppNotification>} notificationModel - The model for AppNotifications, injected using dependency injection.
   * @param {PushNotificationsService} pushNotificationsService - Service for push notifications.
   * @param {EmailService} emailService - Service for sending emails.
   * @param {UserService} userService - Service for user-related operations.
   * @param {TemplateService} templateService - Service for managing templates.
   * @param {ConfigurationService} configurationService - Service for managing configurations.
   */
  constructor(
    @InjectModel(AppNotification.name) public notificationModel: Model<AppNotification>,
    private readonly pushNotificationsService: PushNotificationsService,
    private readonly emailService: EmailService,
    private readonly userService: UserService,
    private readonly templateService: TemplateService,
    private readonly configurationService: ConfigurationService
  ) {}

  /**
   * Finds notifications that match the given filter.
   *
   * @param {StrictFilterQuery<AppNotificationDocument>} filter - MongoDB filter to apply.
   * @returns {Promise<AppNotificationDocument[]>} A promise resolved with an array of found AppNotification documents.
   */
  async find(
    filter: StrictFilterQuery<AppNotificationDocument>
  ): Promise<AppNotificationDocument[]> {
    return this.notificationModel.find(filter).sort({ createdOn: -1 }).exec();
  }

  /**
   * Finds a single notification and updates it.
   *
   * @param {StrictFilterQuery<AppNotificationDocument>} filter - MongoDB filter to identify the notification.
   * @param {UpdateQuery<AppNotificationDocument>} update - Update operations to apply to the notification.
   * @returns {Promise<AppNotification | null>} A promise resolved with the updated notification document, or null if no document is found.
   */
  async findOneAndUpdate(
    filter: StrictFilterQuery<AppNotificationDocument>,
    update: UpdateQuery<AppNotificationDocument>
  ): Promise<AppNotification | null> {
    return this.notificationModel.findOneAndUpdate(filter, update).lean();
  }

  /**
   * Creates a new notification based on provided data.
   *
   * @param {AnyKeys<AppNotification>} newNotification - The properties of the new notification.
   * @returns {Promise<AppNotificationDocument>} A promise resolved with the newly created AppNotification document.
   */
  async create(newNotification: AnyKeys<AppNotification>): Promise<AppNotificationDocument> {
    const appNotification = await this.notificationModel.create(newNotification);
    return appNotification.save();
  }

  /**
   * Sends a notification based on an event to a specified user or email.
   *
   * @param {AppSystemEvent | AppCommunityEvent} event - The event triggering the notification.
   * @param {UserDocument | string | Require_id<User>} destinationUserOrEmail - The recipient user or email.
   * @returns {Promise<void>} A promise that resolves when the notification process is complete.
   */
  async notify(
    event: AppSystemEvent | AppCommunityEvent,
    destinationUserOrEmail: UserDocument | string | Require_id<User>
  ): Promise<void> {
    // The destination user can be a UserDocument or just an email
    // If only the email is passed, check if the user exists
    let userRegistered: UserDocument | null;
    let destinationEmail: string;
    if (typeof destinationUserOrEmail === 'string') {
      destinationEmail = destinationUserOrEmail;
      userRegistered = await this.userService.findOne({ email: destinationUserOrEmail });
    } else {
      userRegistered = await this.userService.findOne({ email: destinationUserOrEmail.email });
      assertIsDefined(userRegistered);
      assertIsDefined(userRegistered.email);
      destinationEmail = userRegistered.email;
    }

    let emailTemplate = undefined;

    if (event.emailTemplateName) {
      let templateSource = undefined;
      if (event.internalType === 'community') {
        // Check for custom template
        templateSource = await this.templateService.findOne({
          name: event.emailTemplateName,
          community: event.data.community._id,
        });
      }

      if (!templateSource) {
        // Check default template
        templateSource = await this.templateService.findOne({
          name: event.emailTemplateName,
        });
      }

      // Now we should have either the custom or de default template, otherwise throw error
      assertIsDefined(templateSource, 'Email template defined but not found in database');
      emailTemplate = event.getEmailTemplate(templateSource.template);
    } else {
      emailTemplate = event.getEmailTemplate('');
    }

    if (emailTemplate) {
      if (await this.isSendingEmailsAllowed(destinationEmail)) {
        await this.emailService.sendMail({
          ...emailTemplate,
          to: destinationEmail,
        });
      } else {
        await this.emailService.sendMail({
          ...emailTemplate,
          to: environment.adminEmail,
        });
      }
    }

    // Only users in the platform receive the following notifications
    if (userRegistered) {
      const appNotification = event.getAppNotificationTemplate(userRegistered.userId);
      if (appNotification) {
        await this.create(appNotification);
      }
      const pushNotification = event.getPushNotificationTemplate();
      if (pushNotification) {
        await this.pushNotificationsService.sendPushNotification(
          userRegistered.userId,
          pushNotification
        );
      }
    }
  }

  /**
   * Checks if sending emails to a particular email address is allowed based on the application's configuration.
   *
   * @param {string} destinationEmail - The email address to check.
   * @returns {Promise<boolean>} A promise resolved with a boolean indicating if sending emails to the address is allowed.
   */
  async isSendingEmailsAllowed(destinationEmail: string): Promise<boolean> {
    const emailDomain = destinationEmail.split('@')[1];
    // All emails are allowed in production
    if (environment.name === 'production') {
      return true;
    } else {
      const configuration = await this.configurationService.getConfiguration();
      // Only emails to orvium.io accounts are allowed in test
      if (
        configuration.allowedEmails.includes(destinationEmail.toLowerCase()) ||
        configuration.allowedEmailDomains.includes(emailDomain)
      ) {
        return true;
      }
    }
    return false;
  }
}
