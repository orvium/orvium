import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from './payment.service';
import { environment } from '../environments/environment';
import {
  createCommunity,
  createPayment,
  createUser,
  factoryStripeCheckoutSession,
  factoryStripeEvent,
  factoryStripePaymentIntent,
  factoryStripePrice,
  factoryStripeProduct,
  factoryStripeWebhookHistory,
} from '../utils/test-data';
import Stripe from 'stripe';
import { cleanCollections, MongooseTestingModule } from '../utils/mongoose-testing.module';
import { assertIsDefined } from '../utils/utils';

jest.mock('stripe', () => {
  return jest.fn(() => ({
    accounts: {
      create: jest.fn(),
    },
    accountLinks: {
      create: jest.fn(),
    },
    checkout: {
      sessions: {
        create: jest.fn(),
        listLineItems: jest.fn(),
      },
    },
    paymentIntents: {
      retrieve: jest.fn(),
    },
    products: {
      list: jest.fn(),
    },
  }));
});

describe('PaymentService', () => {
  let service: PaymentService;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [MongooseTestingModule.forRoot('PaymentService')],
      providers: [],
    }).compile();
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    service = module.get(PaymentService);
    await cleanCollections(module);
    await service.stripeWebhookHistoryModel.create(factoryStripeWebhookHistory.build());
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create stripe account', async () => {
    jest
      .spyOn(service.stripe.accounts, 'create')
      .mockResolvedValue({} as unknown as Stripe.Response<Stripe.Account>);

    const result = await service.createAccount();
    expect(result).toBeDefined();
  });

  it('should link stripe account', async () => {
    jest
      .spyOn(service.stripe.accountLinks, 'create')
      .mockResolvedValue({} as unknown as Stripe.Response<Stripe.AccountLink>);

    const result = await service.linkAccount('acct_xxxxxxxxxxxxxxxxxx', '1', 'https://example.com');
    expect(result).toBeDefined();
  });

  it('should create a checkout session', async () => {
    const communityProducts = [
      factoryStripeProduct.build(),
      factoryStripeProduct.build({
        id: 'prod_xxxxxxxxxxxxxxxx',
        default_price: factoryStripePrice.build({
          id: 'price_xxxxxxxxxxxxxxxx',
          product: 'prod_xxxxxxxxxxxxxxxx',
          nickname: 'Precio ticket VIP',
          unit_amount: 19999,
          unit_amount_decimal: '19999',
        }),
        description: 'El ticket VIP es mucho mejor',
        name: 'Ticket VIP',
      }),
      factoryStripeProduct.build({
        id: 'prod_xxxxxxxxxxxxxxxx',
        default_price: factoryStripePrice.build({
          id: 'price_xxxxxxxxxxxxxxxx',
          product: 'prod_xxxxxxxxxxxxxxxx',
          nickname: 'Precio cena',
          unit_amount: undefined,
          unit_amount_decimal: '10000',
        }),
        description: undefined,
        name: 'Cena de la conferencia',
      }),
    ];

    const { community } = await createCommunity(module, {
      community: {
        stripeAccount: {
          id: 'acct_xxxxxxxxxxxxxxxxxx',
          active: true,
          defaultCurrency: 'eur', // TODO delete
        },
      },
    });

    const spy = jest.spyOn(service.stripe.checkout.sessions, 'create').mockResolvedValue({
      url: 'https://localhost/checkouturl',
    } as unknown as Stripe.Response<Stripe.Checkout.Session>);

    jest
      .spyOn(service.stripe.products, 'list')
      // @ts-expect-error
      .mockResolvedValue({ data: communityProducts });

    const stripeCheckout = await service.checkout(
      {
        communityId: community._id.toHexString(),
        products: [
          {
            productId: communityProducts[0].id,
            quantity: 1,
          },
          {
            productId: communityProducts[2].id,
            quantity: 1,
          },
        ],
      },
      'user@example.com'
    );
    expect(stripeCheckout).toEqual({ url: 'https://localhost/checkouturl' });
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        customer_email: 'user@example.com',
        line_items: [
          {
            price_data: {
              currency: 'eur',
              product_data: {
                description: communityProducts[0].description,
                name: communityProducts[0].name,
              },
              unit_amount: (communityProducts[0].default_price as Stripe.Price).unit_amount,
            },
            quantity: 1,
          },
          {
            price_data: {
              currency: 'eur',
              product_data: {
                description: 'none',
                name: communityProducts[2].name,
              },
              unit_amount: 0,
            },
            quantity: 1,
          },
        ],
        payment_method_types: ['card'],
        mode: 'payment',
        payment_intent_data: {
          application_fee_amount: 0,
        },
        success_url: environment.publicUrl.concat(
          `/communities/${community._id.toHexString()}/order-info/?session_id={CHECKOUT_SESSION_ID}`
        ),
        cancel_url: environment.publicUrl.concat(
          `/communities/${community._id.toHexString()}/view`
        ),
      }),
      { stripeAccount: 'acct_xxxxxxxxxxxxxxxxxx' }
    );
  });

  it('should return a PaymentIntent object', async () => {
    const eventMock: Stripe.Event = {
      id: 'evt_xxxxxxxxxxxxxxxx',
      account: 'acct_xxxxxxxxxxxxxxxxxx',
      api_version: '1',
      created: 0,
      data: {
        object: {
          id: 'pi_xxxxxxxxxxxxxxxxxxxx',
        },
      },
      livemode: false,
      object: 'event',
      pending_webhooks: 0,
      request: null,
      type: 'payment_intent.created',
    };
    const paymentIntent = await service.getPaymentIntent(eventMock);
    expect(paymentIntent).toBeDefined();
  });

  it('should get payment intents retrieve paymentIntent', async () => {
    const user = await createUser(module);
    const checkOutSession = factoryStripeCheckoutSession.build({});
    await createPayment(module, {
      payment: { userId: user._id, eventStatus: 'open', checkoutSessionId: checkOutSession.id },
    });

    await createCommunity(module, {
      community: {
        stripeAccount: {
          id: 'acct_xxxxxxxxxxxxxxxxxx',
          active: true,
          defaultCurrency: 'eur', // TODO delete
        },
      },
    });

    const eventMock: Stripe.Event = {
      id: 'evt_xxxxxxxxxxxxxxxx',
      account: 'acct_xxxxxxxxxxxxxxxxxx',
      api_version: '1',
      created: 0,
      data: {
        object: checkOutSession,
      },
      livemode: false,
      object: 'event',
      pending_webhooks: 0,
      request: null,
      type: 'payment_intent.created',
    };

    const mockPaymentIntent = factoryStripePaymentIntent.build();

    const spy = jest
      .spyOn(service.stripe.paymentIntents, 'retrieve')
      .mockResolvedValue(
        mockPaymentIntent as unknown as Stripe.Response<Stripe.PaymentIntent | null>
      );

    const paymentIntent = await service.getPaymentIntent(eventMock);

    expect(paymentIntent).toEqual(mockPaymentIntent);

    expect(spy).toHaveBeenCalledWith(
      // @ts-expect-error
      eventMock.data.object.payment_intent,
      {
        expand: ['latest_charge'],
      },
      { stripeAccount: eventMock.account }
    );

    await service.updatePaymentHistory(eventMock);
  });

  it('should updatePaymentHistory with default values', async () => {
    const user = await createUser(module);

    const checkOutSession = factoryStripeCheckoutSession.build({
      customer_email: null,
      status: null,
      amount_total: null,
      currency: null,
    });

    await createPayment(module, {
      payment: { userId: user._id, eventStatus: 'open', checkoutSessionId: checkOutSession.id },
    });

    await createCommunity(module, {
      community: {
        stripeAccount: {
          id: 'acct_xxxxxxxxxxxxxxxxxx',
          active: true,
          defaultCurrency: 'eur', // TODO delete
        },
      },
    });

    const mockPaymentIntent = factoryStripePaymentIntent.build();
    jest
      .spyOn(service.stripe.paymentIntents, 'retrieve')
      .mockResolvedValue(
        mockPaymentIntent as unknown as Stripe.Response<Stripe.PaymentIntent | null>
      );

    const eventMock: Stripe.Event = {
      id: 'evt_xxxxxxxxxxxxxxxx',
      account: 'acct_xxxxxxxxxxxxxxxxxx',
      api_version: '1',
      created: 0,
      data: {
        object: checkOutSession,
      },
      livemode: false,
      object: 'event',
      pending_webhooks: 0,
      request: null,
      type: 'payment_intent.created',
    };

    await service.updatePaymentHistory(eventMock);
  });

  it('should handle account updated', async () => {
    await createCommunity(module, {
      community: {
        stripeAccount: {
          id: 'acct_xxxxxxxxxxxxxxxxxx',
          active: true,
          defaultCurrency: 'eur', // TODO delete
        },
      },
    });

    const eventMock = factoryStripeEvent.build({
      data: {
        object: {
          id: 'acct_xxxxxxxxxxxxxxxxxx',
          details_submitted: true,
          default_currency: 'usd',
        },
      },
    });

    const community = await service.handleAccountUpdated(eventMock);
    expect(community.stripeAccount?.defaultCurrency).toBe('usd');
  });

  it('should handle session checkout complete event', async () => {
    const user = await createUser(module);
    const checkOutSession = factoryStripeCheckoutSession.build();
    await createPayment(module, {
      payment: { userId: user._id, eventStatus: 'open', checkoutSessionId: checkOutSession.id },
    });

    const { community } = await createCommunity(module, {
      community: {
        stripeAccount: {
          id: 'acct_xxxxxxxxxxxxxxxxxx',
          active: true,
          defaultCurrency: 'eur', // TODO delete
        },
      },
    });

    assertIsDefined(community.stripeAccount);

    const eventMock: Stripe.Event = {
      id: 'evt_xxxxxxxxxxxxxxxxxx',
      object: 'event',
      account: community.stripeAccount.id,
      api_version: '2022-11-15',
      created: 1671725520,
      data: { object: checkOutSession },
      livemode: false,
      pending_webhooks: 2,
      request: {
        id: 'req_zqWtUwDybunNXR',
        idempotency_key: 'xxxxxxx-adf7-4820-a036-xxxxxxxxxxxxx',
      },
      type: 'payment_intent.succeeded',
    };

    await service.handleCheckoutSessionCompleted(eventMock);
  });

  it('should add payment', async () => {
    const { community } = await createCommunity(module, {
      community: {
        stripeAccount: {
          id: 'acct_xxxxxxxxxxxxxxxxxx',
          active: true,
          defaultCurrency: 'eur', // TODO delete
        },
      },
    });

    const user = await createUser(module);
    const order = {
      communityId: community._id.toHexString(),
      products: [
        {
          productId: 'prod_MzatIXdlCwtGKV',
          quantity: 3,
        },
      ],
    };

    const stripeCheckoutSession = factoryStripeCheckoutSession.build();
    await service.addPaymentHistory(stripeCheckoutSession, order, user);

    // Should also fill some missing values if needed
    await service.addPaymentHistory(
      {
        ...stripeCheckoutSession,
        customer_email: null,
        payment_intent: null,
        status: null,
        amount_total: null,
        currency: null,
      },
      order,
      user
    );
  });

  it('should find payments', async () => {
    await createPayment(module, { payment: { customerEmail: 'rose@example.com' } });
    const result = await service.findPayment({
      customerEmail: 'rose@example.com',
      eventStatus: 'complete',
    });
    expect(result.length).toBe(1);

    const result2 = await service.findPaymentWithPagination({
      customerEmail: 'rose@example.com',
      eventStatus: 'complete',
    });

    expect(result2.length).toBe(1);
  });

  it('should call getPurchasedItems', async () => {
    const spy = jest.spyOn(service.stripe.checkout.sessions, 'listLineItems').mockImplementation();
    await service.getPurchasedItems(
      'cs_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      'acct_xxxxxxxxxxxxxxxxxx'
    );
    expect(spy).toHaveBeenCalledWith(
      'cs_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      { stripeAccount: 'acct_xxxxxxxxxxxxxxxxxx' }
    );
  });
});
