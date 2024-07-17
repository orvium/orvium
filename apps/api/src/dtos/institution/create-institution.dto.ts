import { IsOptional, IsString } from 'class-validator';
import { IsNotBlankValidator } from '../../utils/isNotBlankValidator';

export class CreateInstitutionDTO {
  /**
   * Institution domain
   * @example "orvium"
   */
  @IsString()
  @IsNotBlankValidator({ message: 'Domain should not be empty' })
  domain!: string;

  /**
   * Institution name
   * @example "Orvium"
   */
  @IsString()
  @IsNotBlankValidator({ message: 'Name should not be empty' })
  name!: string;

  /**
   * Institution country
   * @example "Spain"
   */
  @IsOptional() @IsString() country?: string;

  /**
   * Institution city
   * @example "Vitoria"
   */
  @IsOptional() @IsString() city?: string;

  /**
   * Another way of calling the institution
   * @example "Orvium Labs"
   */
  @IsOptional() @IsString() synonym?: string;
}
