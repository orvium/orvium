import { Module } from '@nestjs/common';
import { OffboardingController } from './offboarding.controller';
import { TransformerModule } from '../transformer/transformer.module';
import { UsersModule } from '../users/users.module';
import { DepositModule } from '../deposit/deposit.module';
import { MessageModule } from '../messages/message.module';
import { PaymentModule } from '../payment/payment.module';
import { InviteModule } from '../invite/invite.module';
import { ReviewModule } from '../review/review.module';
import { ConversationsModule } from '../conversations/conversations.module';
import { NotificationModule } from '../notification/notification.module';
import { CommunitiesModule } from '../communities/communities.module';

@Module({
  providers: [],
  imports: [
    TransformerModule,
    UsersModule,
    DepositModule,
    MessageModule,
    PaymentModule,
    InviteModule,
    ReviewModule,
    ConversationsModule,
    NotificationModule,
    CommunitiesModule,
  ],
  controllers: [OffboardingController],
})
export class OffboardingModule {}
