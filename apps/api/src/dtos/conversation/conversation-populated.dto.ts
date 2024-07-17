import { Exclude, Expose, Type } from 'class-transformer';
import { ConversationDTO } from './conversation.dto';
import { UserSummaryDTO } from '../user/user-summary.dto';

@Exclude()
export class ConversationPopulatedDTO extends ConversationDTO {
  /**
   * An array of the all information of the conversations participants
   */
  @Expose() @Type(() => UserSummaryDTO) participantsPopulated!: UserSummaryDTO[];
}
