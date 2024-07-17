import { Exclude, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CreditType } from '../deposit/deposit.schema';
import { TransformObjectId } from '../utils/expose-id.decorator';

@Exclude()
export class AuthorDTO {
  /**
   * Author ID
   * @example 5fa1908fd29a17dc961cc435
   */
  @Expose() userId?: string;

  @TransformObjectId() @Expose() userObjectId?: string;

  /**
   * Author first name
   * @example john
   */
  @Expose() firstName!: string;

  /**
   * Author last name
   * @example doe
   */
  @Expose() lastName!: string;

  /**
   * Author email
   * @example example@example.com
   */
  @Expose({ groups: ['owner', 'admin'] }) email?: string;

  /**
   * Author nickname
   * @example john-doe
   */
  @Expose() nickname?: string;

  /**
   * Author orcid
   * @example 0000-0001-5000-0007
   */
  @Expose() orcid?: string;

  /**
   * Author credit in the publicatuon
   * @example [conceptualization]
   */
  @ApiProperty({ enum: CreditType, enumName: 'CreditType' })
  @Expose()
  credit!: CreditType[];

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
   * Institutions of the author
   * @example [Orvium]
   */
  @Expose() institutions!: string[];
}
