import { Exclude, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import Stripe from 'stripe';
import { StripePrice } from '../../payment/payment.controller';

@Exclude()
export class StripeProductDTO {
  @Expose() actions: string[] = [];

  @Expose()
  @ApiProperty({
    required: true,
    description:
      'Unique identifier for the object Product. Products describe the specific goods or services you offer to your customers.',
    example: 'prod_N4opFLi7XNPtQr',
  })
  id!: string;

  @Expose()
  @ApiProperty({
    required: true,
    description: 'String representing the objects type.',
    example: 'product',
  })
  object!: 'product';

  @Expose()
  @ApiProperty({
    required: false,
    description: 'Whether the product is currently available for purchase.',
    example: 'true',
  })
  active?: boolean;

  @Expose()
  @ApiProperty({
    required: false,
    nullable: true,
    description: 'The product attributes',
    example: 'null',
  })
  attributes?: string[];

  @Expose()
  @ApiProperty({
    required: false,
    nullable: true,
    description: 'The product caption',
    example: 'null',
  })
  caption?: string;

  @Expose()
  @ApiProperty({
    required: false,
    description: 'Time at which the object was created. Measured in seconds since the Unix epoch.',
    example: '1672393645',
  })
  created?: number;

  @Expose()
  @ApiProperty({
    required: false,
    nullable: true,
    description: 'The Price that is the default price for this product.',
    example: '',
  })
  default_price?: StripePrice;

  @Expose()
  @ApiProperty({
    required: false,
    nullable: true,
    description:
      'The product’s description, meant to be displayable to the customer. Use this field to optionally store a long form explanation of the product being sold for your own rendering purposes.',
    example: 'This is 2 days ticket for Physics Conference',
  })
  description?: string;

  @Expose()
  @ApiProperty({
    required: false,
    description:
      'A list of up to 8 URLs of images for this product, meant to be displayable to the customer.',
    example: [
      'https://files.stripe.com/links/MDB8YWNjdF8xTUsycktCTmNCUG92TnZRfGZsX3Rlc3RfeWV5cjUzRHlRNzZJSVloTzd1ZERHTVdU00YFbzgM7G',
    ],
  })
  images?: string[];

  @Expose()
  @ApiProperty({
    required: false,
    description:
      'Has the value true if the object exists in live mode or the value false if the object exists in test mode.',
    example: 'false',
  })
  livemode?: boolean;

  @Expose()
  @ApiProperty({
    required: false,
    description:
      'Set of key-value pairs that you can attach to an object. This can be useful for storing additional information about the object in a structured format.',
    example: '{}',
  })
  metadata?: Stripe.Metadata;

  @Expose()
  @ApiProperty({
    required: false,
    description: 'The product’s name, meant to be displayable to the customer.',
    example: '2 days ticket for Physics Conference',
  })
  name?: string;

  @Expose()
  @ApiProperty({
    required: false,
    nullable: true,
    description: 'The dimensions of this product for shipping purposes.',
    example: 'null',
  })
  package_dimensions?: Stripe.Product.PackageDimensions;

  @Expose()
  @ApiProperty({
    required: false,
    nullable: true,
    description: 'Whether this product is shipped (i.e., physical goods).',
    example: 'null',
  })
  shippable?: boolean;

  @Expose()
  @ApiProperty({
    required: false,
    nullable: true,
    description:
      'Extra information about a product which will appear on your customer’s credit card statement. In the case that multiple products are billed at once, the first statement descriptor will be used.',
    example: 'null',
  })
  statement_descriptor?: string;

  @Expose()
  @ApiProperty({
    required: false,
    description: 'Whether the product was a good or service.',
    example: 'good',
    type: 'string',
  })
  type?: Stripe.Product.Type;

  @Expose()
  @ApiProperty({
    required: false,
    nullable: true,
    description:
      'A label that represents units of this product. When set, this will be included in customers’ receipts, invoices, Checkout, and the customer portal.',
    example: 'null',
  })
  unit_label?: string;

  @Expose()
  @ApiProperty({
    required: false,
    description:
      'Time at which the object was last updated. Measured in seconds since the Unix epoch.',
    example: '1672393646',
  })
  updated?: number;

  @Expose()
  @ApiProperty({
    required: false,
    nullable: true,
    description: 'A URL of a publicly-accessible webpage for this product.',
    example: 'null',
  })
  url?: string;
}
