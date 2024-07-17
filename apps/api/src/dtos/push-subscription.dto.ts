import { Keys } from '../push-notifications/push-notification.schema';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class PushSubscriptionDTO {
  /**
   * The name of the endpoint is activating the notification
   * @example "confirmEmail"
   */
  @Expose() endpoint!: string;

  /**
   * Expiration date of the subscription
   * @example 21/12/2022
   */
  @Expose() expirationTime?: Date;

  /**
   * User ID
   * @example 5fa1908fd29a17dc961cc435
   */
  @Expose() userId?: string;

  /**
   * A string with the encryption method used to generate a client key
   * p256d: public key on the P-256 curve (that is, the NIST secp256r1 elliptic curve)
   * auth: An authentication secret - https://datatracker.ietf.org/doc/html/draft-ietf-webpush-encryption-08
   */
  @Expose() keys!: Keys;
}
