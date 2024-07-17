import { Exclude, Expose, Type } from 'class-transformer';
import { PaymentDTO } from './payment.dto';

@Exclude()
export class CheckoutSessionPaymentsDto {
  @Expose()
  _id!: string;

  @Expose()
  @Type(() => PaymentDTO)
  payments!: PaymentDTO[];
}
