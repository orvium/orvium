import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './users/users.module';
import { EventModule } from './event/event.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { environment } from './environments/environment';
import { BlockchainModule } from './blockchain/blockchain.module';
import { FeedbackModule } from './feedback/feedback.module';
import { CommunitiesModule } from './communities/communities.module';
import { DepositModule } from './deposit/deposit.module';
import { JobService } from './job/job.service';
import { NotificationModule } from './notification/notification.module';
import { ReviewModule } from './review/review.module';
import { InstitutionModule } from './institution/institution.module';
import { DisciplineModule } from './discipline/discipline.module';
import { DomainsModule } from './domains/domains.module';
import { InviteModule } from './invite/invite.module';
import { PushNotificationsModule } from './push-notifications/push-notifications.module';
import { DataciteModule } from './datacite/datacite.module';
import { EmailService } from './email/email.service';
import { CommonModule } from './common/common.module';
import { TemplateModule } from './template/template.module';
import { PandocService } from './pandoc/pandoc.service';
import { HttpModule } from '@nestjs/axios';
import { ConversationsModule } from './conversations/conversations.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CrossrefModule } from './crossref/crossref.module';
import Joi from 'joi';
import { AuthorizationModule } from './authorization/authorization.module';
import { MetricsModule } from './metrics/metrics.module';
import { CacheModule } from '@nestjs/cache-manager';
import { DoiLogModule } from './doi/doi-log.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: Joi.object({
        ENVIRONMENT: Joi.required().default('development'),
        MONGO_URI: Joi.required().default('mongodb://localhost/orvium'),
        S3_FILES_BUCKET: Joi.required().default('files.app.orvium.io'),
        AUTH0_AUDIENCE: Joi.required(),
        SECRET_KEY: Joi.required(),
        SMTP: Joi.required(),
        SENTRY_DSN: Joi.required(),
        PUSH_NOTIFICATIONS_PRIVATE_KEY: Joi.required(),
        SENDER_EMAIL: Joi.required().default('info@example.com'),
        ADMIN_EMAIL: Joi.required().default('info@example.com'),
      }),
    }),
    MongooseModule.forRoot(environment.mongoUri),
    AuthorizationModule,
    ScheduleModule.forRoot(),
    UsersModule,
    EventModule,
    BlockchainModule,
    FeedbackModule,
    CommunitiesModule,
    DepositModule,
    NotificationModule,
    ReviewModule,
    InstitutionModule,
    DisciplineModule,
    DomainsModule,
    InviteModule,
    PushNotificationsModule,
    DataciteModule,
    CommonModule,
    TemplateModule,
    HttpModule,
    ConversationsModule,
    EventEmitterModule.forRoot({
      wildcard: true,
    }),
    CrossrefModule,
    MetricsModule,
    DoiLogModule,
    CacheModule.register({ isGlobal: true }),
  ],
  controllers: [],
  providers: [JobService, EmailService, PandocService],
})
export class AgentModule {}
