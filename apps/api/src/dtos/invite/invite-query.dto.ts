import { Exclude, Expose, Type } from 'class-transformer';
import { InvitePopulatedDTO } from './invite-populated.dto';

@Exclude()
export class InviteQueryDTO {
  /**
   * An array of invitations received by the query
   */
  @Expose() @Type(() => InvitePopulatedDTO) invites!: InvitePopulatedDTO[];

  /**
   * Number of invitations received by the query
   * @example 2
   */
  @Expose() count!: number;

  /**
   * An array of actions
   * @example [Update]
   */
  @Expose() actions?: string[];
}
