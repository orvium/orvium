import { Exclude, Expose, Type } from 'class-transformer';
import { ReviewPopulatedDTO } from './review-populated.dto';

@Exclude()
export class ReviewsPopulatedQueryDTO {
  /**
   * the reviews query
   * @example
   */
  @Expose() @Type(() => ReviewPopulatedDTO) reviews!: ReviewPopulatedDTO[];

  /**
   * the reviews query count
   * @example 2
   */
  @Expose() count!: number;

  /**
   * the reviews query actions
   * @example [Update]
   */
  @Expose() actions?: string[];
}
