import { IsString } from 'class-validator';

export class CreateConversationDTO {
  /**
   * User ID of the person that receive the notification
   * @example 5fa1908fd29a17dc961cc435
   */
  @IsString() recipient!: string;
}
