import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { MongooseModule } from '@nestjs/mongoose';
import { AppNotification, AppNotificationSchema } from './notification.schema';
import { PushNotificationsModule } from '../push-notifications/push-notifications.module';
import { EmailService } from '../email/email.service';
import { TemplateModule } from '../template/template.module';
import { UsersModule } from '../users/users.module';
import { ConfigurationModule } from '../configuration/configuration.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: AppNotification.name, schema: AppNotificationSchema }]),
    PushNotificationsModule,
    TemplateModule,
    UsersModule,
    ConfigurationModule,
  ],
  controllers: [NotificationController],
  providers: [NotificationService, EmailService],
  exports: [NotificationService],
})
export class NotificationModule {}
