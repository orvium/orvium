import { Exclude, Expose, Type } from 'class-transformer';
import { IsString, ValidateNested } from 'class-validator';
import { OrderProductsDTO } from './orderProducts.dto';

@Exclude()
export class OrderDTO {
  /**
   * The ID of the community where the order has been made
   * @example 5fa1908fd29a17dc961cc435
   */
  @Expose() @IsString() communityId!: string;

  /**
   * An array of ordered products
   * @example [product1, product2]
   */
  @Expose() @ValidateNested() @Type(() => OrderProductsDTO) products!: OrderProductsDTO[];
}
