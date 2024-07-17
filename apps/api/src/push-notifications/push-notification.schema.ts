import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { IsString } from 'class-validator';
import { PushSubscription } from 'web-push';

export class Keys {
  @IsString() p256dh!: string;
  @IsString() auth!: string;
}

export type AppPushSubscriptionDocument = HydratedDocument<AppPushSubscription>;

@Schema({ collection: 'pushSubscriptions', timestamps: true, toJSON: { virtuals: true } })
export class AppPushSubscription implements PushSubscription {
  @Prop({ required: true, trim: true }) endpoint!: string;
  @Prop() expirationTime?: Date;
  @Prop({ type: MongooseSchema.Types.Mixed }) keys!: Keys;
  @Prop({ required: true }) userId!: string;
}

export const AppPushSubscriptionSchema = SchemaFactory.createForClass(AppPushSubscription);
