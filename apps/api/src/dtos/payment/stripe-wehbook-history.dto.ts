import { Exclude, Expose } from 'class-transformer';
import { TransformObjectId } from '../../utils/expose-id.decorator';

@Exclude()
export class StripeWebhookHistoryDTO {
  /**
   * StripeWebhookHistory ID
   * @example "63a2f2535f4fbb7d72bc3fd8"
   */
  @TransformObjectId()
  @Expose()
  _id!: string;

  /**
   * All the data of the event
   * @example "Object"
   */
  @Expose() event!: object[];

  /**
   * List of actions available
   * @example ["update"]
   */
  @Expose() actions?: string[];
}
