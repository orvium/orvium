import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { request } from 'express';
import {
  createCommunity,
  createPayment,
  createStripeResponse,
  createUser,
  factoryStripeAccount,
  factoryStripeAccountLink,
  factoryStripeCheckoutSession,
  factoryStripeEvent,
  factoryStripeLineItem,
  factoryStripePrice,
  factoryStripeProduct,
} from '../utils/test-data';
import { AuthorizationService } from '../authorization/authorization.service';
import { cleanCollections, MongooseTestingModule } from '../utils/mongoose-testing.module';
import { RequestWithRawBody } from '../utils/rawBody.middleware';

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
      unit_amount: 10000,
      unit_amount_decimal: '10000',
    }),
    description: 'Vale para una cena en al conferencia',
    name: 'Cena de la conferencia',
  }),
];

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
      },
    },
    products: {
      list: jest.fn().mockResolvedValue({ data: communityProducts }),
    },
  }));
});

describe('PaymentController', () => {
  let controller: PaymentController;
  let paymentService: PaymentService;
  let authorizationService: AuthorizationService;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      controllers: [PaymentController],
      imports: [MongooseTestingModule.forRoot('PaymentController')],
    }).compile();
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    paymentService = module.get(PaymentService);
    controller = module.get(PaymentController);
    authorizationService = module.get(AuthorizationService);

    await cleanCollections(module);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should onboard a community', async () => {
    const user = await createUser(module);
    const { community } = await createCommunity(module, {
      community: { stripeAccount: undefined },
    });

    jest
      .spyOn(paymentService, 'createAccount')
      .mockResolvedValue(createStripeResponse(factoryStripeAccount.build()));
    jest
      .spyOn(paymentService, 'linkAccount')
      .mockResolvedValue(createStripeResponse(factoryStripeAccountLink.build()));
    jest.spyOn(authorizationService, 'canDo').mockImplementation();

    const result = await controller.onboard(
      {
        user: { sub: user.userId },
        headers: { origin: 'http://localhost:4200' },
      } as unknown as typeof request,
      { communityId: community._id.toHexString() }
    );

    expect(result).toMatchObject({
      url: 'https://connect.stripe.com/setup/s/acct_xxxxxxxxxxxxxxxx',
    });
  });

  it('should onboard a when no origin headers', async () => {
    const user = await createUser(module);
    const { community } = await createCommunity(module, {
      community: {
        stripeAccount: {
          id: 'accountId',
        },
      },
    });
    jest
      .spyOn(paymentService, 'createAccount')
      .mockResolvedValue(createStripeResponse(factoryStripeAccount.build()));
    jest
      .spyOn(paymentService, 'linkAccount')
      .mockResolvedValue(createStripeResponse(factoryStripeAccountLink.build()));
    jest.spyOn(authorizationService, 'canDo').mockImplementation();

    const result = await controller.onboard(
      {
        user: { sub: user.userId },
        headers: {},
      } as unknown as typeof request,
      { communityId: community._id.toHexString() }
    );

    expect(result).toMatchObject({
      url: 'https://connect.stripe.com/setup/s/acct_xxxxxxxxxxxxxxxx',
    });
  });

  it('should checkout', async () => {
    const user = await createUser(module);
    const { community } = await createCommunity(module, {
      community: {
        stripeAccount: {
          id: 'accountId',
        },
      },
    });
    const spy = jest
      .spyOn(paymentService, 'checkout')
      .mockResolvedValue(factoryStripeCheckoutSession.build());

    await controller.checkout({ user: { sub: user.userId } } as unknown as typeof request, {
      communityId: community._id.toHexString(),
      products: [],
    });

    expect(spy).toHaveBeenCalled();
  });

  it('should getSuccessInfo', async () => {
    const { community } = await createCommunity(module, {
      community: {
        stripeAccount: {
          id: 'accountId',
        },
      },
    });
    const spy = jest
      .spyOn(paymentService, 'getPurchasedItems')
      // @ts-expect-error
      .mockResolvedValue({ data: [factoryStripeLineItem.build()] });

    await controller.getSuccessInfo('sessionId', community._id.toHexString());

    expect(spy).toHaveBeenCalled();
  });

  it('should process account updates', async () => {
    jest
      .spyOn(paymentService, 'createStripeEvent')
      .mockReturnValue(factoryStripeEvent.build({ type: 'account.updated' }));
    jest.spyOn(paymentService, 'handleAccountUpdated').mockImplementation();

    const result = await controller.webhook({
      rawBody: 'payload',
      headers: { 'stripe-signature': 'signature' },
    } as unknown as RequestWithRawBody);

    expect(result).toMatchObject({ received: true });
  });

  it('should process checkout sessions', async () => {
    jest
      .spyOn(paymentService, 'createStripeEvent')
      .mockReturnValue(factoryStripeEvent.build({ type: 'checkout.session.completed' }));
    jest.spyOn(paymentService, 'handleCheckoutSessionCompleted').mockImplementation();

    const result = await controller.webhook({
      rawBody: 'payload',
      headers: { 'stripe-signature': 'signature' },
    } as unknown as RequestWithRawBody);

    expect(result).toMatchObject({ received: true });
  });

  it('should fail with no event', async () => {
    jest.spyOn(paymentService, 'createStripeEvent').mockReturnValue(null);

    await expect(
      controller.webhook({
        rawBody: 'payload',
        headers: { 'stripe-signature': 'signature' },
      } as unknown as RequestWithRawBody)
    ).rejects.toThrow(ForbiddenException);
  });

  it('should getStripeProducts', async () => {
    const { community } = await createCommunity(module, {
      community: {
        stripeAccount: {
          id: 'accountId',
        },
      },
    });
    const products = await controller.getStripeProducts(community._id.toHexString());
    expect(products.length).toBe(3);
  });

  it('should getUserPayments', async () => {
    const checkoutSessionId = '1234';
    const user = await createUser(module, { user: { email: 'payment@example.com' } });
    await createPayment(module, {
      payment: {
        checkoutSessionId: checkoutSessionId,
        eventStatus: 'open',
        customerEmail: user.email,
      },
    });

    await createPayment(module, {
      payment: {
        checkoutSessionId: checkoutSessionId,
        eventStatus: 'complete',
        customerEmail: user.email,
      },
    });

    const userPayments = await controller.getUserPayments({
      user: { sub: user.userId },
    } as unknown as typeof request);

    expect(userPayments.length).toBe(1);
    expect(userPayments[0].payments[0].checkoutSessionId).toBe(checkoutSessionId);
    expect(userPayments[0].payments[1].checkoutSessionId).toBe(checkoutSessionId);
  });

  it('should getCommunityPayments', async () => {
    const { community, communityOwner } = await createCommunity(module);
    const communityPayments = await controller.getCommunityPayments(
      { user: { sub: communityOwner.userId } } as unknown as typeof request,
      community._id.toHexString(),
      {}
    );
    expect(communityPayments.payments.length).toBe(0);
  });

  it('should retrieve all community payments', async () => {
    const { community, communityOwner } = await createCommunity(module);

    await createPayment(module, {
      payment: { eventStatus: 'complete', community: community._id.toHexString() },
    });
    await createPayment(module, {
      payment: { eventStatus: 'open', community: community._id.toHexString() },
    });
    await createPayment(module, { payment: { eventStatus: 'open' } });

    let payments = await controller.getCommunityPayments(
      {
        user: { sub: communityOwner.userId },
      } as unknown as typeof request,
      community._id.toHexString(),
      { query: '' }
    );

    expect(payments.payments.length).toBe(2);

    await createPayment(module, {
      payment: {
        eventStatus: 'complete',
        community: community._id.toHexString(),
        customerEmail: 'test@test.test',
      },
    });

    payments = await controller.getCommunityPayments(
      {
        user: { sub: communityOwner.userId },
      } as unknown as typeof request,
      community._id.toHexString(),
      { query: 'test@test.test', paymentStatus: 'complete' }
    );

    expect(payments.payments.length).toBe(1);
    expect(payments.payments[0].eventStatus).toBe('complete');
    expect(payments.payments[0].customerEmail).toBe('test@test.test');
  });
});
