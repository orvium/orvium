import { IsNotEmpty, IsString } from 'class-validator';
import { IsNotBlankValidator } from '../../utils/isNotBlankValidator';

export class PaymentUpdateDTO {
  /**
   * The unique identifier for the Stripe event
   * @example "evt_1MKfG8BNcBPovNvQzO26ZobS"
   */
  @IsString()
  @IsNotBlankValidator({ message: 'eventId should not be empty' })
  eventId!: string;

  /**
   * Customer email
   * @example "example@example.com"
   */
  @IsNotEmpty() customerEmail!: string;

  /**
   * The Stripe account ID
   * @example "acct_xxxxxxxxxxxxxxxxxx"
   */
  @IsNotEmpty() stripeAccount!: string;

  /**
   * Unique identifier for the Stripe object: Checkout Session
   * @example "cs_test_a1h7FO586nlXiQrA2VkHEOloRAb1LmAeejcHtDTZ9mhxQFVOiF33vM60bj"
   */
  @IsNotEmpty() checkoutSessionId!: string;

  /**
   * The name of the Stripe event
   * @example "checkout.session"
   */
  @IsNotEmpty() eventName!: string;

  /**
   * The status for the saved Stripe Checkout Session event. The status can be: 'open', 'complete', or 'expired'.
   * 'open': The checkout session is still in progress. Payment processing has not started.
   * 'complete': The checkout session is complete. Payment processing may still be in progress.
   * 'expired': The checkout session has expired. No further processing will occur.
   * @example "complete"
   */
  @IsNotEmpty() eventStatus!: string;

  /**
   * This is the URL to view Stripe automatically generates receipt for this payment.
   * @example "https://pay.stripe.com/receipts/payment/CAcaFwoVYWNjdF8xTUsycktCTmNCUG92TnZRKNLpup0GMgao-VdsULA6LBbel3G_yFCkt1CmSOXUx8WInuq-xEiAoeOc60ad9A5zyQaG7Ci1Wj-C1hga"
   */
  @IsString() receiptUrl?: string;

  /**
   * The date when the payment has been made
   * @example "2022-12-30T09:52:19.126+00:00"
   */
  @IsNotEmpty() date!: Date;

  /**
   * All the data of the events
   */
  @IsNotEmpty() events!: object;
}
