import { Exclude, Expose } from 'class-transformer';
import { UserType } from '../../users/user.schema';
import { TransformObjectId } from '../../utils/expose-id.decorator';
import { ApiProperty } from '@nestjs/swagger';

@Exclude()
export class UserPublicDTO {
  /**
   * User ID ObjectID
   * @example 5fa1908fd29a17dc961cc435
   */
  @TransformObjectId() @Expose() _id!: string;

  /**
   * User first name
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
   * Institutions of the user
   * @example [Orvium]
   */
  @Expose() institutions!: string[];

  /**
   * User orcid
   * @example 0000-0001-5000-0007
   */
  @Expose() orcid?: string;

  /**
   * User type
   * @example Medical
   */
  @ApiProperty({ enum: UserType, enumName: 'UserType' })
  @Expose()
  userType!: UserType;

  /**
   * User disciplines
   * @example Medical
   */
  @Expose() disciplines!: string[];

  /**
   * User description
   * @example Working in the tech department
   */
  @Expose() aboutMe?: string;

  /**
   * Blog url
   * @example https://myblog.com
   */
  @Expose() blog?: string;

  /**
   * User role in the platform
   * @example moderator
   */
  @Expose() role?: string;

  /**
   * User linkedin url
   * @example https://www.linkedin.com/in/john-doe
   */
  @Expose() linkedin?: string;

  /**
   * The url of the image put in the profile banner
   * @example https://s3.eu-central-1.amazonaws.com/public-files.example.com/profile/61f12bb224a817c22e70f108/media/banner.png
   */
  @Expose() bannerURL?: string;

  /**
   * Author gravatar md5 hash
   * @example 4d950dd20ef84d1ce7552c78c577ba00
   */
  @Expose() gravatar?: string;

  /**
   * The url of the image put in the profile avatar
   * @example https://s3.eu-central-1.amazonaws.com/public-files.example.com/profile/61f12bb224a817c22e70f108/media/avatar.png
   */
  @Expose() avatar?: string;

  /**
   * User actions
   * @example [Update]
   */
  @Expose() actions: string[] = [];
}
