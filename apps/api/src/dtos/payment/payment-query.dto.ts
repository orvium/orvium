import { Exclude, Expose, Type } from 'class-transformer';
import { PaymentDTO } from './payment.dto';

@Exclude()
export class PaymentQueryDTO {
  /**
   * An array of payments received by the query
   */
  @Expose() @Type(() => PaymentDTO) payments!: PaymentDTO[];

  /**
   * Number of payments received by the query
   * @example 2
   */
  @Expose() count!: number;

  /**
   * An array of actions
   * @example [Update]
   */
  @Expose() actions?: string[];
}
