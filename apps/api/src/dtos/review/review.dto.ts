import {
  HistoryLogLine,
  ReviewDecision,
  ReviewKind,
  ReviewStatus,
} from '../../review/review.schema';
import { Exclude, Expose, Type } from 'class-transformer';
import { FileMetadata } from '../filemetadata.dto';
import { TransformObjectId } from '../../utils/expose-id.decorator';
import { ApiProperty } from '@nestjs/swagger';
import { DoiStatus } from '../../doi/doi-log.schema';

@Exclude()
export class ReviewDTO {
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

  /**
   *  Review  author
   * @example "The author"
   */
  @Expose() author!: string;

  /**
   *  Review comments
   * @example "Some comments"
   */
  @Expose() comments?: string;

  /**
   *  Review decision
   * @example "accepted"
   */
  @ApiProperty({ enum: ReviewDecision, enumName: 'ReviewDecision' })
  @Expose()
  decision!: ReviewDecision;

  @Expose() file?: FileMetadata;

  /**
   * List of extra files metadata for this review. Extra files are optional.
   */
  @Expose() extraFiles!: FileMetadata[];

  /**
   *  Review transactions
   * @example
   */
  @ApiProperty({ type: 'object', required: false, additionalProperties: true })
  @Expose()
  transactions?: Record<string, unknown>;

  /**
   *  Review url
   * @example https://d23p029t55fvl2.cloudfront.net
   */
  @Expose() url?: string;

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
   *  Review reward
   * @example 0
   */
  @Expose() reward?: number;

  /**
   * DOI of the review
   * @example ""https://doi.org/10.0000/0000"
   */
  @Expose() doi?: string;

  /**
   * Status of the DOI
   * @example "Published"
   */
  @ApiProperty({ enum: DoiStatus, enumName: 'DoiStatus' })
  @Expose()
  doiStatus?: string;

  /**
   * the deposit of the review
   * @example
   */
  @TransformObjectId() @Expose() deposit!: string;

  /**
   * the community of the review
   * @example
   */
  @TransformObjectId() @Expose() community!: string;

  /**
   *  Review creation date
   * @example 2020-10-29T15:56:35.306+00:00
   */
  @Expose() creationDate!: string;

  /**
   *  Review publication date
   * @example "2020-10-29T15:56:35.306+00:00"
   */
  @Expose() publicationDate?: string;

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
   *  The identity of the reviewer is shown to everyone
   * @example true
   */
  @Expose() showIdentityToEveryone!: boolean;

  /**
   *  Keccak256 is a cryptographic function built into solidity. Can be used for cryptographic signature with a small size.
   * @example
   */
  @Expose() keccak256?: string;

  /**
   *  Review actions
   * @example [Update]
   */
  @Expose() actions: string[] = [];

  /**
   * Html extracted automatically for the main review file
   * @example "<p>This publication is about...</p>"
   */
  @Expose() html?: string;

  /**
   * List of images extracted automatically for the main review file
   * @example ["image1.png","image2.png"]
   */
  @Expose() images!: string[];

  /**
   * The url for the pdf of the review. This pdf might have been automatically generated.
   * @example "https://dapp.orvium.io/api/v1/reviews/63a09f6ce3d5ff0813586171/pdf"
   */
  @Expose() pdfUrl?: string;

  /**
   *  Review history
   * @example "{createAt:2020-10-29T15:56:35.306+00:00, username: iker2a4a34, description: this is history }"
   */
  @Expose({ groups: ['moderate'] })
  @Type(() => HistoryLogLine)
  history: HistoryLogLine[] = [];

  /**
   *  The review is shown to the author of the publication
   * @example true
   */
  @Expose() showReviewToAuthor!: boolean;

  /**
   *  The review is shown to everyone
   * @example true
   */
  @Expose() showReviewToEveryone!: boolean;

  /**
   * The number of views of the review
   * @example 1555
   */
  @Expose() views!: number;
}
