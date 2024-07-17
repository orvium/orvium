import {
  AcceptedFor,
  AccessRight,
  AuthorDTO,
  BibtexReferences,
  CalendarDTO,
  CallDTO,
  CallType,
  CommentDTO,
  CommunityDTO,
  CommunityModeratorDTO,
  CommunityPopulatedDTO,
  CommunityPrivateDTO,
  CommunityStatus,
  CommunityType,
  ConversationPopulatedDTO,
  CreditType,
  DepositDTO,
  DepositPopulatedDTO,
  DepositsQueryDTO,
  DepositStatus,
  FeedbackDTO,
  FileMetadata,
  InvitePopulatedDTO,
  InviteStatus,
  InviteType,
  MessageDTO,
  ModeratorRole,
  OrderDTO,
  OrderProductsDTO,
  PaymentDTO,
  PublicationType,
  ReviewDecision,
  ReviewKind,
  ReviewPopulatedDTO,
  ReviewStatus,
  ReviewType,
  SessionDTO,
  StripeLineItem,
  StripeProductDTO,
  StripeProductDTODefaultPrice,
  SubscriptionType,
  UserPrivateDTO,
  UserPublicDTO,
  UserSummaryDTO,
  UserType,
} from '@orvium/api';
import { Factory } from 'fishery';

export function generateObjectId(): string {
  const timestamp = ((new Date().getTime() / 1000) | 0).toString(16);
  return (
    timestamp +
    'xxxxxxxxxxxxxxxx'
      .replace(/[x]/g, function () {
        return ((Math.random() * 16) | 0).toString(16);
      })
      .toLowerCase()
  );
}

export const factoryUserSummaryDTO = Factory.define<UserSummaryDTO>(
  (): UserSummaryDTO => ({
    _id: generateObjectId(),
    userId: 'oauth|id',
    avatar: '',
    gravatar: '',
    nickname: 'user',
    firstName: 'john',
    lastName: 'Doe',
    bannerURL: '',
    institutions: [],
  })
);

export const factoryCommunityModeratorDTO = Factory.define<CommunityModeratorDTO>(
  (): CommunityModeratorDTO => ({
    _id: generateObjectId(),
    moderatorRole: ModeratorRole.Moderator,
    user: factoryUserSummaryDTO.build(),
    notificationOptions: { tracks: [] },
  })
);

export const factoryUserPrivateDTO = Factory.define<UserPrivateDTO>(
  (): UserPrivateDTO => ({
    _id: generateObjectId(),
    userId: 'oauth|id',
    providerIds: ['oauth|id'],
    email: 'test@example.com',
    userType: UserType.Researcher,
    firstName: 'William',
    lastName: 'Wallace',
    isOnboarded: true,
    emailPendingConfirmation: undefined,
    percentageComplete: 0,
    roles: [],
    institutions: [],
    disciplines: [],
    acceptedTC: true,
    avatar: '',
    gravatar: '',
    nickname: 'will-123',
    actions: [],
    starredDeposits: [],
  })
);

export const factoryUserPublicDTO = Factory.define<UserPublicDTO>((): UserPublicDTO => {
  return {
    _id: generateObjectId(),
    firstName: 'William',
    lastName: 'Wallace',
    nickname: 'will-123',
    avatar: '',
    gravatar: '',
    institutions: ['Technical University od HW'],
    userType: UserType.Academic,
    disciplines: [],
    aboutMe: 'Hi! This is me!',
    actions: [],
  };
});

export const factoryDepositPopulatedDTO = Factory.define<DepositPopulatedDTO>(
  (): DepositPopulatedDTO => {
    const creator = factoryUserSummaryDTO.build();
    const community = factoryCommunityDTO.build();
    return {
      _id: generateObjectId(),
      nickname: 'John',
      version: 1,
      creator: creator._id,
      ownerProfile: creator,
      community: community._id,
      communityPopulated: community,
      title: 'Origin of the Species',
      abstract: 'Abstract Abstract Abstract Abstract Abstract Abstract Abstract Abstract Abstract',
      publicationType: PublicationType.Article,
      accessRight: AccessRight.CcBy,
      status: DepositStatus.Draft,
      reviewType: ReviewType.OpenReview,
      acceptedFor: AcceptedFor.Poster,
      authors: [
        {
          firstName: 'john',
          lastName: 'Doe',
          institutions: ['University example'],
          credit: [],
          email: 'john@example.com',
        },
        {
          firstName: 'Monica',
          lastName: 'Michigan',
          institutions: ['University example'],
          credit: [CreditType.Conceptualization],
          email: 'monica@example.com',
        },
      ],
      peerReviews: [],
      keywords: [],
      publicationFile: factoryFileMetadata.build(),
      files: factoryFileMetadata.buildList(2),
      canBeReviewed: true,
      actions: [],
      disciplines: [],
      socialComments: 0,
      isLatestVersion: true,
      views: 0,
      history: [],
      images: [],
      references: [],
      submissionDate: new Date().toISOString(),
      peerReviewsPopulated: [],
      extraMetadata: {},
      bibtexReferences: [],
      canAuthorInviteReviewers: false,
    };
  }
);

export const factoryDepositDTO = Factory.define<DepositDTO>((): DepositDTO => {
  const creator = factoryUserSummaryDTO.build();
  return {
    _id: generateObjectId(),
    nickname: 'John',
    version: 1,
    creator: creator._id,
    community: factoryCommunityPopulatedDTO.build()._id,
    title: 'Origin of the Species',
    abstract: 'Abstract Abstract Abstract Abstract Abstract Abstract Abstract Abstract Abstract',
    publicationType: PublicationType.Article,
    accessRight: AccessRight.CcBy,
    status: DepositStatus.Draft,
    reviewType: ReviewType.OpenReview,
    acceptedFor: AcceptedFor.Poster,
    authors: [
      {
        firstName: 'john',
        lastName: 'Doe',
        institutions: ['University example'],
        credit: [],
        email: 'john@example.com',
      },
      {
        firstName: 'Monica',
        lastName: 'Michigan',
        institutions: ['University example'],
        credit: [CreditType.Conceptualization],
        email: 'monica@example.com',
      },
    ],
    submissionDate: new Date().toISOString(),
    peerReviews: [],
    keywords: [],
    publicationFile: factoryFileMetadata.build(),
    files: factoryFileMetadata.buildList(2),
    canBeReviewed: true,
    actions: [],
    disciplines: [],
    isLatestVersion: true,
    views: 0,
    history: [],
    images: [],
    references: [],
    extraMetadata: {},
    bibtexReferences: [],
    canAuthorInviteReviewers: false,
  };
});

export const factoryFileMetadata = Factory.define<FileMetadata>(
  (): FileMetadata => ({
    filename: 'file',
    description: 'file',
    contentType: 'image/png',
    contentLength: 21500,
    tags: [],
    url: 'mypublication.pdf',
  })
);

export const factoryReviewPopulatedDTO = Factory.define<ReviewPopulatedDTO>(
  (): ReviewPopulatedDTO => {
    const creator = factoryUserSummaryDTO.build();
    const deposit = factoryDepositDTO.build();
    return {
      _id: generateObjectId(),
      creator: creator._id,
      history: [],
      ownerProfile: creator,
      author: 'Author',
      decision: ReviewDecision.Accepted,
      comments: 'This is a very good publication',
      gravatar: '0a2aaae0ac1310d1f8e8e68df45fe7b8',
      creationDate: '01/01/2020',
      publicationDate: '01/01/2020',
      status: ReviewStatus.Published,
      kind: ReviewKind.PeerReview,
      actions: [],
      socialComments: 0,
      extraFiles: [],
      deposit: deposit._id,
      depositPopulated: deposit,
      community: factoryCommunityDTO.build()._id,
      communityPopulated: factoryCommunityPopulatedDTO.build(),
      images: [],
      showIdentityToAuthor: true,
      showIdentityToEveryone: true,
      showReviewToAuthor: false,
      showReviewToEveryone: false,
      views: 0,
    };
  }
);

export const factoryCallDTO = Factory.define<CallDTO>((): CallDTO => {
  return {
    _id: generateObjectId(),
    title: 'A call',
    deadline: new Date(),
    description: 'A description',
    callType: CallType.Papers,
    scope: 'The scope',
    guestEditors: 'John Doe',
    disciplines: ['Environmental technology and design'],
    contact: 'a contact',
    contactEmail: 'example@example.com',
    visible: true,
    community: generateObjectId(),
    actions: [],
  };
});

export const factorySessionDTO = Factory.define<SessionDTO>((): SessionDTO => {
  const date = new Date();
  const dateEnd = new Date(date.getTime() + 100000);
  return {
    _id: generateObjectId(),
    title: 'A Session',
    creator: generateObjectId(),
    community: generateObjectId(),
    dateStart: new Date(),
    dateEnd: dateEnd,
    deposits: [],
    speakers: [],
    actions: [],
  };
});

export const factoryDepositsQuery = Factory.define<DepositsQueryDTO>(
  (): DepositsQueryDTO => ({
    deposits: factoryDepositPopulatedDTO.buildList(2),
    count: 2,
  })
);

export const factoryCommunityCalendarDTO = Factory.define<CalendarDTO>((): CalendarDTO => {
  return {
    date: new Date(),
    message: 'Conference starts today!',
    daysLeft: 3,
  };
});

export const factoryCommunityPopulatedDTO = Factory.define<CommunityPopulatedDTO>(
  (): CommunityPopulatedDTO => ({
    _id: generateObjectId(),
    name: 'HW University of Technology (HW)',
    status: CommunityStatus.Published,
    creator: generateObjectId(),
    codename: 'hw',
    description:
      'Top education and research are at the heart of the oldest and largest technical university in the Atlantis. ' +
      'Our 8 faculties offer 16 bachelors and more than 30 masters programmes. ' +
      'Our more than 25,000 students and 6,000 employees share a fascination for science, design and technology. ' +
      'Our common mission: impact for a better society.',
    country: 'HW, Atlantis',
    twitterURL: 'https://twitter.com/atlantis-fake',
    facebookURL: 'https://www.facebook.com/atlantis-fake/',
    websiteURL: 'https://www.example.com/',
    logoURL: '',
    acknowledgement: '',
    guidelinesURL: '',
    type: CommunityType.Community,
    actions: [],
    moderatorsPopulated: [
      factoryCommunityModeratorDTO.build(),
      factoryCommunityModeratorDTO.build({ moderatorRole: ModeratorRole.Owner }),
    ],
    customLicenses: [AccessRight.Cc0],
    newTracks: [{ timestamp: 1, title: 'biology', description: '' }],
    privateReviews: false,
    subscription: SubscriptionType.Free,
    calendarDates: factoryCommunityCalendarDTO.buildList(1),
    calendarVisible: false,
    views: 0,
    followersCount: 0,
    conferenceProceedings: [],
    conferenceProceedingsPopulated: [],
    productsVisible: false,
    showIdentityToAuthor: true,
    showIdentityToEveryone: true,
    canAuthorInviteReviewers: true,
    showReviewToAuthor: false,
    showReviewToEveryone: false,
  })
);

export const factoryCommunityDTO = Factory.define<CommunityDTO>(
  (): CommunityDTO => ({
    _id: generateObjectId(),
    name: 'HW University of Technology (HW)',
    status: CommunityStatus.Published,
    creator: generateObjectId(),
    codename: 'hw',
    description:
      'Top education and research are at the heart of the oldest and largest technical university in the Atlantis. ' +
      'Our 8 faculties offer 16 bachelors and more than 30 masters programmes. ' +
      'Our more than 25,000 students and 6,000 employees share a fascination for science, design and technology. ' +
      'Our common mission: impact for a better society.',
    country: 'HW, Atlantis',
    twitterURL: 'https://twitter.com/atlantis-fake',
    facebookURL: 'https://www.facebook.com/atlantis-fake/',
    websiteURL: 'https://www.example.com/',
    logoURL: '',
    acknowledgement: '',
    guidelinesURL: '',
    type: CommunityType.Community,
    actions: [],
    customLicenses: [AccessRight.Cc0, AccessRight.CcBy],
    privateReviews: false,
    subscription: SubscriptionType.Free,
    calendarDates: factoryCommunityCalendarDTO.buildList(1),
    calendarVisible: false,
    views: 0,
    followersCount: 0,
    conferenceProceedings: [],
    productsVisible: false,
    newTracks: [],
    showIdentityToAuthor: false,
    showIdentityToEveryone: false,
    canAuthorInviteReviewers: false,
    showReviewToAuthor: false,
    showReviewToEveryone: false,
  })
);

export const factoryAuthorDTO = Factory.define<AuthorDTO>(
  (): AuthorDTO => ({
    firstName: 'john',
    lastName: 'doe',
    email: 'john@example.com',
    gravatar: '191f906338d89d51b29648c89bb612e7',
    nickname: 'john',
    orcid: 'https://orcid.org/0000-0000-0000-0000',
    credit: [],
    institutions: ['Technical University HW', 'Universiteit Atlantis'],
  })
);

export const factoryCommunityPrivateDTO = Factory.define<CommunityPrivateDTO>(
  (): CommunityPrivateDTO => {
    return {
      _id: generateObjectId(),
      name: 'HW University of Technology (HW)',
      codename: 'hw',
      status: CommunityStatus.Published,
      creator: generateObjectId(),
      description:
        'Top education and research are at the heart of the oldest and largest technical university in the Atlantis. ' +
        'Our 8 faculties offer 16 bachelors and more than 30 masters programmes. ' +
        'Our more than 25,000 students and 6,000 employees share a fascination for science, design and technology. ' +
        'Our common mission: impact for a better society.',
      country: 'HW, Atlantis',
      twitterURL: 'https://twitter.com/atlantis-fake',
      facebookURL: 'https://www.facebook.com/atlantis-fake/',
      websiteURL: 'https://www.example.com/',
      logoURL: '',
      views: 0,
      acknowledgement: '',
      guidelinesURL: '',
      type: CommunityType.Community,
      actions: [],
      customLicenses: [AccessRight.Cc0],
      newTracks: [],
      privateReviews: true,
      subscription: SubscriptionType.Free,
      calendarDates: factoryCommunityCalendarDTO.buildList(1),
      calendarVisible: false,
      followersCount: 0,
      conferenceProceedings: [],
      conferenceProceedingsPopulated: [],
      productsVisible: false,
      moderatorsPopulated: [],
      showIdentityToAuthor: false,
      showIdentityToEveryone: false,
      canAuthorInviteReviewers: false,
      showReviewToEveryone: false,
      showReviewToAuthor: false,
      isPrivateDTO: true,
    };
  }
);

export const factoryFeedback = Factory.define<FeedbackDTO>(
  (): FeedbackDTO => ({
    description: 'Feedback report',
    email: 'email@example.com',
  })
);

export const factoryInvitePopulatedDTO = Factory.define<InvitePopulatedDTO>(
  (): InvitePopulatedDTO => {
    const sender = factoryUserSummaryDTO.build();
    return {
      _id: generateObjectId(),
      data: { depositId: generateObjectId(), depositTitle: 'example' },
      inviteType: InviteType.Review,
      status: InviteStatus.Accepted,
      sender: sender._id,
      senderPopulated: sender,
      addressee: '',
      createdOn: new Date('01/01/2010'),
      actions: ['string'],
      dateLimit: new Date(),
    };
  }
);

export const factoryCommentDTO = Factory.define<CommentDTO>((): CommentDTO => {
  return {
    parent: 'xxx',
    resource: 'yyy',
    content: 'My comment',
    hasReplies: false,
    _id: 'ccc',
    actions: [],
    user: factoryUserSummaryDTO.build(),
    tags: [],
    createdAt: new Date('1968-11-16T00:00:00'),
    user_id: 'userId',
    community: generateObjectId(),
  };
});

export const factoryConversationDTO = Factory.define<ConversationPopulatedDTO>(
  (): ConversationPopulatedDTO => {
    const participant = factoryUserSummaryDTO.build();
    return {
      _id: generateObjectId(),
      participants: [participant._id],
      messages: [],
      participantsPopulated: [participant],
      messagesPending: false,
    };
  }
);

export const factoryMessageDTO = Factory.define<MessageDTO>((): MessageDTO => {
  const sender = factoryUserSummaryDTO.build();
  const conversation = factoryConversationDTO.build();
  return {
    _id: generateObjectId(),
    sender: sender._id,
    createdAt: new Date(),
    conversation: conversation._id,
    content: 'Hello',
  };
});

export const factoryStripePrice = Factory.define<StripeProductDTODefaultPrice>(
  (): StripeProductDTODefaultPrice => {
    return {
      id: 'price_xxxxxxxxxxxxxxxxxx',
      object: 'price',
      active: true,
      billing_scheme: 'per_unit',
      created: 1667900666,
      currency: 'usd',
      custom_unit_amount: null,
      livemode: false,
      metadata: {},
      nickname: 'Precio para no universitarios',
      recurring: {
        aggregate_usage: null,
        interval: 'month',
        interval_count: 1,
        trial_period_days: null,
        usage_type: 'licensed',
      },
      tax_behavior: 'unspecified',
      type: 'recurring',
      unit_amount: 25198,
      unit_amount_decimal: '25198',
    };
  }
);

export const factoryStripeProductDTO = Factory.define<StripeProductDTO>((): StripeProductDTO => {
  return {
    id: 'prod_xxxxxxxxxxxxxxxxxx',
    object: 'product',
    active: true,
    attributes: [],
    created: 1667900665,
    default_price: factoryStripePrice.build(),
    description:
      "What is Lorem Ipsum?Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a",
    images: [
      'https://files.stripe.com/links/xxxxxxxxxxxxxxxxxx…xxxxxxxxxxxxxxxxxx',
    ],
    livemode: false,
    metadata: { stock: '100' },
    name: 'PRODUCT_TEST_3[TES]',
    package_dimensions: {},
    type: 'service',
    updated: 1668591757,
    url: null,
    actions: [],
  };
});

export const factoryPaymentDTO = Factory.define<PaymentDTO>(
  (): PaymentDTO => ({
    _id: generateObjectId(),
    community: generateObjectId(),
    customerEmail: 'rose@example.com',
    stripeAccount: 'acct_xxxxxxxxxxxxxxxxxx',
    checkoutSessionId: 'cs_test_bxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxvLR',
    eventName: 'checkout.session',
    eventId: 'evt_xxxxxxxxxxxxxx',
    eventStatus: 'open',
    receiptUrl:
      'https://pay.stripe.com/receipts/payment/xxxxxxxxxxxxxxxxxx-xxxxxxxxxxxxxxxxxx',
    amountTotal: 1.4,
    currency: 'eur',
    communityName: 'The Evolving Scholar',
    date: new Date(),
    order: undefined,
    eventContent: {},
    actions: [],
    userId: generateObjectId(),
  })
);

export const factoryOrderProductsDTO = Factory.define<OrderProductsDTO>(
  (): OrderProductsDTO => ({
    productId: 'prod_xxxxxxxxxxxxxxxx',
    quantity: 1,
  })
);

export const factoryStripeOrderDTO = Factory.define<OrderDTO>(
  (): OrderDTO => ({
    communityId: '5fa1908fd29a17dc961cc435',
    products: [factoryOrderProductsDTO.build()],
  })
);

export const factoryBibtexReference = Factory.define<BibtexReferences>(
  (): BibtexReferences => ({
    title: 'bibtex reference title',
    type: 'article',
    id: 'example',
    raw: '',
  })
);

export const factoryStripeLineItem = Factory.define<StripeLineItem>(
  (): StripeLineItem => ({
    id: generateObjectId(),
    object: '',
    amount_discount: 1,
    amount_subtotal: 1,
    amount_tax: 1,
    amount_total: 1,
    currency: 'eu',
    description: 'testing',
    discounts: [],
    price: {
      unit_amount: 1,
    },
    product: {},
    quantity: {},
    taxes: [],
  })
);
