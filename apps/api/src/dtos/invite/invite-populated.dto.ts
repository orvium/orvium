import { UserSummaryDTO } from '../user/user-summary.dto';
import { Exclude, Expose, Type } from 'class-transformer';
import { InviteDTO } from './invite.dto';

@Exclude()
export class InvitePopulatedDTO extends InviteDTO {
  @Expose() @Type(() => UserSummaryDTO) senderPopulated!: UserSummaryDTO;
}
