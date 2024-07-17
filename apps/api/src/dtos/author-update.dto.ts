import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { CreditType } from '../deposit/deposit.schema';

export class AuthorUpdateDTO {
  /**
   * Author first name
   * @example john
   */
  @IsString() firstName!: string;

  /**
   * Author email
   * @example example@example.com
   */
  @IsOptional() @IsString() email?: string;

  /**
   * Author last name
   * @example doe
   */
  @IsString() lastName!: string;

  /**
   * Author nickname
   * @example john-doe
   */
  @IsOptional() @IsString() nickname?: string;

  /**
   * Author orcid
   * @example 0000-0001-5000-0007
   */
  @IsOptional() @IsString() orcid?: string;

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
  @IsOptional() @IsString() gravatar?: string;

  /**
   * The url of the image put in the profile avatar
   * @example https://s3.eu-central-1.amazonaws.com/public-files.example.com/profile/61f12bb224a817c22e70f108/media/avatar.png
   */
  @IsOptional() @IsString() avatar?: string;

  /**
   * Institutions of the author
   * @example [Orvium]
   */
  @IsString() institutions!: string[];
}
