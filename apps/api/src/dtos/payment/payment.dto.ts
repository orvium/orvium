import { Exclude, Expose, Type } from 'class-transformer';
import { TransformObjectId } from '../../utils/expose-id.decorator';
import { OrderDTO } from '../order.dto';

@Exclude()
export class PaymentDTO {
  /**
   * Payment ID
   * @example "63a2f2495f4fbb7d72bc3fd2"
   */
  @TransformObjectId()
  @Expose()
  _id!: string;

  /**
   * Customer email
   * @example "example@orvium.io"
   */
  @Expose() customerEmail!: string;
  /**
   * Customer Orvium user id
   * @example "63a2f2495f4fbb7d72bc3fd2"
   */
  @TransformObjectId()
  @Expose()
  userId!: string;

  /**
   * The Stripe account ID
   * @example "acct_xxxxxxxxxxxxxxxxxx"
   */
  @Expose() stripeAccount!: string;

  /**
   * Unique identifier for the Stripe object: Checkout Session
   * @example "cs_test_a1h7FO586nlXiQrA2VkHEOloRAb1LmAeejcHtDTZ9mhxQFVOiF33vM60bj"
   */
  @Expose() checkoutSessionId!: string;

  /**
   * The name of the Stripe event
   * @example "checkout.session"
   */
  @Expose() eventName!: string;

  /**
   * The unique identifier for the Stripe event
   * @example "evt_1MKfG8BNcBPovNvQzO26ZobS"
   */
  @Expose() eventId!: string;

  /**
   * The status for the saved Stripe Checkout Session event. The status can be: 'open', 'complete', or 'expired'.
   * 'open': The checkout session is still in progress. Payment processing has not started.
   * 'complete': The checkout session is complete. Payment processing may still be in progress.
   * 'expired': The checkout session has expired. No further processing will occur.
   * @example "complete"
   */
  @Expose() eventStatus!: string;

  /**
   * This is the URL to view Stripe automatically generates receipt for this payment.
   * @example "https://pay.stripe.com/receipts/payment/CAcaFwoVYWNjdF8xTUsycktCTmNCUG92TnZRKNLpup0GMgao-VdsULA6LBbel3G_yFCkt1CmSOXUx8WInuq-xEiAoeOc60ad9A5zyQaG7Ci1Wj-C1hga"
   */
  @Expose() receiptUrl?: string;

  /**
   * The total amount of the payment
   * @example "60"
   */
  @Expose() amountTotal!: number;

  /**
   * The currency of the payment
   * @example "eur"
   */
  @Expose() currency!: string;

  /**
   * The name of the Community in which the payment has been made
   * @example "Orvium Community"
   */
  @Expose() communityName!: string;

  /**
   * The ID of the Community in which the payment has been made
   * @example "63ac712a7224149182794daf"
   */
  @TransformObjectId() @Expose() community!: string;

  /**
   * The date when the payment has been made
   * @example "2022-12-30T09:52:19.126+00:00"
   */
  @Expose() date!: Date;

  /**
   * The order that has been made in this payment
   * @example "Object"
   */
  @Expose() @Type(() => OrderDTO) order?: OrderDTO;

  /**
   * All the data of the event
   * @example ""
   */
  @Expose() eventContent!: unknown;

  /**
   * List of actions available
   * @example ["update"]
   */
  @Expose() actions: string[] = [];
}
