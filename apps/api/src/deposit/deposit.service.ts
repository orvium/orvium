import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AnyKeys, Model, PipelineStage, SortOrder, Types, UpdateQuery } from 'mongoose';
import {
  bibtexPublicationType,
  BibtexPublicationTypes,
  Deposit,
  DepositDocument,
  DepositStatus,
} from './deposit.schema';
import { Community, CommunityDocument } from '../communities/communities.schema';
import { readFileSync } from 'fs';
import handlebars from 'handlebars';
import { environment } from '../environments/environment';
import { join } from 'path';
import { AwsStorageService } from '../common/aws-storage-service/aws-storage.service';
import { User, UserDocument } from '../users/user.schema';
import { Review, ReviewDocument } from '../review/review.schema';
import { assertIsDefined } from '../utils/utils';
import { google } from '@google-analytics/data/build/protos/protos';
import { MetricResult, MetricsService } from '../metrics/metrics.service';
import { NestedMongoQuery, StrictFilterQuery } from '../utils/types';
import { FileMetadata } from '../dtos/filemetadata.dto';

const TEMPLATES_PATH = join(__dirname, '/templates');

export interface PopulatedDepositDocument extends Omit<DepositDocument, ''> {
  communityPopulated: CommunityDocument;
  ownerProfile: UserDocument;
  peerReviewsPopulated: (ReviewDocument & { ownerProfile: UserDocument })[];
  socialComments: number;
}

export interface DepositPopulated extends Deposit {
  communityPopulated: Community;
  ownerProfile: User;
  peerReviewsPopulated: (Review & { ownerProfile: User })[];
  socialComments: number;
}

export type DepositFilterQuery = StrictFilterQuery<
  DepositDocument &
    NestedMongoQuery<FileMetadata, 'publicationFile'> &
    NestedMongoQuery<FileMetadata, 'files'>
>;

/**
 * Service for managing deposit operations including creating, updating, and fetching deposit documents.
 */
@Injectable()
export class DepositService {
  /**
   * Initializes a new instance of the DepositService.
   */
  constructor(
    @InjectModel(Deposit.name) public depositModel: Model<Deposit>,
    private readonly storageService: AwsStorageService,
    private readonly metricsService: MetricsService
  ) {}

  /**
   * Creates a new deposit document in the database.
   *
   * @param {AnyKeys<Deposit>} filter - Initial data for creating the deposit.
   * @returns {Promise<DepositDocument>} A promise that resolves with the newly created deposit document.
   */
  async create(filter: AnyKeys<Deposit>): Promise<DepositDocument> {
    return this.depositModel.create(filter);
  }

  /**
   * Finds a single deposit document based on a specified filter and populates related data.
   *
   * @param {DepositFilterQuery} filter - Criteria used to find the deposit.
   * @returns {Promise<PopulatedDepositDocument | null>} A promise that resolves with the populated deposit document, null otherwise
   */
  async findOne(filter: DepositFilterQuery): Promise<PopulatedDepositDocument | null> {
    return this.depositModel
      .findOne(filter)
      .populate<{
        communityPopulated: CommunityDocument;
        ownerProfile: UserDocument;
        socialComments: number;
      }>(['communityPopulated', 'ownerProfile', 'socialComments'])
      .populate<{ peerReviewsPopulated: (ReviewDocument & { ownerProfile: UserDocument })[] }>({
        path: 'peerReviewsPopulated',
        populate: {
          path: 'ownerProfile',
        },
      })
      .exec();
  }

  /**
   * Finds multiple deposit documents based on a specified filter, sorts them, and populates related data.
   *
   * @param {DepositFilterQuery} filter - Criteria used to find the deposits.
   * @param {string | Record<string, SortOrder>} sort - Sorting criteria.
   * @returns {Promise<PopulatedDepositDocument[]>} A promise that resolves with an array of populated deposit documents.
   */
  async find(
    filter: DepositFilterQuery,
    sort: string | Record<string, SortOrder> = { createdOn: -1 }
  ): Promise<PopulatedDepositDocument[]> {
    return this.depositModel
      .find(filter, '-html')
      .sort(sort)
      .populate<{
        communityPopulated: CommunityDocument;
        ownerProfile: UserDocument;
        socialComments: number;
      }>(['communityPopulated', 'ownerProfile', 'socialComments'])
      .populate<{ peerReviewsPopulated: (ReviewDocument & { ownerProfile: UserDocument })[] }>({
        path: 'peerReviewsPopulated',
        populate: {
          path: 'ownerProfile',
        },
      })
      .exec();
  }

  /**
   * Finds a deposit document by its ID and populates related data.
   *
   * @param {string | Types.ObjectId} id - The ID of the deposit to find.
   * @returns {Promise<PopulatedDepositDocument | null>} A promise that resolves with the populated deposit document, or null if not found.
   */
  async findById(id: string | Types.ObjectId): Promise<PopulatedDepositDocument | null> {
    return this.depositModel
      .findById(id)
      .populate<{
        communityPopulated: CommunityDocument;
        ownerProfile: UserDocument;
        socialComments: number;
      }>(['communityPopulated', 'ownerProfile', 'socialComments'])
      .populate<{ peerReviewsPopulated: (ReviewDocument & { ownerProfile: UserDocument })[] }>({
        path: 'peerReviewsPopulated',
        populate: {
          path: 'ownerProfile',
        },
      })
      .exec();
  }

  /**
   * Checks if a deposit exists based on a specified filter.
   *
   * @param {DepositFilterQuery} filter - Criteria to check the existence of the deposit.
   * @returns {Promise<Pick<DepositDocument, '_id'> | null>} A promise that resolves with the document ID if it exists, null otherwise.
   */
  async exists(filter: DepositFilterQuery): Promise<Pick<DepositDocument, '_id'> | null> {
    return this.depositModel.exists(filter);
  }

  /**
   * Finds deposit documents based on a specified filter with pagination and sorting, and populates related data.
   *
   * @param {DepositFilterQuery} filter - Criteria used to find the deposits.
   * @param {number} skip - Number of documents to skip in the result set.
   * @param {number} [limit=10] - Maximum number of documents to return.
   * @param {string | Record<string, SortOrder>} [sort={ createdOn: -1 }] - Sorting criteria.
   * @returns {Promise<PopulatedDepositDocument[]>} A promise that resolves with an array of populated deposit documents.
   */
  async findWithLimitExec(
    filter: DepositFilterQuery,
    skip: number,
    limit = 10,
    sort: string | Record<string, SortOrder> = { createdOn: -1 }
  ): Promise<PopulatedDepositDocument[]> {
    return this.depositModel
      .find(filter, '-html')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate<{
        communityPopulated: CommunityDocument;
        ownerProfile: UserDocument;
        socialComments: number;
      }>(['communityPopulated', 'ownerProfile', 'socialComments'])
      .populate<{ peerReviewsPopulated: (ReviewDocument & { ownerProfile: UserDocument })[] }>({
        path: 'peerReviewsPopulated',
        populate: {
          path: 'ownerProfile',
        },
      })
      .exec();
  }

  /**
   * Finds deposit documents with pagination and sorting options, and returns them as lean objects.
   *
   * @param {DepositFilterQuery} filter - Criteria used to find the deposits.
   * @param {number} skip - Number of documents to skip.
   * @param {number} limit - Maximum number of documents to return.
   * @param {string | Record<string, SortOrder>} sort - Sorting criteria.
   * @returns {Promise<Deposit[]>} A promise that resolves with an array of deposit documents.
   */
  async findWithLimitLean(
    filter: DepositFilterQuery,
    skip: number,
    limit = 10,
    sort: string | Record<string, SortOrder> = { createdOn: -1 }
  ): Promise<Deposit[]> {
    return this.depositModel
      .find(filter, '-html')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate<{ communityPopulated: CommunityDocument; ownerProfile: UserDocument }>([
        'communityPopulated',
        'ownerProfile',
      ])
      .populate<{ peerReviewsPopulated: (ReviewDocument & { ownerProfile: UserDocument })[] }>({
        path: 'peerReviewsPopulated',
        populate: {
          path: 'ownerProfile',
        },
      })
      .lean();
  }

  /**
   * Updates a deposit document based on a specified filter and updates data.
   *
   * @param {DepositFilterQuery} filter - Criteria used to find the deposit.
   * @param {UpdateQuery<DepositDocument>} update - Data to update the deposit document with.
   * @returns {Promise<Deposit | null>} A promise that resolves with the updated deposit document, or null if not found.
   */
  async findOneAndUpdate(
    filter: DepositFilterQuery,
    update: UpdateQuery<DepositDocument>
  ): Promise<Deposit | null> {
    return this.depositModel
      .findOneAndUpdate(filter, update, { useFindAndModify: false })
      .populate<{ communityPopulated: CommunityDocument; ownerProfile: UserDocument }>([
        'communityPopulated',
        'ownerProfile',
      ])
      .populate<{ peerReviewsPopulated: (ReviewDocument & { ownerProfile: UserDocument })[] }>({
        path: 'peerReviews',
        populate: {
          path: 'peerReviewsPopulated',
        },
      })
      .lean();
  }
  /**
   * Performs an aggregation operation on deposit documents.
   *
   * @param {PipelineStage[]} pipeline - Aggregation pipeline stages to process.
   * @returns {Promise<unknown[]>} A promise that resolves with the results of the aggregation operation.
   */
  async aggregate(pipeline: PipelineStage[]): Promise<unknown[]> {
    return await this.depositModel.aggregate(pipeline).exec();
  }

  /**
   * Updates the specified deposit document to indicate it is the latest version.
   *
   * @param {PopulatedDepositDocument} deposit - The deposit document to update.
   */
  async updateToLastVersion(deposit: PopulatedDepositDocument): Promise<void> {
    const previousDeposit = await this.findOne({
      parent: deposit.parent,
      version: deposit.version - 1,
      isLatestVersion: true,
    });
    if (previousDeposit) {
      deposit.isLatestVersion = true;
      previousDeposit.isLatestVersion = false;
      await deposit.save();
      await previousDeposit.save();
    }
  }

  /**
   * Generates a BibTeX citation for a given deposit.
   *
   * @param {string} identifier - The identifier of the deposit to generate the citation for.
   * @returns {Promise<string>} A promise that resolves with the BibTeX citation string.
   */
  async getBibtexCitation(identifier: string): Promise<string> {
    const deposit = await this.findById(identifier);
    if (!deposit) {
      throw new NotFoundException('Deposit not found');
    }

    const hasDoi = !!deposit.doi;
    const authorsList: string[] = [];
    for (const author of deposit.authors) {
      authorsList.push(author.firstName + ' ' + author.lastName);
    }

    const source = readFileSync(`${TEMPLATES_PATH}/citation/bibtex.hbs`, 'utf-8');
    const template = handlebars.compile<{
      publicationType?: BibtexPublicationTypes;
      citationKey: string;
      title: string;
      abstract?: string;
      keywords?: string;
      authors: string;
      hasDoi: boolean;
      doi?: string;
      year?: number;
      url: string;
    }>(source);
    return template({
      publicationType: bibtexPublicationType.get(deposit.publicationType),
      citationKey: 'orvium-' + deposit._id.toHexString(),
      title: deposit.title,
      abstract: deposit.abstract,
      keywords: deposit.keywords.join(', '),
      authors: authorsList.join(' and '),
      hasDoi: hasDoi,
      doi: deposit.doi,
      year: deposit.submissionDate ? deposit.submissionDate.getFullYear() : undefined,
      url: environment.publicUrl + '/deposits/' + deposit._id.toHexString() + '/view',
    });
  }

  /**
   * Generate APA citation
   * https://apastyle.apa.org/style-grammar-guidelines/references/basic-principles
   *
   * @param {DepositDocument} deposit deposit with the data to generate the APA citation
   * @returns {string} APA citation
   */
  getAPACitation(deposit: PopulatedDepositDocument): string {
    const authors = [];
    for (const author of deposit.authors) {
      authors.push(author.lastName + ', ' + author.firstName.charAt(0).toUpperCase() + '.');
    }

    let authorSection = '';

    if (authors.length > 1) {
      authorSection = authors.slice(0, -1).join(', ') + ' & ' + authors.slice(-1).join();
    } else {
      authorSection = authors[0];
    }

    let date = 'n.d.';
    if (deposit.submissionDate) {
      date = deposit.submissionDate.getFullYear().toString();
    }
    if (deposit.publicationDate) {
      date = deposit.publicationDate.getFullYear().toString();
    }

    const preprintText = deposit.status === DepositStatus.preprint ? ' [preprint]' : '';

    let citationAPA = `${authorSection} (${date}). ${deposit.title}${preprintText}.`;
    citationAPA = citationAPA + ' ' + deposit.communityPopulated.name + '.';
    if (deposit.doi) {
      citationAPA = citationAPA + ' https://doi.org/' + deposit.doi;
    }
    return citationAPA;
  }

  /**
   * Removes email addresses from authors in a deposit document.
   *
   * @param {PopulatedDepositDocument} deposit - The deposit document to process.
   */
  deleteAuthorsEmail(deposit: PopulatedDepositDocument): void {
    for (const author of deposit.authors) {
      author.email = '';
    }
  }

  /**
   * Sets presigned URLs for files related to the deposit.
   *
   * @param {PopulatedDepositDocument | DepositDocument} deposit - The deposit document to process.
   * @returns {Promise<PopulatedDepositDocument | DepositDocument>} A promise that resolves with the deposit document.
   */
  async setPresignedURLs<T extends PopulatedDepositDocument | DepositDocument>(
    deposit: T
  ): Promise<T> {
    if (deposit.status === DepositStatus.draft) {
      if (deposit.publicationFile) {
        const objectKey = `${deposit._id.toHexString()}/${deposit.publicationFile.filename}`;
        const params = {
          Key: objectKey,
          Bucket: this.storageService.privateBucket,
        };
        const signedUrl = await this.storageService.getSignedUrl('getObject', params);
        deposit.publicationFile.url = signedUrl;
      }
      if (deposit.pdfUrl) {
        const objectKey = `${deposit._id.toHexString()}/${deposit.pdfUrl}`;
        const params = {
          Key: objectKey,
          Bucket: this.storageService.privateBucket,
        };
        const signedUrl = await this.storageService.getSignedUrl('getObject', params);
        deposit.pdfUrl = signedUrl;
      }
      for (const file of deposit.files) {
        const objectKey = `${deposit._id.toHexString()}/${file.filename}`;
        const params = {
          Key: objectKey,
          Bucket: this.storageService.privateBucket,
        };
        const signedUrl = await this.storageService.getSignedUrl('getObject', params);
        file.url = signedUrl;
      }
    } else {
      if (deposit.publicationFile) {
        deposit.publicationFile.url = `${
          environment.publicUrlWithPrefix
        }/deposits/${deposit._id.toHexString()}/files/${deposit.publicationFile.filename}`;
      }
      if (deposit.pdfUrl) {
        deposit.pdfUrl = `${
          environment.publicUrlWithPrefix
        }/deposits/${deposit._id.toHexString()}/pdf`;
      }
      for (const file of deposit.files) {
        file.url = `${
          environment.publicUrlWithPrefix
        }/deposits/${deposit._id.toHexString()}/files/${file.filename}`;
      }
    }
    return deposit;
  }

  /**
   * Updates view metrics for deposits based on analytics data.
   *
   * @param {google.analytics.data.v1beta.IRunReportResponse} response - The response from Google Analytics containing view metrics.
   */
  async updateDepositViews(
    response: google.analytics.data.v1beta.IRunReportResponse
  ): Promise<void> {
    const metrics = this.metricsService.extractMetricsFromGAReport(response);
    assertIsDefined(metrics, 'Deposit metrics not found');

    const deposits = await this.find({
      _id: { $in: metrics.map(metric => metric.objectId) },
    });
    for (const deposit of deposits) {
      const metric: MetricResult | undefined = metrics.find(
        metric => metric.objectId === deposit._id.toHexString()
      );
      assertIsDefined(metric, `Metric for deposit ${deposit._id.toHexString()} not found`);
      deposit.views = metric.screeviews;
      await deposit.save();
      Logger.debug(`Deposit ${deposit._id.toHexString()} has ${metric.screeviews} views`);
    }
  }
}
