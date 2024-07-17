import { Test, TestingModule } from '@nestjs/testing';
import { JobService } from './job.service';
import { environment } from '../environments/environment';
import { CommunitiesService } from '../communities/communities.service';
import { PandocService } from '../pandoc/pandoc.service';
import { EventService } from '../event/event.service';
import { NotificationService } from '../notification/notification.service';
import { ReviewStatus } from '../review/review.schema';
import { EventDTO, EventStatus, EventType } from '../event/event.schema';
import { DepositStatus } from '../deposit/deposit.schema';
import { DepositService } from '../deposit/deposit.service';
import {
  createCommunity,
  createConversation,
  createDeposit,
  createInvite,
  createReview,
  createUser,
  factoryFeedback,
  factoryInvite,
  factoryUser,
} from '../utils/test-data';
import { HttpModule, HttpService } from '@nestjs/axios';
import { InvitationEvent } from '../event/events/invitationCreatedEvent';
import { FeedbackCreatedEvent } from '../event/events/feedbackCreatedEvent';
import { FeedbackDocument } from '../feedback/feedback.schema';
import { ConfirmationEmailEvent } from '../event/events/confirmationEmailEvent';
import { ReviewInvitationEmailEvent } from '../event/events/reviewInvitationEmailEvent';
import { CommentCreatedEvent } from '../event/events/commentCreatedEvent';
import { Commentary, CommentTags } from '../comments/comments.schema';
import { DepositChangedToPendingApprovalEvent } from '../event/events/depositChangedToPendingApprovalEvent';
import { DepositSubmittedEvent } from '../event/events/depositSubmittedEvent';
import { ReviewPublishedConfirmationToAuthorEvent } from '../event/events/reviewPublishedConfirmationToAuthorEvent';
import { ReviewInvitationAcceptedEvent } from '../event/events/reviewInvitationAcceptedEvent';
import { ReviewChangedToPendingApprovalEvent } from '../event/events/reviewChangedToPendingApprovalEvent';
import { UserCreatedEvent } from '../event/events/userCreatedEvent';
import { ReviewChangedToDraftEvent } from '../event/events/reviewChangedToDraftEvent';
import { ReplyCommentCreatedEvent } from '../event/events/replyCommentCreatedEvent';
import { FileUploadedEvent, INewFileEventData } from '../event/events/fileUploadedEvent';
import { of } from 'rxjs';
import { AxiosResponse } from 'axios';
import { IExtractHTMLEventData } from '../event/events/extractHTMLEvent';
import { assertIsDefined } from '../utils/utils';
import { ReviewService } from '../review/review.service';
import { cleanCollections, MongooseTestingModule } from '../utils/mongoose-testing.module';
import {
  IIThenticateReportReadyData,
  IThenticateReportReadyEvent,
} from '../event/events/iThenticateReportReady';
import { google } from '@google-analytics/data/build/protos/protos';
import { InviteService } from '../invite/invite.service';
import { ChatMessageReceivedEvent } from '../event/events/chatMessageRecievedEvent';
import { ReviewInvitationRejectedEvent } from '../event/events/reviewInvitationRejectedEvent';
import { ReviewInvitationAcceptedConfirmationEvent } from '../event/events/reviewInvitationAcceptedConfirmationEvent';
import { CommunityAcceptedEvent } from '../event/events/communtyAcceptedEvent';
import { CommunitySubmittedEvent } from '../event/events/communitySubmittedEvent';
import { CommunityChangedToPendingApprovalEvent } from '../event/events/communityChangedToPendingApprovalEvent';
import { ReviewSubmittedConfirmationEvent } from '../event/events/reviewSubmittedConfirmationEvent';
import { ReviewPublishedConfirmationToReviewerEvent } from '../event/events/reviewPublishedConfirmationToReviewerEvent';
import { unreadMessagesReceiveEvent } from '../event/events/unreadMessagesReceivedEvent';
import { generateOpenaireResponse } from '../fixtures/openaire';
import { DepositPublishedEvent } from '../event/events/depositPublishedEvent';
import { DepositBackToPendingApprovalEvent } from '../event/events/depositBackToPendingApprovalEvent';
import { DepositPopulatedDTO } from '../dtos/deposit/deposit-populated.dto';
import { Require_id, Types } from 'mongoose';
import { ModeratorRole } from '../communities/communities-moderator.schema';
import { DepositAcceptedEvent } from '../event/events/depositAcceptedEvent';
import { DepositRejectedByModeratorEvent } from '../event/events/depositRejectedByModerator';
import { DepositDraftedByModeratorEvent } from '../event/events/depositDraftedByModerator';
import { ModeratorAddedToCommunityEvent } from '../event/events/moderatorAddedToCommunityEvent';
import { EditorAssignedEvent } from '../event/events/editorAssignedEvent';
import { GeneralNotificationEvent } from '../event/events/GeneralNotificationEvent';
import IRunReportResponse = google.analytics.data.v1beta.IRunReportResponse;
import DimensionValue = google.analytics.data.v1beta.DimensionValue;
import { DoiLogService } from '../doi/doi-log.service';
import { EmailService } from '../email/email.service';

const runReportSpy = jest.fn();
jest.mock('@google-analytics/data', () => {
  return {
    BetaAnalyticsDataClient: jest.fn().mockImplementation(() => {
      return { runReport: runReportSpy };
    }),
  };
});

describe('JobService', () => {
  let service: JobService;
  let eventService: EventService;
  let notificationService: NotificationService;
  let emailService: EmailService;
  let httpService: HttpService;
  let inviteService: InviteService;
  let module: TestingModule;

  beforeAll(async () => {
    // Create dummy env values
    environment.googleAnalytics.credentials = '{"result":true, "count":42}';
    environment.googleAnalytics.property = '123456789';

    module = await Test.createTestingModule({
      imports: [MongooseTestingModule.forRoot('JobService'), HttpModule],
      providers: [
        JobService,
        {
          provide: PandocService,
          useValue: {
            exportToHTML: jest.fn().mockImplementation(),
            exportToPDF: jest.fn().mockImplementation(),
            unzipFile: jest.fn().mockImplementation(),
            findLatexMainFile: jest.fn().mockReturnValue('myfile.tex'),
            downloadFile: jest
              .fn()
              .mockImplementation((data: INewFileEventData) => `/localfolder/${data.filename}`),
          },
        },
      ],
    }).compile();
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    service = module.get(JobService);
    httpService = module.get(HttpService);
    eventService = module.get(EventService);
    notificationService = module.get(NotificationService);
    emailService = module.get(EmailService);
    jest.spyOn(notificationService, 'notify').mockImplementation();
    inviteService = module.get(InviteService);

    await cleanCollections(module);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should check events when empty', async () => {
    await expect(service.checkEvents()).resolves.not.toThrow();
  });

  it('should process ModeratorAssigned event', async () => {
    const user = await createUser(module);
    const { community } = await createCommunity(module);
    const event = new ModeratorAddedToCommunityEvent({
      user: user.toJSON(),
      community: community.toJSON(),
    });
    const spy = jest.spyOn(notificationService, 'notify');
    await eventService.create(event.getEventDTO());
    await service.checkEvents();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should process CommunityChangedToPendingApprovalEvent', async () => {
    const user = await createUser(module);
    const { community } = await createCommunity(module);
    const event = new CommunityChangedToPendingApprovalEvent({
      user: user.toJSON(),
      community: community.toJSON(),
    });

    const spy = jest.spyOn(notificationService, 'notify');
    await eventService.create(event.getEventDTO());
    await service.checkEvents();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should process community submited event', async () => {
    const { community, communityOwner } = await createCommunity(module);
    const event = new CommunitySubmittedEvent({
      user: communityOwner.toJSON(),
      community: community.toJSON(),
    });

    const spy = jest.spyOn(notificationService, 'notify');
    await eventService.create(event.getEventDTO());
    await service.checkEvents();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should process community accepted event', async () => {
    const { community, communityOwner } = await createCommunity(module);

    const event = new CommunityAcceptedEvent({
      user: communityOwner.toJSON(),
      community: community.toJSON(),
    });
    const spy = jest.spyOn(notificationService, 'notify');
    await eventService.create(event.getEventDTO());
    await service.checkEvents();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should process create reminders event', async () => {
    const event: EventDTO = {
      eventType: EventType.CREATE_REMINDERS,
      data: {},
    };
    await eventService.create(event);
    await service.checkEvents();
  });

  it('should process GA4 reports', async () => {
    const { community } = await createCommunity(module);
    const { deposit } = await createDeposit(module, { community });
    const { review } = await createReview(module, deposit);
    const fakeGAReport = (objectId: string): IRunReportResponse => {
      const report: IRunReportResponse = {
        dimensionHeaders: [
          {
            name: 'pagePathPlusQueryString',
          },
        ],
        metricHeaders: [
          {
            name: 'screenPageViews',
            type: 'TYPE_INTEGER',
          },
        ],
        rows: [
          {
            dimensionValues: [
              {
                value: `/deposits/${objectId}/view`,
                oneValue: 'value',
              },
              {
                value: `/reviews/${objectId}/view`,
                oneValue: 'value',
              },
            ] as DimensionValue[],
            metricValues: [
              {
                value: '1173',
                oneValue: 'value',
              },
            ] as DimensionValue[],
          },
        ],
      };
      return report;
    };

    runReportSpy.mockResolvedValue([fakeGAReport(deposit._id.toHexString())]);

    await service.importDepositViews();

    const updatedDeposit = await module.get(DepositService).findOne({ _id: deposit._id });
    assertIsDefined(updatedDeposit);
    expect(updatedDeposit.views).toBe(1173);

    runReportSpy.mockResolvedValue([fakeGAReport(community._id.toHexString())]);

    await service.importCommunityViews();

    const updatedCommunity = await module.get(CommunitiesService).findById(community._id);
    assertIsDefined(updatedCommunity);
    expect(updatedCommunity.views).toBe(1173);

    runReportSpy.mockResolvedValue([fakeGAReport(review._id.toHexString())]);
    await service.importReviewViews();

    const updatedReview = await module.get(ReviewService).findById(review._id);
    assertIsDefined(updatedReview);
    expect(updatedReview.views).toBe(1173);
  });

  it('should process EditorAssigned event when editor assigned', async () => {
    const { community, moderator } = await createCommunity(module);
    const { deposit, author } = await createDeposit(module, {
      community,
      deposit: { status: DepositStatus.published },
    });

    const event = new EditorAssignedEvent({
      user: author.toJSON(),
      deposit: deposit.toJSON(),
      community: community.toJSON(),
    });
    const spy = jest.spyOn(notificationService, 'notify');
    await eventService.create(event.getEventDTO());
    await service.checkEvents();
    expect(spy).toHaveBeenCalledTimes(0);

    const event2 = new EditorAssignedEvent({
      user: author.toJSON(),
      deposit: { ...deposit.toJSON(), assignee: moderator._id.toHexString() },
      community: community.toJSON(),
    });
    await eventService.create(event2.getEventDTO());
    await service.checkEvents();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should process InvitationEvent', async () => {
    const user = await createUser(module);

    const event = new InvitationEvent({
      emails: ['example1@example.com', 'example2@example.com'],
      sender: user.toJSON(),
    });
    await eventService.create(event.getEventDTO());
    const spy = jest.spyOn(notificationService, 'notify');
    await service.checkEvents();
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('should process FeedbackCreatedEvent', async () => {
    const feedback = factoryFeedback.build({
      description: 'Test feedback',
    });
    const event = new FeedbackCreatedEvent({ feedback: feedback as FeedbackDocument });
    await eventService.create(event.getEventDTO());
    const spy = jest.spyOn(notificationService, 'notify');
    await service.checkEvents();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should process ConfirmationEmailEvent', async () => {
    const event = new ConfirmationEmailEvent({ code: '123456', email: 'example@example.com' });
    await eventService.create(event.getEventDTO());
    const spy = jest.spyOn(notificationService, 'notify');
    await service.checkEvents();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should process ReviewInvitationEmailEvent', async () => {
    const { community } = await createCommunity(module);
    const { deposit, author } = await createDeposit(module, {
      community,
      deposit: { status: DepositStatus.published },
    });

    const { invite } = await createInvite(module, { sender: author, community, deposit });

    const depositPopulated = await module.get(DepositService).findById(deposit._id);
    assertIsDefined(depositPopulated);
    const event = new ReviewInvitationEmailEvent({
      sender: author.toJSON(),
      deposit: depositPopulated.toJSON(),
      destinationEmail: 'example@example.com',
      invite: invite.toJSON(),
      community: community.toJSON(),
      destinationName: 'Example',
    });
    await eventService.create(event.getEventDTO());
    const spy = jest.spyOn(notificationService, 'notify');
    await service.checkEvents();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should process CommentCreatedEvent', async () => {
    const { community } = await createCommunity(module);
    const { deposit, author } = await createDeposit(module, {
      community,
      deposit: { status: DepositStatus.published },
    });

    const comment: Partial<Require_id<Commentary>> = {
      user_id: author._id,
      resource: deposit._id,
      resourceModel: 'Deposit',
      content: 'this is a comment',
      tags: [CommentTags.author],
    };
    const event = new CommentCreatedEvent({
      user: author.toJSON(),
      comment: comment as Require_id<Commentary>,
    });
    await eventService.create(event.getEventDTO());
    const spy = jest.spyOn(notificationService, 'notify');
    await service.checkEvents();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should process DepositSubmitted event', async () => {
    const { community } = await createCommunity(module);
    const { deposit, author } = await createDeposit(module, { community });

    const depositPopulated = await module.get(DepositService).findById(deposit._id);
    assertIsDefined(depositPopulated);

    const event = new DepositSubmittedEvent({
      deposit: depositPopulated.toJSON(),
      user: author.toJSON(),
      community: community.toJSON(),
    });
    await eventService.create(event.getEventDTO());
    const spy = jest.spyOn(notificationService, 'notify');
    await service.checkEvents();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should process DepositPublished event', async () => {
    const user = await createUser(module);
    const { community } = await createCommunity(module);
    const { deposit } = await createDeposit(module, { community });

    const depositPopulated = await module.get(DepositService).findById(deposit._id);
    assertIsDefined(depositPopulated, '');

    const event = new DepositPublishedEvent({
      deposit: depositPopulated.toJSON(),
      user: user.toJSON(),
      community: community.toJSON(),
    });

    await eventService.create(event.getEventDTO());
    const spy = jest.spyOn(notificationService, 'notify');
    await service.checkEvents();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should process DepositBackToPendingApproval event', async () => {
    const user = await createUser(module);
    const { community } = await createCommunity(module);
    const { deposit } = await createDeposit(module, { community });

    const depositPopulated = await module.get(DepositService).findById(deposit._id);
    assertIsDefined(depositPopulated, '');

    const event = new DepositBackToPendingApprovalEvent({
      deposit: depositPopulated.toJSON(),
      user: user.toJSON(),
      community: community.toJSON(),
      reason: 'test reason',
    });

    await eventService.create(event.getEventDTO());
    const spy = jest.spyOn(notificationService, 'notify');
    await service.checkEvents();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should process DepositChangedToPendingApprovalEvent event', async () => {
    const user = await createUser(module);
    const { community } = await createCommunity(module);
    const { deposit } = await createDeposit(module, {
      community,
      deposit: {
        status: DepositStatus.published,
        creator: user._id,
        community: community._id,
      },
    });
    const event = new DepositChangedToPendingApprovalEvent({
      deposit: deposit.toJSON(),
      community: community.toJSON(),
    });

    const spy = jest.spyOn(notificationService, 'notify');
    await eventService.create(event.getEventDTO());
    await service.checkEvents();
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('should process DepositChangedToPendingApprovalEvent event with notification options', async () => {
    const user1 = await createUser(module);
    const user2 = await createUser(module, {
      user: {
        email: 'different@example.com',
        nickname: 'different',
      },
    });
    const { community } = await createCommunity(module);

    const { deposit } = await createDeposit(module, {
      community,
      deposit: {
        status: DepositStatus.pendingApproval,
        creator: user1._id,
        newTrackTimestamp: 1675067548611,
        community: community._id,
      },
    });

    const moderator = await module
      .get(CommunitiesService)
      .addModerator(community, user1, ModeratorRole.moderator);
    moderator.notificationOptions = { tracks: [1675067548611] };
    await moderator.save();

    await module.get(CommunitiesService).addModerator(community, user2, ModeratorRole.moderator);

    const event = new DepositChangedToPendingApprovalEvent({
      deposit: deposit.toJSON(),
      community: community.toJSON(),
    });

    const spy = jest.spyOn(notificationService, 'notify');
    await eventService.create(event.getEventDTO());
    await service.checkEvents();
    expect(spy).toHaveBeenCalledTimes(4);
  });

  it('should process DepositChangedToPendingApprovalEvent and notify only moderators with track', async () => {
    const user = await createUser(module);
    const { community } = await createCommunity(module);
    const { deposit } = await createDeposit(module, {
      community,
      deposit: {
        status: DepositStatus.pendingApproval,
        creator: user._id,
        newTrackTimestamp: 15,
        community: community._id,
      },
    });

    const communityModerator = await module
      .get(CommunitiesService)
      .addModerator(community, user, ModeratorRole.moderator);
    communityModerator.notificationOptions = { tracks: [community.newTracks[0].timestamp] };
    await communityModerator.save();

    const event = new DepositChangedToPendingApprovalEvent({
      deposit: deposit.toJSON(),
      community: community.toJSON(),
    });

    const spy = jest.spyOn(notificationService, 'notify');
    await eventService.create(event.getEventDTO());
    await service.checkEvents();
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('should process DepositAccepted event', async () => {
    const { community } = await createCommunity(module);
    const { deposit, author } = await createDeposit(module, { community });
    const event = new DepositAcceptedEvent({
      deposit: deposit.toJSON(),
      community: community.toJSON(),
      user: author.toJSON(),
    });
    const spy = jest.spyOn(notificationService, 'notify');
    await eventService.create(event.getEventDTO());
    await service.checkEvents();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should process DepositRejected event', async () => {
    const { community } = await createCommunity(module);
    const { deposit, author } = await createDeposit(module, { community });
    const event = new DepositRejectedByModeratorEvent({
      community: community.toJSON(),
      user: author.toJSON(),
      deposit: deposit.toJSON(),
      reason: '',
    });
    const spy = jest.spyOn(notificationService, 'notify');
    await eventService.create(event.getEventDTO());
    await service.checkEvents();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should process DepositDrafted event', async () => {
    const { community } = await createCommunity(module);
    const { deposit, author } = await createDeposit(module, { community });
    const event = new DepositDraftedByModeratorEvent({
      community: community.toJSON(),
      user: author.toJSON(),
      deposit: deposit.toJSON(),
      reason: '',
    });
    const spy = jest.spyOn(notificationService, 'notify');
    await eventService.create(event.getEventDTO());
    await service.checkEvents();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should process ReviewCreatedEvent', async () => {
    const { community } = await createCommunity(module);
    const { deposit } = await createDeposit(module, { community });
    const { review } = await createReview(module, deposit);

    const depositPopulated = await module.get(DepositService).findById(deposit._id);
    assertIsDefined(depositPopulated);

    const reviewPopulated = await module.get(ReviewService).findById(review._id);
    assertIsDefined(reviewPopulated);

    const event = new ReviewPublishedConfirmationToAuthorEvent({
      review: reviewPopulated.toJSON(),
      deposit: depositPopulated.toJSON(),
      community: community.toJSON(),
    });

    const spy = jest.spyOn(notificationService, 'notify');
    await eventService.create(event.getEventDTO());
    await service.checkEvents();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should process UserCreatedEvent', async () => {
    const user = await createUser(module);
    const event = new UserCreatedEvent({
      user: user.toJSON(),
    });

    const spy = jest.spyOn(notificationService, 'notify');
    await eventService.create(event.getEventDTO());
    await service.checkEvents();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should process UserCreatedEvent 2', async () => {
    const user = await createUser(module);

    const event = new UserCreatedEvent({
      user: user.toJSON(),
    });

    const spy = jest.spyOn(notificationService, 'notify');
    await eventService.create(event.getEventDTO());
    await service.checkEvents();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should process ReplyCommentCreatedEvent', async () => {
    const user = await createUser(module);
    const { community } = await createCommunity(module);
    const { deposit } = await createDeposit(module, { community });

    const comment: Require_id<Commentary> = {
      _id: new Types.ObjectId(),
      user_id: factoryUser.build().userId,
      resource: deposit._id,
      resourceModel: 'Deposit',
      content: 'this is a comment',
      tags: [CommentTags.author],
      community: deposit.community._id,
    };

    const event = new ReplyCommentCreatedEvent({
      userId: user.userId,
      comment: comment,
    });

    const spy = jest.spyOn(notificationService, 'notify');
    await eventService.create(event.getEventDTO());
    await service.checkEvents();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should IThenticateReportReadyEvent', async () => {
    const { community } = await createCommunity(module);
    const { deposit, author } = await createDeposit(module, { community });
    const spy = jest.spyOn(notificationService, 'notify');

    const data2: IIThenticateReportReadyData = {
      deposit: deposit.toJSON(),
      submitter: author.toJSON(),
    };

    const event2 = new IThenticateReportReadyEvent(data2);
    await eventService.create(event2.getEventDTO());
    await service.checkEvents();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should process NewFileEvent with a docx', async () => {
    const { community } = await createCommunity(module);
    const { deposit } = await createDeposit(module, { community });
    const depositPopulated = await module.get(DepositService).findById(deposit._id);
    assertIsDefined(depositPopulated);

    const event = new FileUploadedEvent({
      depositOrReview: depositPopulated.toJSON(),
      filename: 'file.docx',
    });

    const spy = jest.spyOn(notificationService, 'notify');
    await eventService.create(event.getEventDTO());
    await service.checkEvents();
    expect(spy).toHaveBeenCalledTimes(0);
  });

  it('should process NewFileEvent with a odt', async () => {
    const { community } = await createCommunity(module);
    const { deposit } = await createDeposit(module, { community });

    const depositPopulated = await module.get(DepositService).findById(deposit._id);
    assertIsDefined(depositPopulated, '');

    const event = new FileUploadedEvent({
      depositOrReview: depositPopulated.toJSON(),
      filename: 'file.odt',
    });

    const spy = jest.spyOn(notificationService, 'notify');
    await eventService.create(event.getEventDTO());
    await service.checkEvents();
    expect(spy).toHaveBeenCalledTimes(0);
  });

  it('should process NewFileEvent with a epub', async () => {
    const { community } = await createCommunity(module);
    const { deposit } = await createDeposit(module, { community });

    const event = new FileUploadedEvent({
      depositOrReview: deposit.toJSON(),
      filename: 'file.epub',
    });

    const spy = jest.spyOn(notificationService, 'notify');
    await eventService.create(event.getEventDTO());
    await service.checkEvents();
    expect(spy).toHaveBeenCalledTimes(0);
  });

  it('should process NewFileEvent with a pdf', async () => {
    const { community } = await createCommunity(module);
    const { deposit } = await createDeposit(module, { community });

    const event = new FileUploadedEvent({
      depositOrReview: deposit.toJSON(),
      filename: 'file.pdf',
    });

    const spy = jest.spyOn(notificationService, 'notify');
    await eventService.create(event.getEventDTO());
    await service.checkEvents();
    expect(spy).toHaveBeenCalledTimes(0);
  });

  it('should process NewFileEvent with a zip extension', async () => {
    const { community } = await createCommunity(module);
    const { deposit } = await createDeposit(module, { community });

    const event = new FileUploadedEvent({
      depositOrReview: deposit.toJSON(),
      filename: 'file.zip',
    });

    await eventService.create(event.getEventDTO());
    await service.checkEvents();

    const pandocService = module.get(PandocService);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(pandocService.unzipFile).toHaveBeenCalledTimes(1);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(pandocService.exportToHTML).toHaveBeenCalledTimes(0);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(pandocService.exportToPDF).toHaveBeenCalledTimes(1);
  });

  it('should process NewFileEvent with a default file', async () => {
    const { community } = await createCommunity(module);
    const { deposit } = await createDeposit(module, { community });

    const event = new FileUploadedEvent({
      depositOrReview: deposit.toJSON(),
      filename: 'file',
    });

    const spy = jest.spyOn(notificationService, 'notify');
    await eventService.create(event.getEventDTO());
    await service.checkEvents();
    expect(spy).toHaveBeenCalledTimes(0);
  });

  it('should process NewFileEvent with a docx in review', async () => {
    const { community } = await createCommunity(module);
    const { deposit } = await createDeposit(module, { community });
    const { review } = await createReview(module, deposit);
    const reviewPopulated = await module.get(ReviewService).findById(review._id);
    assertIsDefined(reviewPopulated);
    const event = new FileUploadedEvent({
      depositOrReview: reviewPopulated.toJSON(),
      filename: 'file.docx',
    });

    const spy = jest.spyOn(notificationService, 'notify');
    await eventService.create(event.getEventDTO());
    await service.checkEvents();
    expect(spy).toHaveBeenCalledTimes(0);
  });

  it('should process NewFileEvent with a odt in review', async () => {
    const { community } = await createCommunity(module);
    const { deposit } = await createDeposit(module, { community });
    const { review } = await createReview(module, deposit);

    const event = new FileUploadedEvent({
      depositOrReview: review.toJSON(),
      filename: 'file.odt',
    });

    const spy = jest.spyOn(notificationService, 'notify');
    await eventService.create(event.getEventDTO());
    await service.checkEvents();
    expect(spy).toHaveBeenCalledTimes(0);
  });

  it('should process NewFileEvent with a epub in review', async () => {
    const { community } = await createCommunity(module);
    const { deposit } = await createDeposit(module, { community });
    const { review } = await createReview(module, deposit);

    const event = new FileUploadedEvent({
      depositOrReview: review.toJSON(),
      filename: 'file.epub',
    });

    const spy = jest.spyOn(notificationService, 'notify');
    await eventService.create(event.getEventDTO());
    await service.checkEvents();
    expect(spy).toHaveBeenCalledTimes(0);
  });

  it('should process NewFileEvent with a pdf in review', async () => {
    const { community } = await createCommunity(module);
    const { deposit } = await createDeposit(module, { community });
    const { review } = await createReview(module, deposit);

    const event = new FileUploadedEvent({
      depositOrReview: review.toJSON(),
      filename: 'file.pdf',
    });

    const spy = jest.spyOn(notificationService, 'notify');
    await eventService.create(event.getEventDTO());
    await service.checkEvents();
    expect(spy).toHaveBeenCalledTimes(0);
  });

  it('should process NewFileEvent with a default file in review', async () => {
    const { community } = await createCommunity(module);
    const { deposit } = await createDeposit(module, { community });
    const { review } = await createReview(module, deposit);

    const event = new FileUploadedEvent({
      depositOrReview: review.toJSON(),
      filename: 'file',
    });

    const spy = jest.spyOn(notificationService, 'notify');
    await eventService.create(event.getEventDTO());
    await service.checkEvents();
    expect(spy).toHaveBeenCalledTimes(0);
  });

  it('should process ReviewInvitationAcceptedEvent', async () => {
    const { community } = await createCommunity(module);
    const { deposit, author } = await createDeposit(module, { community });
    const invitation = await inviteService.create(factoryInvite.build());

    const event = new ReviewInvitationAcceptedEvent({
      sender: author.toJSON(),
      reviewer: author.toJSON(),
      deposit: deposit.toJSON(),
      community: community.toJSON(),
      invitation: invitation.toJSON(),
    });

    const spy = jest.spyOn(notificationService, 'notify');
    await eventService.create(event.getEventDTO());
    await service.checkEvents();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should process ReviewInvitationRejectedEvent', async () => {
    const { community } = await createCommunity(module);
    const { deposit, author } = await createDeposit(module, { community });

    const invitation = await inviteService.create(factoryInvite.build());

    const event = new ReviewInvitationRejectedEvent({
      sender: author.toJSON(),
      reviewer: author.toJSON(),
      deposit: deposit.toJSON(),
      community: community.toJSON(),
      invitation: invitation.toJSON(),
    });

    const spy = jest.spyOn(notificationService, 'notify');
    await eventService.create(event.getEventDTO());
    await service.checkEvents();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should process ReviewInvitationAcceptedConfirmationEvent', async () => {
    const { community } = await createCommunity(module);
    const { deposit, author } = await createDeposit(module, { community });
    const invitation = await inviteService.create(factoryInvite.build());

    const event = new ReviewInvitationAcceptedConfirmationEvent({
      sender: author.toJSON(),
      reviewer: author.toJSON(),
      deposit: deposit.toJSON(),
      community: community.toJSON(),
      invitation: invitation.toJSON(),
    });

    const spy = jest.spyOn(notificationService, 'notify');
    await eventService.create(event.getEventDTO());
    await service.checkEvents();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should process ReviewChangedToPendingApprovalEvent', async () => {
    const user = await createUser(module);
    const { community } = await createCommunity(module);
    const { deposit } = await createDeposit(module, {
      community,
      deposit: {
        status: DepositStatus.pendingApproval,
        creator: user._id,
        community: community._id,
      },
    });
    const { review } = await createReview(module, deposit, {
      review: {
        status: ReviewStatus.draft,
        creator: user._id,
      },
    });

    const event = new ReviewChangedToPendingApprovalEvent({
      deposit: deposit as unknown as DepositPopulatedDTO,
      review: review.toJSON(),
      community: community.toJSON(),
    });

    const spy = jest.spyOn(notificationService, 'notify');
    await eventService.create(event.getEventDTO());
    await service.checkEvents();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should process ReviewChangedToDraft', async () => {
    const { community } = await createCommunity(module);
    const { deposit, author } = await createDeposit(module, { community });
    const { review } = await createReview(module, deposit);

    const event = new ReviewChangedToDraftEvent({
      deposit: deposit.toJSON(),
      review: review.toJSON(),
      community: community.toJSON(),
      reason: 'Message from editor',
      user: author.toJSON(),
    });

    const spy = jest.spyOn(notificationService, 'notify');
    await eventService.create(event.getEventDTO());
    await service.checkEvents();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should process ReviewSubmitted event', async () => {
    const { community } = await createCommunity(module);
    const { deposit, author } = await createDeposit(module, { community });
    const { review } = await createReview(module, deposit);
    const event = new ReviewSubmittedConfirmationEvent({
      user: author.toJSON(),
      deposit: deposit.toJSON(),
      review: review.toJSON(),
      community: community.toJSON(),
    });
    const spy = jest.spyOn(notificationService, 'notify');
    await eventService.create(event.getEventDTO());
    await service.checkEvents();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should process ReviewAccepted event', async () => {
    const { community } = await createCommunity(module);
    const { deposit, author } = await createDeposit(module, { community });
    const { review } = await createReview(module, deposit);
    const event = new ReviewPublishedConfirmationToReviewerEvent({
      user: author.toJSON(),
      deposit: deposit.toJSON(),
      review: review.toJSON(),
      community: community.toJSON(),
    });

    const spy = jest.spyOn(notificationService, 'notify');
    await eventService.create(event.getEventDTO());
    await service.checkEvents();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should process ReminderDraftDeposit event', async () => {
    const date = new Date();
    const { community } = await createCommunity(module);
    const { deposit, author } = await createDeposit(module, { community });
    const event: EventDTO = {
      eventType: EventType.REMINDER_DRAFT_DEPOSIT,
      data: {
        user: author.toJSON(),
        deposit: deposit.toJSON(),
      },
      scheduledOn: date,
    };
    const spy = jest.spyOn(notificationService, 'notify');
    await eventService.create(event);
    await service.checkEvents();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should process reminders only once', async () => {
    const today = new Date();

    const { community } = await createCommunity(module);
    const { deposit } = await createDeposit(module, {
      community,
      deposit: {
        status: DepositStatus.draft,
      },
    });
    await deposit.updateOne({ updatedAt: today.getDate() - 15 }, { timestamps: false });

    const spy = jest.spyOn(eventService, 'create');
    await service.processCreateReminders();
    expect(spy).toHaveBeenCalledTimes(1);

    // Second time it should not create the event again
    await service.processCreateReminders();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should create reminders only when deposit in draft', async () => {
    const { community } = await createCommunity(module);
    const { deposit } = await createDeposit(module, { community });
    await deposit.updateOne({ updatedAt: new Date().getDate() - 10 }, { timestamps: false });

    const spy = jest.spyOn(eventService, 'create');
    await service.processCreateReminders();
    expect(spy).not.toHaveBeenCalled();
  });

  it('should create reminders only when user confirmed email', async () => {
    const { community } = await createCommunity(module);
    const { deposit } = await createDeposit(module, { community });
    await deposit.updateOne({ updatedAt: new Date().getDate() - 15 }, { timestamps: false });

    const spy = jest.spyOn(eventService, 'create');
    await service.processCreateReminders();
    expect(spy).not.toHaveBeenCalled();
  });

  it('should process OPENAIRE_HARVESTER event', async () => {
    const { community } = await createCommunity(module);
    const { deposit } = await createDeposit(module, { community });
    const axiosResponse: AxiosResponse = {
      data: generateOpenaireResponse(deposit._id.toHexString()),
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
      request: {
        res: {
          headers: {},
        },
      },
    } as AxiosResponse;

    const eventOpenAirePayload: EventDTO = {
      eventType: EventType.OPENAIRE_HARVESTER,
      data: {},
    };
    await eventService.create(eventOpenAirePayload);
    jest.spyOn(httpService, 'get').mockImplementation(() => of(axiosResponse));
    await service.checkEvents();
    const depositUpdated = await module.get(DepositService).findById(deposit._id);
    assertIsDefined(depositUpdated);
    expect(depositUpdated.openAireIdentifier).toBe(
      'dedup_wf_001::c93754394cd69bfb1653b85af3cb30fb'
    );
  });

  it('should create weekly events', async () => {
    await service.createWeeklyEvents();
    const event = await eventService.find({ eventType: EventType.OPENAIRE_HARVESTER });
    expect(event).toBeDefined();
  });

  it('should create daily events', async () => {
    const emailSpy = jest.spyOn(emailService, 'sendMail').mockImplementation();
    await service.createDailyEvents();
    const event1 = await eventService.find({ eventType: EventType.IMPORT_DEPOSIT_VIEWS });
    expect(event1).toBeDefined();

    const event2 = await eventService.find({ eventType: EventType.IMPORT_COMMUNITY_VIEWS });
    expect(event2).toBeDefined();

    const event3 = await eventService.find({ eventType: EventType.IMPORT_REVIEW_VIEWS });
    expect(event3).toBeDefined();

    expect(emailSpy).toHaveBeenCalledWith({
      subject: '[CHECK] Email service check',
      to: 'support@example.com',
    });
  });

  it('should update doi status', async () => {
    const doiService = module.get(DoiLogService);
    jest.spyOn(doiService, 'updateDOIstatus').mockImplementation();
    await service.updateCrossrefDOIstatus();
  });

  it('should process proccessHTMLFromDOCX', async () => {
    const { community } = await createCommunity(module);
    const { deposit } = await createDeposit(module, { community });

    const data: IExtractHTMLEventData = {
      depositOrReview: deposit.toJSON(),
      filename: 'filename.docx',
    };
    const event: EventDTO = {
      eventType: EventType.EXTRACT_HTML,
      data: data,
    };
    const spy = jest.spyOn(module.get(PandocService), 'exportToHTML');
    await eventService.create(event);
    await service.checkEvents();
    expect(spy).toHaveBeenCalled();
  });

  it('should change event status to failed when event is not found', async () => {
    const fakeEvent: EventDTO = {
      eventType: 'TEST_EVENT' as EventType,
      data: 'testEvent',
    };

    await eventService.create(fakeEvent);
    await service.checkEvents();
    const event = await eventService.findOne({ data: 'testEvent' });
    expect(event?.status).toBe(EventStatus.FAILED);
  });

  it('should process IMPORT_COMMUNITY_VIEWS event', async () => {
    const importCommunityViews: EventDTO = {
      data: {},
      eventType: EventType.IMPORT_COMMUNITY_VIEWS,
    };

    await eventService.create(importCommunityViews);

    await service.checkEvents();
  });

  it('should process IMPORT_DEPOSIT_VIEWS event', async () => {
    const importDepositViews: EventDTO = {
      eventType: EventType.IMPORT_DEPOSIT_VIEWS,
      data: {},
    };

    await eventService.create(importDepositViews);
    await service.checkEvents();
  });

  it('should process IMPORT_REVIEW_VIEWS event', async () => {
    const importReviewViews: EventDTO = {
      eventType: EventType.IMPORT_REVIEW_VIEWS,
      data: {},
    };

    await eventService.create(importReviewViews);
    await service.checkEvents();
  });

  it('should process CHAT_MESSAGE event', async () => {
    const user = await createUser(module);
    const { conversation } = await createConversation(module);
    const event = new ChatMessageReceivedEvent({
      user: user.toJSON(),
      recipientUser: user.toJSON(),
      conversation: conversation.toJSON(),
    });
    const spy = jest.spyOn(notificationService, 'notify');
    await eventService.create(event.getEventDTO());
    await service.checkEvents();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should process unread message event', async () => {
    const user = await createUser(module);
    const { conversation } = await createConversation(module);
    const event = new unreadMessagesReceiveEvent({
      user: user.toJSON(),
      recipientUser: user.toJSON(),
      conversation: conversation.toJSON(),
    });
    const spy = jest.spyOn(notificationService, 'notify');
    await eventService.create(event.getEventDTO());
    await service.checkEvents();
    expect(spy).toHaveBeenCalled();
  });

  it('should process general notification event', async () => {
    const { community } = await createCommunity(module);
    const user = await createUser(module);
    const event = new GeneralNotificationEvent({
      subject: 'TEST-SUBJECT',
      sender: user.toJSON(),
      community: community.toJSON(),
      message: 'test message',
      recipients: ['john@example.com', 'test@orvium.io'],
    });
    const spy = jest.spyOn(notificationService, 'notify');
    await eventService.create(event.getEventDTO());
    await service.checkEvents();
    expect(spy).toHaveBeenCalled();
  });

  it('should count members', async () => {
    const { community } = await createCommunity(module); // 1 moderator, 1 owner
    const { deposit } = await createDeposit(module, { community });
    deposit.authors.push(
      { credit: [], institutions: [], firstName: 'Sarai', lastName: 'Varona' },
      { credit: [], institutions: [], firstName: 'Sara', lastName: 'Monzón' },
      { credit: [], institutions: [], firstName: 'para', lastName: 'Varona' },
      { credit: [], institutions: [], firstName: 'cara', lastName: 'Monzón' }
    );
    await deposit.save(); // 1+4 authors
    const { deposit: deposit2 } = await createDeposit(module, { community });
    deposit2.authors.push({ credit: [], institutions: [], firstName: 'Sarai', lastName: 'Varona' });
    await deposit2.save(); // 1+1 authors
    await createDeposit(module, { community }); // 1 author
    await createDeposit(module, { community }); // 1 author
    await createReview(module, deposit); // 1 reviewer
    await createReview(module, deposit2); // 1 reviewer
    await service.communityMembers(true);
    const communityUpdated = await module
      .get(CommunitiesService)
      .findOneByFilter({ _id: community._id });
    assertIsDefined(communityUpdated);
    expect(communityUpdated.followersCount).toBe(13);
  });
});
