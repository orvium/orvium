import { Test, TestingModule } from '@nestjs/testing';
import { DepositService } from '../deposit/deposit.service';
import { Deposit, DepositStatus } from '../deposit/deposit.schema';
import { CommunityStatus } from '../communities/communities.schema';
import { ReviewDocument, ReviewStatus } from '../review/review.schema';
import { ReviewService } from '../review/review.service';
import { InviteService } from '../invite/invite.service';
import { InviteStatus, InviteType } from '../invite/invite.schema';
import { AuthorizationService, DEPOSIT_ACTIONS } from './authorization.service';
import {
  createComment,
  createCommunity,
  createDeposit,
  createDepositSet,
  createReview,
  createReviewSet,
  createUser,
  factoryComment,
  factoryReview,
} from '../utils/test-data';
import { CommentsService } from '../comments/comments.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { cleanCollections, MongooseTestingModule } from '../utils/mongoose-testing.module';
import { assertIsDefined } from '../utils/utils';

describe('Authorization-Abilities', () => {
  let reviewService: ReviewService;
  let inviteService: InviteService;
  let authorizationService: AuthorizationService;
  let commentService: CommentsService;
  let cacheManager: Cache;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [MongooseTestingModule.forRoot('AuthorizationService')],
      providers: [],
    }).compile();
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    reviewService = module.get(ReviewService);
    inviteService = module.get(InviteService);
    authorizationService = module.get(AuthorizationService);

    commentService = module.get(CommentsService);
    cacheManager = module.get(CACHE_MANAGER);

    await cleanCollections(module);

    await cacheManager.reset();
  });

  it('Visitor should read only public deposits', async () => {
    const { community } = await createCommunity(module);
    const { draft, pendingApproval, preprint, published } = await createDepositSet(
      module,
      community
    );

    const abilityVisitor = await authorizationService.defineAbilityFor(null);
    expect(abilityVisitor.can('read', draft)).toBe(false);
    expect(abilityVisitor.can('read', pendingApproval)).toBe(false);
    expect(abilityVisitor.can('read', published)).toBe(true);
    expect(abilityVisitor.can('read', preprint)).toBe(true);
  });

  it('should read owner private deposits', async () => {
    const user = await createUser(module);
    const { community } = await createCommunity(module);
    const { draft, pendingApproval, preprint, published } = await createDepositSet(
      module,
      community,
      user
    );

    const ability = await authorizationService.defineAbilityFor(user);
    expect(ability.can('read', draft)).toBe(true);
    expect(ability.can('read', pendingApproval)).toBe(true);
    expect(ability.can('read', preprint)).toBe(true);
    expect(ability.can('read', published)).toBe(true);
  });

  it('should create deposits', async () => {
    const completeRegisteredUser = await createUser(module);
    const ability1 = await authorizationService.defineAbilityFor(completeRegisteredUser);
    expect(ability1.can('create', Deposit.name)).toBe(true);
    const incompleteRegisteredUser = await createUser(module, { user: { isOnboarded: false } });
    const ability2 = await authorizationService.defineAbilityFor(incompleteRegisteredUser);
    expect(ability2.can('create', Deposit.name)).toBe(false);
    const userVisitor = null;
    const abilityVisitor3 = await authorizationService.defineAbilityFor(userVisitor);
    expect(abilityVisitor3.can('create', Deposit.name)).toBe(false);
  });

  it('should update deposits', async () => {
    const completeRegisteredUser = await createUser(module);
    const { community } = await createCommunity(module);
    const { draft, pendingApproval, preprint, published } = await createDepositSet(
      module,
      community,
      completeRegisteredUser
    );

    const ability1 = await authorizationService.defineAbilityFor(completeRegisteredUser);
    expect(ability1.can('update', preprint)).toBe(false);
    expect(ability1.can('update', published)).toBe(false);
    expect(ability1.can('update', pendingApproval)).toBe(false);
    expect(ability1.can('update', draft)).toBe(true);

    const incompleteRegisteredUser = await createUser(module, { user: { isOnboarded: false } });
    const ability2 = await authorizationService.defineAbilityFor(incompleteRegisteredUser);
    expect(ability2.can('update', draft)).toBe(false);
    const userVisitor = null;
    const abilityVisitor3 = await authorizationService.defineAbilityFor(userVisitor);
    expect(abilityVisitor3.can('update', preprint)).toBe(false);
  });

  it('should delete deposits', async () => {
    const { community } = await createCommunity(module);
    const author = await createUser(module);
    const { draft, pendingApproval, preprint, published } = await createDepositSet(
      module,
      community,
      author
    );

    const ability1 = await authorizationService.defineAbilityFor(author);
    expect(ability1.can('delete', preprint)).toBe(false);
    expect(ability1.can('delete', published)).toBe(false);
    expect(ability1.can('delete', pendingApproval)).toBe(false);
    expect(ability1.can('delete', draft)).toBe(true);

    const incompleteRegisteredUser = await createUser(module, { user: { isOnboarded: false } });
    const ability2 = await authorizationService.defineAbilityFor(incompleteRegisteredUser);
    expect(ability2.can('delete', draft)).toBe(false);

    const abilityVisitor3 = await authorizationService.defineAbilityFor(null);
    expect(abilityVisitor3.can('delete', preprint)).toBe(false);
  });

  it('should create new deposit version', async () => {
    const { community } = await createCommunity(module);
    const author = await createUser(module);
    const { draft, pendingApproval, preprint, published } = await createDepositSet(
      module,
      community,
      author
    );
    const admin = await createUser(module, { user: { roles: ['admin'] } });

    const abilityRegistered = await authorizationService.defineAbilityFor(author);
    const abilityAdmin = await authorizationService.defineAbilityFor(admin);
    expect(abilityRegistered.can('createVersion', preprint)).toBe(true);
    expect(abilityRegistered.can('createVersion', published)).toBe(true);
    expect(abilityRegistered.can('createVersion', pendingApproval)).toBe(false);
    expect(abilityRegistered.can('createVersion', draft)).toBe(false);
    expect(abilityAdmin.can('createVersion', preprint)).toBe(true);
    expect(abilityAdmin.can('createVersion', published)).toBe(true);
    expect(abilityAdmin.can('createVersion', pendingApproval)).toBe(true);
    expect(abilityAdmin.can('createVersion', draft)).toBe(true);

    const incompleteRegisteredUser = await createUser(module, { user: { isOnboarded: false } });
    const ability3 = await authorizationService.defineAbilityFor(incompleteRegisteredUser);
    expect(ability3.can('createVersion', draft)).toBe(false);

    const abilityVisitor3 = await authorizationService.defineAbilityFor(null);
    expect(abilityVisitor3.can('createVersion', preprint)).toBe(false);
  });

  it('should create comments', async () => {
    const { community } = await createCommunity(module);
    const { draft, pendingApproval, preprint, published } = await createDepositSet(
      module,
      community
    );

    const completeRegisteredUser = await createUser(module);
    const ability1 = await authorizationService.defineAbilityFor(completeRegisteredUser);
    expect(ability1.can('createComment', preprint)).toBe(true);
    expect(ability1.can('createComment', published)).toBe(true);
    expect(ability1.can('createComment', pendingApproval)).toBe(false);
    expect(ability1.can('createComment', draft)).toBe(false);

    const incompleteRegisteredUser = await createUser(module, { user: { isOnboarded: false } });
    const ability2 = await authorizationService.defineAbilityFor(incompleteRegisteredUser);
    expect(ability2.can('createComment', draft)).toBe(false);

    const abilityVisitor3 = await authorizationService.defineAbilityFor(null);
    expect(abilityVisitor3.can('createComment', preprint)).toBe(false);
  });

  it('should moderate community deposits', async () => {
    const { community, communityOwner, moderator } = await createCommunity(module);
    const { draft, pendingApproval, preprint, published } = await createDepositSet(
      module,
      community
    );
    const ability = await authorizationService.defineAbilityFor(moderator);
    const communityOwnerAbility = await authorizationService.defineAbilityFor(communityOwner);
    expect(ability.can('read', draft)).toBe(true);
    expect(ability.can('read', preprint)).toBe(true);
    expect(ability.can('delete', draft)).toBe(false);
    expect(ability.can('delete', preprint)).toBe(false);
    expect(ability.can('update', draft)).toBe(false);
    expect(ability.can('update', published)).toBe(true);
    expect(ability.can('update', pendingApproval)).toBe(true);
    expect(ability.can('moderate', community)).toBe(true);
    expect(communityOwnerAbility.can('read', draft)).toBe(true);
    expect(communityOwnerAbility.can('read', preprint)).toBe(true);
    expect(communityOwnerAbility.can('delete', draft)).toBe(false);
    expect(communityOwnerAbility.can('delete', preprint)).toBe(false);
    expect(communityOwnerAbility.can('update', draft)).toBe(false);
    expect(communityOwnerAbility.can('update', published)).toBe(true);
    expect(communityOwnerAbility.can('update', pendingApproval)).toBe(true);
    expect(communityOwnerAbility.can('moderate', community)).toBe(true);
  });

  it('should moderate community reviews (community owner and moderator)', async () => {
    const { community, communityOwner, moderator } = await createCommunity(module);
    const { deposit: depositPublished } = await createDeposit(module, {
      community,
      deposit: {
        status: DepositStatus.published,
      },
    });
    const { review: reviewDraft } = await createReview(module, depositPublished, {
      review: { status: ReviewStatus.draft },
    });
    const { review: reviewPendingApproval } = await createReview(module, depositPublished, {
      review: { status: ReviewStatus.pendingApproval },
    });
    const { review: reviewPublished } = await createReview(module, depositPublished, {
      review: { status: ReviewStatus.published },
    });

    const reviewDraftPopulated = await reviewService.findById(reviewDraft._id);
    assertIsDefined(reviewDraftPopulated);
    const reviewPendingApprovalPopulated = await reviewService.findById(reviewPendingApproval._id);
    assertIsDefined(reviewPendingApprovalPopulated);
    const reviewPublishedPopulated = await reviewService.findById(reviewPublished._id);
    assertIsDefined(reviewPublishedPopulated);

    const abilityModerator = await authorizationService.defineAbilityFor(moderator);
    const abilityOwner = await authorizationService.defineAbilityFor(communityOwner);

    expect(abilityModerator.can('read', reviewDraftPopulated)).toBe(true);
    expect(abilityModerator.can('update', reviewDraftPopulated)).toBe(true);
    expect(abilityModerator.can('moderate', reviewDraftPopulated)).toBe(true);
    expect(abilityModerator.can('read', reviewPendingApprovalPopulated)).toBe(true);
    expect(abilityModerator.can('update', reviewPendingApprovalPopulated)).toBe(true);
    expect(abilityModerator.can('moderate', reviewPendingApprovalPopulated)).toBe(true);
    expect(abilityModerator.can('read', reviewPublishedPopulated)).toBe(true);
    expect(abilityModerator.can('update', reviewPublishedPopulated)).toBe(true);
    expect(abilityModerator.can('moderate', reviewPublishedPopulated)).toBe(true);
    expect(abilityOwner.can('read', reviewDraftPopulated)).toBe(true);
    expect(abilityOwner.can('update', reviewDraftPopulated)).toBe(true);
    expect(abilityOwner.can('moderate', reviewDraftPopulated)).toBe(true);
    expect(abilityOwner.can('read', reviewPendingApprovalPopulated)).toBe(true);
    expect(abilityOwner.can('update', reviewPendingApprovalPopulated)).toBe(true);
    expect(abilityOwner.can('moderate', reviewPendingApprovalPopulated)).toBe(true);
    expect(abilityOwner.can('read', reviewPublishedPopulated)).toBe(true);
    expect(abilityOwner.can('update', reviewPublishedPopulated)).toBe(true);
    expect(abilityOwner.can('moderate', reviewPublishedPopulated)).toBe(true);

    //Community Owner and Moderator cant Edit or delete Reviews
    expect(abilityModerator.can('edit', reviewDraftPopulated)).toBe(true);
    expect(abilityModerator.can('edit', reviewPendingApprovalPopulated)).toBe(true);
    expect(abilityModerator.can('edit', reviewPublishedPopulated)).toBe(true);
    expect(abilityModerator.can('delete', reviewDraftPopulated)).toBe(false);
    expect(abilityModerator.can('delete', reviewPendingApprovalPopulated)).toBe(false);
    expect(abilityModerator.can('delete', reviewPublishedPopulated)).toBe(false);
    expect(abilityOwner.can('edit', reviewDraftPopulated)).toBe(true);
    expect(abilityOwner.can('edit', reviewPendingApprovalPopulated)).toBe(true);
    expect(abilityOwner.can('edit', reviewPublishedPopulated)).toBe(true);
    expect(abilityOwner.can('delete', reviewDraftPopulated)).toBe(false);
    expect(abilityOwner.can('delete', reviewPendingApprovalPopulated)).toBe(false);
    expect(abilityOwner.can('delete', reviewPublishedPopulated)).toBe(false);
  });

  describe('Review Authorization', () => {
    it('Visibility with showReviewToAuthor=false and showIdentityToEveryone=false', async () => {
      const { community, moderator } = await createCommunity(module);
      const { deposit, author } = await createDeposit(module, { community });

      const { draft, pendingApproval, published } = await createReviewSet(
        module,
        deposit,
        undefined,
        {
          showReviewToAuthor: false,
          showReviewToEveryone: false,
        }
      );
      const draftPopulated = await reviewService.findById(draft._id);
      assertIsDefined(draftPopulated);
      const pendingApprovalPopulated = await reviewService.findById(pendingApproval._id);
      assertIsDefined(pendingApprovalPopulated);
      const publishedPopulated = await reviewService.findById(published._id);
      assertIsDefined(publishedPopulated);

      const abilityVisitor = await authorizationService.defineAbilityFor(null);
      expect(abilityVisitor.can('read', draftPopulated)).toBe(false);
      expect(abilityVisitor.can('create', draftPopulated)).toBe(false);
      expect(abilityVisitor.can('update', draftPopulated)).toBe(false);
      expect(abilityVisitor.can('delete', draftPopulated)).toBe(false);

      expect(abilityVisitor.can('read', pendingApprovalPopulated)).toBe(false);
      expect(abilityVisitor.can('create', pendingApprovalPopulated)).toBe(false);
      expect(abilityVisitor.can('update', pendingApprovalPopulated)).toBe(false);
      expect(abilityVisitor.can('delete', pendingApprovalPopulated)).toBe(false);

      expect(abilityVisitor.can('read', publishedPopulated)).toBe(false);
      expect(abilityVisitor.can('create', publishedPopulated)).toBe(false);
      expect(abilityVisitor.can('update', publishedPopulated)).toBe(false);
      expect(abilityVisitor.can('delete', publishedPopulated)).toBe(false);

      const abilityAuthor = await authorizationService.defineAbilityFor(author);
      expect(abilityAuthor.can('read', draftPopulated)).toBe(false);
      expect(abilityAuthor.can('create', draftPopulated)).toBe(false);
      expect(abilityAuthor.can('update', draftPopulated)).toBe(false);
      expect(abilityAuthor.can('delete', draftPopulated)).toBe(false);

      expect(abilityAuthor.can('read', pendingApprovalPopulated)).toBe(false);
      expect(abilityAuthor.can('create', pendingApprovalPopulated)).toBe(false);
      expect(abilityAuthor.can('update', pendingApprovalPopulated)).toBe(false);
      expect(abilityAuthor.can('delete', pendingApprovalPopulated)).toBe(false);

      expect(abilityAuthor.can('read', publishedPopulated)).toBe(false);
      expect(abilityAuthor.can('create', publishedPopulated)).toBe(false);
      expect(abilityAuthor.can('update', publishedPopulated)).toBe(false);
      expect(abilityAuthor.can('delete', publishedPopulated)).toBe(false);

      const abilityModerator = await authorizationService.defineAbilityFor(moderator);
      expect(abilityModerator.can('read', draftPopulated)).toBe(true);
      expect(abilityModerator.can('create', draftPopulated)).toBe(false);
      expect(abilityModerator.can('update', draftPopulated)).toBe(true);
      expect(abilityModerator.can('delete', draftPopulated)).toBe(false);

      expect(abilityModerator.can('read', pendingApprovalPopulated)).toBe(true);
      expect(abilityModerator.can('create', pendingApprovalPopulated)).toBe(false);
      expect(abilityModerator.can('update', pendingApprovalPopulated)).toBe(true);
      expect(abilityModerator.can('delete', pendingApprovalPopulated)).toBe(false);

      expect(abilityModerator.can('read', publishedPopulated)).toBe(true);
      expect(abilityModerator.can('create', publishedPopulated)).toBe(false);
      expect(abilityModerator.can('update', publishedPopulated)).toBe(true);
      expect(abilityModerator.can('delete', publishedPopulated)).toBe(false);
    });

    it('Visibility with showReviewToAuthor=true and showIdentityToEveryone=false', async () => {
      const { community, moderator } = await createCommunity(module);
      const { deposit, author } = await createDeposit(module, { community });

      const { draft, pendingApproval, published } = await createReviewSet(
        module,
        deposit,
        undefined,
        {
          showReviewToAuthor: true,
          showReviewToEveryone: false,
        }
      );
      const draftPopulated = await reviewService.findById(draft._id);
      assertIsDefined(draftPopulated);
      const pendingApprovalPopulated = await reviewService.findById(pendingApproval._id);
      assertIsDefined(pendingApprovalPopulated);
      const publishedPopulated = await reviewService.findById(published._id);
      assertIsDefined(publishedPopulated);

      const abilityVisitor = await authorizationService.defineAbilityFor(null);
      expect(abilityVisitor.can('read', draftPopulated)).toBe(false);
      expect(abilityVisitor.can('create', draftPopulated)).toBe(false);
      expect(abilityVisitor.can('update', draftPopulated)).toBe(false);
      expect(abilityVisitor.can('delete', draftPopulated)).toBe(false);

      expect(abilityVisitor.can('read', pendingApprovalPopulated)).toBe(false);
      expect(abilityVisitor.can('create', pendingApprovalPopulated)).toBe(false);
      expect(abilityVisitor.can('update', pendingApprovalPopulated)).toBe(false);
      expect(abilityVisitor.can('delete', pendingApprovalPopulated)).toBe(false);

      expect(abilityVisitor.can('read', publishedPopulated)).toBe(false);
      expect(abilityVisitor.can('create', publishedPopulated)).toBe(false);
      expect(abilityVisitor.can('update', publishedPopulated)).toBe(false);
      expect(abilityVisitor.can('delete', publishedPopulated)).toBe(false);

      const abilityAuthor = await authorizationService.defineAbilityFor(author);
      expect(abilityAuthor.can('read', draftPopulated)).toBe(false);
      expect(abilityAuthor.can('create', draftPopulated)).toBe(false);
      expect(abilityAuthor.can('update', draftPopulated)).toBe(false);
      expect(abilityAuthor.can('delete', draftPopulated)).toBe(false);

      expect(abilityAuthor.can('read', pendingApprovalPopulated)).toBe(false);
      expect(abilityAuthor.can('create', pendingApprovalPopulated)).toBe(false);
      expect(abilityAuthor.can('update', pendingApprovalPopulated)).toBe(false);
      expect(abilityAuthor.can('delete', pendingApprovalPopulated)).toBe(false);

      expect(abilityAuthor.can('read', publishedPopulated)).toBe(true);
      expect(abilityAuthor.can('create', publishedPopulated)).toBe(false);
      expect(abilityAuthor.can('update', publishedPopulated)).toBe(false);
      expect(abilityAuthor.can('delete', publishedPopulated)).toBe(false);

      const abilityModerator = await authorizationService.defineAbilityFor(moderator);
      expect(abilityModerator.can('read', draftPopulated)).toBe(true);
      expect(abilityModerator.can('create', draftPopulated)).toBe(false);
      expect(abilityModerator.can('update', draftPopulated)).toBe(true);
      expect(abilityModerator.can('delete', draftPopulated)).toBe(false);

      expect(abilityModerator.can('read', pendingApprovalPopulated)).toBe(true);
      expect(abilityModerator.can('create', pendingApprovalPopulated)).toBe(false);
      expect(abilityModerator.can('update', pendingApprovalPopulated)).toBe(true);
      expect(abilityModerator.can('delete', pendingApprovalPopulated)).toBe(false);

      expect(abilityModerator.can('read', publishedPopulated)).toBe(true);
      expect(abilityModerator.can('create', publishedPopulated)).toBe(false);
      expect(abilityModerator.can('update', publishedPopulated)).toBe(true);
      expect(abilityModerator.can('delete', publishedPopulated)).toBe(false);
    });

    it('Visibility with showReviewToAuthor=true and showIdentityToEveryone=true', async () => {
      const { community, moderator } = await createCommunity(module);
      const { deposit, author } = await createDeposit(module, { community });

      const { draft, pendingApproval, published } = await createReviewSet(
        module,
        deposit,
        undefined,
        {
          showReviewToAuthor: true,
          showReviewToEveryone: true,
        }
      );
      const draftPopulated = await reviewService.findById(draft._id);
      assertIsDefined(draftPopulated);
      const pendingApprovalPopulated = await reviewService.findById(pendingApproval._id);
      assertIsDefined(pendingApprovalPopulated);
      const publishedPopulated = await reviewService.findById(published._id);
      assertIsDefined(publishedPopulated);

      const abilityVisitor = await authorizationService.defineAbilityFor(null);
      expect(abilityVisitor.can('read', draftPopulated)).toBe(false);
      expect(abilityVisitor.can('create', draftPopulated)).toBe(false);
      expect(abilityVisitor.can('update', draftPopulated)).toBe(false);
      expect(abilityVisitor.can('delete', draftPopulated)).toBe(false);

      expect(abilityVisitor.can('read', pendingApprovalPopulated)).toBe(false);
      expect(abilityVisitor.can('create', pendingApprovalPopulated)).toBe(false);
      expect(abilityVisitor.can('update', pendingApprovalPopulated)).toBe(false);
      expect(abilityVisitor.can('delete', pendingApprovalPopulated)).toBe(false);

      expect(abilityVisitor.can('read', publishedPopulated)).toBe(true);
      expect(abilityVisitor.can('create', publishedPopulated)).toBe(false);
      expect(abilityVisitor.can('update', publishedPopulated)).toBe(false);
      expect(abilityVisitor.can('delete', publishedPopulated)).toBe(false);

      const abilityAuthor = await authorizationService.defineAbilityFor(author);
      expect(abilityAuthor.can('read', draftPopulated)).toBe(false);
      expect(abilityAuthor.can('create', draftPopulated)).toBe(false);
      expect(abilityAuthor.can('update', draftPopulated)).toBe(false);
      expect(abilityAuthor.can('delete', draftPopulated)).toBe(false);

      expect(abilityAuthor.can('read', pendingApprovalPopulated)).toBe(false);
      expect(abilityAuthor.can('create', pendingApprovalPopulated)).toBe(false);
      expect(abilityAuthor.can('update', pendingApprovalPopulated)).toBe(false);
      expect(abilityAuthor.can('delete', pendingApprovalPopulated)).toBe(false);

      expect(abilityAuthor.can('read', publishedPopulated)).toBe(true);
      expect(abilityAuthor.can('create', publishedPopulated)).toBe(false);
      expect(abilityAuthor.can('update', publishedPopulated)).toBe(false);
      expect(abilityAuthor.can('delete', publishedPopulated)).toBe(false);

      const abilityModerator = await authorizationService.defineAbilityFor(moderator);
      expect(abilityModerator.can('read', draftPopulated)).toBe(true);
      expect(abilityModerator.can('create', draftPopulated)).toBe(false);
      expect(abilityModerator.can('update', draftPopulated)).toBe(true);
      expect(abilityModerator.can('delete', draftPopulated)).toBe(false);

      expect(abilityModerator.can('read', pendingApprovalPopulated)).toBe(true);
      expect(abilityModerator.can('create', pendingApprovalPopulated)).toBe(false);
      expect(abilityModerator.can('update', pendingApprovalPopulated)).toBe(true);
      expect(abilityModerator.can('delete', pendingApprovalPopulated)).toBe(false);

      expect(abilityModerator.can('read', publishedPopulated)).toBe(true);
      expect(abilityModerator.can('create', publishedPopulated)).toBe(false);
      expect(abilityModerator.can('update', publishedPopulated)).toBe(true);
      expect(abilityModerator.can('delete', publishedPopulated)).toBe(false);
    });
  });

  it('should review deposits', async () => {
    const { community } = await createCommunity(module);
    const { deposit: depositPublished } = await createDeposit(module, {
      community,
      deposit: {
        status: DepositStatus.published,
      },
    });
    const { deposit: depositDraft } = await createDeposit(module, {
      community,
      deposit: {
        status: DepositStatus.draft,
      },
    });

    const depositService = module.get(DepositService);
    const depositPublishedPopulated = await depositService.findOne({ _id: depositPublished._id });
    assertIsDefined(depositPublishedPopulated);
    const depositDraftPopulated = await depositService.findOne({ _id: depositDraft._id });
    assertIsDefined(depositDraftPopulated);
    const completeRegisteredUser = await createUser(module);
    const ability1 = await authorizationService.defineAbilityFor(completeRegisteredUser);
    expect(ability1.can('review', depositPublishedPopulated)).toBe(true);
    expect(ability1.can('review', depositDraftPopulated)).toBe(false);
    const incompleteRegisteredUser = await createUser(module, {
      user: {
        isOnboarded: false,
      },
    });
    const ability2 = await authorizationService.defineAbilityFor(incompleteRegisteredUser);
    expect(ability2.can('review', depositPublishedPopulated)).toBe(false);
    expect(ability2.can('review', depositDraftPopulated)).toBe(false);
  });

  it('should manage owner reviews', async () => {
    const { community } = await createCommunity(module);
    const { deposit: depositPublished, author } = await createDeposit(module, {
      community,
      deposit: {
        status: DepositStatus.published,
      },
    });
    const notOwnerId = '612579b202a68aafc7ebaaaa';
    const ability = await authorizationService.defineAbilityFor(author);

    const reviewPublishedOwner: ReviewDocument = await reviewService.create(
      factoryReview.build({
        deposit: depositPublished._id,
        creator: author._id,
      })
    );
    const reviewDraftOwner: ReviewDocument = await reviewService.create(
      factoryReview.build({
        deposit: depositPublished._id,
        creator: author._id,
        status: ReviewStatus.draft,
      })
    );
    const reviewPublishedNotOwner: ReviewDocument = await reviewService.create(
      factoryReview.build({
        deposit: depositPublished._id,
        creator: notOwnerId,
      })
    );
    const reviewDraftNotOwner: ReviewDocument = await reviewService.create(
      factoryReview.build({
        deposit: depositPublished._id,
        creator: notOwnerId,
        status: ReviewStatus.draft,
      })
    );
    expect(ability.can('read', reviewPublishedOwner)).toBe(true);
    expect(ability.can('delete', reviewPublishedOwner)).toBe(false);
    expect(ability.can('update', reviewPublishedOwner)).toBe(false);
    expect(ability.can('read', reviewDraftOwner)).toBe(true);
    expect(ability.can('delete', reviewDraftOwner)).toBe(true);
    expect(ability.can('update', reviewDraftOwner)).toBe(true);
    expect(ability.can('read', reviewPublishedNotOwner)).toBe(false);
    expect(ability.can('delete', reviewPublishedNotOwner)).toBe(false);
    expect(ability.can('update', reviewPublishedNotOwner)).toBe(false);
    expect(ability.can('read', reviewDraftNotOwner)).toBe(false);
    expect(ability.can('delete', reviewDraftNotOwner)).toBe(false);
    expect(ability.can('update', reviewDraftNotOwner)).toBe(false);
  });

  it('should join and submit papers to a community', async () => {
    const completeRegisteredUser = await createUser(module);
    const completeRegisteredUserAbility =
      await authorizationService.defineAbilityFor(completeRegisteredUser);
    const incompleteRegisteredUser = await createUser(module, { user: { isOnboarded: false } });
    const incompleteRegisteredUserAbility =
      await authorizationService.defineAbilityFor(incompleteRegisteredUser);
    const { community } = await createCommunity(module);
    expect(completeRegisteredUserAbility.can('join', community)).toBe(true);
    expect(incompleteRegisteredUserAbility.can('join', community)).toBe(false);
    expect(completeRegisteredUserAbility.can('submit', community)).toBe(false);
    expect(incompleteRegisteredUserAbility.can('submit', community)).toBe(false);
  });

  it('should update a community', async () => {
    const completeRegisteredUser = await createUser(module);
    const incompleteRegisteredUser = await createUser(module, { user: { isOnboarded: false } });

    const ability1 = await authorizationService.defineAbilityFor(completeRegisteredUser);
    const ability3 = await authorizationService.defineAbilityFor(incompleteRegisteredUser);
    const { community, communityOwner, moderator } = await createCommunity(module);
    expect(ability1.can('update', community)).toBe(false);
    expect(ability3.can('update', community)).toBe(false);

    const abilityOwner = await authorizationService.defineAbilityFor(communityOwner);
    expect(abilityOwner.can('update', community)).toBe(true);
    expect(ability1.can('update', community)).toBe(false);
    expect(abilityOwner.can('update', community)).toBe(true);
    expect(ability3.can('update', community)).toBe(false);

    const abilityModerator = await authorizationService.defineAbilityFor(moderator);
    expect(abilityModerator.can('update', community)).toBe(false);
  });

  it('should update and delete user', async () => {
    const completeRegisteredUser = await createUser(module);
    const ability1 = await authorizationService.defineAbilityFor(completeRegisteredUser);
    const incompleteRegisteredUser = await createUser(module, { user: { isOnboarded: false } });
    const ability2 = await authorizationService.defineAbilityFor(incompleteRegisteredUser);
    const userVisitor = null;
    const ability3 = await authorizationService.defineAbilityFor(userVisitor);
    expect(ability1.can('update', completeRegisteredUser)).toBe(true);
    expect(ability2.can('update', completeRegisteredUser)).toBe(false);
    expect(ability3.can('update', completeRegisteredUser)).toBe(false);
    expect(ability1.can('delete', completeRegisteredUser)).toBe(false);
    expect(ability2.can('delete', completeRegisteredUser)).toBe(false);
    expect(ability3.can('delete', completeRegisteredUser)).toBe(false);
  });

  it('should invite reviewers', async () => {
    const author = await createUser(module);
    const abilityAuthor = await authorizationService.defineAbilityFor(author);

    const { community, communityOwner: moderator } = await createCommunity(module);
    const { deposit: draft } = await createDeposit(module, {
      community,
      author,
      deposit: { status: DepositStatus.draft },
    });
    const { deposit: pendingApproval } = await createDeposit(module, {
      community,
      author,
      deposit: { status: DepositStatus.pendingApproval },
    });
    const { deposit: published } = await createDeposit(module, {
      community,
      author,
      deposit: { status: DepositStatus.published },
    });
    const { deposit: preprint } = await createDeposit(module, {
      community,
      author,
      deposit: { status: DepositStatus.preprint },
    });

    // By default, authors cannot invite unless canAuthorsInviteReviewers is true
    expect(abilityAuthor.can('inviteReviewers', draft)).toBe(false);
    expect(abilityAuthor.can('inviteReviewers', pendingApproval)).toBe(false);
    expect(abilityAuthor.can('inviteReviewers', published)).toBe(false);
    expect(abilityAuthor.can('inviteReviewers', preprint)).toBe(false);

    await cacheManager.reset();
    const abilityModerator = await authorizationService.defineAbilityFor(moderator);
    expect(abilityModerator.can('inviteReviewers', draft)).toBe(false);
    expect(abilityModerator.can('inviteReviewers', pendingApproval)).toBe(true);
    expect(abilityModerator.can('inviteReviewers', published)).toBe(true);
    expect(abilityModerator.can('inviteReviewers', preprint)).toBe(true);

    // With canAuthorInviteReviewers = true authors can invite in some states
    draft.canAuthorInviteReviewers = true;
    pendingApproval.canAuthorInviteReviewers = true;
    published.canAuthorInviteReviewers = true;
    preprint.canAuthorInviteReviewers = true;

    expect(abilityAuthor.can('inviteReviewers', draft)).toBe(false);
    expect(abilityAuthor.can('inviteReviewers', pendingApproval)).toBe(false);
    expect(abilityAuthor.can('inviteReviewers', published)).toBe(true);
    expect(abilityAuthor.can('inviteReviewers', preprint)).toBe(true);
  });

  it('should update and read invite', async () => {
    const invitationSender = await createUser(module);
    const abilityOwner = await authorizationService.defineAbilityFor(invitationSender);
    const reviewer = await createUser(module);

    const abilityReviewer = await authorizationService.defineAbilityFor(reviewer);
    const abilityVisitor = await authorizationService.defineAbilityFor(null);
    const { community } = await createCommunity(module);
    let invitePending = new inviteService.inviteModel({
      status: InviteStatus.pending,
      inviteType: InviteType.review,
      sender: invitationSender._id,
      addressee: reviewer.email,
      createdOn: new Date(),
      community: community._id,
    });
    invitePending = await invitePending.save();
    let inviteAccepted = new inviteService.inviteModel({
      status: InviteStatus.accepted,
      inviteType: InviteType.review,
      sender: invitationSender._id,
      addressee: reviewer.email,
      createdOn: new Date(),
      community: community._id,
    });
    inviteAccepted = await inviteAccepted.save();
    expect(abilityOwner.can('read', invitePending)).toBe(true);
    expect(abilityOwner.can('update', invitePending)).toBe(false);
    expect(abilityReviewer.can('read', invitePending)).toBe(true);
    expect(abilityReviewer.can('update', invitePending)).toBe(true);
    expect(abilityVisitor.can('read', invitePending)).toBe(false);
    expect(abilityVisitor.can('update', invitePending)).toBe(false);
    expect(abilityOwner.can('read', inviteAccepted)).toBe(true);
    expect(abilityOwner.can('update', inviteAccepted)).toBe(false);
    expect(abilityReviewer.can('read', inviteAccepted)).toBe(true);
    expect(abilityReviewer.can('update', inviteAccepted)).toBe(false);
    expect(abilityVisitor.can('read', inviteAccepted)).toBe(false);
    expect(abilityVisitor.can('update', inviteAccepted)).toBe(false);
  });

  it('should delete comment', async () => {
    const { community, moderator } = await createCommunity(module);
    const { deposit } = await createDeposit(module, {
      community,
      deposit: {
        status: DepositStatus.published,
      },
    });
    const { comment, user: ownerComment } = await createComment(module, deposit);
    const ownerCommentAbility = await authorizationService.defineAbilityFor(ownerComment);
    const moderatorCommentAbility = await authorizationService.defineAbilityFor(moderator);
    // comment owner can delete her comment
    expect(ownerCommentAbility.can('delete', comment)).toBe(true);
    // cannot delete comments from other users
    const { comment: commentFromOtherUser } = await createComment(module, deposit);
    expect(ownerCommentAbility.can('delete', commentFromOtherUser)).toBe(false);

    // moderator can delete comments from her community
    expect(moderatorCommentAbility.can('delete', commentFromOtherUser)).toBe(true);
    // moderator cannot delete comments from other community
    const { deposit: depositFromOtherCommunity } = await createDeposit(module);
    const { comment: commentFromOtherCommunity } = await createComment(
      module,
      depositFromOtherCommunity
    );
    expect(moderatorCommentAbility.can('delete', commentFromOtherCommunity)).toBe(false);
  });

  it('should reply comment', async () => {
    const { community } = await createCommunity(module);
    const { deposit } = await createDeposit(module, {
      community,
      deposit: {
        status: DepositStatus.published,
      },
    });
    const completeRegisteredUser = await createUser(module);
    const abilityCompleteRegisteredUser =
      await authorizationService.defineAbilityFor(completeRegisteredUser);
    const { comment: mainComment } = await createComment(module, deposit, undefined);

    expect(abilityCompleteRegisteredUser.can('reply', mainComment)).toBe(true);
    const replyComment = new commentService.commentModel(
      factoryComment.build({
        user_id: completeRegisteredUser._id,
        resource: deposit._id,
        parent: mainComment._id.toHexString(),
      })
    );
    expect(abilityCompleteRegisteredUser.can('reply', replyComment)).toBe(false);
  });

  it('should only read for anonymous', async () => {
    const { deposit } = await createDeposit(module);
    const { comment } = await createComment(module, deposit);
    const abilityForAnon = await authorizationService.defineAbilityFor(null);
    expect(abilityForAnon.can('read', comment)).toBe(true);
    expect(abilityForAnon.can('reply', comment)).toBe(false);
    expect(abilityForAnon.can('delete', comment)).toBe(false);
  });

  it('should manage when user can do a specific action on a subject', async () => {
    const abilityVisitor = await authorizationService.defineAbilityFor(null);
    const { community } = await createCommunity(module);
    const { deposit } = await createDeposit(module, {
      community,
      deposit: {
        status: DepositStatus.published,
      },
    });
    const depositService = module.get(DepositService);
    const depositPopulated = await depositService.findById(deposit._id);
    assertIsDefined(depositPopulated);

    expect(() => {
      authorizationService.canDo(abilityVisitor, DEPOSIT_ACTIONS.update, depositPopulated);
    }).toThrow();
    authorizationService.canDo(abilityVisitor, DEPOSIT_ACTIONS.read, depositPopulated);
  });

  it('should return user allowed actions on a subject', async () => {
    const { community } = await createCommunity(module);
    const { deposit, author } = await createDeposit(module, {
      community,
      deposit: {
        status: DepositStatus.published,
        canAuthorInviteReviewers: true,
      },
    });

    expect(await authorizationService.getSubjectActions(null, deposit)).toStrictEqual(['read']);
    expect(await authorizationService.getSubjectActions(author, deposit)).toStrictEqual([
      'read',
      'create',
      'inviteReviewers',
      'createVersion',
      'createComment',
      'edit',
    ]);
  });

  it('should read a not published community', async () => {
    const completeRegisteredUser = await createUser(module);
    const incompleteRegisteredUser = await createUser(module, { user: { isOnboarded: false } });
    const abilityRegistered = await authorizationService.defineAbilityFor(completeRegisteredUser);
    const abilityIncomplete = await authorizationService.defineAbilityFor(incompleteRegisteredUser);
    const { community, communityOwner } = await createCommunity(module, {
      community: { status: CommunityStatus.draft },
    });
    const abilityOwner = await authorizationService.defineAbilityFor(communityOwner);

    expect(abilityRegistered.can('read', community)).toBe(false);
    expect(abilityIncomplete.can('read', community)).toBe(false);
    expect(abilityOwner.can('read', community)).toBe(true);
  });
});
