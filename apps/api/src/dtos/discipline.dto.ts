import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class DisciplineDTO {
  /**
   * Discipline name
   * @example Architecture
   */
  @Expose() name!: string;

  /**
   * Discipline description
   * @example Architecture
   */
  @Expose() description?: string;
}
