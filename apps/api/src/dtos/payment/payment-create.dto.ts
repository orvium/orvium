import { IsNotEmpty, IsString } from 'class-validator';
import { IsNotBlankValidator } from '../../utils/isNotBlankValidator';

export class PaymentCreateDTO {
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
   * The name of the Stripe event
   * @example "checkout.session"
   */
  @IsNotEmpty() eventName!: string;
}
