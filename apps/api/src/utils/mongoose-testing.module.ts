import { DynamicModule, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { environment } from '../environments/environment';
import { Deposit, DepositSchema } from '../deposit/deposit.schema';
import { Call, CallSchema } from '../call/call.schema';
import { Community, CommunitySchema } from '../communities/communities.schema';
import {
  CommunityModerator,
  CommunityModeratorSchema,
} from '../communities/communities-moderator.schema';
import { User, UserSchema } from '../users/user.schema';
import { DepositService } from '../deposit/deposit.service';
import { CallService } from '../call/call.service';
import { CommunitiesService } from '../communities/communities.service';
import { UserService } from '../users/user.service';
import { Review, ReviewSchema } from '../review/review.schema';
import { AppEvent, EventSchema } from '../event/event.schema';
import { Invite, InviteSchema } from '../invite/invite.schema';
import { ReviewService } from '../review/review.service';
import { EventService } from '../event/event.service';
import { InviteService } from '../invite/invite.service';
import { Session, SessionSchema } from '../session/session.schema';
import { SessionService } from '../session/session.service';
import { AwsStorageService } from '../common/aws-storage-service/aws-storage.service';
import { DepositImportService } from '../deposit/deposit-import.service';
import { HttpModule } from '@nestjs/axios';
import { FigshareImportService } from '../deposit/figshare-import.service';
import { TemplateService } from '../template/template.service';
import { Template, TemplateSchema } from '../template/template.schema';
import { DataciteService } from '../datacite/datacite.service';
import { AuthorizationService } from '../authorization/authorization.service';
import { Conversation, ConversationSchema } from '../conversations/conversations.schema';
import { ConversationsService } from '../conversations/conversations.service';
import { Commentary, CommentSchema } from '../comments/comments.schema';
import { CommentsService } from '../comments/comments.service';
import { Institution, InstitutionSchema } from '../institution/institution.schema';
import { InstitutionService } from '../institution/institution.service';
import { TransformerService } from '../transformer/transformer.service';
import { AppNotification, AppNotificationSchema } from '../notification/notification.schema';
import { NotificationService } from '../notification/notification.service';
import {
  AppPushSubscription,
  AppPushSubscriptionSchema,
} from '../push-notifications/push-notification.schema';
import { PushNotificationsService } from '../push-notifications/push-notifications.service';
import { EmailService } from '../email/email.service';
import { Configuration, ConfigurationSchema } from '../configuration/configuration.schema';
import { ConfigurationService } from '../configuration/configuration.service';
import { MetricsService } from '../metrics/metrics.service';
import { Metrics, MetricsSchema } from '../metrics/metrics.schema';
import { Discipline, DisciplineSchema } from '../discipline/discipline.schema';
import { DisciplineService } from '../discipline/discipline.service';
import { BlockchainNetwork, BlockchainNetworkSchema } from '../blockchain/blockchain.schema';
import { BlockchainService } from '../blockchain/blockchain.service';
import { MessagesService } from '../messages/messages.service';
import { Message, MessageSchema } from '../messages/messages.schema';
import { Payment, PaymentSchema } from '../payment/payment.schema';
import {
  StripeWebhookHistory,
  StripeWebhookHistorySchema,
} from '../payment/stripe-webhook-history.schema';
import { PaymentService } from '../payment/payment.service';
import { CrossrefService } from '../crossref/crossref.service';
import { OrcidService } from '../orcid/orcid.service';
import { BibtexService } from '../bibtex/bibtex.service';
import { TestingModule } from '@nestjs/testing';
import { CacheModule } from '@nestjs/cache-manager';
import { DoiLog, DoiLogSchema } from '../doi/doi-log.schema';
import { DoiLogService } from '../doi/doi-log.service';

environment.aws = {
  endpoint: 'http://localhost:4566',
  region: 'eu-central-1',
  s3: { privateBucket: 'myPrivateBucket', publicBucket: 'myPublicBucket' },
};

environment.stripe = {
  key: 'fake',
  webhookSecretConnect: 'fake',
  webhookSecretDirect: 'fake',
};

@Module({})
export class MongooseTestingModule {
  static forRoot(testSuite: string): DynamicModule {
    return {
      module: MongooseTestingModule,
      // global: true,
      imports: [
        MongooseModule.forRoot(environment.test.mongoUri, { maxPoolSize: 500 }),
        MongooseModule.forFeature([
          { name: Deposit.name, schema: DepositSchema, collection: `${testSuite}-Deposit` },
          { name: Call.name, schema: CallSchema, collection: `${testSuite}-Call` },
          { name: Metrics.name, schema: MetricsSchema, collection: `${testSuite}-Metrics` },
          { name: Community.name, schema: CommunitySchema, collection: `${testSuite}-Community` },
          {
            name: CommunityModerator.name,
            schema: CommunityModeratorSchema,
            collection: `${testSuite}-CommunityModerator`,
          },
          { name: User.name, schema: UserSchema, collection: `${testSuite}-User` },
          { name: Review.name, schema: ReviewSchema, collection: `${testSuite}-Review` },
          { name: AppEvent.name, schema: EventSchema, collection: `${testSuite}-Event` },
          { name: Invite.name, schema: InviteSchema, collection: `${testSuite}-Invite` },
          { name: Session.name, schema: SessionSchema, collection: `${testSuite}-Session` },
          { name: Template.name, schema: TemplateSchema, collection: `${testSuite}-Template` },
          {
            name: Conversation.name,
            schema: ConversationSchema,
            collection: `${testSuite}-Conversation`,
          },
          { name: Commentary.name, schema: CommentSchema, collection: `${testSuite}-Commentary` },
          {
            name: Institution.name,
            schema: InstitutionSchema,
            collection: `${testSuite}-Institution`,
          },
          {
            name: AppNotification.name,
            schema: AppNotificationSchema,
            collection: `${testSuite}-AppNotification`,
          },
          {
            name: AppPushSubscription.name,
            schema: AppPushSubscriptionSchema,
            collection: `${testSuite}-AppPushSubscription`,
          },
          {
            name: Configuration.name,
            schema: ConfigurationSchema,
            collection: `${testSuite}-Configuration`,
          },
          {
            name: Discipline.name,
            schema: DisciplineSchema,
            collection: `${testSuite}-Discipline`,
          },
          {
            name: BlockchainNetwork.name,
            schema: BlockchainNetworkSchema,
            collection: `${testSuite}-BlockchainNetwork`,
          },
          {
            name: Message.name,
            schema: MessageSchema,
            collection: `${testSuite}-Message`,
          },
          {
            name: DoiLog.name,
            schema: DoiLogSchema,
            collection: `${testSuite}-DoiLog`,
          },
          {
            name: Payment.name,
            schema: PaymentSchema,
            collection: `${testSuite}-Payment`,
          },
          {
            name: StripeWebhookHistory.name,
            schema: StripeWebhookHistorySchema,
            collection: `${testSuite}-StripeWebhookHistory`,
          },
        ]),
        HttpModule,
        CacheModule.register({ store: 'none', isGlobal: true }),
      ],
      providers: [
        AwsStorageService,
        DepositService,
        CallService,
        CommunitiesService,
        UserService,
        ReviewService,
        EventService,
        InviteService,
        SessionService,
        DepositImportService,
        FigshareImportService,
        TemplateService,
        DataciteService,
        AuthorizationService,
        TransformerService,
        ConversationsService,
        CommentsService,
        InstitutionService,
        NotificationService,
        PushNotificationsService,
        EmailService,
        ConfigurationService,
        MetricsService,
        DisciplineService,
        BlockchainService,
        MessagesService,
        PaymentService,
        CrossrefService,
        OrcidService,
        BibtexService,
        DoiLogService,
        { provide: 'TESTDB_COLLECTION_PREFIX', useValue: testSuite },
      ],
      exports: [
        AwsStorageService,
        DepositService,
        DepositImportService,
        CallService,
        CommunitiesService,
        UserService,
        ReviewService,
        EventService,
        InviteService,
        SessionService,
        FigshareImportService,
        TemplateService,
        DataciteService,
        AuthorizationService,
        TransformerService,
        ConversationsService,
        CommentsService,
        InstitutionService,
        NotificationService,
        PushNotificationsService,
        ConfigurationService,
        EmailService,
        MetricsService,
        DisciplineService,
        BlockchainService,
        MessagesService,
        PaymentService,
        CrossrefService,
        OrcidService,
        DoiLogService,
        BibtexService,
      ],
    };
  }
}

export async function cleanCollections(module: TestingModule): Promise<void> {
  const prefix: string = module.get('TESTDB_COLLECTION_PREFIX');
  const connection = module.get(ConfigurationService).getConnection();

  const collections = await connection.db.collections();
  const filteredCollections = collections.filter(collection =>
    collection.collectionName.startsWith(prefix)
  );
  for (const collection of filteredCollections) {
    await collection.deleteMany();
  }
}
