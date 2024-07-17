import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './user.schema';
import { CommunityDocument } from '../communities/communities.schema';
import { assertIsDefined } from '../utils/utils';
import { CommunitiesService, CommunityDocumentPopulated } from '../communities/communities.service';
import { DepositService } from '../deposit/deposit.service';
import { ReviewService } from '../review/review.service';
import { CommentsService } from '../comments/comments.service';
import { StrictFilterQuery } from '../utils/types';
import { AuthPayload } from '../auth/jwt.strategy';

/**
 * Service for handling UserService.
 */
@Injectable()
export class UserService {
  /**
   * Constructs an instance of UserService with required services.
   *
   * @param {Model<User>} userModel - Model for users.
   * @param {DepositService} depositService - Service for deposits.
   * @param {ReviewService} reviewService - Service for reviews.
   * @param {CommunitiesService} communitiesService - Service for communities.
   * @param {CommentsService} commentsService - Service for comments.
   */
  constructor(
    @InjectModel(User.name) public userModel: Model<User>,
    private depositService: DepositService,
    private reviewService: ReviewService,
    private communitiesService: CommunitiesService,
    private commentsService: CommentsService
  ) {}

  /**
   * Finds users based on the provided filter.
   *
   * @param {StrictFilterQuery<UserDocument>} filter - The filter to apply when searching for users.
   * @returns {Promise<UserDocument[]>} The array of found UserDocument objects.
   */
  async find(filter: StrictFilterQuery<UserDocument>): Promise<UserDocument[]> {
    return this.userModel.find(filter).exec();
  }

  /**
   * Retrieves the logged-in user based on the request.
   *
   * @param {Express.Request} request - The request object.
   * @param {boolean} [skipImpersonate=false] - Whether to skip impersonation logic.
   * @returns {Promise<UserDocument | null>} The logged-in user or null if not found.
   */
  async getLoggedUser(
    request: Express.Request,
    skipImpersonate = false
  ): Promise<UserDocument | null> {
    const auth = request.user as AuthPayload | undefined;

    if (typeof auth?.sub === 'string' && !!auth.sub) {
      const loggedUser = await this.userModel.findOne({ providerIds: auth.sub }).exec();

      if (loggedUser?.roles.includes('admin') && loggedUser.impersonatedUser && !skipImpersonate) {
        const impersonatedUser = await this.userModel
          .findOne({ userId: loggedUser.impersonatedUser })
          .exec();
        assertIsDefined(impersonatedUser, 'Impersonated user not found');
        return impersonatedUser;
      }
      return loggedUser;
    } else return null;
  }

  /**
   * Finds a single user based on the provided filter.
   *
   * @param {StrictFilterQuery<UserDocument>} filter - The filter to apply when searching for the user.
   * @returns {Promise<UserDocument | null>} The found UserDocument object or null if not found.
   */
  async findOne(filter: StrictFilterQuery<UserDocument>): Promise<UserDocument | null> {
    return this.userModel.findOne(filter).exec();
  }

  /**
   * Finds a user by ID.
   *
   * @param {string | Types.ObjectId} id - The ID of the user to find.
   * @returns {Promise<UserDocument | null>} The found UserDocument object or null if not found.
   */
  async findById(id: string | Types.ObjectId): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  /**
   * Retrieves requested data for a user.
   *
   * @param {UserDocument} user - The user for which to retrieve data.
   * @returns {Promise<string>} The JSON stringified data.
   */
  async requestData(user: UserDocument): Promise<string> {
    const response = [];
    response.push({ User: user });

    const deposits = await this.depositService.depositModel.find({
      creator: user._id,
    });

    response.push({ Publications: deposits });

    const reviews = await this.reviewService.find({
      creator: user._id,
    });

    response.push({ Reviews: reviews });

    const moderators = await this.communitiesService.findModerators({
      user: user._id,
    });

    response.push({ 'Moderator Roles': moderators });

    const comments = await this.commentsService.find({
      user_id: user._id,
    });

    response.push({ Comments: comments });
    return JSON.stringify(response, null, 2);
  }

  /**
   * Adds a community to a user's list of joined communities.
   *
   * @param {UserDocument} user - The user to whom the community will be added.
   * @param {T} community - The community to add.
   * @returns {Promise<T>} The community after addition.
   * @template T - The type of the community document.
   */
  async addCommunity<T extends CommunityDocument | CommunityDocumentPopulated>(
    userd: UserDocument,
    community: T
  ): Promise<T> {
    const user = await this.userModel.findOne({ userId: userd.userId });
    assertIsDefined(user, 'User not found');
    const index = user.communities.findIndex(joinedCommunityId =>
      joinedCommunityId.equals(community._id)
    );

    if (index === -1) {
      user.communities.push(community._id);
      user.markModified('communities');
      await user.save();

      community.followersCount = community.followersCount + 1;
    }

    return community;
  }

  /**
   * Checks if a user exists based on the provided filter.
   *
   * @param {StrictFilterQuery<UserDocument>} filter - The filter to apply when checking for user existence.
   * @returns {Promise<Pick<UserDocument, '_id'> | null>} The partial UserDocument object or null if not found.
   */
  async exists(filter: StrictFilterQuery<UserDocument>): Promise<Pick<UserDocument, '_id'> | null> {
    return this.userModel.exists(filter);
  }
}
