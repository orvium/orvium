import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class InstitutionDTO {
  /**
   * Institution name
   * @example "Orvium"
   */
  @Expose() name!: string;

  /**
   * Institution domain
   * @example "orvium"
   */
  @Expose() domain!: string;

  /**
   * Institution country
   * @example "Spain"
   */
  @Expose() country?: string;

  /**
   * Institution city
   * @example "Vitoria"
   */
  @Expose() city?: string;

  /**
   * Another way of calling the institution
   * @example "Orvium Labs"
   */
  @Expose() synonym?: string;
}
