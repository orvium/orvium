import { IsString } from 'class-validator';
import { IsNotBlankValidator } from '../../utils/isNotBlankValidator';

export class CommunityCreateDto {
  /**
   * Community name
   * @example "Orvium Community"
   */
  @IsString()
  @IsNotBlankValidator({ message: 'Name should not be empty' })
  name!: string;

  /**
   * Community codename
   * @example orvium
   */
  @IsString()
  @IsNotBlankValidator({ message: 'Codename should not be empty' })
  codename!: string;
}
