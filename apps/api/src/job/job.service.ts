import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  EventDocument,
  EventDTO,
  EventStatus,
  EventType,
  RETRY_NUMBER,
} from '../event/event.schema';
import { environment } from '../environments/environment';
import { EventService } from '../event/event.service';
import { UserService } from '../users/user.service';
import { NotificationService } from '../notification/notification.service';
import { DepositService } from '../deposit/deposit.service';
import { CommunitiesService } from '../communities/communities.service';
import { extname } from 'path';
import { AwsStorageService } from '../common/aws-storage-service/aws-storage.service';
import { PandocService } from '../pandoc/pandoc.service';
import { IInviteEventData, InvitationEvent } from '../event/events/invitationCreatedEvent';
import { CommentCreatedEvent, ICommentCreatedData } from '../event/events/commentCreatedEvent';
import {
  DepositChangedToPendingApprovalEvent,
  IPendingApprovalData,
} from '../event/events/depositChangedToPendingApprovalEvent';
import { INewFileEventData } from '../event/events/fileUploadedEvent';
import { FeedbackCreatedEvent, IFeedbackEventData } from '../event/events/feedbackCreatedEvent';
import {
  IReviewInvitationEmailData,
  ReviewInvitationEmailEvent,
} from '../event/events/reviewInvitationEmailEvent';
import {
  IReviewCreatedEventData,
  ReviewPublishedConfirmationToAuthorEvent,
} from '../event/events/reviewPublishedConfirmationToAuthorEvent';
import {
  IReviewInvitationAcceptedData,
  ReviewInvitationAcceptedEvent,
} from '../event/events/reviewInvitationAcceptedEvent';
import { ConfirmationEmailEvent, IConfirmEmailData } from '../event/events/confirmationEmailEvent';
import { IUserCreatedEventData, UserCreatedEvent } from '../event/events/userCreatedEvent';
import {
  DepositSubmittedEvent,
  IDepositSubmittedData,
} from '../event/events/depositSubmittedEvent';
import {
  DepositRejectedByModeratorEvent,
  IDepositRejectedData,
} from '../event/events/depositRejectedByModerator';
import {
  IModeratorAssignedData,
  ModeratorAddedToCommunityEvent,
} from '../event/events/moderatorAddedToCommunityEvent';
import {
  IReviewPendingApprovalData,
  ReviewChangedToPendingApprovalEvent,
} from '../event/events/reviewChangedToPendingApprovalEvent';
import {
  IReviewToDraftData,
  ReviewChangedToDraftEvent,
} from '../event/events/reviewChangedToDraftEvent';
import {
  IReviewSubmittedData,
  ReviewSubmittedConfirmationEvent,
} from '../event/events/reviewSubmittedConfirmationEvent';
import {
  IReviewAcceptedData,
  ReviewPublishedConfirmationToReviewerEvent,
} from '../event/events/reviewPublishedConfirmationToReviewerEvent';
import {
  IReplyCommentCreatedData,
  ReplyCommentCreatedEvent,
} from '../event/events/replyCommentCreatedEvent';
import { DepositAcceptedEvent, IDepositAcceptedData } from '../event/events/depositAcceptedEvent';
import {
  IReminderDraftDeposit,
  ReminderDraftDepositEvent,
} from '../event/events/reminderDraftDeposit';
import { DepositStatus } from '../deposit/deposit.schema';
import { HttpService } from '@nestjs/axios';
import { assertIsDefined, hasProperty } from '../utils/utils';
import { EditorAssignedEvent, IEditorAssignedData } from '../event/events/editorAssignedEvent';
import {
  DepositDraftedByModeratorEvent,
  IDepositDraftedData,
} from '../event/events/depositDraftedByModerator';
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { IExtractHTMLEventData } from '../event/events/extractHTMLEvent';
import { lastValueFrom } from 'rxjs';
import {
  IIThenticateReportReadyData,
  IThenticateReportReadyEvent,
} from '../event/events/iThenticateReportReady';
import {
  CommunitySubmittedEvent,
  ICommunitySubmittedData,
} from '../event/events/communitySubmittedEvent';
import {
  CommunityChangedToPendingApprovalEvent,
  ICommunityPendingApprovalData,
} from '../event/events/communityChangedToPendingApprovalEvent';
import {
  gaRequestCommunityViews,
  gaRequestDepositViews,
  gaRequestReviewViews,
  MetricsService,
} from '../metrics/metrics.service';
import {
  CommunityAcceptedEvent,
  ICommunityAcceptedData,
} from '../event/events/communtyAcceptedEvent';
import {
  ChatMessageReceivedEvent,
  IChatMessageCreatedData,
} from '../event/events/chatMessageRecievedEvent';
import {
  IReviewInvitationRejectedData,
  ReviewInvitationRejectedEvent,
} from '../event/events/reviewInvitationRejectedEvent';
import {
  IReviewInvitationAcceptedConfirmationData,
  ReviewInvitationAcceptedConfirmationEvent,
} from '../event/events/reviewInvitationAcceptedConfirmationEvent';
import { ReviewService } from '../review/review.service';
import {
  IUnreadMessageReceivedData,
  unreadMessagesReceiveEvent,
} from '../event/events/unreadMessagesReceivedEvent';
import { FakeEventData, TestEvent } from '../event/events/testEvent';
import {
  DepositPublishedEvent,
  IDepositPublishedData,
} from '../event/events/depositPublishedEvent';
import {
  DepositBackToPendingApprovalData,
  DepositBackToPendingApprovalEvent,
} from '../event/events/depositBackToPendingApprovalEvent';
import {
  GeneralNotificationEvent,
  IGeneralNotificationData,
} from '../event/events/GeneralNotificationEvent';
import { DoiLogService } from '../doi/doi-log.service';
import { EmailService } from '../email/email.service';

/**
 * Service for handling background jobs and events.
 */
@Injectable()
export class JobService {
  /**
   * Initializes the JobService with required services.
   *
   * @param {EventService} eventService - Service for handling events.
   * @param {UserService} userService - Service for interacting with users.
   * @param {CommunitiesService} communityService - Service for interacting with communities.
   * @param {NotificationService} notificationService - Service for handling notifications.
   * @param {DepositService} depositService - Service for interacting with deposits.
   * @param {ReviewService} reviewService - Service for interacting with reviews.
   * @param {AwsStorageService} storageService - Service for interacting with AWS S3 storage.
   * @param {HttpService} httpService - Service for making HTTP requests.
   * @param {PandocService} pandocService - Service for converting documents with Pandoc.
   * @param {MetricsService} metricsService - Service for tracking metrics.
   * @param {DoiLogService} doiLogService - Service for logging DOI activity.
   * @param {EmailService} emailService - Service for sending emails.
   */
  constructor(
    private readonly eventService: EventService,
    private readonly userService: UserService,
    private readonly communityService: CommunitiesService,
    private readonly notificationService: NotificationService,
    private readonly depositService: DepositService,
    private readonly reviewService: ReviewService,
    private readonly storageService: AwsStorageService,
    private readonly httpService: HttpService,
    private readonly pandocService: PandocService,
    private readonly metricsService: MetricsService,
    private readonly doiLogService: DoiLogService,
    private readonly emailService: EmailService
  ) {}

  /**
   * Checks for pending events every second and processes them according to their type.
   *
   * @returns {Promise<void>} A promise that resolves when the check is complete.
   */
  @Cron(CronExpression.EVERY_SECOND)
  async checkEvents(): Promise<void> {
    const event = await this.eventService.findOne({
      status: EventStatus.PENDING,
      scheduledOn: { $lte: new Date() },
      retryCount: { $lt: RETRY_NUMBER },
    });

    if (event) {
      let eventNotFound = false;
      await this.eventService.setAsProcessing(event);
      try {
        switch (event.eventType) {
          case EventType.INVITE:
            await this.processInvite(event);
            break;
          case EventType.FEEDBACK:
            await this.sendFeedbackByEmail(event);
            break;
          case EventType.CONFIRM_EMAIL:
            await this.processConfirmationEmail(event);
            break;
          case EventType.REVIEW_INVITATION_EMAIL:
            await this.processReviewInvitationEmail(event);
            break;
          case EventType.COMMENT_CREATED:
            await this.commentCreated(event);
            break;
          case EventType.GENERAL_NOTIFICATION:
            await this.processGeneralNotification(event);
            break;
          case EventType.REPLY_COMMENT_CREATED:
            await this.replyCommentCreated(event);
            break;
          case EventType.REVIEW_CREATED:
            await this.reviewCreated(event);
            break;
          case EventType.REVIEW_INVITATION_ACCEPTED:
            await this.reviewInvitationAccepted(event);
            break;
          case EventType.REVIEW_INVITATION_REJECTED:
            await this.reviewInvitationRejected(event);
            break;
          case EventType.REVIEW_INVITATION_ACCEPTED_CONFIRMATION:
            await this.reviewInvitationAcceptedConfirmation(event);
            break;
          case EventType.NEW_FILE:
            await this.proccessNewFile(event);
            break;
          case EventType.EXTRACT_HTML:
            await this.proccessHTMLFromDOCX(event);
            break;
          case EventType.USER_CREATED:
            await this.userCreated(event);
            break;
          case EventType.COMMUNITY_PENDING_APPROVAL:
            await this.processCommunityPendingApproval(event);
            break;
          case EventType.DEPOSIT_PENDING_APPROVAL:
            await this.processDepositPendingApproval(event);
            break;
          case EventType.REVIEW_PENDING_APPROVAL:
            await this.processReviewPendingApproval(event);
            break;
          case EventType.REVIEW_TO_DRAFT:
            await this.processReviewToDraft(event);
            break;
          case EventType.OPENAIRE_HARVESTER:
            await this.processOpenAireHarvester();
            break;
          case EventType.IMPORT_DEPOSIT_VIEWS:
            await this.importDepositViews();
            break;
          case EventType.IMPORT_REVIEW_VIEWS:
            await this.importReviewViews();
            break;
          case EventType.IMPORT_COMMUNITY_VIEWS:
            await this.importCommunityViews();
            break;
          case EventType.DEPOSIT_REJECTED:
            await this.processDepositRejected(event);
            break;
          case EventType.DEPOSIT_DRAFTED:
            await this.processDepositDrafted(event);
            break;
          case EventType.MODERATOR_ASSIGNED:
            await this.processModeratorAssigned(event);
            break;
          case EventType.EDITOR_ASSIGNED:
            await this.processEditorAssigned(event);
            break;
          case EventType.DEPOSIT_ACCEPTED:
            await this.processDepositAccepted(event);
            break;
          case EventType.DEPOSIT_PUBLISHED:
            await this.processDepositPublished(event);
            break;
          case EventType.DEPOSIT_BACK_TO_PENDING_APPROVAL:
            await this.processDepositBackToPendingApproval(event);
            break;
          case EventType.REVIEW_SUBMITTED:
            await this.processReviewSubmitted(event);
            break;
          case EventType.DEPOSIT_SUBMITTED:
            await this.processDepositSubmitted(event);
            break;
          case EventType.REVIEW_ACCEPTED:
            await this.processReviewAccepted(event);
            break;
          case EventType.CREATE_REMINDERS:
            await this.processCreateReminders();
            break;
          case EventType.REMINDER_DRAFT_DEPOSIT:
            await this.processReminderDraftDeposit(event);
            break;
          case EventType.ITHENTICATE_REPORT_READY:
            await this.processIThenticateReportReady(event);
            break;
          case EventType.COMMUNITY_SUBMITTED:
            await this.processCommunitySubmitted(event);
            break;
          case EventType.COMMUNITY_ACCEPTED:
            await this.processCommunityAccepted(event);
            break;
          case EventType.CHAT_MESSAGE:
            await this.processChatMessage(event);
            break;
          case EventType.UNREAD_MESSAGE:
            await this.processUnreadMessage(event);
            break;
          case EventType.FAKE_EVENT:
            await this.processFakeEvent(event);
            break;
          default:
            eventNotFound = true;
        }
        if (eventNotFound) {
          Logger.warn('Event type not found');
          await this.eventService.setAsFailed(event);
        } else {
          await this.eventService.setAsProcessed(event);
        }
      } catch (e) {
        Logger.debug(e);
        await this.eventService.setAsPending(event);
      }
    }
  }

  /**
   * Execute on Monday at 11:30
   *
   * @returns {Promise<void>} A promise that resolves when the events are created.
   */
  @Cron('0 30 11 * * 1')
  async createWeeklyEvents(): Promise<void> {
    const eventOpenAirePayload: EventDTO = {
      eventType: EventType.OPENAIRE_HARVESTER,
      data: {},
    };
    await this.eventService.create(eventOpenAirePayload);
  }

  /**
   * Execute everyday at 9:00
   *
   * @returns {Promise<void>} A promise that resolves when the events are created.
   */
  @Cron(CronExpression.EVERY_DAY_AT_10AM)
  async createDailyEvents(): Promise<void> {
    const importDepositViewsEvent: EventDTO = {
      eventType: EventType.IMPORT_DEPOSIT_VIEWS,
      data: {},
    };
    await this.eventService.create(importDepositViewsEvent);

    const importCommunityViewsEvent: EventDTO = {
      eventType: EventType.IMPORT_COMMUNITY_VIEWS,
      data: {},
    };
    await this.eventService.create(importCommunityViewsEvent);

    await this.communityMembers(true);
    // TODO enable these reminders in the future
    // const reminders: EventDTO = {
    //   eventType: EVENT_TYPE.CREATE_REMINDERS,
    //   data: {},
    // };
    // await this.eventService.create(reminders);

    const importReviewViewsEvent: EventDTO = {
      eventType: EventType.IMPORT_REVIEW_VIEWS,
      data: {},
    };
    await this.eventService.create(importReviewViewsEvent);

    await this.emailService.sendMail({
      subject: '[CHECK] Email service check',
      to: environment.adminEmail,
    });
  }

  /**
   * Updates the DOI status for items in CrossRef every five minutes.
   *
   * @returns {Promise<void>} A promise that resolves when the status update is complete.
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async updateCrossrefDOIstatus(): Promise<void> {
    console.log('Updating DOI status');
    await this.doiLogService.updateDOIstatus();
  }

  /**
   * Sends feedback by email based on a feedback creation event.
   *
   * @param {EventDocument} event - The event document containing feedback data.
   * @returns {Promise<void>} A promise that resolves when the email is sent.
   */
  async sendFeedbackByEmail(event: EventDocument): Promise<void> {
    const data = event.data as IFeedbackEventData;
    assertIsDefined(environment.adminEmail);
    await this.notificationService.notify(new FeedbackCreatedEvent(data), environment.adminEmail);
  }

  /**
   * Processes user account confirmation emails.
   *
   * @param {EventDocument} event - The event document containing confirmation data.
   * @returns {Promise<void>} A promise that resolves when the process is complete.
   */
  async processConfirmationEmail(event: EventDocument): Promise<void> {
    const eventObject = new ConfirmationEmailEvent(event.data as IConfirmEmailData);
    await this.notificationService.notify(eventObject, eventObject.data.email);
  }

  /**
   * Processes invite events and sends notifications.
   *
   * @param {EventDocument} event - The event document containing invite data.
   * @returns {Promise<void>} A promise that resolves when invites are processed.
   */
  async processInvite(event: EventDocument): Promise<void> {
    const data = event.data as IInviteEventData;
    for (const email of data.emails) {
      await this.notificationService.notify(new InvitationEvent(data), email);
    }
  }

  /**
   * Handles event triggered when a review is created.
   *
   * @param {EventDocument} event - Event data including review details.
   * @returns {Promise<void>} A promise that resolves when the notification has been sent.
   */
  async reviewCreated(event: EventDocument): Promise<void> {
    const data = event.data as IReviewCreatedEventData;
    const user = await this.userService.findOne({ _id: data.deposit.creator });
    assertIsDefined(user);
    await this.notificationService.notify(new ReviewPublishedConfirmationToAuthorEvent(data), user);
  }

  /**
   * Processes an event when a review invitation is accepted.
   *
   * @param {EventDocument} event - Event data including invitation details.
   * @returns {Promise<void>} A promise that resolves when the notification has been sent to the sender.
   */
  async reviewInvitationAccepted(event: EventDocument): Promise<void> {
    const data = event.data as IReviewInvitationAcceptedData;
    const sender = await this.userService.findOne({ userId: data.sender.userId });
    assertIsDefined(sender, 'Sender not found');
    await this.notificationService.notify(new ReviewInvitationAcceptedEvent(data), sender);
  }

  /**
   * Processes an incoming chat message.
   *
   * @param {EventDocument} event - Event data including chat message details.
   * @returns {Promise<void>} A promise that resolves when the notification has been sent to the recipient.
   */
  async processChatMessage(event: EventDocument): Promise<void> {
    const data = event.data as IChatMessageCreatedData;
    await this.notificationService.notify(new ChatMessageReceivedEvent(data), data.recipientUser);
  }

  /**
   * Handles event for processing unread messages.
   *
   * @param {EventDocument} event - Event data including unread message details.
   * @returns {Promise<void>} A promise that resolves when the notification has been sent to the recipient.
   */
  async processUnreadMessage(event: EventDocument): Promise<void> {
    const data = event.data as IUnreadMessageReceivedData;
    await this.notificationService.notify(new unreadMessagesReceiveEvent(data), data.recipientUser);
  }

  /**
   * Processes an event when a review invitation is rejected.
   *
   * @param {EventDocument} event - Event data including rejection details.
   * @returns {Promise<void>} A promise that resolves when the notification has been sent to the sender.
   */
  async reviewInvitationRejected(event: EventDocument): Promise<void> {
    const data = event.data as IReviewInvitationRejectedData;
    const sender = await this.userService.findOne({ userId: data.sender.userId });
    assertIsDefined(sender, 'Sender not found');
    await this.notificationService.notify(new ReviewInvitationRejectedEvent(data), sender);
  }

  /**
   * Handles confirmation of an accepted review invitation.
   *
   * @param {EventDocument} event - Event data including confirmation details.
   * @returns {Promise<void>} A promise that resolves when the notification has been sent to the sender.
   */
  async reviewInvitationAcceptedConfirmation(event: EventDocument): Promise<void> {
    const data = event.data as IReviewInvitationAcceptedConfirmationData;
    assertIsDefined(data.reviewer, 'reviewer not found');
    const sender = await this.userService.findOne({ userId: data.reviewer.userId });
    assertIsDefined(sender, 'Sender not found');
    await this.notificationService.notify(
      new ReviewInvitationAcceptedConfirmationEvent(data),
      sender
    );
  }

  /**
   * Processes an event to send an email for a review invitation.
   *
   * @param {EventDocument} event - Event data including email details.
   * @returns {Promise<void>} A promise that resolves when the email has been sent.
   */
  async processReviewInvitationEmail(event: EventDocument): Promise<void> {
    const data = event.data as IReviewInvitationEmailData;
    await this.notificationService.notify(
      new ReviewInvitationEmailEvent(data),
      data.destinationEmail
    );
  }

  /**
   * Handles event triggered when a comment is created.
   *
   * @param {EventDocument} event - Event data including comment details.
   * @returns {Promise<void>} A promise that resolves when the notification has been sent to the user.
   */
  async commentCreated(event: EventDocument): Promise<void> {
    const data = event.data as ICommentCreatedData;
    await this.notificationService.notify(new CommentCreatedEvent(data), data.user);
  }

  /**
   * Processes an event when a reply to a comment is created.
   *
   * @param {EventDocument} event - Event data including reply details.
   * @returns {Promise<void>} A promise that resolves when the notification has been sent to the user.
   */
  async replyCommentCreated(event: EventDocument): Promise<void> {
    const data = event.data as IReplyCommentCreatedData;
    const user = await this.userService.findOne({ userId: data.userId });
    assertIsDefined(user);
    await this.notificationService.notify(new ReplyCommentCreatedEvent(data), user);
  }

  /**
   * Processes a new file depending on its file type. Handles file conversion and updates related deposit or review records.
   *
   * @param {EventDocument} event - Event data including file details.
   * @returns {Promise<void>} A promise that resolves when the file has been processed.
   */
  async proccessNewFile(event: EventDocument): Promise<void> {
    const data = event.data as INewFileEventData;
    Logger.debug(`Processing ${data.filename} file`);
    switch (extname(data.filename)) {
      case '.docx':
      case '.odt':
      case '.epub': {
        const downloadedFile = this.pandocService.downloadFile(data);
        try {
          await this.pandocService.exportToHTML(downloadedFile, data);
        } catch (e) {
          Logger.debug(e);
        }
        await this.pandocService.exportToPDF(downloadedFile, data);
        break;
      }
      case '.zip': {
        const downloadedZipFile = this.pandocService.downloadFile(data);
        const unzippedFolder = this.pandocService.unzipFile(downloadedZipFile);
        const downloadedTexFile = this.pandocService.findLatexMainFile(unzippedFolder);
        if (downloadedTexFile) {
          // await this.pandocService.exportToHTML(downloadedTexFile, data);
          await this.pandocService.exportToPDF(downloadedTexFile, data);
        }
        break;
      }
      case '.pdf': {
        if ('peerReviews' in data.depositOrReview) {
          await this.depositService.findOneAndUpdate(
            { _id: data.depositOrReview._id },
            {
              images: undefined,
              html: null,
            }
          );
        } else {
          await this.reviewService.findOneAndUpdate(
            { _id: data.depositOrReview._id },
            {
              images: undefined,
              html: null,
            }
          );
        }
        Logger.debug('PDF file processed');
        break;
      }
      default: {
        Logger.debug('Deleting previous generated pdf from if exists');

        if ('peerReviews' in data.depositOrReview) {
          const deposit = await this.depositService.findById(
            data.depositOrReview._id.toHexString()
          );
          assertIsDefined(deposit);
          if (deposit.pdfUrl) {
            await this.storageService.delete(
              `${data.depositOrReview._id.toHexString()}/${deposit.pdfUrl}`
            );
          }
          await this.depositService.findOneAndUpdate(
            { _id: data.depositOrReview._id },
            {
              images: undefined,
              html: undefined,
              pdfUrl: null,
            }
          );
          Logger.debug(`File ${data.filename} processed`);
          break;
        } else {
          const review = await this.reviewService.findById(data.depositOrReview._id.toHexString());
          assertIsDefined(review);
          if (review.pdfUrl) {
            await this.storageService.delete(
              `reviews/${review._id.toHexString()}/${review.pdfUrl}`
            );
          }
          await this.reviewService.findOneAndUpdate(
            { _id: review._id },
            {
              images: undefined,
              html: undefined,
              pdfUrl: null,
            }
          );
          Logger.debug(`File ${data.filename} processed`);
          break;
        }
      }
    }
  }

  /**
   * Extracts and converts the contents of a DOCX file to HTML format.
   *
   * @param {EventDocument} event - Event data including the DOCX file details.
   * @returns {Promise<void>} A promise that resolves when the HTML has been successfully extracted.
   */
  async proccessHTMLFromDOCX(event: EventDocument): Promise<void> {
    const data = event.data as IExtractHTMLEventData;
    Logger.debug('DOCX extracting HTML');
    const downloadedFile = this.pandocService.downloadFile(data);
    await this.pandocService.exportToHTML(downloadedFile, data);
    Logger.debug('DOCX extracted HTML');
  }

  /**
   * Handles the creation of a new user and sends notifications related to the user creation process.
   *
   * @param {EventDocument} event - Event data including user creation details.
   * @returns {Promise<void>} A promise that resolves when notifications have been sent.
   */
  async userCreated(event: EventDocument): Promise<void> {
    const data = event.data as IUserCreatedEventData;

    const userCreatedEvent = new UserCreatedEvent(data);
    await this.notificationService.notify(userCreatedEvent, userCreatedEvent.data.user);

    if (data.user.emailPendingConfirmation) {
      const code = data.user.confirmEmailCode?.codeEmail;
      assertIsDefined(code, 'code is not defined');
      const eventObject = new ConfirmationEmailEvent({
        code: code,
        email: data.user.emailPendingConfirmation,
      });
      await this.notificationService.notify(eventObject, eventObject.data.email);
    }
  }

  /**
   * Processes the event when a community is pending approval, notifying the administrators.
   *
   * @param {EventDocument} event - Event data including community details.
   * @returns {Promise<void>} A promise that resolves when the notification has been sent.
   */
  async processCommunityPendingApproval(event: EventDocument): Promise<void> {
    const data = event.data as ICommunityPendingApprovalData;
    const user = await this.userService.findOne({ _id: data.community.creator });
    if (user) {
      await this.notificationService.notify(
        new CommunityChangedToPendingApprovalEvent(data),
        environment.adminEmail
      );
    }
  }

  /**
   * Processes a deposit pending approval event, notifying moderators of the community associated with the deposit.
   *
   * @param {EventDocument} event - Event data including deposit and community details.
   * @returns {Promise<void>} A promise that resolves when all notifications have been sent.
   */
  async processDepositPendingApproval(event: EventDocument): Promise<void> {
    const data = event.data as IPendingApprovalData;
    const emails: string[] = [];
    const communityModerators = await this.communityService.getModerators(data.community._id);
    for (const moderator of communityModerators) {
      if (!hasProperty(moderator.user, 'nickname')) {
        throw new NotFoundException('User is not populated');
      }
      if (moderator.user.email && !moderator.user.emailPendingConfirmation) {
        if (moderator.notificationOptions) {
          // Then we only send emails to tracks included in notification options
          if (
            data.deposit.newTrackTimestamp &&
            moderator.notificationOptions.tracks.includes(data.deposit.newTrackTimestamp)
          ) {
            emails.push(moderator.user.email);
          }
        } else {
          emails.push(moderator.user.email);
        }
      }
    }
    for (const email of emails) {
      await this.notificationService.notify(new DepositChangedToPendingApprovalEvent(data), email);
    }
  }

  /**
   * Processes a review pending approval event, notifying the admin email configured in the environment.
   *
   * @param {EventDocument} event - Event data including review details.
   * @returns {Promise<void>} A promise that resolves when the notification has been sent.
   */
  async processReviewPendingApproval(event: EventDocument): Promise<void> {
    const data = event.data as IReviewPendingApprovalData;
    let emails: string[] = [];
    if (environment.adminEmail) {
      emails = [environment.adminEmail];
    }

    for (const email of emails) {
      await this.notificationService.notify(new ReviewChangedToPendingApprovalEvent(data), email);
    }
  }

  /**
   * Moves a review back to draft status and notifies the creator of the review.
   *
   * @param {EventDocument} event - Event data including review details.
   * @returns {Promise<void>} A promise that resolves when the notification has been sent.
   */
  async processReviewToDraft(event: EventDocument): Promise<void> {
    const data = event.data as IReviewToDraftData;
    const user = await this.userService.findOne({ _id: data.review.creator });
    if (user) {
      await this.notificationService.notify(new ReviewChangedToDraftEvent(data), user);
    }
  }

  /**
   * Handles the processing of OpenAIRE harvester, updating records based on OpenAIRE API results.
   *
   * @returns {Promise<void>} A promise that resolves when all relevant deposits have been updated.
   */
  async processOpenAireHarvester(): Promise<void> {
    const url =
      'https://services.openaire.eu/search/v2/api/publications?fq=collectedfromdatasourceid%20exact%20%22opendoar____::f00e1df0c9e961695bd1c1d9816d0c04%22or%20resulthostingdatasourceid%20exact%20%22opendoar____::f00e1df0c9e961695bd1c1d9816d0c04%22&sortBy=resultdateofacceptance,descending&page=0&size=10000&format=json';
    const result = await lastValueFrom(
      this.httpService.get(url, {
        headers: {
          Accept: 'application/json',
        },
      })
    );
    assertIsDefined(result.data.results, 'Publications not found');

    // Documentation: https://www.openaire.eu/schema/0.3/doc/oaf-result-0_3_xsd.html
    const results = result.data.results;
    for (const result of results) {
      const link: string = result.result.header['dri:objIdentifier'];
      assertIsDefined(link);
      Logger.debug(`Processing record ${link}`);

      const originalId: string[] =
        result.result.metadata['oaf:entity']['oaf:result'].originalId || [];
      const orviumId = originalId.find(line => String(line).startsWith('oai:orvium.io:'));
      const depositId = orviumId?.split(':').pop();
      assertIsDefined(depositId);
      Logger.debug(`Found publication with id ${depositId} and link ${link}`);
      if (depositId) {
        const deposit = await this.depositService.findById(depositId);
        if (deposit) {
          if (!deposit.openAireIdentifier || deposit.openAireIdentifier !== link) {
            Logger.warn(`Identifier ${deposit.openAireIdentifier || ''} has changed to ${link}`);
            deposit.openAireIdentifier = link;
            await deposit.save();
            Logger.debug(`Deposit ${deposit._id.toHexString()} saved`);
          }
        } else {
          Logger.warn('Deposit not found!');
        }
      } else {
        Logger.error(`Not found orvium id for ${link}`);
      }
    }
  }

  /**
   * Imports community views from Google Analytics and updates community metrics.
   *
   * @returns {Promise<void>} A promise that resolves when the community views have been updated.
   */
  async importCommunityViews(): Promise<void> {
    if (!environment.googleAnalytics.credentials || !environment.googleAnalytics.property) {
      console.error('Google Analytics credentials or property not configured!');
      return;
    }

    const analyticsDataClient = new BetaAnalyticsDataClient({
      credentials: JSON.parse(environment.googleAnalytics.credentials),
    });
    const [response] = await analyticsDataClient.runReport(
      gaRequestCommunityViews('2018-01-01', 'yesterday')
    );

    await this.metricsService.create({ communityReport: response });

    await this.communityService.updateCommunityViews(response);
  }

  /**
   * Imports deposit views from Google Analytics and updates deposit metrics.
   *
   * @returns {Promise<void>} A promise that resolves when the deposit views have been updated.
   */
  async importDepositViews(): Promise<void> {
    if (!environment.googleAnalytics.credentials || !environment.googleAnalytics.property) {
      console.error('Google Analytics credentials or property not configured!');
      return;
    }

    const analyticsDataClient = new BetaAnalyticsDataClient({
      credentials: JSON.parse(environment.googleAnalytics.credentials),
    });
    const [response] = await analyticsDataClient.runReport(
      gaRequestDepositViews('2018-01-01', 'yesterday')
    );

    await this.metricsService.create({ depositReport: response });

    await this.depositService.updateDepositViews(response);
  }

  /**
   * Processes pending review data for generating review views analytics.
   *
   * @returns {Promise<void>} A promise that resolves when the review views have been imported and updated.
   */
  async importReviewViews(): Promise<void> {
    if (!environment.googleAnalytics.credentials || !environment.googleAnalytics.property) {
      console.error('Google Analytics credentials or property not configured!');
      return;
    }

    const analyticsDataClient = new BetaAnalyticsDataClient({
      credentials: JSON.parse(environment.googleAnalytics.credentials),
    });
    const [response] = await analyticsDataClient.runReport(
      gaRequestReviewViews('2018-01-01', 'yesterday')
    );

    await this.metricsService.create({ reviewReport: response });

    await this.reviewService.updateReviewViews(response);
  }

  /**
   * Processes the event where a moderator is assigned to a community.
   *
   * @param {EventDocument} event - Event containing data related to the moderator assignment.
   * @returns {Promise<void>} A promise that resolves when the moderator has been notified.
   */
  async processModeratorAssigned(event: EventDocument): Promise<void> {
    const data = event.data as IModeratorAssignedData;
    await this.notificationService.notify(new ModeratorAddedToCommunityEvent(data), data.user);
  }

  /**
   * Processes the event where an editor is assigned to a deposit.
   *
   * @param {EventDocument} event - Event containing data related to the editor assignment.
   * @returns {Promise<void>} A promise that resolves when the editor has been notified.
   */
  async processEditorAssigned(event: EventDocument): Promise<void> {
    const data = event.data as IEditorAssignedData;
    const editor = await this.userService.findOne({ _id: data.deposit.assignee });
    if (editor) {
      await this.notificationService.notify(new EditorAssignedEvent(data), editor);
    }
  }

  /**
   * Processes the event when a community submission is made.
   *
   * @param {EventDocument} event - Event containing data related to the community submission.
   * @returns {Promise<void>} A promise that resolves when the community creator has been notified.
   */
  async processCommunitySubmitted(event: EventDocument): Promise<void> {
    const data = event.data as ICommunitySubmittedData;
    const user = await this.userService.findOne({ _id: data.community.creator });
    if (user) {
      await this.notificationService.notify(new CommunitySubmittedEvent(data), user);
    }
  }

  /**
   * Processes the event when a community is accepted.
   *
   * @param {EventDocument} event - Event containing data related to the community acceptance.
   * @returns {Promise<void>} A promise that resolves when the community creator has been notified.
   */
  async processCommunityAccepted(event: EventDocument): Promise<void> {
    const data = event.data as ICommunityAcceptedData;
    const user = await this.userService.findOne({ _id: data.community.creator });
    if (user) {
      await this.notificationService.notify(new CommunityAcceptedEvent(data), user);
    }
  }

  /**
   * Processes the event when a deposit submission is made.
   *
   * @param {EventDocument} event - Event containing data related to the deposit submission.
   * @returns {Promise<void>} A promise that resolves when the deposit creator has been notified.
   */
  async processDepositSubmitted(event: EventDocument): Promise<void> {
    const data = event.data as IDepositSubmittedData;
    const user = await this.userService.findOne({ _id: data.deposit.creator });
    if (user) {
      await this.notificationService.notify(new DepositSubmittedEvent(data), user);
    }
  }

  /**
   * Processes the event when a deposit is rejected.
   *
   * @param {EventDocument} event - Event containing data related to the deposit rejection.
   * @returns {Promise<void>} A promise that resolves when the deposit creator has been notified.
   */
  async processDepositRejected(event: EventDocument): Promise<void> {
    const data = event.data as IDepositRejectedData;
    const user = await this.userService.findOne({ _id: data.deposit.creator });
    if (user) {
      await this.notificationService.notify(new DepositRejectedByModeratorEvent(data), user);
    }
  }

  /**
   * Processes the event when a deposit is drafted.
   *
   * @param {EventDocument} event - Event containing data related to the deposit drafting.
   * @returns {Promise<void>} A promise that resolves when the deposit creator has been notified.
   */
  async processDepositDrafted(event: EventDocument): Promise<void> {
    const data = event.data as IDepositDraftedData;
    const user = await this.userService.findOne({ _id: data.deposit.creator });
    if (user) {
      await this.notificationService.notify(new DepositDraftedByModeratorEvent(data), user);
    }
  }

  /**
   * Processes the event when a deposit is accepted.
   *
   * @param {EventDocument} event - Event containing data related to the deposit acceptance.
   * @returns {Promise<void>} A promise that resolves when the deposit creator has been notified.
   */
  async processDepositAccepted(event: EventDocument): Promise<void> {
    const data = event.data as IDepositAcceptedData;
    const user = await this.userService.findOne({ _id: data.deposit.creator });
    if (user) {
      await this.notificationService.notify(new DepositAcceptedEvent(data), user);
    }
  }

  /**
   * Processes the event when a deposit is published.
   *
   * @param {EventDocument} event - Event containing data related to the deposit publication.
   * @returns {Promise<void>} A promise that resolves when the deposit creator has been notified.
   */
  async processDepositPublished(event: EventDocument): Promise<void> {
    const data = event.data as IDepositPublishedData;
    const user = await this.userService.findOne({ _id: data.deposit.creator });
    if (user) {
      await this.notificationService.notify(new DepositPublishedEvent(data), user);
    }
  }

  /**
   * Processes the event when a deposit is sent back to pending approval.
   *
   * @param {EventDocument} event - Event containing data related to sending the deposit back to pending approval.
   * @returns {Promise<void>} A promise that resolves when the deposit creator has been notified.
   */
  async processDepositBackToPendingApproval(event: EventDocument): Promise<void> {
    const data = event.data as DepositBackToPendingApprovalData;
    const user = await this.userService.findOne({ _id: data.deposit.creator });
    if (user) {
      await this.notificationService.notify(new DepositBackToPendingApprovalEvent(data), user);
    }
  }

  /**
   * Processes the event when a review is submitted.
   *
   * @param {EventDocument} event - Event containing data related to the review submission.
   * @returns {Promise<void>} A promise that resolves when the review creator has been notified.
   */
  async processReviewSubmitted(event: EventDocument): Promise<void> {
    const data = event.data as IReviewSubmittedData;
    const user = await this.userService.findOne({ _id: data.review.creator });
    if (user) {
      await this.notificationService.notify(new ReviewSubmittedConfirmationEvent(data), user);
    }
  }

  /**
   * Processes the event when a review is accepted.
   *
   * @param {EventDocument} event - Event containing data related to the review acceptance.
   * @returns {Promise<void>} A promise that resolves when the review creator has been notified.
   */
  async processReviewAccepted(event: EventDocument): Promise<void> {
    const data = event.data as IReviewAcceptedData;
    const user = await this.userService.findOne({ _id: data.review.creator });
    if (user) {
      await this.notificationService.notify(
        new ReviewPublishedConfirmationToReviewerEvent(data),
        user
      );
    }
  }

  /**
   * Processes the event when a reminder is created for a draft deposit.
   *
   * @param {EventDocument} event - Event containing data related to the draft deposit reminder.
   * @returns {Promise<void>} A promise that resolves when the deposit creator has been reminded.
   */
  async processReminderDraftDeposit(event: EventDocument): Promise<void> {
    const data = event.data as IReminderDraftDeposit;
    await this.notificationService.notify(new ReminderDraftDepositEvent(data), data.user);
  }

  /**
   * Schedules and manages reminders for draft deposits.
   *
   * @returns {Promise<void>} A promise that resolves when reminders have been created or updated.
   */
  async processCreateReminders(): Promise<void> {
    const today = new Date();
    const twoWeeksAgo = today.setDate(today.getDate() - 14);
    const deposits = await this.depositService.find({
      status: DepositStatus.draft,
      updatedAt: { $lte: twoWeeksAgo },
    });
    const events = await this.eventService.find({ eventType: EventType.REMINDER_DRAFT_DEPOSIT });
    for (const deposit of deposits) {
      const wasReminded = events?.find(event =>
        (event.data as IReminderDraftDeposit).deposit._id.equals(deposit._id)
      );
      if (!wasReminded) {
        const user = await this.userService.findOne({
          _id: deposit.creator,
          acceptedTC: true,
        });
        if (user) {
          const event = new ReminderDraftDepositEvent({
            deposit: deposit.toJSON(),
            user: user.toJSON(),
          });
          await this.eventService.create(event.getEventDTO());
        }
      }
    }
  }

  /**
   * Processes the iThenticate report readiness event.
   *
   * @param {EventDocument} event - Event containing data related to the iThenticate report.
   * @returns {Promise<void>} A promise that resolves when the submitter has been notified.
   */
  async processIThenticateReportReady(event: EventDocument): Promise<void> {
    const data = event.data as IIThenticateReportReadyData;
    await this.notificationService.notify(new IThenticateReportReadyEvent(data), data.submitter);
  }

  /**
   * Processes fake events.
   *
   * @param {EventDocument} event - Event containing general notification data.
   * @returns {Promise<void>} A promise that resolves when all recipients have been notified.
   */
  async processFakeEvent(event: EventDocument): Promise<void> {
    const data = event.data as FakeEventData;
    await this.notificationService.notify(new TestEvent(data), data.user);
  }

  /**
   * Processes general notifications for events.
   *
   * @param {EventDocument} event - Event containing general notification data.
   * @returns {Promise<void>} A promise that resolves when all recipients have been notified.
   */
  async processGeneralNotification(event: EventDocument): Promise<void> {
    const data = event.data as IGeneralNotificationData;
    for (const recipient of data.recipients) {
      await this.notificationService.notify(new GeneralNotificationEvent(data), recipient);
    }
  }

  /**
   * Manages community membership details, optionally saving changes.
   *
   * @param {boolean} [save=false] - Whether to save changes to the database.
   * @returns {Promise<void>} A promise that resolves when community member data has been updated.
   */
  async communityMembers(save?: boolean): Promise<void> {
    const communities = await this.communityService.find({});

    // Calculate baseline of members for each community
    for (const commmunity of communities) {
      Logger.warn(
        `Updating members for community ${commmunity.name} with id ${commmunity._id.toHexString()}`
      );
      let authorCount = 0;
      let moderatorCount = 0;
      let reviewerCount = 0;
      moderatorCount = commmunity.moderatorsPopulated.length;
      const deposits = await this.depositService.depositModel.find({ community: commmunity._id });
      const reviews = await this.reviewService.reviewModel.find({ community: commmunity._id });
      reviewerCount = reviews.length;

      for (const deposit of deposits) {
        authorCount += deposit.authors.length;
      }
      Logger.debug(`Moderators: ${moderatorCount}`);
      Logger.debug(`Reviewers: ${reviewerCount}`);
      Logger.debug(`Authors: ${authorCount}`);

      commmunity.followersCount = moderatorCount + reviewerCount + authorCount;
      Logger.debug(`Total: ${commmunity.followersCount}`);

      if (save) {
        await commmunity.save();
      }
    }

    const communitiesWithConferences = await this.communityService.find({
      conferenceProceedings: { $exists: true, $ne: [] },
    });

    for (const commmunity of communitiesWithConferences) {
      Logger.warn(
        `Updating community with conferences ${
          commmunity.name
        } with id ${commmunity._id.toHexString()}`
      );
      for (const conference of commmunity.conferenceProceedingsPopulated) {
        Logger.debug(
          `Found conference ${conference.name} with followers ${conference.followersCount}`
        );
        commmunity.followersCount += conference.followersCount;
      }
      Logger.warn(`New followers count is ${commmunity.followersCount}`);

      if (save) {
        await commmunity.save();
      }
    }
  }
}
