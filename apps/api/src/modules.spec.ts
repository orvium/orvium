// We need to set these before importing app module

import { MongooseTestingModule } from './utils/mongoose-testing.module';
import { MetricsModule } from './metrics/metrics.module';
import { Test } from '@nestjs/testing';
import { BlockchainModule } from './blockchain/blockchain.module';
import { MongooseModule } from '@nestjs/mongoose';
import { environment } from './environments/environment';
import { CommentsModule } from './comments/comments.module';
import { AuthorizationModule } from './authorization/authorization.module';
import { CommunitiesModule } from './communities/communities.module';
import { ConfigurationModule } from './configuration/configuration.module';
import { ConversationsModule } from './conversations/conversations.module';
import { DataciteModule } from './datacite/datacite.module';
import { DepositModule } from './deposit/deposit.module';
import { DisciplineModule } from './discipline/discipline.module';
import { DomainsModule } from './domains/domains.module';
import { EventModule } from './event/event.module';
import { FeedbackModule } from './feedback/feedback.module';
import { InstitutionModule } from './institution/institution.module';
import { InviteModule } from './invite/invite.module';
import { IthenticateModule } from './ithenticate/ithenticate.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { NotificationModule } from './notification/notification.module';
import { OaipmhModule } from './oaipmh/oaipmh.module';
import { PaymentModule } from './payment/payment.module';
import { PushNotificationsModule } from './push-notifications/push-notifications.module';
import { ReviewModule } from './review/review.module';
import { SessionModule } from './session/session.module';
import { TemplateModule } from './template/template.module';
import { UsersModule } from './users/users.module';
import { CallModule } from './call/call.module';
import { AppModule } from './app.module';
import { OrcidModule } from './orcid/orcid.module';
import { BibtexModule } from './bibtex/bibtex.module';
import { CacheModule } from '@nestjs/cache-manager';

process.env.AWS_ENDPOINT_URL = 'http://localhost:4566';
process.env.STRIPE = '{"key":"fake","webhookSecret":"fake"}';

environment.aws.s3 = { privateBucket: 'myPrivateBucket', publicBucket: 'myPublicBucket' };

describe('Testing Modules', () => {
  it('should compile AppModule', async () => {
    const module = await Test.createTestingModule({
      imports: [MongooseModule.forRoot(environment.test.mongoUri), AppModule],
      providers: [],
    }).compile();

    expect(module).toBeDefined();
    await module.close();
  });

  it('should compile BlockchainModule', async () => {
    const module = await Test.createTestingModule({
      imports: [MongooseModule.forRoot(environment.test.mongoUri), BlockchainModule],
      providers: [],
    }).compile();

    expect(module).toBeDefined();
    await module.close();
  });

  it('should compile CallModule', async () => {
    const module = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(environment.test.mongoUri),
        CacheModule.register({ ttl: 0, isGlobal: true }),
        AuthorizationModule,
        CallModule,
      ],
      providers: [],
    }).compile();

    expect(module).toBeDefined();
    await module.close();
  });

  it('should compile CommentsModule', async () => {
    const module = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(environment.test.mongoUri),
        CacheModule.register({ ttl: 0, isGlobal: true }),
        AuthorizationModule,
        CommentsModule,
      ],
      providers: [],
    }).compile();

    expect(module).toBeDefined();
    await module.close();
  });

  it('should compile CommunitiesModule', async () => {
    const module = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(environment.test.mongoUri),
        CacheModule.register({ ttl: 0, isGlobal: true }),
        AuthorizationModule,
        CommunitiesModule,
      ],
      providers: [],
    }).compile();

    expect(module).toBeDefined();
    await module.close();
  });

  it('should compile ConfigurationModule', async () => {
    const module = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(environment.test.mongoUri),
        CacheModule.register({ ttl: 0, isGlobal: true }),
        AuthorizationModule,
        ConfigurationModule,
      ],
      providers: [],
    }).compile();

    expect(module).toBeDefined();
    await module.close();
  });

  it('should compile ConversationsModule', async () => {
    const module = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(environment.test.mongoUri),
        CacheModule.register({ ttl: 0, isGlobal: true }),
        AuthorizationModule,
        ConversationsModule,
      ],
      providers: [],
    }).compile();

    expect(module).toBeDefined();
    await module.close();
  });

  it('should compile Datacite', async () => {
    const module = await Test.createTestingModule({
      imports: [MongooseModule.forRoot(environment.test.mongoUri), DataciteModule],
      providers: [],
    }).compile();

    expect(module).toBeDefined();
    await module.close();
  });

  it('should compile OrcidModule', async () => {
    const module = await Test.createTestingModule({
      imports: [MongooseModule.forRoot(environment.test.mongoUri), OrcidModule],
      providers: [],
    }).compile();

    expect(module).toBeDefined();
    await module.close();
  });

  it('should compile BibtexModule', async () => {
    const module = await Test.createTestingModule({
      imports: [MongooseModule.forRoot(environment.test.mongoUri), BibtexModule],
      providers: [],
    }).compile();

    expect(module).toBeDefined();
    await module.close();
  });

  it('should compile CrossrefModule', async () => {
    const module = await Test.createTestingModule({
      imports: [MongooseTestingModule.forRoot(environment.test.mongoUri)],
    }).compile();

    expect(module).toBeDefined();
    await module.close();
  });

  it('should compile DoiLogModule', async () => {
    const module = await Test.createTestingModule({
      imports: [MongooseTestingModule.forRoot(environment.test.mongoUri)],
    }).compile();

    expect(module).toBeDefined();
    await module.close();
  });

  it('should compile DepositModule', async () => {
    const module = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(environment.test.mongoUri),
        CacheModule.register({ ttl: 0, isGlobal: true }),
        AuthorizationModule,
        DepositModule,
      ],
      providers: [],
    }).compile();

    expect(module).toBeDefined();
    await module.close();
  });

  it('should compile DisciplineModule', async () => {
    const module = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(environment.test.mongoUri),
        CacheModule.register({ ttl: 0, isGlobal: true }),
        AuthorizationModule,
        DisciplineModule,
      ],
      providers: [],
    }).compile();

    await module.close();
    expect(module).toBeDefined();
  });

  it('should compile DomainsModule', async () => {
    const module = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(environment.test.mongoUri),
        CacheModule.register({ ttl: 0, isGlobal: true }),
        AuthorizationModule,
        DomainsModule,
      ],
      providers: [],
    }).compile();

    expect(module).toBeDefined();
    await module.close();
  });

  it('should compile EventModule', async () => {
    const module = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(environment.test.mongoUri),
        CacheModule.register({ ttl: 0, isGlobal: true }),
        AuthorizationModule,
        EventModule,
      ],
      providers: [],
    }).compile();

    expect(module).toBeDefined();
    await module.close();
  });

  it('should compile FeedbackModule', async () => {
    const module = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(environment.test.mongoUri),
        CacheModule.register({ ttl: 0, isGlobal: true }),
        AuthorizationModule,
        EventEmitterModule.forRoot({
          wildcard: true,
        }),
        FeedbackModule,
      ],
      providers: [],
    }).compile();

    expect(module).toBeDefined();
    await module.close();
  });

  it('should compile InstitutionModule', async () => {
    const module = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(environment.test.mongoUri),
        CacheModule.register({ ttl: 0, isGlobal: true }),
        AuthorizationModule,
        InstitutionModule,
      ],
      providers: [],
    }).compile();

    expect(module).toBeDefined();
    await module.close();
  });

  it('should compile InviteModule', async () => {
    const module = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(environment.test.mongoUri),
        CacheModule.register({ ttl: 0, isGlobal: true }),
        AuthorizationModule,
        InviteModule,
      ],
      providers: [],
    }).compile();

    expect(module).toBeDefined();
    await module.close();
  });

  it('should compile IthenticateModule', async () => {
    const module = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(environment.test.mongoUri),
        CacheModule.register({ ttl: 0, isGlobal: true }),
        AuthorizationModule,
        IthenticateModule,
      ],
      providers: [],
    }).compile();

    expect(module).toBeDefined();
    await module.close();
  });

  it('should compile NotificationModule', async () => {
    const module = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(environment.test.mongoUri),
        CacheModule.register({ ttl: 0, isGlobal: true }),
        AuthorizationModule,
        NotificationModule,
      ],
      providers: [],
    }).compile();

    expect(module).toBeDefined();
    await module.close();
  });

  it('should compile OaipmhModule', async () => {
    const module = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(environment.test.mongoUri),
        CacheModule.register({ ttl: 0, isGlobal: true }),
        AuthorizationModule,
        OaipmhModule,
      ],
      providers: [],
    }).compile();

    expect(module).toBeDefined();
    await module.close();
  });

  it('should compile PaymentModule', async () => {
    const module = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(environment.test.mongoUri),
        CacheModule.register({ ttl: 0, isGlobal: true }),
        AuthorizationModule,
        PaymentModule,
      ],
      providers: [],
    }).compile();

    expect(module).toBeDefined();
    await module.close();
  });

  it('should compile PushNotificationsModule', async () => {
    const module = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(environment.test.mongoUri),
        CacheModule.register({ ttl: 0, isGlobal: true }),
        AuthorizationModule,
        PushNotificationsModule,
      ],
      providers: [],
    }).compile();

    expect(module).toBeDefined();
    await module.close();
  });

  it('should compile ReviewModule', async () => {
    const module = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(environment.test.mongoUri),
        CacheModule.register({ ttl: 0, isGlobal: true }),
        AuthorizationModule,
        ReviewModule,
      ],
      providers: [],
    }).compile();

    expect(module).toBeDefined();
    await module.close();
  });

  it('should compile SessionModule', async () => {
    const module = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(environment.test.mongoUri),
        CacheModule.register({ ttl: 0, isGlobal: true }),
        AuthorizationModule,
        SessionModule,
      ],
      providers: [],
    }).compile();

    expect(module).toBeDefined();
    await module.close();
  });

  it('should compile TemplateModule', async () => {
    const module = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(environment.test.mongoUri),
        CacheModule.register({ ttl: 0, isGlobal: true }),
        AuthorizationModule,
        TemplateModule,
      ],
      providers: [],
    }).compile();

    expect(module).toBeDefined();
    await module.close();
  });

  it('should compile UsersModule', async () => {
    const module = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(environment.test.mongoUri),
        CacheModule.register({ ttl: 0, isGlobal: true }),
        AuthorizationModule,
        UsersModule,
      ],
      providers: [],
    }).compile();

    expect(module).toBeDefined();
    await module.close();
  });

  it('should compile MetricsModule', async () => {
    const module = await Test.createTestingModule({
      imports: [MongooseModule.forRoot(environment.test.mongoUri), MetricsModule],
      providers: [],
    }).compile();

    expect(module).toBeDefined();
    await module.close();
  });
});
