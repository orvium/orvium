import { IsOptional, IsString } from 'class-validator';

export class CreateReviewDTO {
  /**
   *  the ID of deposit when you create a review
   * @example 5ca50abe835e09000186f88e
   */
  @IsString() deposit!: string;

  /**
   *  pass invitation ID when you create a review
   * @example 62ff56abbde4de30b2bb1286
   */
  @IsOptional() @IsString() invite?: string;
}
