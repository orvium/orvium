import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class StripeCheckoutDTO {
  /**
   * The URL to the Checkout Session. Redirect customers to this URL to take them to Checkout.
   * @example https://checkout.stripe.com/c/pay/cs_test_bxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxvLR#xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   */
  @Expose() url!: string;

  /**
   * List of actions available
   * @example ["update"]
   */
  @Expose() actions: string[] = [];
}
