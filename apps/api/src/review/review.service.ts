import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AnyKeys, Model, SortOrder, Types, UpdateQuery } from 'mongoose';
import { Review, ReviewDocument, ReviewStatus } from './review.schema';
import { AwsStorageService } from '../common/aws-storage-service/aws-storage.service';
import { environment } from '../environments/environment';
import { Deposit, DepositDocument } from '../deposit/deposit.schema';
import { User, UserDocument } from '../users/user.schema';
import { Community, CommunityDocument } from '../communities/communities.schema';
import { AuthorizationService } from '../authorization/authorization.service';
import { ReviewPopulatedDTO } from '../dtos/review/review-populated.dto';
import { ReviewSummaryDTO } from '../dtos/review/review-summary.dto';
import { plainToClassCustom } from '../transformer/utils';
import { ReviewHiddenIdentityDTO } from '../dtos/review/review-hidden-identity.dto';
import { NestedMongoQuery, StrictFilterQuery } from '../utils/types';
import { FileMetadata } from '../dtos/filemetadata.dto';
import { google } from '@google-analytics/data/build/protos/protos';
import { assertIsDefined } from '../utils/utils';
import { MetricResult, MetricsService } from '../metrics/metrics.service';

export interface ReviewDocumentPopulated extends Omit<ReviewDocument, ''> {
  depositPopulated: DepositDocument;
  communityPopulated: CommunityDocument;
  ownerProfile: UserDocument;
  socialComments: number;
}

export interface ReviewPopulated extends Review {
  depositPopulated: Deposit;
  communityPopulated: Community;
  ownerProfile: User;
  socialComments: number;
}

export enum ReviewRoles {
  Creator = 'creator',
  Moderator = 'moderator',
  Author = 'author',
  Public = 'public',
}

interface RoleInput1 {
  review: ReviewDocumentPopulated;
  user: UserDocument | null;
}

interface RoleInput2 {
  review: ReviewDocument;
  user: UserDocument | null;
  deposit: DepositDocument;
}

export type ReviewFilterQuery = StrictFilterQuery<
  ReviewDocument &
    NestedMongoQuery<FileMetadata, 'file'> &
    NestedMongoQuery<FileMetadata, 'extraFiles'>
>;

/**
 * Service for handling ReviewService.
 */
@Injectable()
export class ReviewService {
  /**
   * Constructs an instance of ReviewService with required services.
   *
   * @param {Model<Review>} reviewModel - Model for reviews.
   * @param {AwsStorageService} storageService - Service for AWS storage.
   * @param {AuthorizationService} authorizationService - Service for authorization.
   * @param {MetricsService} metricsService - Service for metrics.
   */
  constructor(
    @InjectModel(Review.name) public reviewModel: Model<Review>,
    private readonly storageService: AwsStorageService,
    private readonly authorizationService: AuthorizationService,
    private readonly metricsService: MetricsService
  ) {}

  /**
   * Finds reviews based on a filter and sorting criteria, and populates related data.
   *
   * @param {ReviewFilterQuery} filter - The filter criteria for the search.
   * @param {string | Record<string, SortOrder>} sort - The sorting criteria for the results.
   * @returns {Promise<ReviewDocumentPopulated[]>} A promise that resolves to an array of populated review documents.
   */
  async find(
    filter: ReviewFilterQuery,
    sort: string | Record<string, SortOrder> = { creationDate: -1 }
  ): Promise<ReviewDocumentPopulated[]> {
    return this.reviewModel
      .find(filter, '-html')
      .sort(sort)
      .populate<{ depositPopulated: DepositDocument }>('depositPopulated', '-html')
      .populate<{ ownerProfile: UserDocument }>('ownerProfile')
      .populate<{ communityPopulated: CommunityDocument }>('communityPopulated')
      .populate<{ socialComments: number }>('socialComments')
      .exec();
  }

  /**
   * Finds reviews with pagination based on a filter, sorting, and pagination settings.
   *
   * @param {ReviewFilterQuery} filter - The filter criteria for the search.
   * @param {string | Record<string, SortOrder>} sort - The sorting criteria for the results.
   * @param {number} limit - The number of results per page.
   * @param {number} page - The current page number.
   * @returns {Promise<ReviewDocumentPopulated[]>} A promise that resolves to an array of populated review documents.
   */
  async findWithLimit(
    filter: ReviewFilterQuery,
    sort: string | Record<string, SortOrder> = { creationDate: -1 },
    limit = 25,
    page = 0
  ): Promise<ReviewDocumentPopulated[]> {
    return this.reviewModel
      .find(filter, '-html')
      .sort(sort)
      .skip(page * limit)
      .limit(limit)
      .populate<{ depositPopulated: DepositDocument }>('depositPopulated', '-html')
      .populate<{ ownerProfile: UserDocument }>('ownerProfile')
      .populate<{ communityPopulated: CommunityDocument }>('communityPopulated')
      .populate<{ socialComments: number }>('socialComments')
      .exec();
  }

  /**
   * Finds a single review based on a filter and populates related data.
   *
   * @param {ReviewFilterQuery} filter - The filter criteria for the search.
   * @returns {Promise<ReviewDocumentPopulated | null>} A promise that resolves to a populated review document or null if not found.
   */
  async findOne(filter: ReviewFilterQuery): Promise<ReviewDocumentPopulated | null> {
    return this.reviewModel
      .findOne(filter)
      .populate<{ depositPopulated: DepositDocument }>('depositPopulated', '-html')
      .populate<{ ownerProfile: UserDocument }>('ownerProfile')
      .populate<{ communityPopulated: CommunityDocument }>('communityPopulated')
      .populate<{ socialComments: number }>('socialComments')
      .exec();
  }

  /**
   * Finds a review by its ID and populates related data.
   *
   * @param {string | Types.ObjectId} id - The ID of the review.
   * @returns {Promise<ReviewDocumentPopulated | null>} A promise that resolves to a populated review document or null if not found.
   */
  async findById(id: string | Types.ObjectId): Promise<ReviewDocumentPopulated | null> {
    return this.reviewModel
      .findById(id)
      .populate<{ depositPopulated: DepositDocument }>('depositPopulated')
      .populate<{ communityPopulated: CommunityDocument }>('communityPopulated')
      .populate<{ ownerProfile: UserDocument }>('ownerProfile')
      .populate<{ socialComments: number }>('socialComments')
      .exec();
  }

  /**
   * Updates a review based on a filter and an update query, and returns the updated document.
   *
   * @param {ReviewFilterQuery} filter - The filter criteria for the update.
   * @param {UpdateQuery<ReviewDocument>} update - The update to apply to the review document.
   * @returns {Promise<Review | null>} A promise that resolves to the updated review document or null if not found.
   */
  async findOneAndUpdate(
    filter: ReviewFilterQuery,
    update: UpdateQuery<ReviewDocument>
  ): Promise<Review | null> {
    return this.reviewModel
      .findOneAndUpdate(filter, update, { useFindAndModify: false })
      .populate<{ depositPopulated: DepositDocument }>('depositPopulated')
      .populate<{ communityPopulated: CommunityDocument }>('communityPopulated')
      .lean();
  }

  /**
   * Creates a new review document.
   *
   * @param {AnyKeys<Review>} filter - The review data to create the document with.
   * @returns {Promise<ReviewDocument>} A promise that resolves to the newly created review document.
   */
  async create(filter: AnyKeys<Review>): Promise<ReviewDocument> {
    return this.reviewModel.create(filter);
  }

  /**
   * Returns a review with presigned URLs to access to its files
   *
   * @param {ReviewDocument} review
   * @returns {ReviewDocument} deposit with presigned urls
   */
  async setPresignedURLs<T extends ReviewDocument | ReviewDocumentPopulated>(
    review: T
  ): Promise<T> {
    if (review.status === ReviewStatus.draft) {
      if (review.file) {
        const objectKey = `reviews/${review._id.toHexString()}/${review.file.filename}`;
        const params = {
          Key: objectKey,
          Bucket: this.storageService.privateBucket,
        };
        const signedUrl = await this.storageService.getSignedUrl('getObject', params);
        review.file.url = signedUrl;
      }

      for (const file of review.extraFiles) {
        const objectKey = `reviews/${review._id.toHexString()}/${file.filename}`;
        const params = {
          Key: objectKey,
          Bucket: this.storageService.privateBucket,
        };
        const signedUrl = await this.storageService.getSignedUrl('getObject', params);
        file.url = signedUrl;
      }
    } else {
      if (review.file) {
        review.file.url = `${
          environment.publicUrlWithPrefix
        }/reviews/${review._id.toHexString()}/files/${review.file.filename}`;
      }
      for (const file of review.extraFiles) {
        file.url = `${environment.publicUrlWithPrefix}/reviews/${review._id.toHexString()}/files/${
          file.filename
        }`;
      }
    }
    return review;
  }

  async getUserRolesForReview(input: RoleInput1 | RoleInput2): Promise<ReviewRoles[]> {
    const roles: ReviewRoles[] = [ReviewRoles.Public];
    if (!input.user) {
      // If no user, no additional roles are added
      return roles;
    }

    const ability = await this.authorizationService.defineAbilityFor(input.user);
    if (ability.can('moderate', input.review)) {
      roles.push(ReviewRoles.Moderator);
    }

    if (input.review.creator._id.toHexString() === input.user._id.toHexString()) {
      roles.push(ReviewRoles.Creator);
    }

    const deposit = 'deposit' in input ? input.deposit : input.review.depositPopulated;
    if (deposit.creator.toHexString() === input.user._id.toHexString()) {
      roles.push(ReviewRoles.Author);
    }

    return roles;
  }

  /**
   * Returns a Review with different degree of visibility of the reviewer's personal data depending on the user
   * to whom the information is shown
   *
   * @param {ReviewDocument} review
   * @param roles
   * @returns {ReviewDocument} returns the review with the data of the reviewer's identity that can be seen
   * by the user who is viewing the review
   */
  setReviewerIdentityVisibility(
    review: ReviewPopulatedDTO,
    roles: ReviewRoles[]
  ): ReviewPopulatedDTO;
  setReviewerIdentityVisibility(review: ReviewSummaryDTO, roles: ReviewRoles[]): ReviewSummaryDTO;
  setReviewerIdentityVisibility(
    review: ReviewPopulatedDTO | ReviewSummaryDTO,
    roles: ReviewRoles[]
  ): ReviewPopulatedDTO | ReviewSummaryDTO {
    // If the review is public, or the user is moderator or the reviewer himself, then show identity
    if (
      review.showIdentityToEveryone ||
      roles.includes(ReviewRoles.Moderator) ||
      roles.includes(ReviewRoles.Creator)
    ) {
      return review;
    }

    // Otherwise check if identity is shown to authors
    if (review.showIdentityToAuthor && roles.includes(ReviewRoles.Author)) {
      return review;
    }

    // Arriving to this point means that identity should be hidden
    return plainToClassCustom(ReviewHiddenIdentityDTO, review) as typeof review;
  }

  /**
   * Updates the views count for reviews based on Google Analytics data.
   *
   * @param {google.analytics.data.v1beta.IRunReportResponse} response - The Google Analytics data response.
   * @returns {Promise<void>} A promise that resolves when the update is complete.
   */
  async updateReviewViews(
    response: google.analytics.data.v1beta.IRunReportResponse
  ): Promise<void> {
    const metrics = this.metricsService.extractMetricsFromGAReport(response);
    assertIsDefined(metrics, 'Reviews metrics not found');

    const reviews = await this.find({
      _id: { $in: metrics.map(metric => metric.objectId) },
    });
    for (const review of reviews) {
      const metric: MetricResult | undefined = metrics.find(
        metric => metric.objectId === review._id.toHexString()
      );
      assertIsDefined(metric, `Metric for review ${review._id.toHexString()} not found`);
      review.views = metric.screeviews;
      await review.save();
      Logger.debug(`Review ${review._id.toHexString()} has ${metric.screeviews} views`);
    }
  }
}
