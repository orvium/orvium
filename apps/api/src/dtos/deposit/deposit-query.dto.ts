import { Exclude, Expose, Type } from 'class-transformer';
import { DepositPopulatedDTO } from './deposit-populated.dto';

@Exclude()
export class DepositsQueryDTO {
  /**
   * An array of publications received by the query
   */
  @Expose() @Type(() => DepositPopulatedDTO) deposits!: DepositPopulatedDTO[];

  /**
   * Number of publications received by the query
   * @example 2
   */
  @Expose() count!: number;

  /**
   * An array of actions
   * @example [Update]
   */
  @Expose() actions?: string[];
}
