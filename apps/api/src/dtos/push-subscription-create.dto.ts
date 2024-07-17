import { IsDate, IsDefined, IsOptional, IsString } from 'class-validator';
import { Keys } from '../push-notifications/push-notification.schema';

export class PushSubscriptionCreateDTO {
  /**
   * The name of the endpoint is activating the notification
   * @example "confirmEmail"
   */
  @IsString() endpoint!: string;

  /**
   * Expiration date of the subscription
   * @example 21/12/2022
   */
  @IsOptional() @IsDate() expirationTime?: Date;

  /**
   * A string with the encryption method used to generate a client key
   * p256d: public key on the P-256 curve (that is, the NIST secp256r1 elliptic curve)
   * auth: An authentication secret - https://datatracker.ietf.org/doc/html/draft-ietf-webpush-encryption-08
   */
  @IsDefined() keys!: Keys;
}
