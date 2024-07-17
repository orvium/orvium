import { Module } from '@nestjs/common';
import { PushNotificationsController } from './push-notifications.controller';
import { PushNotificationsService } from './push-notifications.service';
import { MongooseModule } from '@nestjs/mongoose';
import { AppPushSubscription, AppPushSubscriptionSchema } from './push-notification.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AppPushSubscription.name, schema: AppPushSubscriptionSchema },
    ]),
  ],
  controllers: [PushNotificationsController],
  exports: [PushNotificationsService],
  providers: [PushNotificationsService],
})
export class PushNotificationsModule {}
