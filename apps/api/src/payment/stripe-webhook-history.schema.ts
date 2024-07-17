import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type StripeWebhookHistoryDocument = HydratedDocument<StripeWebhookHistory>;

@Schema({ collection: 'stripeWebhookHistory', timestamps: true, toJSON: { virtuals: true } })
export class StripeWebhookHistory {
  @Prop({ type: MongooseSchema.Types.Mixed })
  event!: unknown[];
}

export const StripeWebhookHistorySchema = SchemaFactory.createForClass(StripeWebhookHistory);
