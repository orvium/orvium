import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { readFileSync } from 'fs';
import handlebars from 'handlebars';
import { DepositService } from '../deposit/deposit.service';
import { DC_TYPES, METADATA_FORMAT_DC, ResumptionToken } from './oaipmh.schema';
import { environment } from '../environments/environment';
import { join } from 'path';
import { Deposit, DepositDocument, DepositStatus } from '../deposit/deposit.schema';
import { CommunitiesService } from '../communities/communities.service';
import { isValidObjectId, Require_id } from 'mongoose';
import { Community } from '../communities/communities.schema';
import { StrictFilterQuery } from '../utils/types';

const TEMPLATES_PATH = join(__dirname, '/templates');
const PAGE_LIMIT = 20;

/**
 * Service for handling OaipmhService.
 */
@Injectable()
export class OaipmhService {
  /**
   * Constructs an instance of OaipmhService with required services.
   *
   * @param {DepositService} depositService - Service for managing deposits.
   * @param {CommunitiesService} communitiesService - Service for managing communities.
   */
  constructor(
    private readonly depositService: DepositService,
    private readonly communitiesService: CommunitiesService
  ) {
    handlebars.registerHelper('toISOString', function (date: Date) {
      return date.toISOString().substring(0, 10);
    });
    handlebars.registerHelper('toDateStampFormat', function (date: Date) {
      return date.toISOString().substring(0, 19) + 'Z';
    });
  }

  /**
   * Returns an Identify response formatted according to the OAIPMH protocol.
   *
   * @returns {string} The formatted Identify response.
   */
  identify(): string {
    const source = readFileSync(`${TEMPLATES_PATH}/identify.hbs`, 'utf-8');
    const template = handlebars.compile<{ date: string; endpoint: string }>(source);
    return template({ date: new Date().toISOString(), endpoint: environment.publicUrl });
  }

  /**
   * Lists available metadata formats that this repository can supply.
   *
   * @returns {string} The formatted ListMetadataFormats response.
   */
  listMetadataFormats(): string {
    const source = readFileSync(`${TEMPLATES_PATH}/listMetadataFormats.hbs`, 'utf-8');
    const template = handlebars.compile<{ date: string; endpoint: string }>(source);
    return template({ date: new Date().toISOString(), endpoint: environment.publicUrl });
  }

  /**
   * Generates a response indicating an invalid or illegal request due to bad verb.
   *
   * @returns {string} The formatted BadVerb response.
   */
  badVerb(): string {
    const source = readFileSync(`${TEMPLATES_PATH}/badVerb.hbs`, 'utf-8');
    const template = handlebars.compile<{ date: string; endpoint: string }>(source);
    return template({ date: new Date().toISOString(), endpoint: environment.publicUrl });
  }

  /**
   * Generates a response indicating an invalid or illegal request due to bad argument.
   *
   * @returns {string} The formatted BadArgument response.
   */
  badArgument(): string {
    const source = readFileSync(`${TEMPLATES_PATH}/badArgument.hbs`, 'utf-8');
    const template = handlebars.compile<{ date: string; endpoint: string }>(source);
    return template({ date: new Date().toISOString(), endpoint: environment.publicUrl });
  }

  /**
   * Generates a response indicating an invalid or expired resumption token.
   *
   * @returns {string} The formatted BadResumptionToken response.
   */
  badResumptionToken(): string {
    const source = readFileSync(`${TEMPLATES_PATH}/badResumptionToken.hbs`, 'utf-8');
    const template = handlebars.compile<{ date: string; endpoint: string }>(source);
    return template({ date: new Date().toISOString(), endpoint: environment.publicUrl });
  }

  /**
   * Generates a response indicating no records match the provided identifier.
   *
   * @returns {string} The formatted NoMatchId response.
   */
  noMatchId(): string {
    const source = readFileSync(`${TEMPLATES_PATH}/noMatchId.hbs`, 'utf-8');
    const template = handlebars.compile<{ date: string; endpoint: string }>(source);
    return template({ date: new Date().toISOString(), endpoint: environment.publicUrl });
  }

  /**
   * Generates a response indicating no records match the request.
   *
   * @returns {string} The formatted NoMatch response.
   */
  noMatch(): string {
    const source = readFileSync(`${TEMPLATES_PATH}/noMatch.hbs`, 'utf-8');
    const template = handlebars.compile<{ date: string; endpoint: string }>(source);
    return template({ date: new Date().toISOString(), endpoint: environment.publicUrl });
  }

  /**
   * Generates a response indicating no metadata formats are available for the requested set or record.
   *
   * @returns {string} The formatted NoMetadataFormats response.
   */
  noMetadataFormats(): string {
    const source = readFileSync(`${TEMPLATES_PATH}/noMetadataFormats.hbs`, 'utf-8');
    const template = handlebars.compile<{ date: string; endpoint: string }>(source);
    return template({ date: new Date().toISOString(), endpoint: environment.publicUrl });
  }

  /**
   * Lists all sets that the repository supports.
   *
   * @returns {Promise<string>} A promise resolved with the formatted ListSets response.
   */
  async listSets(): Promise<string> {
    const communities = await this.communitiesService.communityModel.find({}).lean();
    const source = readFileSync(`${TEMPLATES_PATH}/listSets.hbs`, 'utf-8');
    const template = handlebars.compile<{
      date: string;
      endpoint: string;
      community: Require_id<Community>[];
    }>(source);
    return template({
      date: new Date().toISOString(),
      endpoint: environment.publicUrl,
      community: communities,
    });
  }

  /**
   * Retrieves a record formatted according to the specified metadata format from the repository.
   *
   * @param {string} identifier - The unique identifier of the record.
   * @param {string} metadataFormat - The metadata format for the record to be returned.
   * @returns {Promise<string>} A promise resolved with the formatted record or an error response.
   */
  async getRecord(identifier: string, metadataFormat: string): Promise<string> {
    // Generate local identifier
    const localIdentifier = this.getLocalIdentifier(identifier);

    // Check metadata format
    const checkMetadata = this.checkMetadataFormats(metadataFormat);
    if (!checkMetadata) {
      return this.noMetadataFormats();
    }
    // Find deposit by id
    if (!isValidObjectId(localIdentifier)) {
      return this.noMatchId();
    }

    const deposit = await this.depositService.findById(localIdentifier);
    if (!deposit || ![DepositStatus.preprint, DepositStatus.published].includes(deposit.status)) {
      return this.noMatchId();
    }

    try {
      // https://schema.datacite.org/meta/kernel-4.4/doc/DataCite-MetadataKernel_v4.4.pdf
      // https://support.datacite.org/docs/datacite-metadata-schema-v44-xml-metadata-examples
      const source = readFileSync(`${TEMPLATES_PATH}/getRecord.hbs`, 'utf-8');
      let relatedItems = false;
      let relatedIdentifiers = false;
      if (
        deposit.extraMetadata.journalTitle ||
        deposit.extraMetadata.dissertationName ||
        deposit.extraMetadata.conferenceTitle ||
        deposit.extraMetadata.inbookTitle
      ) {
        relatedItems = true;
      }
      if (deposit.extraMetadata.issn || deposit.extraMetadata.isbn) {
        relatedIdentifiers = true;
      }
      const template = handlebars.compile<{
        date: string;
        dcIdentifier: string;
        spec: string;
        dcDate: string;
        dcType: string;
        dcTypeUri: string;
        endpoint: string;
        dcRelatedItems: boolean;
        dcRelatedIdentifiers: boolean;
        deposit: DepositDocument;
      }>(source);
      return template({
        date: deposit.createdOn.toISOString().substring(0, 19) + 'Z',
        dcIdentifier: localIdentifier,
        spec: deposit.communityPopulated.codename,
        dcDate: deposit.createdOn.toISOString().substring(0, 10),
        dcType: this.getType(deposit.publicationType),
        dcTypeUri: this.getTypeUri(deposit.publicationType),
        endpoint: environment.publicUrl,
        dcRelatedItems: relatedItems,
        dcRelatedIdentifiers: relatedIdentifiers,
        deposit: deposit.toJSON(),
      });
    } catch (e) {
      console.error(e);
      throw new InternalServerErrorException();
    }
  }

  /**
   * Lists identifiers of records from the repository filtered by criteria.
   *
   * @param {string} metadataFormat - The metadata format of the records to list.
   * @param {string} [from] - Start date of the range of records to retrieve.
   * @param {string} [until] - End date of the range of records to retrieve.
   * @param {string} [set] - The set to which records belong.
   * @param {string} [resumptionToken] - Resumption token for paginating large result sets.
   * @returns {Promise<string>} A promise resolved with the formatted ListIdentifiers response or an error response.
   */
  async listIdentifiers(
    metadataFormat: string,
    from?: string,
    until?: string,
    set?: string,
    resumptionToken?: string
  ): Promise<string> {
    // Check metadata format
    const checkMetadata = this.checkMetadataFormats(metadataFormat);
    if (!checkMetadata) {
      return this.noMetadataFormats();
    }
    // Find deposit identifiers
    try {
      from = this.setFromDate(resumptionToken, from);
      until = this.setUntilDate(resumptionToken, until);
      const filter: StrictFilterQuery<DepositDocument> = {};
      filter.status = { $in: [DepositStatus.published, DepositStatus.preprint] };
      filter.createdOn = {
        $gte: new Date(from),
        $lte: new Date(until),
      };
      filter.isLatestVersion = true;
      // Check set
      if (resumptionToken) {
        const jsonToken = JSON.parse(resumptionToken);
        if (jsonToken.set) {
          const community = await this.communitiesService.findOneByFilter({
            codename: jsonToken.set,
          });
          filter.community = community?._id;
        }
      } else if (set) {
        if ((await this.checkSet(set)) === false) {
          return this.noMatch();
        }
        const community = await this.communitiesService.findOneByFilter({ codename: set });
        filter.community = community?._id;
      }
      const deposits = await this.depositService.findWithLimitLean(
        filter,
        this.getSkip(resumptionToken),
        PAGE_LIMIT
      );
      if (deposits.length == 0) {
        return this.noMatch();
      }
      let limit = false;
      if (deposits.length == PAGE_LIMIT) limit = true;
      const source = readFileSync(`${TEMPLATES_PATH}/listIdentifiers.hbs`, 'utf-8');
      const template = handlebars.compile<{
        date: string;
        param: string;
        deposit: Deposit[];
        incomplete: boolean;
        token: string;
        endpoint: string;
      }>(source);
      return template(
        {
          date: new Date().toISOString(),
          param: '',
          deposit: deposits,
          incomplete: limit,
          token: resumptionToken
            ? this.setResumptionToken(resumptionToken)
            : this.createResumptionToken(from, until, set),
          endpoint: environment.publicUrl,
        },
        {
          allowedProtoMethods: {
            trim: true,
          },
        }
      );
    } catch (e) {
      Logger.debug(e);
      return this.badResumptionToken();
    }
  }

  /**
   * Lists records from the repository filtered by criteria and formatted according to the specified metadata format.
   *
   * @param {string} metadataFormat - The metadata format of the records to list.
   * @param {string} [from] - Start date of the range of records to retrieve.
   * @param {string} [until] - End date of the range of records to retrieve.
   * @param {string} [set] - The set to which records belong.
   * @param {string} [resumptionToken] - Resumption token for paginating large result sets.
   * @returns {Promise<string>} A promise resolved with the formatted ListRecords response or an error response.
   */
  async listRecords(
    metadataFormat: string,
    from?: string,
    until?: string,
    set?: string,
    resumptionToken?: string
  ): Promise<string> {
    // Check metadata format
    const checkMetadata = this.checkMetadataFormats(metadataFormat);
    if (!checkMetadata) {
      return this.noMetadataFormats();
    }
    // Find deposits
    try {
      from = this.setFromDate(resumptionToken, from);
      until = this.setUntilDate(resumptionToken, until);
      const filter: StrictFilterQuery<DepositDocument> = {};
      filter.status = { $in: [DepositStatus.published, DepositStatus.preprint] };
      filter.createdOn = {
        $gte: new Date(from),
        $lte: new Date(until),
      };
      filter.isLatestVersion = true;
      // Check set
      if (resumptionToken) {
        const jsonToken = JSON.parse(resumptionToken);
        if (jsonToken.set) {
          const community = await this.communitiesService.findOneByFilter({
            codename: jsonToken.set,
          });
          filter.community = community?._id;
        }
      } else if (set) {
        if ((await this.checkSet(set)) === false) {
          return this.noMatch();
        }
        const community = await this.communitiesService.findOneByFilter({ codename: set });
        filter.community = community?._id;
      }
      const deposits = await this.depositService.findWithLimitLean(
        filter,
        this.getSkip(resumptionToken),
        PAGE_LIMIT
      );
      if (deposits.length == 0) {
        return this.noMatch();
      }
      let limit = false;
      if (deposits.length == PAGE_LIMIT) limit = true;
      const source = readFileSync(`${TEMPLATES_PATH}/listRecord.hbs`, 'utf-8');
      const template = handlebars.compile<{
        date: string;
        param: string;
        deposit: Deposit[];
        incomplete: boolean;
        token: string;
        endpoint: string;
      }>(source);
      return template(
        {
          date: new Date().toISOString(),
          param: '',
          deposit: deposits,
          incomplete: limit,
          token: resumptionToken
            ? this.setResumptionToken(resumptionToken)
            : this.createResumptionToken(from, until, set),
          endpoint: environment.publicUrl,
        },
        {
          allowedProtoMethods: {
            trim: true,
          },
        }
      );
    } catch (e) {
      Logger.debug(e);
      return this.badResumptionToken();
    }
  }

  /**
   * Extracts the local identifier from a full OAI identifier.
   *
   * @param {string} value - The full OAI identifier.
   * @returns {string} The local identifier extracted from the full identifier or 'Invalid identifier' if not found.
   */
  getLocalIdentifier(value: string): string {
    const regex = /oai:orvium\.io:(\w*)/;
    const localIdentifier = regex.exec(value);
    return localIdentifier?.[1] || 'Invalid identifier';
  }

  /**
   * Maps the internal publication type to its corresponding OpenAire type.
   *
   * @param {string} value - The internal publication type value.
   * @returns {string} The OpenAire publication type.
   */
  getType(value: string): string {
    for (const type of DC_TYPES) {
      if (value == type.orviumValue) {
        return type.value;
      }
    }
    return 'other';
  }

  /**
   * Retrieves the URI for a given publication type based on OpenAire standards.
   *
   * @param {string} value - The publication type.
   * @returns {string} The URI for the publication type according to OpenAire.
   */
  getTypeUri(value: string): string {
    for (const type of DC_TYPES) {
      if (value == type.orviumValue) {
        return type.uri;
      }
    }
    return 'http://purl.org/coar/resource_type/c_1843';
  }

  /**
   * Verifies if the given metadata format is supported by the repository.
   *
   * @param {string} value - The metadata format to check.
   * @returns {boolean} True if the format is supported, otherwise false.
   */
  checkMetadataFormats(value: string): boolean {
    for (const type of METADATA_FORMAT_DC) {
      if (value == type.prefix) {
        return true;
      }
    }
    return false;
  }

  /**
   * Checks if a set (typically a community or collection) exists in the repository.
   *
   * @param {string} value - The set identifier.
   * @returns {Promise<boolean>} A promise that resolves to true if the set exists, otherwise false.
   */
  async checkSet(value: string): Promise<boolean> {
    if (value == 'orvium') {
      return true;
    }
    const exists = await this.communitiesService.exists({ codename: value });
    return !!exists;
  }

  /**
   * Updates or generates a resumption token for paginating large datasets.
   *
   * @param {string} resumptionToken - The current resumption token.
   * @param {string} [set] - The set to associate with the token.
   * @returns {string} A new or updated resumption token.
   */
  setResumptionToken(resumptionToken: string, set?: string): string {
    const jsonToken = JSON.parse(resumptionToken);
    const skip = Number(jsonToken.limit) + PAGE_LIMIT;
    const token: ResumptionToken = {
      from: jsonToken.from,
      until: jsonToken.until,
      limit: skip.toString(),
    };
    if (set) {
      token.set = set;
    }
    const encode = encodeURIComponent(JSON.stringify(token).trim());
    Logger.debug(encode);
    Logger.debug(decodeURIComponent(encode));
    return decodeURIComponent(encode);
  }

  /**
   * Creates a resumption token for paginating large datasets from scratch.
   *
   * @param {string} from - The start date for filtering records.
   * @param {string} until - The end date for filtering records.
   * @param {string} [set] - The set to associate with the token.
   * @returns {string} A newly created resumption token.
   */
  createResumptionToken(from: string, until: string, set?: string): string {
    const token: ResumptionToken = {
      from: from,
      until: until,
      limit: PAGE_LIMIT.toString(),
    };
    if (set) {
      token.set = set;
    }
    const encode = encodeURIComponent(JSON.stringify(token).trim());
    Logger.debug(encode);
    Logger.debug(decodeURIComponent(encode));
    return decodeURIComponent(encode);
  }

  /**
   * Extracts the skip value from a resumption token to determine the starting point for pagination.
   *
   * @param {string} [resumptionToken] - The resumption token containing the skip value.
   * @returns {number} The skip value extracted from the token.
   */
  getSkip(resumptionToken?: string): number {
    if (resumptionToken) {
      const jsonToken = JSON.parse(resumptionToken);
      return Number(jsonToken.limit);
    } else {
      return 0;
    }
  }

  /**
   * Sets the correct "from" date for filtering records, taking into account any provided resumption token.
   *
   * @param {string} [resumptionToken] - The resumption token which may contain a "from" date.
   * @param {string} [date] - The "from" date provided by the user.
   * @returns {string} The "from" date to be used for filtering records.
   */
  setFromDate(resumptionToken?: string, date?: string): string {
    if (date) {
      return date;
    } else if (resumptionToken) {
      const jsonToken = JSON.parse(resumptionToken);
      return jsonToken.from;
    } else {
      return '0000-01-01';
    }
  }

  /**
   * Sets the correct "until" date for filtering records, taking into account any provided resumption token.
   *
   * @param {string} [resumptionToken] - The resumption token which may contain an "until" date.
   * @param {string} [date] - The "until" date provided by the user.
   * @returns {string} The "until" date to be used for filtering records.
   */
  setUntilDate(resumptionToken?: string, date?: string): string {
    if (date) {
      return date;
    } else if (resumptionToken) {
      const jsonToken = JSON.parse(resumptionToken);
      return jsonToken.until;
    } else {
      return '9999-01-01';
    }
  }
}
