import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { InviteDocument, InviteStatus } from '../invite/invite.schema';
import { UserDocument } from '../users/user.schema';
import { DepositDocument, DepositStatus } from '../deposit/deposit.schema';
import { CommunityDocument, CommunityStatus } from '../communities/communities.schema';
import { ReviewDocument, ReviewStatus } from '../review/review.schema';
import {
  Ability,
  AbilityBuilder,
  AbilityClass,
  ForbiddenError,
  RawRuleOf,
  Subject,
} from '@casl/ability';
import { ModeratorRole } from '../communities/communities-moderator.schema';
import { CommunitiesService, CommunityDocumentPopulated } from '../communities/communities.service';
import { CommentaryDocument } from '../comments/comments.schema';
import { InviteService } from '../invite/invite.service';
import { ConversationDocument } from '../conversations/conversations.schema';
import { PopulatedDepositDocument } from '../deposit/deposit.service';
import { SessionDocument } from '../session/session.schema';
import {
  CommentaryCLASSNAME,
  CommunityCLASSNAME,
  ConversationCLASSNAME,
  DepositCLASSNAME,
  InviteCLASSNAME,
  ReviewCLASSNAME,
  SessionCLASSNAME,
  UserCLASSNAME,
} from '../utils/utils';
import { ReviewDocumentPopulated } from '../review/review.service';
import { PopulatedCommentaryDocument } from '../comments/comments.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { environment } from '../environments/environment';

interface userAbility {
  userMongoId: string;
  rules: RawRuleOf<AppAbility>[];
}

export type SubjectList =
  | DepositDocument
  | CommunityDocument
  | CommunityDocumentPopulated
  | ReviewDocument
  | ReviewDocumentPopulated
  | UserDocument
  | InviteDocument
  | CommentaryDocument
  | PopulatedCommentaryDocument
  | ConversationDocument
  | SessionDocument
  | string;

const actionsMap = new Map<Subject, readonly string[]>();

type AdminAbilities = ['manage', 'all'];

/**
 * Enum for deposits-related actions.
 */
export enum DEPOSIT_ACTIONS {
  read = 'read',
  update = 'update',
  updateCommunity = 'updateCommunity',
  create = 'create',
  delete = 'delete',
  inviteReviewers = 'inviteReviewers',
  createVersion = 'createVersion',
  createComment = 'createComment',
  review = 'review',
  moderate = 'moderate',
  edit = 'edit',
}

/**
 * Defines action types for deposits.
 */
const depositActions = Object.keys(DEPOSIT_ACTIONS);
type DepositActions = (typeof depositActions)[number];
type DepositAbilities = [DepositActions, DepositDocument | typeof DepositCLASSNAME];
actionsMap.set(DepositCLASSNAME, depositActions);

/**
 * Enum for review-related actions.
 */
export enum REVIEW_ACTIONS {
  read = 'read',
  update = 'update',
  delete = 'delete',
  createComment = 'createComment',
  moderate = 'moderate',
  edit = 'edit',
}

/**
 * Defines action types for reviews.
 */
const reviewActions = Object.keys(REVIEW_ACTIONS);
type ReviewActions = (typeof reviewActions)[number];
type ReviewAbilities = [ReviewActions, ReviewDocument | typeof ReviewCLASSNAME];
actionsMap.set(ReviewCLASSNAME, reviewActions);

/**
 * Enum for session-related actions.
 */
export enum SESSION_ACTIONS {
  read = 'read',
  delete = 'delete',
  edit = 'edit',
}

/**
 * Defines action types for sessions.
 */
const sessionActions = Object.keys(SESSION_ACTIONS);
type SessionActions = (typeof sessionActions)[number];
type SessionAbilities = [SessionActions, SessionDocument | typeof SessionCLASSNAME];
actionsMap.set(SessionCLASSNAME, sessionActions);

/**
 * Enum for conversation-related actions.
 */
export enum CONVERSATION_ACTIONS {
  create = 'create',
  read = 'read',
  postMessage = 'postMessage',
}
/**
 * Defines action types for conversation.
 */
const conversationActions = Object.keys(CONVERSATION_ACTIONS);
type ConversationActions = (typeof conversationActions)[number];
type ConversationAbilities = [
  ConversationActions,
  ConversationDocument | typeof ConversationCLASSNAME,
];
actionsMap.set(ConversationCLASSNAME, conversationActions);

/**
 * Enum for user-related actions.
 */
export enum USER_ACTIONS {
  read = 'read',
  update = 'update',
}

/**
 * Defines action types for users.
 */
const userActions = Object.keys(USER_ACTIONS);
type UserActions = (typeof userActions)[number];
type UserAbilities = [UserActions, UserDocument | typeof UserCLASSNAME];
actionsMap.set(UserCLASSNAME, userActions);

/**
 * Enum for community-related actions.
 */
export enum COMMUNITY_ACTIONS {
  create = 'create',
  delete = 'delete',
  read = 'read',
  update = 'update',
  join = 'join',
  submit = 'submit',
  moderate = 'moderate',
}

/**
 * Defines action types for communities.
 */
const communityActions = Object.keys(COMMUNITY_ACTIONS);
type CommunityActions = (typeof communityActions)[number];
type CommunityAbilities = [CommunityActions, CommunityDocument | typeof CommunityCLASSNAME];
actionsMap.set(CommunityCLASSNAME, communityActions);

/**
 * Enum for invite-related actions.
 */
export enum INVITE_ACTIONS {
  read = 'read',
  update = 'update',
}

/**
 * Defines action types for invites.
 */
const inviteActions = Object.keys(INVITE_ACTIONS);
type InviteActions = (typeof inviteActions)[number];
type InviteAbilities = [InviteActions, InviteDocument | typeof InviteCLASSNAME];
actionsMap.set(InviteCLASSNAME, inviteActions);

/**
 * Enum for comment-related actions.
 */
export enum COMMENT_ACTIONS {
  read = 'read',
  delete = 'delete',
  reply = 'reply',
}

/**
 * Defines action types for comments.
 */
const commentActions = Object.keys(COMMENT_ACTIONS);
type CommentActions = (typeof commentActions)[number];
type CommentAbilities = [CommentActions, CommentaryDocument | typeof CommentaryCLASSNAME];
actionsMap.set(CommentaryCLASSNAME, commentActions);

/**
 * Represents a union type of all ability arrays across different domains.
 */
type Abilities =
  | AdminAbilities
  | DepositAbilities
  | UserAbilities
  | CommunityAbilities
  | ReviewAbilities
  | InviteAbilities
  | CommentAbilities
  | ConversationAbilities
  | SessionAbilities;

export type AppAbility = Ability<Abilities>;
export const AppAbility = Ability as AbilityClass<AppAbility>;

/**
 * Service responsible for defining and managing authorization rules and abilities.
 */
@Injectable()
export class AuthorizationService {
  /**
   * Initializes the class with a cache manager, as well as services for communities and invites.
   * @constructor
   * @param {Cache} cacheManager - Cache manager instance.
   * @param {CommunitiesService} communitiesService - Service for communities.
   * @param {InviteService} inviteService - Service for invites.
   */
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private communitiesService: CommunitiesService,
    private inviteService: InviteService
  ) {}

  /**
   * Define the rules for a visitor (not logged user)
   *
   * @returns {RawRuleOf<AppAbility>[]} visitor user rules
   */
  visitor(): RawRuleOf<AppAbility>[] {
    const builder = new AbilityBuilder(AppAbility);
    builder.can(USER_ACTIONS.read, UserCLASSNAME);
    builder.can(DEPOSIT_ACTIONS.read, DepositCLASSNAME, {
      status: {
        $in: [DepositStatus.preprint, DepositStatus.published],
      },
    });
    builder.can(REVIEW_ACTIONS.read, ReviewCLASSNAME, {
      status: ReviewStatus.published,
      showReviewToEveryone: true,
    });
    builder.can(COMMUNITY_ACTIONS.read, CommunityCLASSNAME, { status: CommunityStatus.published });
    builder.can(COMMENT_ACTIONS.read, CommentaryCLASSNAME);
    builder.can(SESSION_ACTIONS.read, SessionCLASSNAME);
    return builder.rules;
  }

  /**
   * Define the rules for an incomplete registered user (has not completed the onboarding or has not verified email)
   *
   * @param user The user document of the incomplete registered user.
   * @returns {RawRuleOf<AppAbility>[]} Set of rules applicable to an incomplete registered user.
   */
  incompleteRegisteredUser(user: UserDocument): RawRuleOf<AppAbility>[] {
    const builder = new AbilityBuilder(AppAbility);
    builder.rules = builder.rules.concat(this.visitor());
    builder.can(USER_ACTIONS.update, UserCLASSNAME, { _id: user._id });
    return builder.rules;
  }

  /**
   * Define the rules for a registered user
   *
   * @param user The user document of the registered user.
   * @returns {RawRuleOf<AppAbility>[]} registered user rules
   */
  async registeredUser(user: UserDocument): Promise<RawRuleOf<AppAbility>[]> {
    const rules: RawRuleOf<AppAbility>[] = [
      // Deposit rules
      {
        action: [DEPOSIT_ACTIONS.read, DEPOSIT_ACTIONS.edit],
        subject: DepositCLASSNAME,
        conditions: {
          creator: user._id,
        },
      },
      { action: DEPOSIT_ACTIONS.create, subject: DepositCLASSNAME },
      {
        action: [DEPOSIT_ACTIONS.update, DEPOSIT_ACTIONS.delete],
        subject: DepositCLASSNAME,
        conditions: { creator: user._id, status: DepositStatus.draft },
      },
      {
        action: DEPOSIT_ACTIONS.updateCommunity,
        subject: DepositCLASSNAME,
        conditions: { creator: user._id, status: DepositStatus.draft, version: 1 },
      },
      {
        action: DEPOSIT_ACTIONS.createVersion,
        subject: DepositCLASSNAME,
        conditions: {
          creator: user._id,
          status: { $in: [DepositStatus.preprint, DepositStatus.published] },
          isLatestVersion: true,
        },
      },
      {
        action: DEPOSIT_ACTIONS.inviteReviewers,
        subject: DepositCLASSNAME,
        conditions: {
          creator: user._id,
          status: { $in: [DepositStatus.preprint, DepositStatus.published] },
          canAuthorInviteReviewers: true,
          isLatestVersion: true,
        },
      },
      {
        action: DEPOSIT_ACTIONS.createComment,
        subject: DepositCLASSNAME,
        conditions: { status: { $in: [DepositStatus.preprint, DepositStatus.published] } },
      },
      {
        action: DEPOSIT_ACTIONS.review,
        subject: DepositCLASSNAME,
        conditions: {
          creator: { $ne: user._id },
          status: { $in: [DepositStatus.preprint, DepositStatus.published] },
          canBeReviewed: true,
          'peerReviewsPopulated.creator': { $ne: user._id },
          'communityPopulated.privateReviews': false,
        },
      },
      // Review rules
      {
        action: [REVIEW_ACTIONS.read, REVIEW_ACTIONS.edit],
        subject: ReviewCLASSNAME,
        conditions: {
          creator: user._id,
        },
      },
      {
        action: REVIEW_ACTIONS.read,
        subject: ReviewCLASSNAME,
        conditions: {
          'depositPopulated.creator': user._id,
          status: ReviewStatus.published,
          showReviewToAuthor: true,
        },
      },
      {
        action: REVIEW_ACTIONS.update,
        subject: ReviewCLASSNAME,
        conditions: { creator: user._id, status: ReviewStatus.draft },
      },
      {
        action: REVIEW_ACTIONS.delete,
        subject: ReviewCLASSNAME,
        conditions: { creator: user._id, status: ReviewStatus.draft },
      },
      {
        action: REVIEW_ACTIONS.createComment,
        subject: ReviewCLASSNAME,
        conditions: {
          status: { $in: [ReviewStatus.published] },
          creator: user._id,
        },
      },
      {
        action: REVIEW_ACTIONS.createComment,
        subject: ReviewCLASSNAME,
        conditions: {
          status: { $in: [ReviewStatus.published] },
          'depositPopulated.creator': user._id,
        },
      },
      // Community
      { action: COMMUNITY_ACTIONS.join, subject: CommunityCLASSNAME },
      {
        action: [COMMUNITY_ACTIONS.submit, COMMUNITY_ACTIONS.update],
        subject: CommunityCLASSNAME,
        conditions: {
          creator: user._id,
          status: CommunityStatus.draft,
        },
      },
      {
        action: COMMUNITY_ACTIONS.read,
        subject: CommunityCLASSNAME,
        conditions: {
          creator: user._id,
        },
      },
      // User
      {
        action: USER_ACTIONS.update,
        subject: UserCLASSNAME,
        conditions: { _id: user._id },
      },
      // Invite
      {
        action: INVITE_ACTIONS.read,
        subject: InviteCLASSNAME,
        conditions: { 'sender._id': user._id },
      },
      {
        action: INVITE_ACTIONS.read,
        subject: InviteCLASSNAME,
        conditions: { addressee: user.email },
      },
      {
        action: INVITE_ACTIONS.update,
        subject: InviteCLASSNAME,
        conditions: { status: InviteStatus.pending, addressee: user.email },
      },
      // Comment
      {
        action: COMMENT_ACTIONS.delete,
        subject: CommentaryCLASSNAME,
        conditions: { user_id: user._id },
      },
      {
        action: COMMENT_ACTIONS.reply,
        subject: CommentaryCLASSNAME,
        conditions: { parent: undefined },
      },
      // Conversations
      {
        action: CONVERSATION_ACTIONS.read,
        subject: ConversationCLASSNAME,
        conditions: { participants: { $in: [user._id] } },
      },
    ];

    const invitations = await this.inviteService.inviteModel.find({
      addressee: user.email,
    });

    if (invitations.length > 0) {
      const invitedDeposits = [];

      for (const invitation of invitations) {
        invitedDeposits.push(invitation.data.depositId);
      }

      rules.push(
        {
          action: [DEPOSIT_ACTIONS.review],
          subject: DepositCLASSNAME,
          conditions: {
            creator: { $ne: user._id },
            _id: { $in: invitedDeposits },
            status: {
              $in: [DepositStatus.preprint, DepositStatus.published, DepositStatus.pendingApproval],
            },
            'peerReviewsPopulated.creator': { $ne: user._id },
            canBeReviewed: true,
          },
        },
        {
          action: [DEPOSIT_ACTIONS.read],
          subject: DepositCLASSNAME,
          conditions: {
            _id: { $in: invitedDeposits },
            status: {
              $in: [DepositStatus.preprint, DepositStatus.published, DepositStatus.pendingApproval],
            },
          },
        }
      );
    }

    // Handle permissions for the specific of whitelabel solution
    if (!environment.onlyAdminsCreateCommunities) {
      rules.push({ action: COMMUNITY_ACTIONS.create, subject: CommunityCLASSNAME });
    }

    return rules;
  }

  /**
   * Define the rules for a community moderator user
   *
   * @returns {RawRuleOf<AppAbility>[]} moderator rules
   * @param user The user document of the moderator.
   * @param communitiesIDs Array of community IDs the user moderates.
   */
  moderator(user: UserDocument, communitiesIDs: string[]): RawRuleOf<AppAbility>[] {
    return [
      {
        action: [
          DEPOSIT_ACTIONS.read,
          DEPOSIT_ACTIONS.update,
          DEPOSIT_ACTIONS.createComment,
          DEPOSIT_ACTIONS.moderate,
          DEPOSIT_ACTIONS.edit,
          DEPOSIT_ACTIONS.inviteReviewers,
        ],
        subject: DepositCLASSNAME,
        conditions: {
          community: { $in: communitiesIDs },
          status: {
            $in: [
              DepositStatus.pendingApproval,
              DepositStatus.preprint,
              DepositStatus.published,
              DepositStatus.merged,
              DepositStatus.rejected,
            ],
          },
        },
      },
      {
        action: [DEPOSIT_ACTIONS.read],
        subject: DepositCLASSNAME,
        conditions: {
          community: { $in: communitiesIDs },
          status: DepositStatus.draft,
        },
      },
      {
        action: [
          REVIEW_ACTIONS.read,
          REVIEW_ACTIONS.update,
          REVIEW_ACTIONS.edit,
          REVIEW_ACTIONS.moderate,
        ],
        subject: ReviewCLASSNAME,
        conditions: {
          community: { $in: communitiesIDs },
          status: {
            $in: [ReviewStatus.pendingApproval, ReviewStatus.published, ReviewStatus.draft],
          },
        },
      },
      {
        action: COMMUNITY_ACTIONS.moderate,
        subject: CommunityCLASSNAME,
        conditions: { _id: { $in: communitiesIDs } },
      },
      {
        action: [SESSION_ACTIONS.edit, SESSION_ACTIONS.delete],
        subject: SessionCLASSNAME,
        conditions: { 'community._id': { $in: communitiesIDs } },
      },
      {
        action: [COMMENT_ACTIONS.delete],
        subject: CommentaryCLASSNAME,
        conditions: { 'community._id': { $in: communitiesIDs } },
      },
    ];
  }

  /**
   * Define the rules for a community owner user
   *
   * @returns {RawRuleOf<AppAbility>[]} moderator rules
   * @param user The user document of the owner.
   * @param communitiesIDs Array of community IDs the user owns.
   */
  owner(user: UserDocument, communitiesIDs: string[]): RawRuleOf<AppAbility>[] {
    return [
      {
        action: [COMMUNITY_ACTIONS.update, COMMUNITY_ACTIONS.moderate],
        subject: CommunityCLASSNAME,
        conditions: { _id: { $in: communitiesIDs } },
      },
    ];
  }

  /**
   * Define the rules for an admin user
   *
   * @returns {RawRuleOf<AppAbility>[]} admin rules
   */
  admin(): RawRuleOf<AppAbility>[] {
    return [{ action: 'manage', subject: 'all' }];
  }

  /**
   * Define the ability for an specific user
   *
   * @returns {Ability} CASL Ability
   * @param user
   */
  async defineAbilityFor(user: UserDocument | null): Promise<Ability> {
    const usersAbilities = (await this.cacheManager.get<userAbility[]>('user-ability')) || [];
    const userAbility = usersAbilities.find(
      elem => user && elem.userMongoId === user._id.toHexString()
    );
    if (userAbility) {
      const builder = new AbilityBuilder(Ability);
      builder.rules = userAbility.rules;
      return builder.build();
    }
    const builder = new AbilityBuilder(Ability);
    let rules: RawRuleOf<AppAbility>[] = [];
    const roles = await this.getUserRoles(user);
    if (!user) {
      rules = rules.concat(this.visitor());
      builder.rules = rules;
      return builder.build();
    }
    for (const role of roles) {
      switch (role) {
        case 'visitor':
          rules = rules.concat(this.visitor());
          break;
        case 'registered':
          rules = rules.concat(await this.registeredUser(user));
          // Check if moderator
          const communitiesModeratorIds = await this.communityModeratorIDs(user);
          if (communitiesModeratorIds.length > 0) {
            rules = rules.concat(this.moderator(user, communitiesModeratorIds));
          }
          // Check if owner
          const communityOwnerIDs = await this.communityOwnerIDs(user);
          if (communityOwnerIDs.length > 0) {
            rules = rules.concat(this.moderator(user, communityOwnerIDs)); // add moderator rules
            rules = rules.concat(this.owner(user, communityOwnerIDs)); // add owner rules
          }
          break;
        case 'incompleteRegistered':
          rules = rules.concat(this.incompleteRegisteredUser(user));
          break;
        case 'admin':
          rules = rules.concat(this.admin());
          break;
      }
    }
    builder.rules = rules;
    const ability = builder.build();
    // @ts-expect-error
    usersAbilities.push({ rules: builder.rules, userMongoId: user._id.toHexString() });
    // Default expiration time of the cache is 5 seconds
    await this.cacheManager.set('user-ability', usersAbilities);
    return ability;
  }

  async getUserRoles(user?: UserDocument | null): Promise<string[]> {
    const roles = ['visitor'];
    if (user) {
      if (!user.isOnboarded) {
        roles.push('incompleteRegistered');
      } else {
        roles.push('registered');
      }

      if (user.roles.includes('admin')) {
        roles.push('admin');
      }
    }

    return roles;
  }

  /**
   * Check if the user is moderator returning the communities IDs
   *
   * @returns {string[]} the IDs of the communities that the user is a moderator
   * @param user the user document
   */
  async communityModeratorIDs(user: UserDocument): Promise<string[]> {
    const communityModeratorDocuments = await this.communitiesService.findModerators({
      user: user._id,
      moderatorRole: ModeratorRole.moderator,
    });
    return communityModeratorDocuments.map(moderator => moderator.community.toHexString());
  }

  /**
   * Check if the user is owner returning the communities IDs
   *
   * @returns {string[]} the IDs of the communities that the user is owner
   * @param user the user document
   */
  async communityOwnerIDs(user: UserDocument): Promise<string[]> {
    const communityOwnerDocuments = await this.communitiesService.findModerators({
      user: user._id,
      moderatorRole: ModeratorRole.owner,
    });
    return communityOwnerDocuments.map(owner => owner.community.toHexString());
  }

  /**
   * Check if the user is authorized and if is not, throws an exception
   *
   * @returns {boolean} true if it is authorized, exception if is not
   * @param ability
   * @param action
   * @param subject
   */
  canDo(
    ability: Ability,
    action: DEPOSIT_ACTIONS,
    subject: typeof DepositCLASSNAME | PopulatedDepositDocument
  ): void;
  canDo(
    ability: Ability,
    action: COMMUNITY_ACTIONS,
    subject: typeof CommunityCLASSNAME | CommunityDocumentPopulated
  ): void;
  canDo(
    ability: Ability,
    action: REVIEW_ACTIONS,
    subject: typeof ReviewCLASSNAME | ReviewDocumentPopulated
  ): void;
  canDo(
    ability: Ability,
    action: COMMENT_ACTIONS,
    subject: typeof CommentaryCLASSNAME | CommentaryDocument | PopulatedCommentaryDocument
  ): void;
  canDo(
    ability: Ability,
    action: SESSION_ACTIONS,
    subject: typeof SessionCLASSNAME | SessionDocument
  ): void;
  canDo(
    ability: Ability,
    action: INVITE_ACTIONS,
    subject: typeof InviteCLASSNAME | InviteDocument
  ): void;
  canDo(ability: Ability, action: USER_ACTIONS, subject: typeof UserCLASSNAME | UserDocument): void;
  canDo(
    ability: Ability,
    action: CONVERSATION_ACTIONS,
    subject: typeof ConversationCLASSNAME | ConversationDocument
  ): void;
  canDo(ability: Ability, action: string, subject: Subject): void {
    try {
      ForbiddenError.from(ability).throwUnlessCan(action, subject);
    } catch (error) {
      throw new UnauthorizedException(`Unauthorized action ${action}`);
    }
  }

  /**
   * Returns user actions for a subject
   *
   * @returns {string[]} user actions
   */
  async getSubjectActions(user: UserDocument | null, subject: SubjectList): Promise<string[]> {
    const ability = await this.defineAbilityFor(user);
    const detectSubjectType = ability.detectSubjectType(subject);
    const actions = actionsMap.get(detectSubjectType);
    const allowedActions: string[] = [];

    if (actions) {
      for (const action of actions) {
        if (ability.can(action, subject)) {
          allowedActions.push(action);
        }
      }
    }

    return allowedActions;
  }
}
