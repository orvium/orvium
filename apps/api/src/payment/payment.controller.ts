import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { assertIsDefined } from '../utils/utils';
import { environment } from '../environments/environment';
import { CommunitiesService } from '../communities/communities.service';
import { PaymentService } from './payment.service';
import { OrderDTO } from '../dtos/order.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequestWithRawBody } from '../utils/rawBody.middleware';
import { AuthorizationService, COMMUNITY_ACTIONS } from '../authorization/authorization.service';
import { UserService } from '../users/user.service';
import {
  ApiBearerAuth,
  ApiExcludeEndpoint,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import { IsString } from 'class-validator';
import Stripe from 'stripe';
import { TransformerService } from '../transformer/transformer.service';
import { StripeWebhookHistory } from './stripe-webhook-history.schema';
import { StripeWebhookHistoryDTO } from '../dtos/payment/stripe-wehbook-history.dto';
import { StripeCheckoutDTO } from '../dtos/payment/stripe-checkout.dto';
import { StripeProductDTO } from '../dtos/payment/stripe-product.dto';
import { AnyKeys } from 'mongoose';
import { CheckoutSessionPaymentsDto } from '../dtos/payment/checkout-session-payments.dto';
import { PaymentDocument } from './payment.schema';
import { StrictFilterQuery } from '../utils/types';
import { PaymentQueryDTO } from '../dtos/payment/payment-query.dto';
import { CommunityPaymentsQueryDTO } from '../dtos/community/community-payments-query.dto';

export class StripeOnboardingUrl {
  @ApiProperty() url!: string;
}

export class StripeOnboardPayload {
  @ApiProperty() @IsString() communityId!: string;
}

export class StripeWebhookResponse {
  @ApiProperty() received!: boolean;
}

export class StripeLineItem {
  @ApiProperty({
    description:
      'Unique identifier for the object Stripe LineItem. LineItem is A list of items the customer is being quoted for.',
    example: 'li_1MOiBfBNcBPovNvQWMAQkH59',
  })
  id!: string;
  @ApiProperty({
    description: 'String representing the objects type.',
    example: 'item',
  })
  object!: 'item';
  @ApiProperty({
    description: 'Total discount amount applied. If no discounts were applied, defaults to 0.',
    example: '0',
  })
  amount_discount!: number;
  @ApiProperty({
    description: 'Total before any discounts or taxes are applied.',
    example: '0',
  })
  amount_subtotal!: number;
  @ApiProperty({
    description: 'Total tax amount applied. If no tax was applied, defaults to 0.',
    example: '0',
  })
  amount_tax!: number;
  @ApiProperty({
    description: 'Total after discounts and taxes.',
    example: '10',
  })
  amount_total!: number;
  @ApiProperty({
    description:
      'It is the currency in which payments can be made in that community. Must be a supported currency.',
    example: 'eur',
  })
  currency!: string;
  @ApiProperty({
    description:
      'A string attached to the object. Often useful for displaying to users. Defaults to product name.',
    example: '2 days ticket for Physics Conference',
  })
  description!: string;
  @ApiProperty({
    description:
      'The discounts applied to the line item. This field is not included by default. To include it in the response, expand the discounts field.',
    example: '[]',
  })
  discounts?: Stripe.LineItem.Discount[];
  @ApiProperty({
    description: 'The price used to generate the line item.',
    example: '10',
  })
  price!: Stripe.Price | null;
  @ApiProperty({
    description: 'Products describe the specific goods or services you offer to your customers.',
    example: '',
  })
  product?: string | StripeProductDTO | Stripe.DeletedProduct;
  @ApiProperty({
    description: 'The quantity of products being purchased.',
    example: '1',
  })
  quantity!: number | null;
  @ApiProperty({
    description: 'The taxes applied to the line item. This field is not included by default.',
    example: '0',
  })
  taxes?: Stripe.LineItem.Tax[];
}

export class StripePrice {
  @ApiProperty({
    required: true,
    description:
      'Unique identifier for the object Price. Prices define the unit cost, currency, and (optional) billing cycle for both recurring and one-time purchases of products.',
    example: 'price_1MOiTKBNcBPovNvQbRuljPTm',
  })
  id!: string;
  @ApiProperty({
    required: true,
    description: 'String representing the objects type.',
    example: 'price',
  })
  object!: 'price';
  @ApiProperty({
    required: false,
    description: 'Whether the price can be used for new purchases.',
    example: 'true',
  })
  active?: boolean;
  @ApiProperty({
    required: false,
    description: 'Describes how to compute the price per period. Either per_unit or tiered.',
    example: 'per_unit',
  })
  billing_scheme?: Stripe.Price.BillingScheme;
  @ApiProperty({
    required: false,
    description: 'Time at which the object was created. Measured in seconds since the Unix epoch.',
    example: '1673359598',
  })
  created?: number;
  @ApiProperty({
    required: true,
    description:
      'It is the currency in which payments can be made in that community. Must be a supported currency.',
    example: 'eur',
  })
  currency!: string;
  @ApiProperty({
    required: false,
    nullable: true,
    description:
      'When set, provides configuration for the amount to be adjusted by the customer during Checkout Sessions and Payment Links.',
    example: 'null',
  })
  custom_unit_amount?: Stripe.Price.CustomUnitAmount;
  @ApiProperty({
    required: false,
    description:
      'Has the value true if the object exists in live mode or the value false if the object exists in test mode.',
    example: 'false',
  })
  livemode?: boolean;
  @ApiProperty({
    required: false,
    description:
      'Set of key-value pairs that you can attach to an object. This can be useful for storing additional information about the object in a structured format. ',
    example: '{}',
  })
  metadata?: Stripe.Metadata;
  @ApiProperty({
    required: false,
    nullable: true,
    description: 'A brief description of the price, hidden from customers.',
    example: 'null',
  })
  nickname?: string;
  @ApiProperty({
    required: false,
    nullable: true,
    description: 'The recurring components of a price such as interval and usage_type.',
    example: '{}',
  })
  recurring?: Stripe.Price.Recurring;
  @ApiProperty({
    required: false,
    nullable: true,
    description:
      'Specifies whether the price is considered inclusive of taxes or exclusive of taxes. One of inclusive, exclusive, or unspecified. Once specified as either inclusive or exclusive, it cannot be changed.',
    example: 'unspecified',
  })
  tax_behavior?: Stripe.Price.TaxBehavior;
  @ApiProperty({
    required: false,
    description:
      'One of one_time or recurring depending on whether the price is for a one-time purchase or a recurring (subscription) purchase.',
    example: 'one_time',
  })
  type?: Stripe.Price.Type;
  @ApiProperty({
    required: true,
    nullable: false,
    description:
      'A positive integer in cents (or 0 for a free price) representing how much to charge. One of unit_amount or custom_unit_amount is required, unless billing_scheme=tiered.',
    example: '2000',
  })
  unit_amount!: number; // Filter Free Payments --> Stripe API Doc [REQUIRED CONDITIONALLY]: unit_amount?: number | null;
  @ApiProperty({
    required: true,
    nullable: false,
    description:
      'Same as unit_amount, but accepts a decimal value in cents with at most 12 decimal places. Only one of unit_amount and unit_amount_decimal can be set.',
    example: '2000',
  })
  unit_amount_decimal!: string; // Filter Free Payments --> [REQUIRED CONDITIONALLY]: unit_amount?: string | null;
}

@ApiTags('payment')
@Controller('payment')
export class PaymentController {
  constructor(
    private readonly authorizationService: AuthorizationService,
    private readonly userService: UserService,
    private readonly paymentService: PaymentService,
    private readonly transformerService: TransformerService,
    private readonly communitiesService: CommunitiesService
  ) {
    assertIsDefined(environment.stripe.key, 'Stripe key not found!');
  }

  /**
   * Setups the Stripe account for the specified community
   * @param req
   * @param payload
   */
  @ApiOperation({ summary: 'Setup Stripe account' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('onboard')
  async onboard(
    @Req() req: Request,
    @Body() payload: StripeOnboardPayload
  ): Promise<StripeOnboardingUrl> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');

    const community = await this.communitiesService.findById(payload.communityId);
    assertIsDefined(community, 'Community not found');
    const ability = await this.authorizationService.defineAbilityFor(user);
    this.authorizationService.canDo(ability, COMMUNITY_ACTIONS.moderate, community);

    // Create account
    if (!community.stripeAccount) {
      const account = await this.paymentService.createAccount();
      community.stripeAccount = {
        id: account.id,
        active: false,
        defaultCurrency: account.default_currency,
      };
      await community.save();
    }

    // Link account
    const accountLink = await this.paymentService.linkAccount(
      community.stripeAccount.id,
      community._id.toHexString(),
      req.headers.origin || environment.publicUrl
    );
    return { url: accountLink.url };
  }

  /**
   * Creates a Stripe Checkout Session. A Checkout Session represents your customer's session as they pay for one-time purchases.
   * @param req
   * @param payload
   */
  @ApiOperation({ summary: 'Create checkout' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('checkout')
  async checkout(@Req() req: Request, @Body() payload: OrderDTO): Promise<StripeCheckoutDTO> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(
      user?.email,
      'Please, complete the onboarding process before purchasing any item.'
    );

    const checkout = await this.paymentService.checkout(payload, user.email);

    await this.paymentService.addPaymentHistory(checkout, payload, user);
    return this.transformerService.toDTO(checkout, StripeCheckoutDTO);
  }

  /**
   * Webhooks notified about events that happen in your Stripe account or connected accounts.
   * @param {request} request the request
   * @returns {StripeWebhookResponse} StripeWebhookResponse
   */
  @ApiExcludeEndpoint()
  @Post('stripe-webhook')
  async webhook(@Req() request: RequestWithRawBody): Promise<StripeWebhookResponse> {
    const payload = request.rawBody;
    const sig = request.headers['stripe-signature']?.toString();
    assertIsDefined(payload, 'Missing Stripe payload!');
    assertIsDefined(sig, 'Missing Stripe signature header!');

    try {
      const event = this.paymentService.createStripeEvent(payload, sig);
      console.log('webhook', event);
      await this.addStripeWebhookHistory(event);
      switch (event.type) {
        case 'account.updated':
          await this.paymentService.handleAccountUpdated(event);
          break;
        case 'checkout.session.completed':
          await this.paymentService.handleCheckoutSessionCompleted(event);
          break;
      }
      return { received: true };
    } catch (err) {
      console.log(err);
      throw new ForbiddenException('Webhook Error');
    }
  }

  /**
   * Add Stripe Webhook History: Add the Stripe event data that is passed by parameter to the database
   * @param {event} event
   */
  async addStripeWebhookHistory(event: Stripe.Event): Promise<void> {
    const query: AnyKeys<StripeWebhookHistory> = {
      event: [event],
    };
    const addedStripeWebhookHistory = await this.paymentService.addStripeWebhookHistory(query);
    await this.transformerService.toDTO(addedStripeWebhookHistory, StripeWebhookHistoryDTO);
    return undefined;
  }

  /**
   * Retrieves the details of the purchase if it has been successful.
   * @param sessionId
   * @param communityId
   */
  @ApiOperation({ summary: 'Retrieve successful checkout' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('success')
  async getSuccessInfo(
    @Query('sessionId') sessionId: string,
    @Query('communityId') communityId: string
  ): Promise<StripeLineItem[]> {
    const community = await this.communitiesService.findById(communityId);
    assertIsDefined(community, 'Community not found');
    assertIsDefined(community.stripeAccount, 'Stripe not configured correctly');
    const lineItems = await this.paymentService.getPurchasedItems(
      sessionId,
      community.stripeAccount.id
    );
    return lineItems.data;
  }

  /**
   * List products created in Stripe for the specified community. These products should have been created previous in the Stripe dashboard.
   * @param communityId
   * @returns {StripeProductDTO[]} StripeProductDTO[]
   */
  @ApiOperation({ summary: 'List products' })
  @Get('stripeProducts')
  async getStripeProducts(@Query('communityId') communityId: string): Promise<StripeProductDTO[]> {
    const community = await this.communitiesService.findById(communityId);
    assertIsDefined(community, 'Community not found');
    assertIsDefined(community.stripeAccount, 'Stripe not configured correctly');
    const products = await this.paymentService.getCommunityProducts(community.stripeAccount.id);
    assertIsDefined(products, 'Products not found');

    // Filter Free Payments --> Stripe API Doc [REQUIRED CONDITIONALLY];
    const productsWithPrice = products.filter(
      product => (product.default_price as Stripe.Price).unit_amount !== 0
    );
    assertIsDefined(productsWithPrice, 'ProductsWithPrice not found');
    return this.transformerService.toDTO(productsWithPrice, StripeProductDTO);
  }

  /**
   * List a user payments in Orvium.
   * @param req
   * @returns {PaymentDTO[]} PaymentDTO[]
   */
  @UseGuards(JwtAuthGuard)
  @Get('myPayments')
  async getUserPayments(@Req() req: Request): Promise<CheckoutSessionPaymentsDto[]> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');

    const payments: { _id: string; payments: PaymentDocument[] }[] =
      await this.paymentService.paymentModel
        .aggregate([
          {
            $match: {
              customerEmail: user.email,
            },
          },
          {
            $group: {
              _id: '$checkoutSessionId',
              payments: { $push: '$$ROOT' },
            },
          },
        ])
        .exec();

    return await this.transformerService.toDTO(payments, CheckoutSessionPaymentsDto);
  }

  /**
   * List a Community payments in Orvium.
   * @param req
   * @param communityId
   * @returns {PaymentDTO[]} PaymentDTO[]
   */
  @UseGuards(JwtAuthGuard)
  @Get(':communityId([0-9a-f]{24})')
  async getCommunityPayments(
    @Req() req: Request,
    @Param('communityId') communityId: string,
    @Query()
    { query, paymentStatus, page = 0, limit = 10 }: CommunityPaymentsQueryDTO
  ): Promise<PaymentQueryDTO> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');

    const community = await this.communitiesService.findById(communityId);
    assertIsDefined(community, 'Community not found');
    const ability = await this.authorizationService.defineAbilityFor(user);
    this.authorizationService.canDo(ability, COMMUNITY_ACTIONS.update, community);
    const filter: StrictFilterQuery<PaymentDocument> = { community: communityId };

    if (query) {
      filter.$text = { $search: query };
    }

    if (paymentStatus) {
      filter.eventStatus = { $eq: paymentStatus };
    }

    const payments = await this.paymentService.findPaymentWithPagination(
      filter,
      undefined,
      limit,
      page
    );
    const count = await this.paymentService.paymentModel.countDocuments(filter);

    return this.transformerService.toDTO({ payments, count }, PaymentQueryDTO);
  }
}
