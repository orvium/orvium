import { Exclude, Expose } from 'class-transformer';
import { TransformObjectId } from '../../utils/expose-id.decorator';

@Exclude()
export class UserSummaryDTO {
  /**
   * User ID ObjectID
   * @example 5fa1908fd29a17dc961cc435
   */
  @TransformObjectId() @Expose() _id!: string;

  /**
   * User ID
   * @example 5fa1908fd29a17dc961cc435
   */
  @Expose() userId!: string;

  /**
   * User fist name
   * @example john
   */
  @Expose() firstName!: string;

  /**
   * User last name
   * @example doe
   */
  @Expose() lastName!: string;

  /**
   * User nickname
   * @example john-doe
   */
  @Expose() nickname!: string;

  /**
   * User gravatar md5 hash
   * @example 4d950dd20ef84d1ce7552c78c577ba00
   */
  @Expose() gravatar!: string;

  /**
   * Institutions of the user
   * @example [Orvium]
   */
  @Expose() institutions!: string[];

  /**
   * The url of the image put in the profile banner
   * @example https://s3.eu-central-1.amazonaws.com/public-files.example.com/profile/61f12bb224a817c22e70f108/media/banner.png
   */
  @Expose() bannerURL?: string;

  /**
   * The url of the image put in the profile avatar
   * @example https://s3.eu-central-1.amazonaws.com/public-files.example.com/profile/61f12bb224a817c22e70f108/media/avatar.png
   */
  @Expose() avatar?: string;
}
