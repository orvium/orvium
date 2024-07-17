import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { IsNotBlankValidator } from '../../utils/isNotBlankValidator';

export class CreateDepositDTO {
  /**
   * Publication title
   * @example "My first publication"
   */
  @IsString()
  @IsNotBlankValidator({ message: 'Title should not be empty' })
  title!: string;

  /**
   * Community id where the publication is created
   * @example 5fa1908fd29a17dc961cc435
   */
  @IsNotEmpty() community!: string;

  /**
   * DOI of the publication
   * @example ""https://doi.org/10.0000/0000"
   */
  @IsOptional() @IsNotEmpty() doi?: string;
}
