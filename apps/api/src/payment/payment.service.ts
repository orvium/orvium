import { Injectable } from '@nestjs/common';
import { CommunitiesService } from '../communities/communities.service';
import { environment } from '../environments/environment';
import { assertIsDefined } from '../utils/utils';
import Stripe from 'stripe';
import { OrderDTO } from '../dtos/order.dto';

import { PaymentDTO } from '../dtos/payment/payment.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Payment, PaymentDocument } from './payment.schema';
import { AnyKeys, Model, SortOrder } from 'mongoose';
import {
  StripeWebhookHistory,
  StripeWebhookHistoryDocument,
} from './stripe-webhook-history.schema';
import { TransformerService } from '../transformer/transformer.service';
import { CommunityDocument } from '../communities/communities.schema';
import { StrictFilterQuery } from '../utils/types';
import { UserDocument } from '../users/user.schema';
import { UserService } from '../users/user.service';

/**
 * Service for handling PaymentService.
 */
@Injectable()
export class PaymentService {
  public readonly stripe: Stripe;

  /**
   * Constructs an instance of PaymentService with required services.
   *
   * @param {Model<Payment>} paymentModel - Model for payment operations.
   * @param {Model<StripeWebhookHistory>} stripeWebhookHistoryModel - Model for Stripe webhook history operations.
   * @param {TransformerService} transformerService - Service for data transformation.
   * @param {CommunitiesService} communityService - Service for managing communities.
   * @param {UserService} userService - Service for managing users.
   */
  constructor(
    @InjectModel(Payment.name)
    public paymentModel: Model<Payment>,
    @InjectModel(StripeWebhookHistory.name)
    public stripeWebhookHistoryModel: Model<StripeWebhookHistory>,
    private readonly transformerService: TransformerService,
    private readonly communityService: CommunitiesService,
    private readonly userService: UserService
  ) {
    assertIsDefined(environment.stripe.key, 'Stripe key not found!');
    this.stripe = new Stripe(environment.stripe.key, { apiVersion: '2022-11-15' });
  }

  /**
   * Adds a new payment to the database.
   *
   * @param {AnyKeys<Payment>} filter - The payment details to create.
   * @returns {Promise<PaymentDocument>} The created payment document.
   */
  async addPayment(filter: AnyKeys<Payment>): Promise<PaymentDocument> {
    return this.paymentModel.create(filter);
  }

  /**
   * Adds a record of a Stripe webhook event to the database.
   *
   * @param {AnyKeys<StripeWebhookHistory>} filter - The webhook event details to record.
   * @returns {Promise<StripeWebhookHistoryDocument>} The created webhook history document.
   */
  async addStripeWebhookHistory(
    filter: AnyKeys<StripeWebhookHistory>
  ): Promise<StripeWebhookHistoryDocument> {
    return this.stripeWebhookHistoryModel.create(filter);
  }

  /**
   * Finds payments based on a query and sorts them.
   *
   * @param {StrictFilterQuery<PaymentDocument>} filter - The filter criteria to use.
   * @param {string | Record<string, SortOrder>} sort - The sorting order of the results.
   * @returns {Promise<PaymentDocument[]>} An array of found payment documents.
   */
  async findPayment(
    filter: StrictFilterQuery<PaymentDocument>,
    sort: string | Record<string, SortOrder> = { createdAt: -1 }
  ): Promise<PaymentDocument[]> {
    return this.paymentModel.find(filter).sort(sort).exec();
  }

  /**
   * Finds payments based on a query and sorts them.
   *
   * @param {StrictFilterQuery<PaymentDocument>} filter - The filter criteria to use.
   * @param {string | Record<string, SortOrder>} sort - The sorting order of the results.
   * @returns {Promise<PaymentDocument[]>} An array of found payment documents.
   */
  async findPaymentWithPagination(
    filter: StrictFilterQuery<PaymentDocument>,
    sort: string | Record<string, SortOrder> = { createdAt: -1 },
    limit = 10,
    page = 0
  ): Promise<PaymentDocument[]> {
    return this.paymentModel
      .find(filter)
      .sort(sort)
      .skip(page * limit)
      .limit(limit)
      .exec();
  }

  /**
   * Creates a new Stripe account.
   *
   * @returns {Promise<Stripe.Response<Stripe.Account>>} The created Stripe account.
   */
  async createAccount(): Promise<Stripe.Response<Stripe.Account>> {
    return this.stripe.accounts.create({ type: 'standard' });
  }

  /**
   * Generates a link for onboarding or managing a connected Stripe account.
   *
   * @param {string} stripeId - The Stripe account ID.
   * @param {string} communityId - The community ID related to the Stripe account.
   * @param {string} origin - The base URL for the return and refresh URLs.
   * @returns {Promise<Stripe.Response<Stripe.AccountLink>>} The account link object.
   */
  async linkAccount(
    stripeId: string,
    communityId: string,
    origin: string
  ): Promise<Stripe.Response<Stripe.AccountLink>> {
    return this.stripe.accountLinks.create({
      type: 'account_onboarding',
      account: stripeId,
      refresh_url: `${origin}/communities/${communityId}/integrations`,
      return_url: `${origin}/communities/${communityId}/integrations`,
    });
  }

  /**
   * Creates a Stripe Checkout Session. A Checkout Session represents your customer's session as they pay for one-time purchases
   *
   * @param {OrderDTO} order The order that has been made in this Checkout Session
   * @param {string} userEmail The user email
   * @returns {Stripe.Checkout.Session} Returns the session, Stripe.Checkout.Session
   */
  async checkout(order: OrderDTO, userEmail: string): Promise<Stripe.Checkout.Session> {
    const community = await this.communityService.findById(order.communityId);
    assertIsDefined(community, 'Community not found');
    assertIsDefined(community.stripeAccount, 'Stripe is not correctly configured');
    const stripeCommunityProducts = await this.getCommunityProducts(community.stripeAccount.id);

    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    for (const product of order.products) {
      if (product.quantity > 0) {
        const found = stripeCommunityProducts.find(element => element.id === product.productId);

        if (found) {
          const stripePrices = found.default_price as Stripe.Price;
          assertIsDefined(stripePrices, 'Stripe product price is not defined');
          const line_item: Stripe.Checkout.SessionCreateParams.LineItem = {
            price_data: {
              currency: community.stripeAccount.defaultCurrency || 'eur',
              product_data: {
                name: found.name,
                description: found.description || 'none',
              },
              unit_amount: stripePrices.unit_amount || 0,
            },
            quantity: product.quantity,
          };
          line_items.push(line_item);
        }
      }
    }

    const session = (await this.stripe.checkout.sessions.create(
      {
        customer_email: userEmail,
        line_items: line_items,
        payment_method_types: ['card'],
        mode: 'payment',
        payment_intent_data: {
          application_fee_amount: 0,
        },
        success_url: environment.publicUrl.concat(
          `/communities/${order.communityId}/order-info/?session_id={CHECKOUT_SESSION_ID}`
        ),
        cancel_url: environment.publicUrl.concat(`/communities/${order.communityId}/view`),
      },
      { stripeAccount: community.stripeAccount.id }
    )) as Stripe.Checkout.Session;

    assertIsDefined(session, 'Checkout session undefined');
    return session;
  }

  /**
   * Creates a Stripe Event. Events are Stripe way of letting you know when something interesting happens in your account.
   * When an interesting event occurs, Stripe creates a new Event object.
   *
   * @param {Buffer} payload is the request body, Information on the API request that instigated the event.
   * @param {string} sig sig is the Stripe signature
   * @returns {Stripe.Event} Returns the event
   */
  createStripeEvent(payload: Buffer, sig: string): Stripe.Event {
    if (payload.includes('account')) {
      assertIsDefined(
        environment.stripe.webhookSecretConnect,
        'Missing Stripe Connect webhook secret!'
      );
      return this.stripe.webhooks.constructEvent(
        payload,
        sig,
        environment.stripe.webhookSecretConnect
      );
    }
    assertIsDefined(
      environment.stripe.webhookSecretDirect,
      'Missing Stripe Direct webhook secret!'
    );
    return this.stripe.webhooks.constructEvent(
      payload,
      sig,
      environment.stripe.webhookSecretDirect
    );
  }

  /**
   * AccountUpdated: Updates the Community data with the Stripe Account data
   *
   * @param {Stripe.Event} event
   * @returns {CommunityDocument} CommunityDocument: returns a CommunityDocument with the stripeAccount data updated
   */
  async handleAccountUpdated(event: Stripe.Event): Promise<CommunityDocument> {
    const account = event.data.object as Stripe.Account;
    assertIsDefined(account, 'Session not found');
    assertIsDefined(account.id, 'Session id is not defined');

    const community = await this.communityService.findOneByFilter({
      // @ts-expect-error
      'stripeAccount.id': account.id,
    });
    assertIsDefined(community, 'Community not found');
    assertIsDefined(community.stripeAccount, 'Stripe account is not defined');

    community.stripeAccount = {
      ...community.stripeAccount,
      active: account.details_submitted,
      defaultCurrency: account.default_currency,
    };

    return await community.save();
  }

  /**
   * Returns the Purchased Items if the purchase has been successful.
   *
   * @param {string} sessionId
   * @param {string} stripeAccount
   * @returns {Stripe.ApiListPromise<Stripe.LineItem>} returns the list of purchased items if the purchase has been successful.
   */
  async getPurchasedItems(
    sessionId: string,
    stripeAccount: string
  ): Promise<Stripe.ApiListPromise<Stripe.LineItem>> {
    return this.stripe.checkout.sessions.listLineItems(sessionId, { stripeAccount: stripeAccount });
  }

  /**
   * Handle the Checkout Session Completed event and calls the method updatePaymentHistory
   *
   * @param {Stripe.Event} event
   */
  async handleCheckoutSessionCompleted(event: Stripe.Event): Promise<void> {
    event.data.object as Stripe.Checkout.Session;
    await this.updatePaymentHistory(event); //orvium-ui payment view info
  }

  /**
   * A PaymentIntent contains a payment intent information from your customer.
   *
   * @param {Stripe.Event} event
   * @returns {Stripe.PaymentIntent | null} paymentIntent
   */
  async getPaymentIntent(event: Stripe.Event): Promise<Stripe.PaymentIntent | null> {
    const checkoutSessionCompleted = event.data.object as Stripe.Checkout.Session;
    let paymentIntent: Stripe.PaymentIntent | null = null;

    if (typeof checkoutSessionCompleted.payment_intent === 'string' && event.account) {
      paymentIntent = await this.stripe.paymentIntents.retrieve(
        checkoutSessionCompleted.payment_intent,
        {
          expand: ['latest_charge'],
        },
        { stripeAccount: event.account }
      );
    }
    return paymentIntent;
  }

  /**
   * Add information of a Payment in the Orvium database (here ir where the order data is stored).
   * When a user makes a purchase of products from a community, the payment details are added to the Orvium database.
   *
   * @param {Stripe.Checkout.Session} session the session contains a Checkout Session,represents the customer's session as they pay for one-time purchases.
   * @param {OrderDTO} order The order that has been made in this Checkout Session, it contains information about the products that have been purchased in the purchase
   */
  async addPaymentHistory(
    session: Stripe.Checkout.Session,
    order: OrderDTO,
    user: UserDocument
  ): Promise<void> {
    const sessionCheckout = session;
    assertIsDefined(sessionCheckout, 'Session Checkout not found');

    const community = await this.communityService.findById(order.communityId);
    assertIsDefined(community, 'Community not found');
    assertIsDefined(community.stripeAccount, 'Stripe not configured correctly');

    const query: AnyKeys<Payment> = {
      customerEmail: sessionCheckout.customer_email ?? '',
      userId: user._id,
      stripeAccount: community.stripeAccount.id,
      checkoutSessionId: sessionCheckout.id,
      eventName: sessionCheckout.object,
      eventId:
        typeof sessionCheckout.payment_intent === 'string'
          ? sessionCheckout.payment_intent.toString()
          : '',
      eventStatus: sessionCheckout.status ?? '',
      receiptUrl: '',
      amountTotal: sessionCheckout.amount_total ? sessionCheckout.amount_total / 100 : 0,
      currency: sessionCheckout.currency?.toString() ?? '',
      communityName: community.name,
      community: community._id,
      date: new Date(),
      order: order,
      eventContent: sessionCheckout,
    };

    const addedPaymentHistory = await this.addPayment(query);

    await this.transformerService.toDTO(addedPaymentHistory, PaymentDTO);
    return undefined;
  }

  /**
   * Update information of a Payment in the Orvium database (here is where the receiptUrl is stored).
   * When a user makes a purchase of products from a community, the payment details are added to the Orvium database.
   *
   * @param {Stripe.Event} event
   */
  async updatePaymentHistory(event: Stripe.Event): Promise<void> {
    const sessionCheckout = event.data.object as Stripe.Checkout.Session;
    let receipt_url: string | null = '';
    const openPayment = await this.paymentModel
      .findOne({ checkoutSessionId: sessionCheckout.id })
      .exec();
    assertIsDefined(openPayment, 'No open payment found');
    const user = await this.userService.findById(openPayment.userId);
    assertIsDefined(user, 'User not exists');

    const paymentIntent = await this.getPaymentIntent(event);
    if (paymentIntent) {
      const stripeCharge = paymentIntent.latest_charge as Stripe.Charge;
      receipt_url = stripeCharge.receipt_url;
    }

    assertIsDefined(event.account, 'Stripe Account Id not found');
    const community = await this.communityService.findOneByFilter({
      // @ts-expect-error
      'stripeAccount.id': event.account,
    });
    assertIsDefined(community, 'Community not found');
    assertIsDefined(community.stripeAccount, 'Stripe account is not defined');

    const query: AnyKeys<Payment> = {
      customerEmail: sessionCheckout.customer_email ?? '',
      userId: user._id,
      stripeAccount: event.account,
      checkoutSessionId: sessionCheckout.id,
      eventName: sessionCheckout.object,
      eventId: event.id,
      eventStatus: sessionCheckout.status ?? '',
      receiptUrl: receipt_url ?? '',
      amountTotal: sessionCheckout.amount_total ? sessionCheckout.amount_total / 100 : 0,
      currency: sessionCheckout.currency ? sessionCheckout.currency.toString() : '',
      communityName: community.name,
      community: community._id,
      date: new Date(),
      order: undefined,
      eventContent: event,
    };

    await this.addPayment(query);

    return undefined;
  }

  /**
   * List products created in Stripe for the specified community.
   * These products should have been created previous in the Stripe dashboard.
   *
   * @param {string} stripeAccount
   * @returns {StripeProduct[]} StripeProduct[]
   */
  async getCommunityProducts(stripeAccount: string): Promise<Stripe.Product[]> {
    const products = await this.stripe.products.list(
      {
        expand: ['data.default_price'], // Documentation: https://stripe.com/docs/expand
      },
      { stripeAccount: stripeAccount }
    );
    return products.data;
  }
}
