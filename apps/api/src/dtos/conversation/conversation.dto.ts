import { Exclude, Expose, Type } from 'class-transformer';
import { TransformObjectId } from '../../utils/expose-id.decorator';
import { MessageDTO } from '../message.dto';

@Exclude()
export class ConversationDTO {
  /**
   * Conversation ID
   * @example 5fa1908fd29a17dc961cc435
   */
  @TransformObjectId()
  @Expose()
  _id!: string;

  /**
   * An array of the IDs of the conversations participants
   * @example 5fa1908fd29a17dc961cc435
   */
  @TransformObjectId() @Expose() participants!: string[];

  /**
   * Mark if the last conversation message is pending to read
   * @example false
   */
  @Expose() messagesPending!: boolean;

  /**
   * Last message date
   * @example 2012-01-01
   */
  @Expose() lastMessageDate?: Date;

  /**
   * An array of the messages of the conversation
   */
  @Expose() @Type(() => MessageDTO) messages!: MessageDTO[];

  /**
   * An array of the conversation actions
   * @example [Update]
   */
  @Expose() actions?: string[];
}
