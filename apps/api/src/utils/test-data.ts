import {
  AcceptedFor,
  AccessRight,
  Author,
  CreditType,
  Deposit,
  DepositDocument,
  DepositStatus,
  PublicationType,
  ReviewType,
} from '../deposit/deposit.schema';
import { User, UserDocument, UserType } from '../users/user.schema';
import {
  Community,
  CommunityDocument,
  CommunityStatus,
  CommunityType,
  SubscriptionType,
} from '../communities/communities.schema';
import {
  Review,
  ReviewDecision,
  ReviewDocument,
  ReviewKind,
  ReviewStatus,
} from '../review/review.schema';
import { ModeratorRole } from '../communities/communities-moderator.schema';
import { Commentary, CommentaryDocument } from '../comments/comments.schema';
import { Factory } from 'fishery';
import { Conversation, ConversationDocument } from '../conversations/conversations.schema';
import { randomBytes, randomInt } from 'crypto';
import { Feedback } from '../feedback/feedback.schema';
import { Invite, InviteDocument, InviteStatus, InviteType } from '../invite/invite.schema';
import { Template, TemplateCategory } from '../template/template.schema';
import { Session, SessionDocument } from '../session/session.schema';
import { DepositCLASSNAME, generateObjectId, ReviewCLASSNAME } from './utils';
import { Payment, PaymentDocument } from '../payment/payment.schema';
import { StripeWebhookHistory } from '../payment/stripe-webhook-history.schema';
import Stripe from 'stripe';
import { FileMetadata } from '../dtos/filemetadata.dto';
import { TestingModule } from '@nestjs/testing';
import { UserService } from '../users/user.service';
import { DepositService } from '../deposit/deposit.service';
import { ReviewService } from '../review/review.service';
import { CommunitiesService } from '../communities/communities.service';
import mongoose, { AnyKeys } from 'mongoose';
import { InviteService } from '../invite/invite.service';
import { Message, MessageDocument } from '../messages/messages.schema';
import { ConversationsService } from '../conversations/conversations.service';
import { MessagesService } from '../messages/messages.service';
import { SessionService } from '../session/session.service';
import { CommentsService } from '../comments/comments.service';
import { PaymentService } from '../payment/payment.service';
import { AuthorDTO } from '../dtos/author.dto';
import { DoiLog, DoiLogDocument } from '../doi/doi-log.schema';
import { DoiLogService } from '../doi/doi-log.service';

export const factoryAuthorDTO = Factory.define<AuthorDTO>(() => {
  const author: AuthorDTO = {
    credit: [CreditType.investigation],
    email: 'info+1@example.com',
    orcid: '',
    gravatar: 'e9ce92218c2e926184d1d25b9f96bceb',
    userId: 'google-oauth2|00000000000000000000',
    nickname: 'john-doe-nickname',
    institutions: ['University'],
    firstName: 'John',
    lastName: 'Doe',
  };
  return author;
});

export const factoryAuthor = Factory.define<Author>(() => {
  const author: Author = {
    credit: [CreditType.investigation],
    email: 'info+1@example.com',
    orcid: '',
    gravatar: 'e9ce92218c2e926184d1d25b9f96bceb',
    userId: 'google-oauth2|00000000000000000000',
    nickname: 'john-doe-nickname',
    institutions: ['University'],
    firstName: 'John',
    lastName: 'Doe',
  };
  return author;
});

export const factoryDepositDocumentDefinition = Factory.define<AnyKeys<Deposit>>(() => {
  const deposit: AnyKeys<Deposit> = {
    canAuthorInviteReviewers: false,
    community: generateObjectId(), //??
    title:
      'Big data analytics as a service infrastructure: challenges, desired properties and solutions',
    abstract:
      'CERN’s accelerator complex generates a very large amount of data. A large volumen of heterogeneous data is constantly generated from control equipment and monitoring agents. These data must be stored and analysed. Over the decades, CERN’s researching and engineering teams have applied different approaches, techniques and technologies for this purpose. This situation has minimised the necessary collaboration and, more relevantly, the cross data analytics over different domains. These two factors are essential to unlock hidden insights and correlations between the underlying processes, which enable better and more efficient daily-based accelerator operations and more informed decisions. ',
    authors: [factoryAuthorDTO.build()],
    status: DepositStatus.preprint,
    keywords: [
      'Big Data',
      'High Energy Physics',
      'Machine Learning',
      'Hadoop',
      'Spark',
      'Artificial Intelligence',
    ],
    doi: 'doiexample',
    files: [],
    keccak256: '0x4a80ca00dcb6769aff349f3d0460982c6e369f60088bb0a5b3bf81a8aa35460a',
    accessRight: AccessRight.CC0,
    peerReviews: [],
    publicationDate: new Date(),
    publicationType: PublicationType.article,
    reviewType: ReviewType.openReview,
    acceptedFor: AcceptedFor.Poster,
    gravatar: 'e9ce92218c2e926184d1d25b9f96bceb',
    createdOn: new Date(),
    disciplines: [],
    isLatestVersion: true,
    parent: '1fbf7635-37b1-4fa2-ba68-d4e1d682cfb0',
    references: [],
    bibtexReferences: [],
    version: 1,
    images: [],
    nickname: 'john-doe',
    canBeReviewed: true,
    openAireIdentifier: 'doi_dedup___::4cc480df7cee322108bc36d6bfaf53e3',
    views: 164,
    submissionDate: new Date(),
    creator: '5d28ed8f5984d9eedab794c6',
    history: [],
    pdfUrl: 'publication-5e6b927b9859ddaed225608c.pdf',
    extraMetadata: {},
  };

  return deposit;
});

export const factoryReview = Factory.define<AnyKeys<Review>>((): AnyKeys<Review> => {
  const review: AnyKeys<Review> = {
    creator: generateObjectId(),
    decision: ReviewDecision.accepted,
    comments: 'Good job. The manuscript technically sounds. Well done.',
    gravatar: 'user.gravatar',
    avatar: 'https://urltoavatar.orvium.io',
    deposit: generateObjectId(),
    author: 'Marie Curie',
    wasInvited: false,
    showIdentityToAuthor: true,
    showIdentityToEveryone: true,
    status: ReviewStatus.published,
    kind: ReviewKind.peerReview,
    creationDate: new Date(),
    extraFiles: [],
    history: [],
    community: generateObjectId(),
    images: [],
    showReviewToAuthor: false,
    showReviewToEveryone: false,
  };

  return review;
});

/**
 *
 */
export const factoryCommunity = Factory.define<Partial<Community>>(() => {
  const community: Partial<Community> = {
    canAuthorInviteReviewers: false,
    name: 'Orvium Community',
    description: 'Description',
    subscription: SubscriptionType.free,
    country: 'Testlandia',
    twitterURL: 'https://twitter.com/test',
    facebookURL: 'https://www.facebook.com/test/',
    websiteURL: 'https://www.example.com/',
    logoURL: '',
    views: 2,
    acknowledgement: '',
    guidelinesURL: '',
    codename: `orvium-${randomInt(10000, 99999)}`,
    type: CommunityType.community,
    bannerURL: '',
    cardImageUrl: '',
    conferenceProceedings: [],
    newTracks: [
      {
        timestamp: Date.now(),
        title: 'track1: biology',
        description: 'track1: biology',
      },
    ],
    customLicenses: [AccessRight.CC0, AccessRight.CCBY],
    privateReviews: false,
    issn: '2231-4455',
    calendarDates: [],
    calendarVisible: false,
    followersCount: 0,
    productsVisible: false,
    creator: new mongoose.Types.ObjectId(),
    status: CommunityStatus.published,
    stripeAccount: {
      id: 'acct_xxxxxxxxxxxxxxxxxx',
      active: true,
      defaultCurrency: 'eur',
    },
    showIdentityToAuthor: false,
    showIdentityToEveryone: false,
    showReviewToAuthor: false,
    showReviewToEveryone: false,
  };

  return community;
});

export const factorySession = Factory.define<AnyKeys<Session>>(() => {
  const session: AnyKeys<Session> = {
    title: 'New Session',
    creator: '6124d3870873a803c65ec483',
    community: '6128d0270873a803c65er845',
    newTrackTimestamp: 15,
    description:
      'Exposition of the publications related to Metropolization and the Right to the City',
    speakers: [],
    dateStart: new Date(),
    dateEnd: new Date(),
    deposits: [],
  };

  return session;
});

export const factoryUser = Factory.define<AnyKeys<User>>(() => {
  const random = randomInt(999999);
  const userId = `userId-${random}`;
  const user: AnyKeys<User> = {
    firstName: 'John',
    lastName: 'Doe',
    userId: userId,
    providerIds: [userId],
    nickname: `nickname-${random}`,
    gravatar: 'user.gravatar',
    email: `email-${random}@example.com`,
    userType: UserType.business,
    institutions: [],
    isOnboarded: true,
    percentageComplete: 0,
    roles: [],
    disciplines: [],
    acceptedTC: true,
    communities: [],
    invitationsAvailable: 5,
    inviteToken: randomBytes(16).toString('hex'),
    starredDeposits: [],
  };

  return user;
});

export const factoryComment = Factory.define<AnyKeys<Commentary>>(() => {
  const commentary: AnyKeys<Commentary> = {
    user_id: generateObjectId(),
    resource: generateObjectId(),
    tags: [],
    content: 'content',
    resourceModel: DepositCLASSNAME,
    parent: undefined,
    community: generateObjectId(),
  };

  return commentary;
});

export const factoryConversation = Factory.define<AnyKeys<Conversation>>(() => {
  const conversation: AnyKeys<Conversation> = {
    participants: [],
  };
  return conversation;
});

export const factoryMessage = Factory.define<AnyKeys<Message>>(() => {
  const message: AnyKeys<Message> = {
    conversation: generateObjectId(),
    content: 'hello',
    sender: generateObjectId(),
    createdAt: new Date(),
  };

  return message;
});

export const factoryFeedback = Factory.define<AnyKeys<Feedback>>(() => {
  const feedback: AnyKeys<Feedback> = {
    email: 'user@example.com',
    description: 'Feedback description',
    created: new Date(),
  };

  return feedback;
});

export const factoryInvite = Factory.define<AnyKeys<Invite>>(() => {
  const invite: AnyKeys<Invite> = {
    inviteType: InviteType.review,
    status: InviteStatus.pending,
    sender: generateObjectId(),
    addressee: 'example@example.com',
    createdOn: new Date(),
    community: generateObjectId(),
    data: {
      depositId: new mongoose.Types.ObjectId('569ed8269353e9f4c51617aa'),
      depositTitle: 'example',
      reviewId: new mongoose.Types.ObjectId('569ed8269353e9f4c51617aa'),
    },
    message:
      'Text example of the invitation message: I am approaching you with the peer-review request of the below mentioned publication. Thank you.',
  };

  return invite;
});

export const factoryTemplate = Factory.define<AnyKeys<Template>>(() => {
  const template: AnyKeys<Template> = {
    name: 'confirm-email',
    template: '<p>Template</p>',
    community: generateObjectId(),
    isCustomizable: false,
    title: 'Confirmation Email',
    description:
      'This email is sent to confirm your email by copying the code of the email in the last step of the onboarding.',
    category: TemplateCategory.system,
  };

  return template;
});

export const factoryPayment = Factory.define<AnyKeys<Payment>>(() => {
  return {
    //_id: string;
    customerEmail: 'rose@example.com',
    userId: generateObjectId(),
    stripeAccount: 'acct_xxxxxxxxxxxxxxxxxx',
    checkoutSessionId: 'cs_test_xxxxxxxxxxxxxxxxxx',
    eventName: 'checkout.session',
    eventId: 'evt_xxxxxxxxxxxxxx',
    eventStatus: 'complete',
    receiptUrl:
      'https://pay.stripe.com/receipts/payment/xxxxxxxxxxxxxxxxxx-xxxxxxxxxxxxxxxxxx',
    amountTotal: 1.4,
    currency: 'eur',
    communityName: 'The Evolving Scholar',
    community: generateObjectId(),
    date: new Date(),
    order: undefined,
    eventContent: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };
});

export const factoryDoiLog = Factory.define<AnyKeys<DoiLog>>(() => {
  return {
    status: 'processing',
    file: 'test.xml',
    doi: `10.0000/${randomInt(999999)}`,
    community: generateObjectId(),
    submissionId: 129812112,
    resource: generateObjectId(),
    resourceModel: DepositCLASSNAME,
  };
});

export const factoryStripeWebhookHistory = Factory.define<AnyKeys<StripeWebhookHistory>>(() => {
  return {
    event: [{}],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
});

export const factoryStripePrice = Factory.define<Stripe.Price>(() => {
  return {
    id: 'price_xxxxxxxxxxxxxxxxxx',
    object: 'price',
    active: true,
    billing_scheme: 'per_unit',
    created: 1667900666,
    currency: 'usd',
    custom_unit_amount: null,
    livemode: false,
    lookup_key: null,
    metadata: {},
    nickname: 'Precio para no universitarios',
    product: 'prod_xxxxxxxxxxxxxxxxxx',
    recurring: {
      aggregate_usage: null,
      interval: 'month',
      interval_count: 1,
      trial_period_days: null,
      usage_type: 'licensed',
    },
    tax_behavior: 'unspecified',
    tiers_mode: null,
    transform_quantity: null,
    type: 'recurring',
    unit_amount: 25198,
    unit_amount_decimal: '25198',
  };
});

export const factoryStripeProduct = Factory.define<Stripe.Product>(({ params }) => {
  return {
    id: params.id ?? 'prod_xxxxxxxxxxxxxxxxxx',
    object: 'product',
    active: true,
    attributes: [],
    created: 1667900665,
    default_price: factoryStripePrice.build({ product: params.id ?? 'prod_xxxxxxxxxxxxxxxxxx' }),
    description: 'Esta es la descripcion del ticket de conferecia BASICO',
    images: [
      'https://files.stripe.com/links/xxxxxxxxxxxxxxxxxx…xxxxxxxxxxxxxxxxxx',
    ],
    livemode: false,
    metadata: {},
    name: 'Ticket conferencia BASICO',
    package_dimensions: null,
    shippable: null,
    statement_descriptor: null,
    tax_code: null,
    type: 'service',
    unit_label: null,
    updated: 1668591757,
    url: null,
  };
});

export const factoryStripeEvent = Factory.define<Stripe.Event>(({ params }) => {
  return {
    id: params.id ?? 'evt_xxxxxxxxxxxxxxxxxx',
    object: 'event',
    account: 'acct_xxxxxxxxxxxxxxxxxx',
    type: 'payment_intent.succeeded',
    api_version: '2022-11-15',
    created: 1671725520,
    data: {
      object: {},
    },

    livemode: false,
    pending_webhooks: 2,
    request: {
      id: 'req_zqWtUwDybunNXR',
      idempotency_key: 'xxxxxxx-adf7-4820-a036-xxxxxxxxxxxxx',
    },
  };
});

export const factoryFileMetadata = Factory.define<FileMetadata>(() => {
  const file: FileMetadata = {
    url: '',
    contentLength: 1000,
    tags: [],
    contentType: 'application/pdf',
    filename: `file-${randomInt(999999)}.pdf`,
    description: '',
  };

  return file;
});

export function createStripeResponse<T>(object: T): Stripe.Response<T> {
  return {
    ...object,
    lastResponse: {
      headers: {},
      requestId: '',
      statusCode: 200,
      apiVersion: '',
      idempotencyKey: '',
      stripeAccount: '',
    },
  };
}

export const factoryStripeLineItem = Factory.define<Stripe.LineItem>(() => {
  const item: Stripe.LineItem = {
    id: 'ii_xxxxxxxxxxxxxxxx',
    object: 'item',
    currency: 'usd',
    description: '',
    discounts: [],
    price: {
      id: 'price_xxxxxxxxxxxxxxxx',
      object: 'price',
      active: false,
      billing_scheme: 'per_unit',
      created: 1684912632,
      currency: 'usd',
      custom_unit_amount: null,
      livemode: false,
      lookup_key: null,
      metadata: {},
      nickname: null,
      product: 'prod_xxxxxxxxxxxxxxxx',
      recurring: null,
      tax_behavior: 'unspecified',
      tiers_mode: null,
      transform_quantity: null,
      type: 'one_time',
      unit_amount: 55,
      unit_amount_decimal: '55',
    },
    quantity: 1,
    amount_discount: 0,
    amount_subtotal: 0,
    amount_tax: 0,
    amount_total: 0,
  };
  return item;
});

export const factoryStripeAccountLink = Factory.define<Stripe.AccountLink>(() => {
  return {
    object: 'account_link',
    created: 1684949908,
    expires_at: 1684950208,
    url: 'https://connect.stripe.com/setup/s/acct_xxxxxxxxxxxxxxxx',
  };
});

export const factoryStripeAccount = Factory.define<Stripe.Account>(() => {
  return {
    id: 'acct_xxxxxxxxxxxxxxxx',
    object: 'account',
    business_profile: {
      mcc: null,
      name: 'Stripe.com',
      product_description: null,
      support_address: null,
      support_email: null,
      support_phone: null,
      support_url: null,
      url: null,
    },
    business_type: null,
    capabilities: {},
    charges_enabled: false,
    controller: { type: 'account' },
    country: 'US',
    created: 1385798567,
    default_currency: 'usd',
    details_submitted: false,
    email: 'jenny.rosen@example.com',
    external_accounts: {
      object: 'list',
      data: [],
      has_more: false,
      url: '/v1/accounts/acct_xxxxxxxxxxxxxxxx/external_accounts',
    },
    future_requirements: {
      alternatives: [],
      current_deadline: null,
      currently_due: [],
      disabled_reason: null,
      errors: [],
      eventually_due: [],
      past_due: [],
      pending_verification: [],
    },
    metadata: {},
    payouts_enabled: false,
    requirements: {
      alternatives: [],
      current_deadline: null,
      currently_due: [
        'business_profile.mcc',
        'business_profile.product_description',
        'business_profile.support_phone',
        'business_profile.url',
        'business_type',
        'external_account',
        'person_xxxxxxxxxxxxxxxx.first_name',
        'person_xxxxxxxxxxxxxxxx.last_name',
        'tos_acceptance.date',
        'tos_acceptance.ip',
      ],
      disabled_reason: 'requirements.past_due',
      errors: [],
      eventually_due: [
        'business_profile.mcc',
        'business_profile.product_description',
        'business_profile.support_phone',
        'business_profile.url',
        'business_type',
        'external_account',
        'person_xxxxxxxxxxxxxxxx.first_name',
        'person_xxxxxxxxxxxxxxxx.last_name',
        'tos_acceptance.date',
        'tos_acceptance.ip',
      ],
      past_due: [
        'business_profile.mcc',
        'business_profile.product_description',
        'business_profile.support_phone',
        'business_profile.url',
        'business_type',
        'external_account',
        'person_xxxxxxxxxxxxxxxx.first_name',
        'person_xxxxxxxxxxxxxxxx.last_name',
        'tos_acceptance.date',
        'tos_acceptance.ip',
      ],
      pending_verification: [],
    },
    settings: {
      bacs_debit_payments: {},
      branding: { icon: null, logo: null, primary_color: null, secondary_color: null },
      card_issuing: { tos_acceptance: { date: null, ip: null } },
      card_payments: {
        decline_on: { avs_failure: true, cvc_failure: false },
        statement_descriptor_prefix: null,
        statement_descriptor_prefix_kanji: null,
        statement_descriptor_prefix_kana: null,
      },
      dashboard: { display_name: 'Stripe.com', timezone: 'US/Pacific' },
      payments: {
        statement_descriptor: null,
        statement_descriptor_prefix_kana: null,
        statement_descriptor_prefix_kanji: null,
        statement_descriptor_kana: null,
        statement_descriptor_kanji: null,
      },
      payouts: {
        debit_negative_balances: true,
        schedule: { delay_days: 7, interval: 'daily' },
        statement_descriptor: null,
      },
      sepa_debit_payments: {},
    },
    tos_acceptance: { date: null, ip: null, user_agent: null },
    type: 'custom',
  };
});

export const factoryStripePaymentIntent = Factory.define<AnyKeys<Stripe.PaymentIntent>>(() => {
  return {
    id: 'pi_xxxxxxxxxxxxxxxxxxxx',
    object: 'payment_intent',
    amount: 900,
    amount_capturable: 0,
    amount_details: { tip: {} },
    amount_received: 900,
    application: 'ca_xxxxxxxxxxxxxxxxxxxx',
    application_fee_amount: 0,
    automatic_payment_methods: null,
    canceled_at: null,
    cancellation_reason: null,
    capture_method: 'automatic',
    client_secret: 'pi_xxxxxxxxxxxxxxxxxxxx_secret_xxxxxxxxxxxxxxxxxxx',
    confirmation_method: 'automatic',
    created: 1671785916,
    currency: 'eur',
    customer: null,
    description: null,
    invoice: null,
    last_payment_error: null,
    latest_charge: factoryStripeCharge.build(),
    livemode: false,
    metadata: {},
    next_action: null,
    on_behalf_of: null,
    payment_method: 'pm_xxxxxxxxxxxxxxxxxxx',
    payment_method_options: {},
    payment_method_types: ['card'],
    processing: null,
    receipt_email: 'rose@example.com',
    review: null,
    setup_future_usage: null,
    shipping: null,
    source: null,
    statement_descriptor: null,
    statement_descriptor_suffix: null,
    status: 'succeeded',
    transfer_data: null,
    transfer_group: null,
  };
});

export const factoryStripeCharge = Factory.define<AnyKeys<Stripe.Charge>>(() => {
  return {
    id: 'ch_xxxxxxxxxxxxxxxxxxx',
    object: 'charge',
    amount: 900,
    amount_captured: 900,
    amount_refunded: 0,
    application: 'ca_xxxxxxxxxxxxxxxxxxxx',
    application_fee: null,
    application_fee_amount: 0,
    balance_transaction: 'txn_xxxxxxxxxxxxxxxxxxx',
    billing_details: {
      address: null,
      email: 'rose@example.com',
      name: 'AZhang San',
      phone: null,
    },
    calculated_statement_descriptor: 'THE ENVOLVING SCHOLAR',
    captured: true,
    created: 1671785917,
    currency: 'eur',
    customer: null,
    description: null,
    destination: null,
    dispute: null,
    disputed: false,
    failure_balance_transaction: null,
    failure_code: null,
    failure_message: null,
    fraud_details: {},
    invoice: null,
    livemode: false,
    metadata: {},
    on_behalf_of: null,
    //order: null,
    outcome: {
      network_status: 'approved_by_network',
      reason: null,
      risk_level: 'normal',
      risk_score: 61,
      seller_message: 'Payment complete.',
      type: 'authorized',
    },
    paid: true,
    payment_intent: 'pi_xxxxxxxxxxxxxxxxxxxx',
    payment_method: 'pm_xxxxxxxxxxxxxxxxxxx',
    //payment_method_details: { card: null, type: 'card' },
    payment_method_details: {
      card: {
        brand: 'visa',
        checks: {
          address_line1_check: null,
          address_postal_code_check: null,
          cvc_check: 'pass',
        },
        country: 'US',
        exp_month: 8,
        exp_year: 2023,
        fingerprint: 'xxxxxxxxxxxxxxxxxxx',
        funding: 'credit',
        installments: null,
        last4: '4242',
        mandate: null,
        network: 'visa',
        three_d_secure: null,
        wallet: null,
      },
      type: 'card',
    },
    receipt_email: 'rose@example.com',
    receipt_number: null,
    receipt_url:
      'https://pay.stripe.com/receipts/payment/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    refunded: false,
    refunds: {
      object: 'list',
      data: [],
      has_more: false,
      url: '/v1/charges/ch_xxxxxxxxxxxxxxxxxx/refunds',
    },
    review: null,
    shipping: null,
    source: null,
    source_transfer: null,
    statement_descriptor: null,
    statement_descriptor_suffix: null,
    status: 'succeeded',
    transfer_data: null,
    transfer_group: null,
  };
});

export const factoryStripeCheckoutSession = Factory.define<Stripe.Checkout.Session>(() => {
  return {
    id: 'cs_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    object: 'checkout.session',
    after_expiration: null,
    allow_promotion_codes: null,
    amount_subtotal: 900,
    amount_total: 900,
    automatic_tax: {
      enabled: false,
      status: null,
    },
    billing_address_collection: null,
    cancel_url: 'http://localhost:4200/communities/5fa1908fd29a17dc961cc435/view',
    client_reference_id: null,
    consent: null,
    consent_collection: null,
    created: 1671785910,
    currency: 'eur',
    currency_conversion: null,
    custom_text: {
      shipping_address: null,
      submit: null,
    },
    customer: null,
    customer_creation: 'if_required',
    customer_details: {
      address: {
        city: null,
        country: 'ES',
        line1: null,
        line2: null,
        postal_code: null,
        state: null,
      },
      email: 'rose@example.com',
      name: 'AZhang San',
      phone: null,
      tax_exempt: 'none',
      tax_ids: [],
    },
    customer_email: 'rose@example.com',
    expires_at: 1671872310,
    invoice: null,
    invoice_creation: {
      enabled: false,
      invoice_data: {
        account_tax_ids: null,
        custom_fields: null,
        description: null,
        footer: null,
        rendering_options: null,
        metadata: null,
      },
    },
    livemode: false,
    locale: null,
    metadata: null,
    mode: 'payment',
    payment_method_options: null,
    payment_intent: 'pi_xxxxxxxxxxxxxxxxxxxx',
    payment_link: null,
    payment_method_collection: 'always',
    payment_method_types: ['card'],
    payment_status: 'paid',
    phone_number_collection: {
      enabled: false,
    },
    recovered_from: null,
    setup_intent: null,
    shipping_address_collection: null,
    shipping_cost: null,
    shipping_details: null,
    shipping_options: [],
    status: 'complete',
    submit_type: null,
    subscription: null,
    success_url:
      'http://localhost:4200/communities/5fa1908fd29a17dc961cc435/order-info/?session_id={CHECKOUT_SESSION_ID}',
    total_details: {
      amount_discount: 0,
      amount_shipping: 0,
      amount_tax: 0,
    },
    url: null,
    custom_fields: [],
  };
});

/**
 * Creates a deposit in preprint by default.
 * Optionally creates an author if not provided.
 * @param module
 * @param community
 * @param params
 */
export async function createDeposit(
  module: TestingModule,
  params: {
    community?: CommunityDocument;
    author?: UserDocument;
    deposit?: Partial<DepositDocument>;
  } = {}
): Promise<{ author: UserDocument; deposit: DepositDocument; community: CommunityDocument }> {
  const author = params.author ? params.author : await createUser(module);
  const community = params.community ?? (await createCommunity(module)).community;
  const depositService = module.get(DepositService);
  const deposit = await depositService.create(
    factoryDepositDocumentDefinition.build({
      creator: author._id,
      community: community._id,
      newTrackTimestamp:
        community.newTracks.length > 0 ? community.newTracks[0].timestamp : undefined,
      ...params.deposit,
    })
  );
  return { author, deposit, community };
}

export async function createDepositSet(
  module: TestingModule,
  community: CommunityDocument,
  author?: UserDocument
): Promise<{
  draft: DepositDocument;
  published: DepositDocument;
  pendingApproval: DepositDocument;
  preprint: DepositDocument;
}> {
  const { deposit: draft } = await createDeposit(module, {
    community,
    deposit: {
      status: DepositStatus.draft,
    },
    author,
  });
  const { deposit: published } = await createDeposit(module, {
    community,
    deposit: {
      status: DepositStatus.published,
    },
    author,
  });
  const { deposit: pendingApproval } = await createDeposit(module, {
    community,
    deposit: {
      status: DepositStatus.pendingApproval,
    },
    author,
  });
  const { deposit: preprint } = await createDeposit(module, {
    community,
    deposit: {
      status: DepositStatus.preprint,
    },
    author,
  });

  return { draft, published, pendingApproval, preprint };
}

export async function createReview(
  module: TestingModule,
  deposit: DepositDocument,
  params?: {
    reviewer?: UserDocument;
    review?: Partial<AnyKeys<ReviewDocument>>;
  }
): Promise<{ reviewer: UserDocument; review: ReviewDocument }> {
  const reviewer = params?.reviewer ? params.reviewer : await createUser(module);
  const reviewService = module.get(ReviewService);
  const review = await reviewService.create(
    factoryReview.build({
      ...params?.review,
      creator: reviewer._id,
      deposit: deposit._id,
      community: deposit.community,
    })
  );
  deposit.peerReviews.push(review._id);
  await deposit.save();
  return { reviewer, review };
}

export async function createReviewSet(
  module: TestingModule,
  deposit: DepositDocument,
  reviewer?: UserDocument,
  review?: Partial<AnyKeys<Review>>
): Promise<{
  draft: ReviewDocument;
  published: ReviewDocument;
  pendingApproval: ReviewDocument;
}> {
  const { review: draft } = await createReview(module, deposit, {
    review: {
      ...review,
      status: ReviewStatus.draft,
    },
    reviewer,
  });
  const { review: pendingApproval } = await createReview(module, deposit, {
    review: {
      ...review,
      status: ReviewStatus.pendingApproval,
    },
    reviewer,
  });
  const { review: published } = await createReview(module, deposit, {
    review: {
      ...review,
      status: ReviewStatus.published,
    },
    reviewer,
  });

  return { draft, published, pendingApproval };
}

/**
 * Creates a community published with tracks.
 * @see {@link defaultCommunity} to check default values
 * @param module
 * @param params
 */
export async function createCommunity(
  module: TestingModule,
  params?: {
    community?: Partial<AnyKeys<Community>>;
    owner?: AnyKeys<User>;
    moderator?: AnyKeys<User>;
  }
): Promise<{
  community: CommunityDocument;
  communityOwner: UserDocument;
  moderator: UserDocument;
}> {
  const userService = module.get(UserService);
  const communitiesService = module.get(CommunitiesService);
  const creator = await userService.userModel.create(factoryUser.build(params?.owner));
  let community = await communitiesService.create(
    factoryCommunity.build({ ...params?.community, creator: creator._id })
  );
  await communitiesService.addModerator(community, creator, ModeratorRole.owner);
  community = await userService.addCommunity(creator, community);

  const moderator = await userService.userModel.create(factoryUser.build(params?.moderator));
  await communitiesService.addModerator(community, moderator, ModeratorRole.moderator);
  community = await userService.addCommunity(moderator, community);
  await community.save();

  return { communityOwner: creator, community, moderator };
}

export async function createUser(
  module: TestingModule,
  params?: {
    user?: Partial<AnyKeys<User>>;
  }
): Promise<UserDocument> {
  const userService = module.get(UserService);
  return await userService.userModel.create(factoryUser.build(params?.user));
}

export async function createAdmin(
  module: TestingModule,
  user?: Partial<User>
): Promise<UserDocument> {
  return createUser(module, { ...user, ...{ user: { roles: ['admin'] } } });
}

export async function createInvite(
  module: TestingModule,
  params: {
    sender?: UserDocument;
    community?: CommunityDocument;
    deposit?: DepositDocument;
    invite?: Partial<AnyKeys<Invite>>;
  }
): Promise<{ invite: InviteDocument; sender: UserDocument; community: CommunityDocument }> {
  const inviteService = module.get(InviteService);
  const community = params.community ?? (await createCommunity(module)).community;
  const sender = params.sender ?? (await createUser(module));

  const invite = await inviteService.create(
    factoryInvite.build({
      community: community._id,
      sender: sender,
      data: {
        depositId: params.deposit?._id,
        depositTitle: params.deposit?.title,
      },
      ...params.invite,
    })
  );
  return { invite, sender, community };
}

export async function createConversation(
  module: TestingModule,
  firstParticipant?: UserDocument,
  secondParticipant?: UserDocument
): Promise<{ conversation: ConversationDocument; user1: UserDocument; user2: UserDocument }> {
  const user1 = firstParticipant ?? (await createUser(module));
  const user2 = secondParticipant ?? (await createUser(module));
  const conversationService = module.get(ConversationsService);

  const conversation = await conversationService.conversationModel.create(
    factoryConversation.build({
      participants: [user1._id, user2._id],
    })
  );

  return { conversation, user1, user2 };
}

export async function createMessage(
  module: TestingModule,
  conversation: ConversationDocument,
  sender: UserDocument,
  params?: {
    message?: Partial<AnyKeys<MessageDocument>>;
  }
): Promise<{ message: MessageDocument }> {
  const messagesService = module.get(MessagesService);

  const message = await messagesService.messageModel.create(
    factoryMessage.build({
      conversation: conversation._id,
      sender: sender._id,
      ...params?.message,
    })
  );

  return { message };
}

export async function createSession(
  module: TestingModule,
  community: CommunityDocument,
  params?: {
    session?: Partial<AnyKeys<Session>>;
  }
): Promise<{ session: SessionDocument }> {
  const sessionService = module.get(SessionService);

  const session = await sessionService.sessionModel.create(
    factorySession.build({
      community: community._id,
      creator: community.creator,
      ...params?.session,
    })
  );

  return { session };
}

export async function createComment(
  module: TestingModule,
  resource: DepositDocument | ReviewDocument,
  parent?: CommentaryDocument,
  params?: {
    user?: UserDocument;
  }
): Promise<{ comment: CommentaryDocument; user: UserDocument }> {
  const commentsService = module.get(CommentsService);
  const user = params?.user ?? (await createUser(module));

  const comment = await commentsService.create(
    factoryComment.build({
      user_id: user._id,
      resource: resource._id,
      resourceModel: 'peerReviews' in resource ? DepositCLASSNAME : ReviewCLASSNAME,
      parent: parent,
      community: resource.community._id,
    })
  );

  return { comment, user };
}

export async function createPayment(
  module: TestingModule,
  params?: {
    payment?: Partial<AnyKeys<PaymentDocument>>;
  }
): Promise<PaymentDocument> {
  const paymentService = module.get(PaymentService);
  const payment = await paymentService.addPayment(factoryPayment.build({ ...params?.payment }));
  return payment;
}

export async function createDoiLog(
  module: TestingModule,
  params?: {
    doiLog?: Partial<AnyKeys<DoiLogDocument>>;
    resource?: DepositDocument | ReviewDocument;
  }
): Promise<DoiLogDocument> {
  if (params?.resource) {
    params.doiLog = {
      ...params.doiLog,
      resource: params.resource._id,
      resourceModel: 'peerReviews' in params.resource ? DepositCLASSNAME : ReviewCLASSNAME,
    };
  }
  const doiLogService = module.get(DoiLogService);
  const doiLog = doiLogService.create(factoryDoiLog.build({ ...params?.doiLog }));
  return doiLog;
}
