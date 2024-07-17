import { Module } from '@nestjs/common';
import { JwtStrategy } from './auth/jwt.strategy';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './users/users.module';
import { EventModule } from './event/event.module';
import { ConfigModule } from '@nestjs/config';
import { environment } from './environments/environment';
import { BlockchainModule } from './blockchain/blockchain.module';
import { FeedbackModule } from './feedback/feedback.module';
import { CommunitiesModule } from './communities/communities.module';
import { OaipmhModule } from './oaipmh/oaipmh.module';
import { DepositModule } from './deposit/deposit.module';
import { NotificationModule } from './notification/notification.module';
import { ReviewModule } from './review/review.module';
import { AnonymousStrategy } from './auth/anonymous.strategy';
import { SitemapController } from './sitemap/sitemap.controller';
import { InstitutionModule } from './institution/institution.module';
import { DisciplineModule } from './discipline/discipline.module';
import { DomainsModule } from './domains/domains.module';
import { InviteModule } from './invite/invite.module';
import { PushNotificationsModule } from './push-notifications/push-notifications.module';
import { DataciteModule } from './datacite/datacite.module';
import { EmailService } from './email/email.service';
import { CommonModule } from './common/common.module';
import { TemplateModule } from './template/template.module';
import { AuthorizationModule } from './authorization/authorization.module';
import { CommentsModule } from './comments/comments.module';
import { ConversationsModule } from './conversations/conversations.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CallModule } from './call/call.module';
import { SessionModule } from './session/session.module';
import { IthenticateModule } from './ithenticate/ithenticate.module';
import { PaymentModule } from './payment/payment.module';
import Joi from 'joi';
import { AdminModule } from './admin/admin.module';
import { CrossrefModule } from './crossref/crossref.module';
import { OrcidModule } from './orcid/orcid.module';
import { BibtexModule } from './bibtex/bibtex.module';
import { OffboardingModule } from './offboarding/offboarding.module';
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
    UsersModule,
    EventModule,
    BlockchainModule,
    FeedbackModule,
    CommunitiesModule,
    OaipmhModule,
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
    PaymentModule,
    TemplateModule,
    CommentsModule,
    ConversationsModule,
    CallModule,
    SessionModule,
    IthenticateModule,
    AdminModule,
    CrossrefModule,
    DoiLogModule,
    OrcidModule,
    BibtexModule,
    OffboardingModule,
    EventEmitterModule.forRoot({
      wildcard: true,
    }),
    CacheModule.register({ isGlobal: true }),
  ],
  controllers: [SitemapController],
  providers: [JwtStrategy, AnonymousStrategy, EmailService],
})
export class AppModule {}
