import { ReviewDecision, ReviewKind, ReviewStatus } from '../../review/review.schema';
import { Exclude, Expose, Type } from 'class-transformer';
import { UserSummaryDTO } from '../user/user-summary.dto';
import { TransformObjectId } from '../../utils/expose-id.decorator';
import { ApiProperty } from '@nestjs/swagger';

@Exclude()
export class ReviewSummaryDTO {
  /**
   *  Review ID
   * @example 5ca50abe835e09000186f88e
   */
  @TransformObjectId() @Expose() _id!: string;

  /**
   *  Review creator ID
   * @example 5cafc10c1061680001ea4762
   */
  @TransformObjectId() @Expose() creator!: string;

  @Expose() @Type(() => UserSummaryDTO) ownerProfile!: UserSummaryDTO;

  /**
   *  Review status
   * @example draft
   */
  @ApiProperty({ enum: ReviewStatus, enumName: 'ReviewStatus' })
  @Expose()
  status!: ReviewStatus;

  /**
   *  Review kind
   * @example "peer review"
   */
  @ApiProperty({ enum: ReviewKind, enumName: 'ReviewKind' })
  @Expose()
  kind!: ReviewKind;

  /**
   * DOI of the review
   * @example ""https://doi.org/10.0000/0000"
   */
  @Expose() doi?: string;

  /**
   *  Review gravatar
   * @example 07de5cb10305a6e4c1844a14ac0b01a8
   */
  @Expose() gravatar?: string;

  /**
   * The url of the image put in the profile avatar
   * @example https://s3.eu-central-1.amazonaws.com/public-files.example.com/profile/61f12bb224a817c22e70f108/media/avatar.png
   */
  @Expose() avatar?: string;

  /**
   *  was invited for a review
   * @example false
   */
  @Expose() wasInvited?: boolean;

  /**
   *  The identity of the reviewer is shown to the author of the publication
   * @example true
   */
  @Expose() showIdentityToAuthor!: boolean;

  /**
   *  The identity of the reviewer is shown to the everyone
   * @example true
   */
  @Expose() showIdentityToEveryone!: boolean;

  /**
   *  Review decision
   * @example "accepted"
   */
  @ApiProperty({ enum: ReviewDecision, enumName: 'ReviewDecision' })
  @Expose()
  decision?: ReviewDecision;
}
