import { IsBoolean, IsDate, IsNumber, IsOptional, IsString } from 'class-validator';
import { IsNotBlankValidator } from '../../utils/isNotBlankValidator';
import { ReviewDecision } from '../../review/review.schema';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class UpdateReviewDTO {
  /**
   *  Review  author
   * @example "The author"
   */
  @IsOptional()
  @IsString()
  @IsNotBlankValidator({ message: 'Author should not be empty' })
  author?: string;

  /**
   *  Review comments
   * @example "Some comments"
   */
  @IsOptional() @IsString() comments?: string;

  /**
   *  Review reward
   * @example 0
   */
  @IsOptional() @IsNumber() reward?: number;

  /**
   *  Review decision
   * @example "accepted"
   */
  @ApiProperty({ enum: ReviewDecision, enumName: 'ReviewDecision' })
  @IsOptional()
  @IsString()
  decision?: ReviewDecision;

  /**
   * DOI of the review
   * @example ""https://doi.org/10.0000/0000"
   */
  @IsOptional() @IsString() doi?: string;

  /**
   *  Review transactions
   * @example
   */
  @ApiProperty({ type: 'object', required: false, additionalProperties: true })
  @IsOptional()
  transactions?: unknown;

  /**
   *  Review publication date
   * @example "2020-10-29T15:56:35.306+00:00"
   */
  @IsOptional() @IsDate() publicationDate?: Date;

  /**
   *  was invited for a review
   * @example false
   */
  @IsOptional() @IsBoolean() wasInvited?: boolean;

  /**
   * Html extracted automatically for the main review file
   * @example "<p>This publication is about...</p>"
   */
  @IsOptional() @Expose() html?: string;

  /**
   *  Keccak256 is a cryptographic function built into solidity. Can be used for cryptographic signature with a small size.
   * @example
   */
  @IsOptional() @IsString() keccak256?: string;

  /**
   * Reason to accept a review
   * @example "The content is very interesting"
   */
  @IsOptional() @IsString() reason?: string;

  /**
   *  The review is shown to the author of the publication
   * @example true
   */
  @IsOptional() @IsBoolean() showReviewToAuthor?: boolean;

  /**
   *  The review is shown to everyone
   * @example true
   */
  @IsOptional() @IsBoolean() showReviewToEveryone?: boolean;
  /**
   *  The identity of the reviewer is shown to the author of the publication
   * @example true
   */
  @IsOptional() @IsBoolean() showIdentityToAuthor?: boolean;

  /**
   *  The identity of the reviewer is shown to everyone
   * @example true
   */
  @IsOptional() @IsBoolean() showIdentityToEveryone?: boolean;
}
