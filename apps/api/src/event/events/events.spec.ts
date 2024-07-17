import { CommentCreatedEvent } from './commentCreatedEvent';
import { ConfirmationEmailEvent } from './confirmationEmailEvent';
import { DepositChangedToPendingApprovalEvent } from './depositChangedToPendingApprovalEvent';
import { DepositRejectedByModeratorEvent } from './depositRejectedByModerator';
import { DepositSubmittedEvent } from './depositSubmittedEvent';
import { Feedback } from '../../feedback/feedback.schema';
import { FeedbackCreatedEvent } from './feedbackCreatedEvent';
import { FileUploadedEvent } from './fileUploadedEvent';
import { InvitationEvent } from './invitationCreatedEvent';
import { ModeratorAddedToCommunityEvent } from './moderatorAddedToCommunityEvent';
import { ReviewPublishedConfirmationToAuthorEvent } from './reviewPublishedConfirmationToAuthorEvent';
import { ReviewInvitationAcceptedEvent } from './reviewInvitationAcceptedEvent';
import { Invite, InviteDocument, InviteStatus, InviteType } from '../../invite/invite.schema';
import { ReviewInvitationEmailEvent } from './reviewInvitationEmailEvent';
import { UserCreatedEvent } from './userCreatedEvent';
import { DepositAcceptedEvent, IDepositAcceptedData } from './depositAcceptedEvent';
import { ReviewSubmittedConfirmationEvent } from './reviewSubmittedConfirmationEvent';
import { ReviewPublishedConfirmationToReviewerEvent } from './reviewPublishedConfirmationToReviewerEvent';
import { ReplyCommentCreatedEvent } from './replyCommentCreatedEvent';
import { ReviewChangedToDraftEvent } from './reviewChangedToDraftEvent';
import { CommunityChangedToPendingApprovalEvent } from './communityChangedToPendingApprovalEvent';
import { ReviewChangedToPendingApprovalEvent } from './reviewChangedToPendingApprovalEvent';
import { EditorAssignedEvent } from './editorAssignedEvent';
import { DepositDraftedByModeratorEvent } from './depositDraftedByModerator';
import { ExtractHTMLEvent } from './extractHTMLEvent';
import {
  createCommunity,
  createConversation,
  createDeposit,
  createReview,
  createUser,
  factoryInvite,
} from '../../utils/test-data';
import { IThenticateReportReadyEvent } from './iThenticateReportReady';
import { ReviewService } from '../../review/review.service';
import { assertIsDefined } from '../../utils/utils';
import { Test, TestingModule } from '@nestjs/testing';
import { DepositService } from '../../deposit/deposit.service';
import { cleanCollections, MongooseTestingModule } from '../../utils/mongoose-testing.module';
import { CommunitySubmittedEvent } from './communitySubmittedEvent';
import { CommunityAcceptedEvent } from './communtyAcceptedEvent';
import { InviteService } from '../../invite/invite.service';
import { ReminderDraftDepositEvent } from './reminderDraftDeposit';
import { ChatMessageReceivedEvent } from './chatMessageRecievedEvent';
import { ReviewInvitationRejectedEvent } from './reviewInvitationRejectedEvent';
import { ReviewInvitationAcceptedConfirmationEvent } from './reviewInvitationAcceptedConfirmationEvent';
import { unreadMessagesReceiveEvent } from './unreadMessagesReceivedEvent';
import { TestEvent } from './testEvent';
import { DepositPublishedEvent, IDepositPublishedData } from './depositPublishedEvent';
import {
  DepositBackToPendingApprovalData,
  DepositBackToPendingApprovalEvent,
} from './depositBackToPendingApprovalEvent';
import { Require_id, Types } from 'mongoose';
import { GeneralNotificationEvent } from './GeneralNotificationEvent';

describe('Events', () => {
  let module: TestingModule;

  const feedback: Feedback = {
    created: new Date(),
    email: 'email@email.com',
    description: 'Feedback description',
  };

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [MongooseTestingModule.forRoot('Events')],
      providers: [],
    }).compile();
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    await cleanCollections(module);
  });

  it('should create CommentCreatedEvent', async () => {
    const { community } = await createCommunity(module);
    const { deposit, author } = await createDeposit(module, { community });
    const event = new CommentCreatedEvent({
      user: author.toJSON(),
      comment: {
        _id: new Types.ObjectId(),
        resource: deposit._id,
        tags: [],
        content: 'Comment content',
        parent: deposit._id,
        resourceModel: 'Deposit',
        user_id: author._id,
        hasReplies: false,
        community: deposit.community._id,
      },
    });
    expect(event.getEventDTO()).toMatchObject({ data: { user: author.toJSON() } });
    expect(event.getEmailTemplate()).toBeUndefined();
    expect(event.getAppNotificationTemplate('myUserId')).toMatchObject({
      userId: 'myUserId',
      title: 'New comment received',
    });
    expect(event.getPushNotificationTemplate()).toMatchObject({
      notification: {
        body: 'Somebody has commented one of your publications',
      },
    });
    expect(event.getHistoryTemplate()).toBeUndefined();
  });

  it('should create ReplyCommentCreatedEvent', async () => {
    const { community } = await createCommunity(module);
    const { deposit, author } = await createDeposit(module, { community });
    const event = new ReplyCommentCreatedEvent({
      userId: 'myUserId',
      comment: {
        _id: new Types.ObjectId(),
        resource: deposit._id,
        tags: [],
        content: 'Comment content',
        parent: deposit._id,
        resourceModel: 'Deposit',
        user_id: author._id,
        hasReplies: false,
        community: deposit.community._id,
      },
    });
    expect(event.getEventDTO()).toMatchObject({ data: { userId: 'myUserId' } });
    expect(event.getEmailTemplate()).toBeUndefined();
    expect(event.getAppNotificationTemplate('myUserId')).toMatchObject({
      userId: 'myUserId',
      title: 'Somebody has replied to you',
    });
    expect(event.getPushNotificationTemplate()).toMatchObject({
      notification: {
        body: 'Somebody has replied to your comment!',
      },
    });
    expect(event.getHistoryTemplate()).toBeUndefined();
  });

  it('should create ChatCreatedCreatedEvent', async () => {
    const user1 = await createUser(module);
    const user2 = await createUser(module);
    const { conversation } = await createConversation(module);
    const event = new ChatMessageReceivedEvent({
      user: user1.toJSON(),
      recipientUser: user2.toJSON(),
      conversation: conversation.toJSON(),
    });
    expect(event.getEventDTO()).toMatchObject({ data: { user: user1.toJSON() } });
    expect(event.getAppNotificationTemplate(user1.userId)).toMatchObject({
      body: 'Somebody has started a chat with you',
      icon: 'chat',
      isRead: false,
      title: 'New chat started',
      userId: user1.userId,
    });
    expect(event.getPushNotificationTemplate()).toMatchObject({
      notification: {
        actions: [],
        body: 'Somebody has send you a message',
        data: { primaryKey: 1 },
        icon: 'icon-96x96.png',
        title: 'Orvium chat message notification',
        vibrate: [100, 50, 100],
      },
    });
    expect(event.getHistoryTemplate()).toBeUndefined();
    expect(event.getEmailTemplate('{{USER_FULLNAME}}')).toMatchObject({
      subject: 'You have a new chat available on orvium',
      html: expect.stringContaining('John Doe'),
    });
  });

  it('should create testEvent', async () => {
    const user = await createUser(module);

    const event = new TestEvent({
      user: user.toJSON(),
    });

    expect(event.getAppNotificationTemplate()).toBe(undefined);
    expect(event.getEmailTemplate()).toBe(undefined);
    expect(event.getHistoryTemplate()).toBe(undefined);
    expect(event.getAppNotificationTemplate()).toBe(undefined);
    expect(event.getPushNotificationTemplate()).toMatchObject({
      notification: {
        title: 'Test Notification',
        body: 'This is how notifications will look like',
        icon: 'icon-96x96.png',
        vibrate: [100, 50, 100],
        data: {
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
    });
  });

  it('should create unread message', async () => {
    const user1 = await createUser(module);
    const user2 = await createUser(module);
    const { conversation } = await createConversation(module);
    const event = new unreadMessagesReceiveEvent({
      user: user1.toJSON(),
      recipientUser: user2.toJSON(),
      conversation: conversation.toJSON(),
    });
    expect(event.getEventDTO()).toMatchObject({ data: { user: user1.toJSON() } });
    expect(event.getAppNotificationTemplate(user1.userId)).toMatchObject({
      title: 'Unread messages',
      body: 'Somebody has sent a message and you have not read it',
      icon: 'chat',
      isRead: false,
      userId: user1.userId,
    });
    expect(event.getHistoryTemplate()).toBeUndefined();

    expect(
      event.getEmailTemplate(`
        <p>{{USER_FULLNAME}}</p>
        `)
    ).toMatchObject({
      subject: 'You have a new message available in orvium',
      html: expect.stringContaining('John Doe'),
    });

    expect(event.getPushNotificationTemplate()).toMatchObject({
      notification: {
        actions: [],
        body: 'You have unread messages',
        data: { primaryKey: 1 },
        icon: 'icon-96x96.png',
        title: 'Orvium chat message notification',
        vibrate: [100, 50, 100],
      },
    });
  });

  it('should create ConfirmationEmailEvent', () => {
    const event = new ConfirmationEmailEvent({
      code: '123456',
      email: 'myemail@example.com',
    });
    expect(event.getEventDTO()).toMatchObject({ data: { email: 'myemail@example.com' } });
    expect(event.getAppNotificationTemplate()).toBeUndefined();
    expect(event.getPushNotificationTemplate()).toBeUndefined();
    expect(event.getHistoryTemplate()).toBeUndefined();
  });

  it('should create ReviewChangedToDraftEvent', async () => {
    const { community } = await createCommunity(module);
    const { deposit } = await createDeposit(module, { community });
    const { review, reviewer } = await createReview(module, deposit);
    const reviewService = module.get(ReviewService);
    const reviewPopulated = await reviewService.findById(review._id);
    assertIsDefined(reviewPopulated);
    const event = new ReviewChangedToDraftEvent({
      review: reviewPopulated.toJSON(),
      deposit: deposit.toJSON(),
      community: community.toJSON(),
      reason: 'Message from editor',
      user: reviewer.toJSON(),
    });
    expect(event.getEventDTO()).toMatchObject({
      data: { deposit: deposit.toJSON(), community: community.toJSON() },
    });
    expect(event.getEmailTemplate('{{PUBLICATION_TITLE}}')).toMatchObject({
      subject: 'Your review needs changes',
      html: expect.stringContaining(deposit.title),
    });
    expect(event.getAppNotificationTemplate('myUserId')).toMatchObject({
      userId: 'myUserId',
      body: 'Your review is not ready to be published and available to everyone just yet. We need you to make some changes first on it.',
    });
    expect(event.getPushNotificationTemplate()).toMatchObject({
      notification: {
        body: 'Your review needs changes',
      },
    });
    expect(event.getHistoryTemplate()).toMatchObject({
      username: `${reviewer.firstName} ${reviewer.lastName}`,
      description: `Review rejected and moved to Draft in ${community.name}. Reason: Message from editor`,
    });
  });

  it('should create DepositChangedToPendingApprovalEvent', async () => {
    const { community } = await createCommunity(module);
    const { deposit } = await createDeposit(module, { community });
    const event = new DepositChangedToPendingApprovalEvent({
      deposit: deposit.toJSON(),
      community: community.toJSON(),
    });
    expect(event.getEventDTO()).toMatchObject({ data: { deposit: deposit.toJSON() } });
    expect(
      event.getEmailTemplate(`
        <p>{{PUBLICATION_TITLE}}</p>
        <p>{{ PUBLICATION_ABSTRACT }}</p>
        <p>{{ publication.keywords }}</p>
        <p>{{PUBLICATION_LINK}}</p>
        <p>{{ orviumLink }}</p>`)
    ).toMatchObject({
      subject: 'New publication just received',
      html: expect.stringContaining(deposit.title),
    });
    expect(event.getAppNotificationTemplate()).toBeUndefined();
    expect(event.getPushNotificationTemplate()).toBeUndefined();
    expect(event.getHistoryTemplate()).toBeUndefined();
  });

  it('should create CommunityChangedToPendingApprovalEvent', async () => {
    const { community, communityOwner } = await createCommunity(module);
    const event = new CommunityChangedToPendingApprovalEvent({
      user: communityOwner.toJSON(),
      community: community.toJSON(),
    });
    expect(event.getEventDTO()).toMatchObject({
      data: {
        user: communityOwner.toJSON(),
        community: community.toJSON(),
      },
    });
    expect(
      event.getEmailTemplate(`
        <p>A new community is pending approval!</p>`)
    ).toMatchObject({
      subject: 'New communities are pending approval',
      html: expect.stringContaining('A new community is pending approval!'),
    });
    expect(event.getAppNotificationTemplate()).toBeUndefined();
    expect(event.getPushNotificationTemplate()).toBeUndefined();
    expect(event.getHistoryTemplate()).toBeUndefined();
  });

  it('should create ReviewChangedToPendingApprovalEvent', async () => {
    const { community } = await createCommunity(module);
    const { deposit } = await createDeposit(module, { community });
    const { review } = await createReview(module, deposit);
    const reviewService = module.get(ReviewService);
    const reviewPopulated = await reviewService.findById(review._id);
    assertIsDefined(reviewPopulated);
    const event = new ReviewChangedToPendingApprovalEvent({
      deposit: deposit.toJSON(),
      review: reviewPopulated.toJSON(),
      community: community.toJSON(),
    });
    expect(event.getEventDTO()).toMatchObject({
      data: {
        deposit: deposit.toJSON(),
        review: reviewPopulated.toJSON(),
      },
    });
    expect(
      event.getEmailTemplate(`
        <p>Review needs changes</p>`)
    ).toMatchObject({
      subject: 'New reviews are pending approval',
      html: expect.stringContaining('Review needs changes'),
    });
    expect(event.getAppNotificationTemplate()).toBeUndefined();
    expect(event.getPushNotificationTemplate()).toBeUndefined();
    expect(event.getHistoryTemplate()).toBeUndefined();
  });

  it('should create DepositRejectedByModeratorEvent', async () => {
    const { community } = await createCommunity(module);
    const { deposit, author } = await createDeposit(module, { community });
    const event = new DepositRejectedByModeratorEvent({
      deposit: deposit.toJSON(),
      community: community.toJSON(),
      reason: 'Message from editor',
      user: author.toJSON(),
    });
    expect(event.getEventDTO()).toMatchObject({
      data: { deposit: deposit.toJSON(), community: community.toJSON() },
    });
    expect(event.getEmailTemplate('{{PUBLICATION_TITLE}}')).toMatchObject({
      subject: 'Your publication has been rejected',
      html: expect.stringContaining(deposit.title),
    });
    expect(event.getAppNotificationTemplate('myUserId')).toMatchObject({
      userId: 'myUserId',
      title: 'Your publication has been rejected',
    });
    expect(event.getPushNotificationTemplate()).toMatchObject({
      notification: {
        body: 'Your publication has been rejected',
      },
    });
    expect(event.getHistoryTemplate()).toMatchObject({
      username: `${author.firstName} ${author.lastName}`,
      description: `Publication rejected in ${community.name}. Reason: Message from editor`,
    });
  });

  it('should create DepositDraftedByModeratorEvent', async () => {
    const { community } = await createCommunity(module);
    const { deposit, author } = await createDeposit(module, { community });
    const event = new DepositDraftedByModeratorEvent({
      deposit: deposit.toJSON(),
      community: community.toJSON(),
      reason: 'Message from editor',
      user: author.toJSON(),
    });
    expect(event.getEventDTO()).toMatchObject({
      data: { deposit: deposit.toJSON(), community: community.toJSON() },
    });
    expect(event.getEmailTemplate('{{PUBLICATION_TITLE}}')).toMatchObject({
      subject: 'Your publication needs some changes',
      html: expect.stringContaining(deposit.title),
    });
    expect(event.getAppNotificationTemplate('myUserId')).toMatchObject({
      userId: 'myUserId',
      title: 'Your publication needs some changes',
    });
    expect(event.getPushNotificationTemplate()).toMatchObject({
      notification: {
        body: 'Your publication needs some changes',
      },
    });
    expect(event.getHistoryTemplate()).toMatchObject({
      username: `${author.firstName} ${author.lastName}`,
      description: `Publication moved to Draft in ${community.name}. Reason: Message from editor`,
    });
  });

  it('should create DepositSubmittedEvent', async () => {
    const { community } = await createCommunity(module);
    const { deposit, author } = await createDeposit(module, { community });
    const event = new DepositSubmittedEvent({
      deposit: deposit.toJSON(),
      user: author.toJSON(),
      community: community.toJSON(),
    });
    expect(event.getEventDTO()).toMatchObject({ data: { deposit: deposit.toJSON() } });
    expect(event.getEmailTemplate('{{PUBLICATION_TITLE}}')).toMatchObject({
      subject: 'Your publication has been submitted to Orvium',
      html: expect.stringContaining(deposit.title),
    });
    expect(event.getAppNotificationTemplate()).toBeUndefined();
    expect(event.getPushNotificationTemplate()).toBeUndefined();
    expect(event.getHistoryTemplate()).toMatchObject({
      username: `${author.firstName} ${author.lastName}`,
      description: 'Publication submitted',
    });
  });

  it('should create FeedbackCreatedEvent', () => {
    const event = new FeedbackCreatedEvent({
      feedback: feedback,
    });
    expect(event.getEventDTO()).toMatchObject({ data: { feedback: feedback } });
    expect(event.getEmailTemplate('{{ email }}')).toMatchObject({
      subject: 'New feedback received',
      html: expect.stringContaining('email@email.com'),
    });
    expect(event.getAppNotificationTemplate()).toBeUndefined();
    expect(event.getPushNotificationTemplate()).toBeUndefined();
    expect(event.getHistoryTemplate()).toBeUndefined();
  });

  it('should create FileUploadedEvent', async () => {
    const { community } = await createCommunity(module);
    const { deposit } = await createDeposit(module, { community });
    const event = new FileUploadedEvent({
      depositOrReview: deposit.toJSON(),
      filename: 'test.pdf',
    });
    expect(event.getEventDTO()).toMatchObject({
      data: { depositOrReview: deposit.toJSON(), filename: 'test.pdf' },
    });
    expect(event.getEmailTemplate()).toBeUndefined();
    expect(event.getAppNotificationTemplate()).toBeUndefined();
    expect(event.getPushNotificationTemplate()).toBeUndefined();
    expect(event.getHistoryTemplate()).toBeUndefined();
  });

  it('should create ExtractHTMLEvent', async () => {
    const { community } = await createCommunity(module);
    const { deposit } = await createDeposit(module, { community });
    const event = new ExtractHTMLEvent({
      depositOrReview: deposit.toJSON(),
      filename: 'test.pdf',
    });
    expect(event.getEventDTO()).toMatchObject({
      data: { depositOrReview: deposit.toJSON(), filename: 'test.pdf' },
    });
    expect(event.getEmailTemplate()).toBeUndefined();
    expect(event.getAppNotificationTemplate()).toBeUndefined();
    expect(event.getPushNotificationTemplate()).toBeUndefined();
    expect(event.getHistoryTemplate()).toBeUndefined();
  });

  it('should create InvitationEvent', async () => {
    const user = await createUser(module);
    const event = new InvitationEvent({
      emails: ['email@email.com'],
      sender: user.toJSON(),
    });
    expect(event.getEventDTO()).toMatchObject({
      data: { emails: ['email@email.com'], sender: user.toJSON() },
    });
    expect(event.getEmailTemplate('{{ inviteLink }}')).toMatchObject({
      subject: `${user.firstName} ${user.lastName} has invited you to join Orvium`,
      html: expect.stringContaining('profile/invite?inviteToken'),
    });
    expect(event.getAppNotificationTemplate()).toBeUndefined();
    expect(event.getPushNotificationTemplate()).toBeUndefined();
    expect(event.getHistoryTemplate()).toBeUndefined();
  });

  it('should create ModeratorAssignedEvent', async () => {
    const { community, moderator } = await createCommunity(module);

    const event = new ModeratorAddedToCommunityEvent({
      user: moderator.toJSON(),
      community: community.toJSON(),
    });
    expect(event.getEventDTO()).toMatchObject({
      data: { user: moderator.toJSON(), community: community.toJSON() },
    });
    expect(event.getEmailTemplate('{{ COMMUNITY_MODERATE_LINK }}')).toMatchObject({
      subject: 'You have been upgraded to moderator',
      html: expect.stringContaining(community._id.toHexString()),
    });
    expect(event.getAppNotificationTemplate(moderator.userId)).toMatchObject({
      userId: moderator.userId,
      title: 'You are now a moderator',
      body: `You are now a moderator of ${community.name} community. Go to the community page and click on the button "Moderate" to
        access to the moderator panel.`,
      icon: 'assignment_ind',
      isRead: false,
      action: `communities/${community._id.toHexString()}/moderate`,
    });
    expect(event.getPushNotificationTemplate()).toBeUndefined();
    expect(event.getHistoryTemplate()).toBeUndefined();
  });

  it('should create EditorAssignedEvent', async () => {
    const { community } = await createCommunity(module);
    const { deposit, author } = await createDeposit(module, { community });
    const event = new EditorAssignedEvent({
      user: author.toJSON(),
      deposit: deposit.toJSON(),
      community: community.toJSON(),
    });
    expect(event.getEventDTO()).toMatchObject({
      data: { user: author.toJSON(), deposit: deposit.toJSON() },
    });
    expect(event.getEmailTemplate('{{PUBLICATION_TITLE}}')).toMatchObject({
      subject: 'Publication assigned to you',
      html: expect.stringContaining(deposit.title),
    });
    expect(event.getAppNotificationTemplate(author.userId)).toMatchObject({
      userId: author.userId,
      title: 'Publication assigned to you!',
      body: 'A publication has just been assigned to you, please take a look.',
      icon: 'assignment_ind',
      isRead: false,
      action: `deposits/${deposit._id.toHexString()}/view`,
    });
    expect(event.getPushNotificationTemplate()).toBeUndefined();
    expect(event.getHistoryTemplate()).toBeUndefined();
  });

  it('should create ReviewCreatedEvent', async () => {
    const { community } = await createCommunity(module);
    const { deposit, author } = await createDeposit(module, { community });
    const { review } = await createReview(module, deposit);
    const reviewService = module.get(ReviewService);
    const reviewPopulated = await reviewService.findById(review._id);
    assertIsDefined(reviewPopulated);
    const event = new ReviewPublishedConfirmationToAuthorEvent({
      deposit: deposit.toJSON(),
      review: reviewPopulated.toJSON(),
      community: community.toJSON(),
    });
    expect(event.getEventDTO()).toMatchObject({
      data: { deposit: deposit.toJSON() },
    });
    expect(event.getAppNotificationTemplate(author.userId)).toMatchObject({
      userId: author.userId,
      title: 'New review created',
      body: `A review has been created for your publication ${deposit.title}`,
      icon: 'search',
      isRead: false,
      action: `/deposits/${deposit._id.toHexString()}/view`,
    });

    expect(event.getEmailTemplate('{{REVIEW_DECISION}}')).toMatchObject({
      subject: 'Your publication has received a new review',
      html: expect.stringContaining('accepted'),
    });

    expect(event.getPushNotificationTemplate()).toMatchObject({
      notification: {
        body: 'Somebody is reviewing your publication',
      },
    });
    expect(event.getHistoryTemplate()).toBeUndefined();
  });

  it('should create ReviewInvitationAcceptedEvent', async () => {
    const { community } = await createCommunity(module);
    const { deposit, author } = await createDeposit(module, { community });
    const { reviewer } = await createReview(module, deposit);
    const inviteService = module.get(InviteService);
    const invitation = await inviteService.create(factoryInvite.build());
    const event = new ReviewInvitationAcceptedEvent({
      deposit: deposit.toJSON(),
      sender: author.toJSON(),
      reviewer: reviewer.toJSON(),
      community: community.toJSON(),
      invitation: invitation.toJSON(),
    });
    expect(event.getEventDTO()).toMatchObject({
      data: {
        deposit: deposit.toJSON(),
        sender: author.toJSON(),
        reviewer: reviewer.toJSON(),
      },
    });
    assertIsDefined(author._id);
    expect(event.getEmailTemplate(author._id.toHexString())).toBeDefined();
    expect(event.getAppNotificationTemplate(author.userId)).toMatchObject({
      userId: author.userId,
      title: 'Your invitation has been accepted',
      body: `Congratulations, user with email example@example.com has accepted an invitation to review the ${deposit.title} publication!`,
      icon: 'rate_review',
      isRead: false,
      action: `/deposits/${deposit._id.toHexString()}/view`,
    });
    expect(event.getPushNotificationTemplate()).toMatchObject({
      notification: {
        body: 'You review invitation has been accepted',
      },
    });
    expect(event.getHistoryTemplate()).toMatchObject({
      username: `${author.firstName} ${author.lastName}`,
      description: 'Invitation to review has been accepted',
    });
  });

  it('should create ReviewInvitationRejectedEvent', async () => {
    const { community } = await createCommunity(module);
    const { deposit, author } = await createDeposit(module, { community });
    const inviteService = module.get(InviteService);
    const invitation = await inviteService.create(factoryInvite.build());
    const event = new ReviewInvitationRejectedEvent({
      deposit: deposit.toJSON(),
      sender: author.toJSON(),
      reviewer: null,
      community: community.toJSON(),
      invitation: invitation.toJSON(),
    });
    expect(event.getEventDTO()).toMatchObject({
      data: {
        deposit: deposit.toJSON(),
        sender: author.toJSON(),
        reviewer: null,
      },
    });
    assertIsDefined(author._id);
    expect(event.getEmailTemplate(author._id.toHexString())).toBeDefined();
    expect(event.getAppNotificationTemplate(author.userId)).toMatchObject({
      userId: author.userId,
      title: 'Your invitation has been rejected',
      body: `User with email example@orvium.io has rejected an invitation to review the ${deposit.title} publication!`,
      icon: 'rate_review',
      isRead: false,
      action: `/deposits/${deposit._id.toHexString()}/view`,
    });
    expect(event.getPushNotificationTemplate()).toMatchObject({
      notification: {
        body: 'You review invitation has been rejected',
      },
    });
    expect(event.getHistoryTemplate()).toMatchObject({
      username: 'example@orvium.io',
      description: 'Invitation to review has been rejected',
    });
  });

  it('should create ReviewInvitationAcceptedEvent with no reviewer', async () => {
    const { community } = await createCommunity(module);
    const { deposit, author } = await createDeposit(module, { community });
    const inviteService = module.get(InviteService);
    const invitation = await inviteService.create(factoryInvite.build());
    const event = new ReviewInvitationAcceptedEvent({
      deposit: deposit.toJSON(),
      sender: author.toJSON(),
      reviewer: null,
      community: community.toJSON(),
      invitation: invitation.toJSON(),
    });
    expect(event.getEventDTO()).toMatchObject({
      data: {
        deposit: deposit.toJSON(),
        sender: author.toJSON(),
        reviewer: null,
      },
    });
    assertIsDefined(author._id);
    expect(event.getEmailTemplate(author._id.toHexString())).toBeDefined();
    expect(event.getAppNotificationTemplate(author.userId)).toMatchObject({
      userId: author.userId,
      title: 'Your invitation has been accepted',
      body: `Congratulations, user with email example@orvium.io has accepted an invitation to review the ${deposit.title} publication!`,
      icon: 'rate_review',
      isRead: false,
      action: `/deposits/${deposit._id.toHexString()}/view`,
    });
    expect(event.getPushNotificationTemplate()).toMatchObject({
      notification: {
        body: 'You review invitation has been accepted',
      },
    });
    expect(event.getHistoryTemplate()).toMatchObject({
      username: 'example@orvium.io',
      description: 'Invitation to review has been accepted',
    });
  });

  it('should create ReviewInvitationAcceptedConfirmationEvent', async () => {
    const { community } = await createCommunity(module);
    const { deposit, author } = await createDeposit(module, { community });
    const inviteService = module.get(InviteService);
    const invitation = await inviteService.create(factoryInvite.build());
    const event = new ReviewInvitationAcceptedConfirmationEvent({
      deposit: deposit.toJSON(),
      sender: author.toJSON(),
      reviewer: null,
      community: community.toJSON(),
      invitation: invitation.toJSON(),
    });
    expect(event.getEventDTO()).toMatchObject({
      data: {
        deposit: deposit.toJSON(),
        sender: author.toJSON(),
        reviewer: null,
      },
    });
    assertIsDefined(author._id);
    expect(event.getEmailTemplate(author._id.toHexString())).toBeDefined();
    expect(event.getAppNotificationTemplate(author.userId)).toMatchObject({
      userId: author.userId,
      title: 'You have accepted the review invitation',
      body: `Congratulations, user with email example@orvium.io has accepted an invitation to review the ${deposit.title} publication!`,
      icon: 'rate_review',
      isRead: false,
      action: `/deposits/${deposit._id.toHexString()}/view`,
    });
    expect(event.getPushNotificationTemplate()).toMatchObject({
      notification: {
        body: 'You have accepted the review invitation',
      },
    });
    expect(event.getHistoryTemplate()).toMatchObject({
      username: 'example@orvium.io',
      description: 'You have accepted the review invitation',
    });
  });

  it('should create ReviewInvitationEmailEvent', async () => {
    const { community } = await createCommunity(module);
    const { deposit, author } = await createDeposit(module, { community });
    const invite: Require_id<Invite> = {
      community: community._id,
      _id: new Types.ObjectId(),
      createdOn: new Date(),
      inviteType: InviteType.review,
      status: InviteStatus.pending,
      sender: author._id,
      addressee: 'email',
      data: {
        depositId: deposit._id,
        depositTitle: 'example',
      },
    };

    const event = new ReviewInvitationEmailEvent({
      sender: author.toJSON(),
      deposit: deposit.toJSON(),
      destinationEmail: 'email@orvium.io',
      invite: invite,
      community: community.toJSON(),
      destinationName: 'example',
    });
    expect(event.getEventDTO()).toMatchObject({
      data: {
        sender: author.toJSON(),
        deposit: deposit.toJSON(),
        destinationEmail: 'email@orvium.io',
        invite: invite as InviteDocument,
      },
    });
    expect(event.getEmailTemplate('{{ acceptLink }}')).toMatchObject({
      subject: 'New review invitation received',
    });
    expect(event.getAppNotificationTemplate(author.userId)).toMatchObject({
      userId: author.userId,
      title: 'New review invite received',
      body: `Create a review for ${deposit.title} publication now!`,
      icon: 'rate_review',
      isRead: false,
      action: `/deposits/${deposit._id.toHexString()}/view`,
    });
    expect(event.getPushNotificationTemplate()).toMatchObject({
      notification: {
        body: 'You have been invited to review a publication',
      },
    });
    assertIsDefined(invite.inviteType, 'invitation invite type is not defined');
    assertIsDefined(invite.addressee, 'addressee invite type is not defined');

    expect(event.getHistoryTemplate()).toMatchObject({
      username: `${author.firstName} ${author.lastName}`,
      description: `Invitation to ${invite.inviteType} sent to ${invite.addressee}`,
    });
  });

  it('should create UserCreatedEvent', async () => {
    const user = await createUser(module);
    const event = new UserCreatedEvent({
      user: user.toJSON(),
    });
    expect(event.getEventDTO()).toMatchObject({ data: { user: user.toJSON() } });
    expect(event.getEmailTemplate()).toBeUndefined();
    expect(event.getAppNotificationTemplate(user.userId)).toMatchObject({
      userId: user.userId,
      title: 'Complete your profile',
      body: 'Your profile is not complete, click here to fix it!',
      icon: 'person',
      isRead: false,
      action: 'profile',
    });
    expect(event.getPushNotificationTemplate()).toBeUndefined();
    expect(event.getHistoryTemplate()).toBeUndefined();
  });

  it('should create DepositAcceptedEvent', async () => {
    const { community } = await createCommunity(module);
    const { deposit, author } = await createDeposit(module, { community });

    const data: IDepositAcceptedData = {
      deposit: deposit.toJSON(),
      community: community.toJSON(),
      user: author.toJSON(),
      reason: 'Nice job!',
    };
    const event = new DepositAcceptedEvent(data);
    expect(event.getEventDTO()).toMatchObject({ data: { deposit: deposit.toJSON() } });
    expect(event.getEmailTemplate('{{PUBLICATION_TITLE}}')).toMatchObject({
      subject: 'Your publication is now available in Orvium',
      html: expect.stringContaining(deposit.title),
    });
    expect(event.getAppNotificationTemplate(author.userId)).toMatchObject({
      userId: author.userId,
      title: 'Your publication has been accepted',
      body: ` Your publication is now available in Orvium. Click to access to ${deposit.title}.`,
      icon: 'check_circle',
      isRead: false,
      action: `/deposits/${deposit._id.toHexString()}/view`,
    });
    expect(event.getPushNotificationTemplate()).toBeUndefined();
    expect(event.getHistoryTemplate()).toMatchObject({
      username: `${author.firstName} ${author.lastName}`,
      description: `Publication accepted in ${community.name}. Feedback: ${data.reason ?? ''}`,
    });
  });

  it('should create DepositPublishedEvent', async () => {
    const { community } = await createCommunity(module);
    const { deposit, author } = await createDeposit(module, { community });

    const data: IDepositPublishedData = {
      deposit: deposit.toJSON(),
      community: community.toJSON(),
      user: author.toJSON(),
    };
    const event = new DepositPublishedEvent(data);
    expect(event.getEventDTO()).toMatchObject({ data: { deposit: deposit.toJSON() } });

    expect(event.getEmailTemplate()).toBeUndefined();
    expect(event.getAppNotificationTemplate(author.userId)).toMatchObject({
      userId: author.userId,
      title: 'Your publication has been published',
      body: ` Your publication status is now published!. Click to access to ${deposit.title}.`,
      icon: 'check_circle',
      isRead: false,
      action: `/deposits/${deposit._id.toHexString()}/view`,
    });
    expect(event.getPushNotificationTemplate()).toBeUndefined();
    expect(event.getHistoryTemplate()).toMatchObject({
      username: `${author.firstName} ${author.lastName}`,
      description: `Publication published in ${community.name}.`,
    });
  });

  it('should create DepositBackToPendingApprovalEvent', async () => {
    const { community } = await createCommunity(module);
    const { deposit, author } = await createDeposit(module, { community });
    const depositService = module.get(DepositService);
    const depositPopulated = await depositService.findById(deposit._id);
    assertIsDefined(depositPopulated);
    const data: DepositBackToPendingApprovalData = {
      deposit: depositPopulated.toJSON(),
      community: community.toJSON(),
      user: author.toJSON(),
      reason: 'bad job!?',
    };
    const event = new DepositBackToPendingApprovalEvent(data);
    expect(event.getEventDTO()).toMatchObject({ data: { deposit: deposit.toJSON() } });
    expect(event.getEmailTemplate()).toBeUndefined();
    expect(event.getAppNotificationTemplate(author.userId)).toMatchObject({
      userId: author.userId,
      title: 'Your publication has been returned to pending approval.',
      body: `Your publication status is now pending approval. Click to access to ${deposit.title}.`,
      icon: 'check_circle',
      isRead: false,
      action: `/deposits/${deposit._id.toHexString()}/view`,
    });
    expect(event.getPushNotificationTemplate()).toBeUndefined();
    expect(event.getHistoryTemplate()).toMatchObject({
      username: `${author.firstName} ${author.lastName}`,
      description: `Publication returned to pending approval in ${community.name}. Reason: ${
        data.reason ?? ''
      }`,
    });
  });

  it('should create ReminderDraftDepositEvent', async () => {
    const { community } = await createCommunity(module);
    const { deposit, author } = await createDeposit(module, { community });
    const event = new ReminderDraftDepositEvent({
      deposit: deposit.toJSON(),
      user: author.toJSON(),
    });
    expect(event.getEventDTO()).toMatchObject({
      data: { deposit: deposit.toJSON(), user: author.toJSON() },
    });
    expect(event.getEmailTemplate('{{ userName }} {{depositTitle}}')).toMatchObject({
      subject: 'Just a friendly reminder',
      html: expect.stringContaining(`${author.firstName} ${author.lastName} ${deposit.title}`),
    });
    expect(event.getAppNotificationTemplate()).toBeUndefined();
    expect(event.getPushNotificationTemplate()).toBeUndefined();
    expect(event.getHistoryTemplate()).toBeUndefined();
  });

  it('should create ReviewSubmittedEvent', async () => {
    const { community } = await createCommunity(module);
    const { deposit, author } = await createDeposit(module, { community });
    const { review } = await createReview(module, deposit);
    const reviewService = module.get(ReviewService);
    const reviewPopulated = await reviewService.findById(review._id);
    assertIsDefined(reviewPopulated);
    const event = new ReviewSubmittedConfirmationEvent({
      deposit: deposit.toJSON(),
      review: reviewPopulated.toJSON(),
      user: author.toJSON(),
      community: community.toJSON(),
    });
    expect(event.getEventDTO()).toMatchObject({
      data: { deposit: deposit.toJSON(), review: reviewPopulated.toJSON() },
    });
    expect(event.getEmailTemplate('{{PUBLICATION_TITLE}}')).toMatchObject({
      subject: 'Your review has been submitted to Orvium',
      html: expect.stringContaining(deposit.title),
    });
    expect(event.getAppNotificationTemplate()).toBeUndefined();
    expect(event.getPushNotificationTemplate()).toBeUndefined();
    expect(event.getHistoryTemplate()).toMatchObject({
      username: `${author.firstName} ${author.lastName}`,
      description: 'Review by John submitted',
    });
  });

  it('should create ReviewPublishedConfirmationToReviewerEvent', async () => {
    const { community } = await createCommunity(module);
    const { deposit, author } = await createDeposit(module, { community });
    const { review } = await createReview(module, deposit);
    const reviewService = module.get(ReviewService);
    const reviewPopulated = await reviewService.findById(review._id);
    assertIsDefined(reviewPopulated);
    const event = new ReviewPublishedConfirmationToReviewerEvent({
      deposit: deposit.toJSON(),
      review: reviewPopulated.toJSON(),
      user: author.toJSON(),
      community: community.toJSON(),
    });
    expect(event.getEventDTO()).toMatchObject({
      data: { deposit: deposit.toJSON(), review: reviewPopulated.toJSON() },
    });
    expect(event.getEmailTemplate('{{PUBLICATION_TITLE}}')).toMatchObject({
      subject: 'Your review has been accepted',
      html: expect.stringContaining(deposit.title),
    });
    assertIsDefined(review._id);
    expect(event.getAppNotificationTemplate(author.userId)).toMatchObject({
      userId: author.userId,
      title: 'Your review has been accepted',
      body: 'The editorial board has accepted your peer review',
      icon: 'check_circle',
      isRead: false,
      action: `/reviews/${review._id.toHexString()}/view`,
    });
    expect(event.getPushNotificationTemplate()).toBeUndefined();
    expect(event.getHistoryTemplate()).toMatchObject({
      username: `${author.firstName} ${author.lastName}`,
      description: 'Review by John Doe published',
    });
  });

  it('should create IThenticateReportReadyEvent', async () => {
    const { community } = await createCommunity(module);
    const { deposit, author } = await createDeposit(module, { community });
    const event = new IThenticateReportReadyEvent({
      deposit: deposit.toJSON(),
      submitter: author.toJSON(),
    });
    expect(event.getEventDTO()).toMatchObject({
      data: { deposit: deposit.toJSON(), submitter: author.toJSON() },
    });
    expect(event.getEmailTemplate('{{USER_FULLNAME}} {{PUBLICATION_TITLE}}')).toMatchObject({
      subject: 'Similarity Report Ready',
      html: expect.stringContaining(`${deposit.title}`),
    });
    expect(event.getAppNotificationTemplate()).toBeUndefined();
    expect(event.getPushNotificationTemplate()).toBeUndefined();
    expect(event.getHistoryTemplate()).toBeUndefined();
  });

  it('should create CommunitySubmittedEvent', async () => {
    const { community, communityOwner } = await createCommunity(module);
    const event = new CommunitySubmittedEvent({
      community: community.toJSON(),
      user: communityOwner.toJSON(),
    });
    expect(event.getEventDTO()).toMatchObject({
      data: { community: community.toJSON(), user: communityOwner.toJSON() },
    });
    expect(
      event.getEmailTemplate('{{COMMUNITY_NAME}} {{COMMUNITY_LINK}} {{USER_FULLNAME}}')
    ).toMatchObject({
      subject: 'A new community has been submitted to Orvium',
      html: expect.stringContaining(`${communityOwner.firstName}`),
    });
    expect(event.getAppNotificationTemplate()).toBeUndefined();
    expect(event.getPushNotificationTemplate()).toBeUndefined();
    expect(event.getHistoryTemplate()).toBeUndefined();
  });

  it('should create CommunityAcceptedEvent', async () => {
    const { community, communityOwner } = await createCommunity(module);
    const event = new CommunityAcceptedEvent({
      community: community.toJSON(),
      user: communityOwner.toJSON(),
    });
    expect(event.getEventDTO()).toMatchObject({
      data: { community: community.toJSON(), user: communityOwner.toJSON() },
    });
    expect(
      event.getEmailTemplate('{{COMMUNITY_NAME}} {{COMMUNITY_LINK}} {{USER_FULLNAME}}')
    ).toMatchObject({
      subject: 'Your community has been accepted in Orvium',
      html: expect.stringContaining(`${communityOwner.firstName}`),
    });
    expect(event.getAppNotificationTemplate()).toBeUndefined();
    expect(event.getPushNotificationTemplate()).toBeUndefined();
    expect(event.getHistoryTemplate()).toBeUndefined();
  });

  it('should create GeneralNotificationEvent', async () => {
    const { community, communityOwner } = await createCommunity(module);
    const event = new GeneralNotificationEvent({
      community: community.toJSON(),
      sender: communityOwner.toJSON(),
      message: 'Hello reviewers, i am testing',
      subject: 'TEST-MAIL',
      recipients: ['john@orvium.io', 'federico@orvium.io'],
    });
    expect(event.getEventDTO()).toMatchObject({
      data: {
        community: community.toJSON(),
        sender: communityOwner.toJSON(),
        message: 'Hello reviewers, i am testing',
        subject: 'TEST-MAIL',
        recipients: ['john@orvium.io', 'federico@orvium.io'],
      },
    });
    expect(
      event.getEmailTemplate('{{COMMUNITY_NAME}} {{COMMUNITY_LINK}} {{USER_FULLNAME}}')
    ).toMatchObject({
      subject: 'TEST-MAIL',
      html: expect.stringContaining(`${communityOwner.firstName}`),
    });
    expect(event.getAppNotificationTemplate()).toBeUndefined();
    expect(event.getPushNotificationTemplate()).toBeUndefined();
    expect(event.getHistoryTemplate()).toBeUndefined();
  });
});
