import { Exclude, Expose, Type } from 'class-transformer';
import { CommunityDTO } from '../community/community.dto';
import { DepositDTO } from './deposit.dto';
import { UserSummaryDTO } from '../user/user-summary.dto';
import { ReviewSummaryDTO } from '../review/review-summary.dto';
import { Track } from '../../communities/communities.schema';

@Exclude()
export class DepositPopulatedDTO extends DepositDTO {
  @Expose() @Type(() => UserSummaryDTO) ownerProfile!: UserSummaryDTO;

  /**
   * List of peer reviews objects associated with this publication
   */
  @Expose()
  @Type(() => ReviewSummaryDTO)
  peerReviewsPopulated!: ReviewSummaryDTO[];

  @Expose() @Type(() => CommunityDTO) communityPopulated!: CommunityDTO;

  /**
   * Number of comments associated with this publication
   */
  @Expose() socialComments!: number;

  @Expose()
  get track(): Track | undefined {
    return this.communityPopulated.newTracks.find(
      (track: { timestamp: number }) => track.timestamp === this.newTrackTimestamp
    );
  }
}
