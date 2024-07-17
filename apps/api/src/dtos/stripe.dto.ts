import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class StripeDTO {
  /**
   * The ID of the stripe account
   * @example acct_xxxxxxxxxxxxxxxx
   */
  @Expose() id!: string;

  /**
   * Check if the stripe account is active now
   * @example true
   */
  @Expose() active!: boolean;

  /**
   * The default currency configured in the stripe account
   * @example "eur"
   */
  @Expose() defaultCurrency?: string;
}
