import { Exclude, Expose } from 'class-transformer';
import { TransformObjectId } from '../utils/expose-id.decorator';

@Exclude()
export class MessageDTO {
  /**
   * Message ID
   * @example 542c2b97bac0595474108b48
   */
  @TransformObjectId()
  @Expose()
  _id!: string;

  /**
   * The user that send the message
   * @example john
   */
  @TransformObjectId()
  @Expose()
  sender!: string;

  /**
   * Date of the message
   * @example 15/07/1998 22:30
   */
  @Expose() createdAt!: Date;

  /**
   * Message content
   * @example hi, my name is john.
   */
  @Expose() content!: string;

  /**
   * Conversation id
   * @example "617298619ff9664a706ca6fb"
   */
  @TransformObjectId()
  @Expose()
  conversation!: string;

  /**
   * Date of marked as read
   * @example 15/07/1998 10:22
   */
  @Expose() readAt?: Date;
}
