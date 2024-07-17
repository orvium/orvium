import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AnyKeys, Model, Types } from 'mongoose';
import { Community, CommunityDocument } from './communities.schema';
import { UserDocument } from '../users/user.schema';
import {
  CommunityModerator,
  CommunityModeratorDocument,
  ModeratorRole,
} from './communities-moderator.schema';
import { assertIsDefined } from '../utils/utils';
import { google } from '@google-analytics/data/build/protos/protos';
import { MetricResult, MetricsService } from '../metrics/metrics.service';
import { StrictFilterQuery } from '../utils/types';
import { environment } from '../environments/environment';
import { Parser } from 'json2csv';
import { DepositService } from '../deposit/deposit.service';

/**
 * Represents the document of a populated CommunityModerator, including user information.
 */
export interface CommunityModeratorDocumentPopulated
  extends Omit<CommunityModeratorDocument, 'user'> {
  user: UserDocument;
}

/**
 * Represents the document of a populated Community.
 */
export interface CommunityDocumentPopulated extends Omit<CommunityDocument, ''> {
  conferenceProceedingsPopulated: CommunityDocument[];
  moderatorsPopulated: CommunityModeratorDocumentPopulated[];
}

/**
 * Service for managing community-related data.
 */
@Injectable()
export class CommunitiesService {
  /**
   * Creates an instance of CommunitiesService.
   *
   * @param {Model<Community>} communityModel - Model for communities.
   * @param {Model<CommunityModerator>} communityModeratorModel - Model for community moderators.
   * @param {MetricsService} metricsService - Service for metrics.
   * @param {DepositService} depositService - Service for deposits.
   */
  constructor(
    @InjectModel(Community.name) public communityModel: Model<Community>,
    @InjectModel(CommunityModerator.name)
    public communityModeratorModel: Model<CommunityModerator>,
    private readonly metricsService: MetricsService,
    private readonly depositService: DepositService
  ) {}

  /**
   * Creates a new community document in the database.
   *
   * @param {AnyKeys<Community>} filter - An object containing key-value pairs that specify the data to use for creating the community.
   * @returns {Promise<CommunityDocument>} A Promise resolving to the newly created CommunityDocument.
   */
  async create(filter: AnyKeys<Community>): Promise<CommunityDocument> {
    return this.communityModel.create(filter);
  }

  /**
   * Retrieves a list of populated community documents based on the provided filter, including related conference proceedings and moderators.
   *
   * @param {StrictFilterQuery<CommunityDocument>} filter - A MongoDB query filter to find matching community documents.
   * @returns {Promise<CommunityDocumentPopulated[]>} A Promise resolving to an array of populated community documents.
   */
  async find(filter: StrictFilterQuery<CommunityDocument>): Promise<CommunityDocumentPopulated[]> {
    return await this.communityModel
      .find(filter)
      .populate<{ conferenceProceedingsPopulated: CommunityDocument[] }>(
        'conferenceProceedingsPopulated'
      )
      .populate<{ moderatorsPopulated: CommunityModeratorDocumentPopulated[] }>({
        path: 'moderatorsPopulated',
        populate: { path: 'user' },
      })
      .exec();
  }

  /**
   * Retrieves a single populated community document based on the provided filter, including related conference proceedings and moderators.
   *
   * @param {StrictFilterQuery<CommunityDocument>} filter - A MongoDB query filter to find a specific community document.
   * @returns {Promise<CommunityDocumentPopulated | null>} A Promise resolving to a populated community document or null if no match is found.
   */
  async findOneByFilter(
    filter: StrictFilterQuery<CommunityDocument>
  ): Promise<CommunityDocumentPopulated | null> {
    return await this.communityModel
      .findOne(filter)
      .populate<{ conferenceProceedingsPopulated: CommunityDocument[] }>(
        'conferenceProceedingsPopulated'
      )
      .populate<{ moderatorsPopulated: CommunityModeratorDocumentPopulated[] }>({
        path: 'moderatorsPopulated',
        populate: { path: 'user' },
      })
      .exec();
  }

  /**
   * Retrieves a single populated community document by its ID, including related conference proceedings and moderators.
   *
   * @param {string | Types.ObjectId} id - The identifier of the community document to retrieve.
   * @returns {Promise<CommunityDocumentPopulated | null>} A Promise resolving to a populated community document or null if no document is found.
   */
  async findById(id: string | Types.ObjectId): Promise<CommunityDocumentPopulated | null> {
    return this.communityModel
      .findById(id)
      .populate<{ conferenceProceedingsPopulated: CommunityDocument[] }>(
        'conferenceProceedingsPopulated'
      )
      .populate<{ moderatorsPopulated: CommunityModeratorDocumentPopulated[] }>({
        path: 'moderatorsPopulated',
        populate: { path: 'user' },
      })
      .exec();
  }

  /**
   * Checks if any community document exists that matches the given filter.
   *
   * @param {StrictFilterQuery<CommunityDocument>} filter - A query filter to check for an existing community document.
   * @returns {Promise<Pick<CommunityDocument, '_id'> | null>} A Promise resolving to the document identifier if found, otherwise null.
   */
  async exists(
    filter: StrictFilterQuery<CommunityDocument>
  ): Promise<Pick<CommunityDocument, '_id'> | null> {
    return this.communityModel.exists(filter);
  }

  /**
   * Finds all moderators based on the provided filter.
   *
   * @param {StrictFilterQuery<CommunityModeratorDocument>} filter - A query filter to find matching community moderator documents.
   * @returns {Promise<CommunityModeratorDocument[]>} A Promise resolving to an array of community moderator documents.
   */
  async findModerators(
    filter: StrictFilterQuery<CommunityModeratorDocument>
  ): Promise<CommunityModeratorDocument[]> {
    return this.communityModeratorModel.find(filter).exec();
  }

  /**
   * Finds a moderator by their ID.
   *
   * @param {string | Types.ObjectId} id - The identifier of the moderator to be retrieved.
   * @returns {Promise<CommunityModeratorDocument | null>} A Promise resolving to the moderator document if found, or null if no matches.
   */
  async findModeratorById(id: string | Types.ObjectId): Promise<CommunityModeratorDocument | null> {
    return this.communityModeratorModel.findById(id).exec();
  }

  /**
   * Retrieves all moderators for a specified community.
   *
   * @param {string | Types.ObjectId} community - The identifier of the community.
   * @returns {Promise<CommunityModeratorDocumentPopulated[]>} A Promise resolving to an array of populated moderator documents.
   */
  async getModerators(
    community: string | Types.ObjectId
  ): Promise<CommunityModeratorDocumentPopulated[]> {
    const rows = await this.communityModeratorModel
      .find({ community: community })
      .populate<{ user: UserDocument }>('user')
      .exec();
    // @ts-ignore
    return rows;
  }

  /**
   * Retrieves the community IDs where a specific user is a moderator.
   *
   * @param {string | Types.ObjectId} userId - The user identifier.
   * @returns {Promise<Types.ObjectId[]>} A Promise resolving to an array of ObjectId with the communities where the user has moderator roles.
   */
  async getModeratorCommunities(userId: string | Types.ObjectId): Promise<Types.ObjectId[]> {
    const communitiesIds = await this.communityModeratorModel
      .find({ user: userId, moderatorRole: { $in: ['owner', 'moderator'] } }, { community: 1 })
      .exec();
    return communitiesIds.map(community => community.community);
  }

  /**
   * Adds a moderator to a community.
   *
   * @param {CommunityDocument | CommunityDocumentPopulated} community - The community document to which a moderator will be added.
   * @param {UserDocument} user - The user document of the new moderator.
   * @param {ModeratorRole} role - The role of the moderator within the community.
   * @returns {Promise<CommunityModeratorDocument>} A Promise resolving to the newly created moderator document.
   */
  async addModerator(
    community: CommunityDocument | CommunityDocumentPopulated,
    user: UserDocument,
    role: ModeratorRole
  ): Promise<CommunityModeratorDocument> {
    return await this.communityModeratorModel.create({
      user: user._id,
      moderatorRole: role,
      community: community._id,
    });
  }

  /**
   * Deletes a moderator from a community.
   *
   * @param {CommunityDocument | CommunityDocumentPopulated} community - The community from which the moderator will be removed.
   * @param {UserDocument} user - The user document of the moderator to be removed.
   * @returns {Promise<void>} A Promise that resolves when the moderator has been successfully deleted.
   */
  async deleteModerator(
    community: CommunityDocument | CommunityDocumentPopulated,
    user: UserDocument
  ): Promise<void> {
    await this.communityModeratorModel.deleteOne({ user: user._id, community: community._id });
  }

  /**
   * Checks if a moderator exists based on the given filter.
   *
   * @param {StrictFilterQuery<CommunityModeratorDocument>} filter - A MongoDB query filter to check for an existing moderator document.
   * @returns {Promise<Pick<CommunityModeratorDocument, '_id'> | null>} A Promise resolving to the moderator document if found, otherwise null.
   */
  async existsModerator(
    filter: StrictFilterQuery<CommunityModeratorDocument>
  ): Promise<Pick<CommunityModeratorDocument, '_id'> | null> {
    return this.communityModeratorModel.exists(filter);
  }

  /**
   * Updates community views based on Google Analytics report response.
   *
   * @param {google.analytics.data.v1beta.IRunReportResponse} response - The response from Google Analytics containing viewing metrics.
   * @returns {Promise<void>} A Promise that resolves when community views have been updated.
   */
  async updateCommunityViews(
    response: google.analytics.data.v1beta.IRunReportResponse
  ): Promise<void> {
    const metrics = this.metricsService.extractMetricsFromGAReport(response);
    assertIsDefined(metrics, 'Community metrics not defined');

    const communities = await this.find({
      _id: { $in: metrics.map(metric => metric.objectId) },
    });
    for (const community of communities) {
      const metric: MetricResult | undefined = metrics.find(
        metric => metric.objectId === community._id.toHexString()
      );
      assertIsDefined(metric, `Metric not found for community ${community._id.toHexString()}`);
      community.views = metric.screeviews;
      await community.save();
    }
  }

  /**
   * Exports submission data of a community to a CSV format.
   *
   * @param {string} id - The identifier of the community for which to export submissions.
   * @returns {Promise<string>} A Promise resolving to a CSV string containing the community's submission data.
   */
  async exportSubmisionsToCsv(id: string): Promise<string> {
    const deposits = await this.depositService.depositModel
      .find(
        { community: id },
        {
          title: 1,
          abstract: 1,
          status: 1,
          submissionDate: 1,
          assignee: 1,
          authors: 1,
          disciplines: 1,
          keywords: 1,
          creator: 1,
        }
      )
      .populate<{ assignee: UserDocument | null }>('assignee')
      .populate<{ creator: UserDocument }>('creator')
      .exec();

    const depositsTransformed = [];

    for (const deposit of deposits) {
      const assignee = deposit.assignee as unknown as UserDocument | null;
      depositsTransformed.push({
        title: deposit.title,
        abstract: deposit.abstract,
        submitter: deposit.creator.email,
        status: deposit.status,
        submissionDate: deposit.submissionDate,
        assignee: assignee ? `${assignee.firstName} ${assignee.lastName}` : '',
        authors: deposit.authors.map(author => {
          return {
            firstname: author.firstName,
            lastname: author.lastName,
            orcid: author.orcid,
            institutions: author.institutions,
            email: author.email,
          };
        }),
        disciplines: deposit.disciplines,
        keywords: deposit.keywords,
        publicationLink: `${environment.publicUrl}/deposits/${deposit._id.toHexString()}/view`,
        inviteLink: `${environment.publicUrl}/deposits/${deposit._id.toHexString()}/invite`,
      });
    }
    const parser = new Parser();
    return depositsTransformed.length > 0 ? parser.parse(depositsTransformed) : '';
  }
}
