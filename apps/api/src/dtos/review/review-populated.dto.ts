import { Exclude, Expose, Type } from 'class-transformer';
import { UserSummaryDTO } from '../user/user-summary.dto';
import { DepositDTO } from '../deposit/deposit.dto';
import { CommunityDTO } from '../community/community.dto';
import { ReviewDTO } from './review.dto';

@Exclude()
export class ReviewPopulatedDTO extends ReviewDTO {
  @Expose() @Type(() => UserSummaryDTO) ownerProfile!: UserSummaryDTO;

  @Expose() @Type(() => DepositDTO) depositPopulated!: DepositDTO;

  @Expose() @Type(() => CommunityDTO) communityPopulated!: CommunityDTO;
  /**
   * Number of comments associated with this publication
   */
  @Expose() socialComments!: number;
}
