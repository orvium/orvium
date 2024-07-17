import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { CommunitiesModule } from '../communities/communities.module';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { Payment, PaymentSchema } from './payment.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { TransformerModule } from '../transformer/transformer.module';
import { StripeWebhookHistory, StripeWebhookHistorySchema } from './stripe-webhook-history.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Payment.name, schema: PaymentSchema },
      { name: StripeWebhookHistory.name, schema: StripeWebhookHistorySchema },
    ]),
    CommunitiesModule,
    UsersModule,
    TransformerModule,
  ],
  providers: [PaymentService],
  controllers: [PaymentController],
  exports: [PaymentService],
})
export class PaymentModule {}
