import { Exclude, Expose } from 'class-transformer';
import { TransformObjectId } from '../utils/expose-id.decorator';

@Exclude()
export class InvitationDataDTO {
  /**
   * Publication ID
   * @example "617298619ff9664a706ca6fb"
   */
  @TransformObjectId() @Expose() depositId!: string;

  /**
   * Publication title
   * @example "My first publication"
   */
  @Expose() depositTitle!: string;

  /**
   *  Review ID
   * @example 5ca50abe835e09000186f88e
   */
  @TransformObjectId() @Expose() reviewId?: string;
}
