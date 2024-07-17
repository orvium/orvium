import { IsNotEmpty } from 'class-validator';

export class CreateDepositWithDoiDTO {
  /**
   * Community where the publication is created
   * @example 5fa1908fd29a17dc961cc435
   */
  @IsNotEmpty() community!: string;

  /**
   * DOI of the publication
   * @example "https://doi.org/10.0000/0000"
   */
  @IsNotEmpty() doi!: string;
}
