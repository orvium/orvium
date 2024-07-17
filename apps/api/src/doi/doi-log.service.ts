import { InjectModel } from '@nestjs/mongoose';
import { AnyKeys, Model, Types } from 'mongoose';
import { DoiLog, DoiLogDocument, DoiStatus } from './doi-log.schema';
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { assertIsDefined, CROSSREF_ENDPOINT, decryptJson, DepositCLASSNAME } from '../utils/utils';
import { CommunitiesService } from '../communities/communities.service';
import { firstValueFrom, from, groupBy, lastValueFrom, mergeMap, toArray } from 'rxjs';
import { environment } from '../environments/environment';
import { ReviewService } from '../review/review.service';
import { DepositService } from '../deposit/deposit.service';

/**
 * Service for managing DOI log operations.
 */
@Injectable()
export class DoiLogService {
  /**
   * Constructs a new instance of DoiLogService.
   */
  constructor(
    @InjectModel(DoiLog.name) public doiModel: Model<DoiLog>,
    private httpService: HttpService,
    private communitiesService: CommunitiesService,
    private reviewService: ReviewService,
    private depositService: DepositService
  ) {}

  /**
   * Creates a new DOI log entry in the database.
   *
   * @param {AnyKeys<DoiLog>} filter - Initial data for creating the DOI log.
   * @returns {Promise<DoiLogDocument>} A promise that resolves with the newly created DOI log document.
   */
  async create(filter: AnyKeys<DoiLog>): Promise<DoiLogDocument> {
    return this.doiModel.create(filter);
  }

  /**
   * Retrieves a DOI log document based on the resource ID.
   *
   * @param {string | Types.ObjectId} _id - The ID of the resource for which to find the DOI log.
   * @returns {Promise<DoiLogDocument | null>} A promise that resolves with the DOI log document, or null if not found.
   */
  async findByResourceId(_id: string | Types.ObjectId): Promise<DoiLogDocument | null> {
    return this.doiModel
      .findOne({
        resource: _id,
      })
      .exec();
  }

  /**
   * Updates the status of DOI logs that are still processing. It checks the status from Crossref or DataCite server
   *
   * and updates the status accordingly in the database.
   * @returns {Promise<void>} A promise that resolves when all updates are complete.
   */
  async updateDOIstatus(): Promise<void> {
    const pendingDOIs = await this.doiModel.find({ status: DoiStatus.processing }).exec();
    const groups = await lastValueFrom(
      from(pendingDOIs).pipe(
        groupBy(pendingdoi => pendingdoi.community.toHexString()),
        // return each item in group as array
        mergeMap(group => group.pipe(toArray())),
        toArray()
      )
    );

    for (const group of groups) {
      const community = await this.communitiesService.findById(group[0].community);

      assertIsDefined(community, 'Community not found');
      assertIsDefined(community.crossref, 'crossref configuration not found');

      const url =
        community.crossref.server === CROSSREF_ENDPOINT.production
          ? environment.crossref.prodLogUrl
          : environment.crossref.testLogUrl;
      const { user, pass, role } = community.crossref;

      for (const doi of group) {
        const response = await firstValueFrom(
          this.httpService.get(url, {
            params: {
              usr: `${user}/${role}`,
              pwd: decryptJson(pass),
              file_name: doi.file,
              type: 'result',
            },
          })
        );

        // We will always receive the status complete even if the process has failed.
        // If it is not yet processed we will receive the status to processing or queued.
        // In that case we will not update the status. And will wait to next cron job.
        // If the process has failed <success_count> will be 0.
        if (
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          response.data.includes('status="completed"')
        ) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          if (response.data.includes('<success_count>1</success_count>')) {
            doi.status = DoiStatus.published;
          } else {
            doi.status = DoiStatus.failed;
          }
        }

        doi.data = response.data;
        await doi.save();

        if (doi.resourceModel === DepositCLASSNAME) {
          await this.depositService.findOneAndUpdate(
            {
              _id: doi.resource,
            },
            {
              $set: {
                doiStatus: doi.status,
              },
            }
          );
        } else {
          await this.reviewService.findOneAndUpdate(
            {
              _id: doi.resource,
            },
            {
              $set: {
                doiStatus: doi.status,
              },
            }
          );
        }
      }
    }
  }
}
