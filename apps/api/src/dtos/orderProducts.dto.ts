import { Exclude, Expose } from 'class-transformer';
import { IsNumber, IsString } from 'class-validator';

@Exclude()
export class OrderProductsDTO {
  /**
   * Product ID
   * @example 5fa1908fd29a17dc961cc435
   */
  @Expose() @IsString() productId!: string;

  /**
   * Product quantity ordered
   * @example 2
   */
  @Expose() @IsNumber() quantity!: number;
}
