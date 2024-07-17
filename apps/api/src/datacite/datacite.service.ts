import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { environment } from '../environments/environment';
import { Author, DepositDocument } from '../deposit/deposit.schema';
import { assertIsDefined, decryptJson } from '../utils/utils';
import {
  Configuration,
  Doi,
  DoiData,
  DoiDataAttributesCreatorsInner,
  DoiDataAttributesEventEnum,
  DoisApi,
} from '@orvium/datacite-client';
import { HttpService } from '@nestjs/axios';
import { PopulatedDepositDocument } from '../deposit/deposit.service';
import { ReviewPopulatedDTO } from '../dtos/review/review-populated.dto';
import { CommunityDocument } from '../communities/communities.schema';

export enum DATACITE_ENDPOINT {
  test = 'https://api.test.datacite.org',
  production = 'https://api.datacite.org',
}

/**
 * Service for managing DOI registrations and metadata handling via DataCite.
 */
@Injectable()
export class DataciteService {
  private publicUrl: string;

  /**
   * Initializes a new instance of the CrossrefService.
   *
   * @param {HttpService} httpService - The HTTP service for making API calls.
   */
  constructor(private httpService: HttpService) {
    if (environment.publicUrl === 'http://localhost:4200') {
      this.publicUrl = 'https://d23p029t55fvl2.cloudfront.net/';
    } else {
      this.publicUrl = environment.publicUrl;
    }
  }

  /**
   * Generates DOI metadata for a deposit.
   *
   * @param {PopulatedDepositDocument} deposit - The deposit document containing all required metadata.
   * @returns {{ data: DoiData; doi: string }} An object containing DOI metadata and the DOI string.
   */
  generateDOIMetadata(deposit: PopulatedDepositDocument): { data: DoiData; doi: string } {
    assertIsDefined(deposit.communityPopulated.datacite);
    const doi = `${deposit.communityPopulated.datacite.prefix}/${deposit._id.toHexString()}`;

    const data: DoiData = {
      type: 'dois',
      attributes: {
        event: DoiDataAttributesEventEnum.Publish,
        prefix: deposit.communityPopulated.datacite.prefix,
        doi: doi,
        creators: this.authorsToDataciteCreators(deposit.authors),
        titles: [
          {
            title: deposit.title,
          },
        ],
        publisher: environment.datacite.publisher,
        publicationYear: deposit.submissionDate?.getFullYear(),
        types: {
          resourceTypeGeneral: 'Text',
        },
        url: `${this.publicUrl}/deposits/${deposit._id.toHexString()}/view`,
        schemaVersion: 'http://datacite.org/schema/kernel-4',
      },
    };

    return { data, doi };
  }

  /**
   * Generates DOI metadata for a review.
   *
   * @param {ReviewPopulatedDTO} review - The review DTO containing review metadata.
   * @param {CommunityDocument} community - The community document associated with the review.
   * @param {DepositDocument} deposit - The deposit document associated with the review.
   * @param {number} reviewNumber - The sequence number of the review.
   * @returns {{ data: DoiData; doi: string }} An object containing DOI metadata and the DOI string.
   */
  generateDOIMetadataReview(
    review: ReviewPopulatedDTO,
    community: CommunityDocument,
    deposit: DepositDocument,
    reviewNumber: number
  ): { data: DoiData; doi: string } {
    assertIsDefined(community.datacite);
    const doi = `${community.datacite.prefix}/${review._id}`;

    const data: DoiData = {
      type: 'dois',
      attributes: {
        prefix: community.datacite.prefix,
        doi: doi,
        creators: [
          {
            name: `${review.ownerProfile.firstName} ${review.ownerProfile.lastName}`,
            givenName: review.ownerProfile.firstName,
            familyName: review.ownerProfile.lastName,
          },
        ],
        titles: [
          {
            title: `Review: ${deposit.title} (R${deposit.version}/RC${reviewNumber})`,
          },
        ],
        relatedIdentifiers: [
          {
            relatedIdentifierType: 'DOI',
            relationType: 'Reviews',
            relatedIdentifier: deposit.doi,
            resourceTypeGeneral: 'Text',
          },
        ],
        publisher: environment.datacite.publisher,
        publicationYear: deposit.submissionDate?.getFullYear(),
        types: {
          resourceTypeGeneral: 'PeerReview',
        },
        url: `${this.publicUrl}/reviews/${deposit._id.toHexString()}/view`,
        schemaVersion: 'http://datacite.org/schema/kernel-4',
      },
    };

    return { data, doi };
  }

  /**
   * Registers a new DOI for a deposit.
   *
   * @param {PopulatedDepositDocument} deposit - The deposit linked to the new DOI.
   * @returns {Promise<string>} A Promise that resolves to the new DOI string.
   */
  async generateDOI(deposit: PopulatedDepositDocument): Promise<string> {
    const community = deposit.communityPopulated;

    assertIsDefined(community.datacite, 'DataCite is not configured correctly');

    const doisApi = new DoisApi(
      new Configuration(),
      community.datacite.server,
      this.httpService.axiosRef
    );

    const { data, doi } = this.generateDOIMetadata(deposit);

    await doisApi.doisPost(
      {
        data: data,
      },
      {
        auth: {
          username: community.datacite.accountId,
          password: decryptJson(community.datacite.pass),
        },
      }
    );

    return doi;
  }

  /**
   * Fetches DOI metadata from DataCite for a specific deposit.
   *
   * @param {PopulatedDepositDocument} deposit - The deposit for which to fetch DOI metadata.
   * @returns {Promise<Doi>} A Promise that resolves to the DOI metadata.
   */
  async getDoiMetadata(deposit: PopulatedDepositDocument): Promise<Doi> {
    Logger.debug('getDoiMetadata');
    const depositCommunity = deposit.communityPopulated;
    assertIsDefined(depositCommunity.datacite, 'DataCite is not configured correctly');

    assertIsDefined(deposit.doi, 'Doi not found in deposit');

    const doisApi = new DoisApi(
      new Configuration(),
      depositCommunity.datacite.server,
      this.httpService.axiosRef
    );

    Logger.debug('Asking for doi ', deposit.doi);

    const result = await doisApi.doisIdGet(deposit.doi, {
      auth: {
        username: depositCommunity.datacite.accountId,
        password: decryptJson(depositCommunity.datacite.pass),
      },
    });

    return result.data;
  }

  /**
   * Registers a new DOI for a review.
   *
   * @param {ReviewPopulatedDTO} review - The review linked to the new DOI.
   * @param {CommunityDocument} community - The community associated with the review.
   * @param {DepositDocument} deposit - The deposit associated with the review.
   * @param {number} reviewNumber - The sequence number of the review.
   * @returns {Promise<string>} A Promise that resolves to the new DOI string.
   */
  async generateReviewDOI(
    review: ReviewPopulatedDTO,
    community: CommunityDocument,
    deposit: DepositDocument,
    reviewNumber: number
  ): Promise<string> {
    assertIsDefined(deposit.doi, 'Reviewed deposit DOI is not defined');

    if (!community.datacite) {
      throw new NotFoundException('DataCite is not configured correctly');
    }

    const doisApi = new DoisApi(
      new Configuration(),
      community.datacite.pass,
      this.httpService.axiosRef
    );

    const doi = `${community.datacite.prefix}/${review._id}`;

    const doiAttr = this.generateDOIMetadataReview(review, community, deposit, reviewNumber);

    await doisApi.doisPost(
      {
        data: {
          type: 'dois',
          attributes: doiAttr,
        },
      },
      {
        auth: {
          username: community.datacite.accountId,
          password: decryptJson(community.datacite.pass),
        },
      }
    );

    return doi;
  }

  /**
   * Fetches DOI metadata from DataCite for a specific review.
   *
   * @param {ReviewPopulatedDTO} review - The review for which to fetch DOI metadata.
   * @param {CommunityDocument} community - The community associated with the review.
   * @returns {Promise<Doi>} A Promise that resolves to the DOI metadata.
   */
  async getReviewDoiMetadata(
    review: ReviewPopulatedDTO,
    community: CommunityDocument
  ): Promise<Doi> {
    if (!community.datacite) {
      throw new NotFoundException('DataCite is not configured correctly');
    }

    assertIsDefined(review.doi, 'Doi not found in review');

    const doisApi = new DoisApi(
      new Configuration(),
      community.datacite.server,
      this.httpService.axiosRef
    );

    const result = await doisApi.doisIdGet(review.doi, {
      auth: {
        username: community.datacite.server,
        password: decryptJson(community.datacite.pass),
      },
    });

    return result.data;
  }

  /**
   * Converts author information into DataCite creator format.
   *
   * @param {Author[]} authors - The list of authors to convert.
   * @returns {DoiDataAttributesCreatorsInner[]} An array of DataCite creator objects.
   */
  authorsToDataciteCreators(authors: Author[]): DoiDataAttributesCreatorsInner[] {
    const creators: DoiDataAttributesCreatorsInner[] = [];
    for (const author of authors) {
      const regex = /https:\/\/orcid\.org\/(.*)/;
      const orcid = author.orcid?.match(regex);
      if (orcid && orcid[1]) {
        creators.push({
          name: author.firstName + ' ' + author.lastName,
          givenName: author.firstName,
          familyName: author.lastName,
          nameIdentifiers: [
            {
              nameIdentifier: orcid[1],
              nameIdentifierScheme: 'ORCID',
              schemeUri: 'http://orcid.org/',
            },
          ],
        });
      } else {
        creators.push({
          name: author.firstName + ' ' + author.lastName,
          givenName: author.firstName,
          familyName: author.lastName,
        });
      }
    }

    return creators;
  }
}
