import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { OrderDTO } from '../dtos/order.dto';
import { CommunityCLASSNAME, UserCLASSNAME } from '../utils/utils';

/**
 * Type alias for a hydrated document of a Payment, which includes methods like save(),
 * find(), etc., from Mongoose.
 */
export type PaymentDocument = HydratedDocument<Payment>;

/**
 * Represents a payment transaction within the system.
 * This class is used to store and manage details about payments made by users,
 * linking them to users, communities, and the specifics of the transaction.
 */
@Schema({ collection: 'payment', timestamps: true, toJSON: { virtuals: true } })
export class Payment {
  /**
   * The email address of the customer who made the payment, whitespaces trimmed
   */
  @Prop({ trim: true })
  customerEmail!: string;

  /**
   * The ObjectId of the user who made the payment, linked to the User collection.
   */
  @Prop({
    required: true,
    ref: UserCLASSNAME,
    type: MongooseSchema.Types.ObjectId,
  })
  userId!: Types.ObjectId;

  /**
   * Identifier for the Stripe account used in the payment, whitespaces trimmed
   */
  @Prop({ trim: true })
  stripeAccount!: string;

  /**
   * The session ID from Stripe used during the checkout process, whitespaces trimmed
   */
  @Prop({ trim: true })
  checkoutSessionId!: string;

  /**
   * The name of the event related to the payment, if applicable, whitespaces trimmed
   */
  @Prop({ trim: true })
  eventName!: string;

  /**
   * The unique identifier for the event related to the payment, whitespaces trimmed
   */
  @Prop({ trim: true })
  eventId!: string;

  /**
   * The status of the event related to the payment, whitespaces trimmed
   */
  @Prop({ trim: true })
  eventStatus!: string;

  /**
   * Optional URL to the receipt for the payment, whitespaces trimmed
   */
  @Prop({ trim: true })
  receiptUrl?: string;

  /**
   * The total amount of the payment
   */
  @Prop()
  amountTotal!: number;

  /**
   * The currency in which the payment was made, whitespaces trimmed
   */
  @Prop({ trim: true })
  currency!: string;

  /**
   * The name of the community associated with the payment, whitespaces trimmed
   */
  @Prop({ trim: true })
  communityName!: string;

  /**
   * The ObjectId of the community related to the payment, linked to the Community collection.
   */
  @Prop({
    required: true,
    ref: CommunityCLASSNAME,
    type: MongooseSchema.Types.ObjectId,
  })
  community!: Types.ObjectId;

  /**
   * The date when the payment was processed.
   */
  @Prop()
  date!: Date;

  /**
   * Optional detailed order information related to the payment.
   */
  @Prop([{ type: MongooseSchema.Types.Mixed }])
  order?: OrderDTO;

  /**
   * Additional content related to the event of the payment
   */
  @Prop({ type: MongooseSchema.Types.Mixed })
  eventContent!: unknown;
}

/**
 * Schema factory for the Payment class.
 */
export const PaymentSchema = SchemaFactory.createForClass(Payment);

PaymentSchema.index({
  customerEmail: 'text',
});
