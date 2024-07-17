import { IsDefined } from 'class-validator';
import { TransformObjectId } from '../utils/expose-id.decorator';

export class TopDisciplinesDTO {
  /**
   * Discipline ID
   * @example 5fa1908fd29a17dc961cc435
   */
  @TransformObjectId() @IsDefined() _id!: string;

  /**
   * Position of the discipline in the popular disciplines ranking
   * @example 3
   */
  @IsDefined() count!: number;
}
