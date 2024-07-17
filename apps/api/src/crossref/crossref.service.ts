import { Injectable } from '@nestjs/common';
import { assertIsDefined, decryptJson, DepositCLASSNAME, ReviewCLASSNAME } from '../utils/utils';
import { readFileSync } from 'fs';
import FormData from 'form-data';
import handlebars from 'handlebars';
import { join } from 'path';
import { PopulatedDepositDocument } from '../deposit/deposit.service';
import { environment } from '../environments/environment';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { ReviewService } from '../review/review.service';
import { ReviewDecision } from '../review/review.schema';
import { CommunityDocument, CommunityType } from '../communities/communities.schema';
import { CrossrefDTO } from '../dtos/crossref.dto';
import { Author } from '../deposit/deposit.schema';
import { ReviewPopulatedDTO } from '../dtos/review/review-populated.dto';
import { HIDDEN_IDENTITY } from '../dtos/review/review-hidden-identity.dto';
import { Reference } from '../dtos/reference.dto';
import { DoiLogService } from '../doi/doi-log.service';
import { DoiStatus } from '../doi/doi-log.schema';

const TEMPLATES_PATH = join(__dirname, '/templates');

export interface CrossrefReviewDoi {
  doi: string;
  title: string;
  publicationDate: { month: string; day: string; year: string };
  isAuthorHidden: boolean;
  firstName: string;
  lastName: string;
  decision: CROSSREF_REVIEW_RECOMENDATIONS;
  resource: string;
  depositTitle: string;
  depositDoi: string;
}

export interface CrossrefDepositDoi {
  doi: string;
  title: string;
  abstract: string;
  publicationDate: { month: string; day: string; year: string };
  isbn?: string | null;
  firstPage?: number | null;
  conferenceTitle?: string;
  conferenceTheme?: string;
  lastPage?: number | null;
  resource: string;
  references?: Reference[];
  authors: Author[];
  publisher?: string;
  issn?: string | null;
  journal_title?: string | null;
}

enum CROSSREF_REVIEW_RECOMENDATIONS {
  majorRevision = 'major-revision',
  minorRevision = 'minor-revision',
  reject = 'reject',
  rejectWithResubmit = 'reject-with-resubmit',
  accept = 'accept',
  acceptWithReservation = 'accept-with-reservation',
}

/**
 * Service for handling Crossref operations such as DOI registration and metadata submissions.
 */
@Injectable()
export class CrossrefService {
  /**
   * Initializes a new instance of the CrossrefService.
   *
   * @param {HttpService} httpService - The HTTP service for making API calls.
   * @param {ReviewService} reviewService - Service for accessing review data.
   * @param {DoiLogService} doiLogService - Service for logging DOI operations.
   */
  constructor(
    private readonly httpService: HttpService,
    private readonly reviewService: ReviewService,
    private readonly doiLogService: DoiLogService
  ) {}

  /**
   * Generates XML metadata for a deposit based on Crossref standards.
   *
   * @param {PopulatedDepositDocument} deposit - The deposit document containing all required metadata.
   * @param {number} timestamp - Optional timestamp for the submission, defaults to current time.
   * @returns {string} The generated XML string ready for Crossref submission.
   */
  createDepositXML(deposit: PopulatedDepositDocument, timestamp = new Date().getTime()): string {
    assertIsDefined(deposit.communityPopulated.crossref, 'Crossref credentials are not defined');
    this.registerPartials();

    const fileName =
      deposit.communityPopulated.type === CommunityType.conference
        ? 'crossrefDepositConference'
        : 'crossrefDepositJournal';
    const source = readFileSync(`${TEMPLATES_PATH}/${fileName}.hbs`, 'utf-8');

    const template = handlebars.compile<{
      timestamp: number;
      deposit: CrossrefDepositDoi;
    }>(source);

    return template({
      timestamp: timestamp,
      deposit: this.transformToCrossrefDeposit(deposit, deposit.communityPopulated.crossref),
    });
  }

  /**
   * Generates XML metadata for a review based on Crossref standards.
   *
   * @param {ReviewPopulatedDTO} reviewDTO - The review data transfer object containing all required metadata.
   * @param {CrossrefDTO} crossref - Crossref credentials and other necessary data.
   * @param {number} timestamp - Optional timestamp for the submission, defaults to current time.
   * @returns {Promise<string>} A Promise that resolves to the generated XML string ready for Crossref submission.
   */
  async createReviewXML(
    reviewDTO: ReviewPopulatedDTO,
    crossref: CrossrefDTO,
    timestamp = new Date().getTime()
  ): Promise<string> {
    this.registerPartials();

    const source = readFileSync(`${TEMPLATES_PATH}/crossrefReview.hbs`, 'utf-8');
    const template = handlebars.compile<{
      timestamp: number;
      review: CrossrefReviewDoi;
    }>(source);

    return template({
      timestamp: timestamp,
      review: await this.transformToCrossrefReview(reviewDTO, crossref),
    });
  }

  /**
   * Submits a deposit's metadata to Crossref and registers a DOI.
   *
   * @param {PopulatedDepositDocument} deposit - The deposit document to submit.
   * @returns {Promise<string>} A Promise that resolves to the registered DOI.
   */
  async generateDepositDOI(deposit: PopulatedDepositDocument): Promise<string> {
    assertIsDefined(deposit.communityPopulated.crossref, 'Crossref credentials are not defined');
    const submissionId = new Date().getTime(); // The timestamp is used as submission id
    const depositXML = this.createDepositXML(deposit, submissionId);
    const filename = `crossref_deposit_${deposit._id.toString()}_${submissionId}.xml`;

    const { doi, status } = await this.sendMetadataSubmission(
      deposit.communityPopulated._id.toHexString(),
      deposit.communityPopulated.crossref,
      depositXML,
      filename,
      submissionId,
      deposit._id.toHexString(),
      DepositCLASSNAME
    );

    deposit.doi = doi;
    deposit.doiStatus = status;
    await deposit.save();

    return doi;
  }

  /**
   * Submits a review's metadata to Crossref and registers a DOI.
   *
   * @param {ReviewPopulatedDTO} review - The review to submit.
   * @param {CommunityDocument} community - The community associated with the review.
   * @returns {Promise<string>} A Promise that resolves to the registered DOI.
   */
  async generateReviewDOI(
    review: ReviewPopulatedDTO,
    community: CommunityDocument
  ): Promise<string> {
    assertIsDefined(community.crossref, 'Crossref credentials are not defined');
    const submissionId = new Date().getTime(); // The timestamp is used as submission id
    const reviewXML = await this.createReviewXML(review, community.crossref, submissionId);
    const filename = `crossref_review_${review._id.toString()}_${submissionId}.xml`;

    const { status, doi } = await this.sendMetadataSubmission(
      community._id.toHexString(),
      community.crossref,
      reviewXML,
      filename,
      submissionId,
      review._id,
      ReviewCLASSNAME
    );

    await this.reviewService.findOneAndUpdate(
      { _id: review._id },
      {
        doi: doi,
        doiStatus: status,
      }
    );

    return doi;
  }

  /**
   * Handles the sending of metadata to Crossref and processes the response.
   *
   * @param {string} communityId - The identifier of the community submitting the data.
   * @param {CrossrefDTO} crossref - The Crossref credentials.
   * @param {string} XML - The XML metadata to submit.
   * @param {string} filename - The name of the file to create for the submission.
   * @param {number} submissionId - The unique identifier for the submission.
   * @param {string} id - The identifier of the resource (deposit or review).
   * @param {typeof DepositCLASSNAME | typeof ReviewCLASSNAME} type - The type of the resource being submitted.
   * @returns {Promise<{ doi: string; status: DoiStatus }>} A Promise resolving to the DOI and its registration status.
   */
  private async sendMetadataSubmission(
    communityId: string,
    crossref: CrossrefDTO,
    XML: string,
    filename: string,
    submissionId: number,
    id: string,
    type: typeof DepositCLASSNAME | typeof ReviewCLASSNAME
  ): Promise<{ doi: string; status: DoiStatus }> {
    const { user, pass, role, prefixDOI, server } = crossref;
    const form = new FormData();
    form.append('operation', 'doMDUpload');
    form.append('login_id', `${user}/${role}`);
    form.append('login_passwd', decryptJson(pass));
    form.append('fname', Buffer.from(XML), filename);
    const doi = `${prefixDOI}/${id}`;

    const doiLogWithoutStatus = {
      doi,
      file: filename,
      community: communityId,
      submissionId: submissionId,
      resource: id,
      resourceModel: type,
    };

    const doiLog = await this.doiLogService.doiModel.findOne({ doi: doi }).exec();

    if (doiLog?.status === DoiStatus.failed || doiLog?.status === DoiStatus.published) {
      await doiLog.deleteOne();
    }
    if (doiLog?.status === DoiStatus.processing) {
      return { doi, status: DoiStatus.processing };
    }

    const response = await firstValueFrom(
      this.httpService.post<string>(server, form, {
        headers: {
          ...form.getHeaders(),
          'Content-Type': 'multipart/form-data',
        },
      })
    );

    if (!response.data.includes('<title>SUCCESS</title>')) {
      await this.doiLogService.create({
        status: DoiStatus.failed,
        data: 'Invalid metadata, please check the xml file',
        ...doiLogWithoutStatus,
      });
      return { doi, status: DoiStatus.failed };
    }
    await this.doiLogService.create({
      status: DoiStatus.processing,
      ...doiLogWithoutStatus,
    });
    return { doi, status: DoiStatus.processing };
  }

  /**
   * Registers partial templates needed for XML generation.
   */
  private registerPartials(): void {
    const contributors_partial = readFileSync(
      `${TEMPLATES_PATH}/partials/contributors.hbs`,
      'utf-8'
    );
    const head_partial = readFileSync(`${TEMPLATES_PATH}/partials/head.hbs`, 'utf-8');
    handlebars.registerPartial('contributors_content', contributors_partial);
    handlebars.registerPartial('head_content', head_partial);
  }

  /**
   * Transforms review data into the format required for Crossref submission.
   *
   * @param {ReviewPopulatedDTO} review - The review data.
   * @param {CrossrefDTO} crossref - The Crossref configuration data.
   * @returns {Promise<CrossrefReviewDoi>} A Promise resolving to the transformed review data.
   */
  private async transformToCrossrefReview(
    review: ReviewPopulatedDTO,
    crossref: CrossrefDTO
  ): Promise<CrossrefReviewDoi> {
    assertIsDefined(review.depositPopulated.doi, 'Reviewed deposit must have a DOI assigned');
    const reviewDate = new Date(review.publicationDate ?? review.creationDate);
    const date = {
      day: reviewDate.getDate().toString(),
      month: String(reviewDate.getMonth() + 1),
      year: reviewDate.getFullYear().toString(),
    };
    const reviewNumber = await this.reviewService.reviewModel
      .countDocuments({ deposit: review.deposit, doi: { $exists: true, $ne: '' } })
      .exec();
    const reviewTitle = `Review: ${review.depositPopulated.title} (R${
      review.depositPopulated.version
    }/RC${reviewNumber + 1})`;

    const transformedCrossref: CrossrefReviewDoi = {
      depositTitle: review.depositPopulated.title,
      depositDoi: review.depositPopulated.doi,
      doi: `${crossref.prefixDOI}/${review._id}`,
      publicationDate: date,
      resource: `${environment.publicUrl}/reviews/${review._id}/view`,
      title: reviewTitle,
      decision: this.reviewDecisionTransform(review.decision),
      firstName: review.ownerProfile.firstName,
      lastName: review.ownerProfile.lastName,
      isAuthorHidden: review.author === HIDDEN_IDENTITY,
    };

    return transformedCrossref;
  }

  /**
   * Transforms deposit data into the format required for Crossref submission.
   *
   * @param {PopulatedDepositDocument} deposit - The deposit data.
   * @param {CrossrefDTO} crossref - The Crossref configuration data.
   * @returns {CrossrefDepositDoi} The transformed deposit data.
   */
  private transformToCrossrefDeposit(
    deposit: PopulatedDepositDocument,
    crossref: CrossrefDTO
  ): CrossrefDepositDoi {
    if (deposit.communityPopulated.type === CommunityType.journal) {
      assertIsDefined(deposit.extraMetadata.issn, 'ISSN is mandatory for Journal publications');
      assertIsDefined(
        deposit.extraMetadata.journalTitle,
        'Journal title is mandatory for Journal publications'
      );
    }
    assertIsDefined(deposit.abstract, 'Abstract is mandatory');
    deposit.publicationDate = deposit.publicationDate ? deposit.publicationDate : new Date();
    const depositDate = new Date(deposit.publicationDate);
    const date = {
      day: depositDate.getDate().toString(),
      month: String(depositDate.getMonth() + 1),
      year: depositDate.getFullYear().toString(),
    };

    // Prepare some default values
    deposit.extraMetadata.publisher =
      deposit.extraMetadata.publisher || deposit.communityPopulated.name;
    deposit.extraMetadata.conferenceTheme =
      deposit.extraMetadata.conferenceTheme || deposit.communityPopulated.name;

    const transformedCrossref: CrossrefDepositDoi = {
      title: deposit.title,
      doi: `${crossref.prefixDOI}/${deposit._id.toHexString()}`,
      abstract: deposit.abstract,
      conferenceTitle: deposit.communityPopulated.name,
      conferenceTheme: deposit.extraMetadata.conferenceTheme,
      isbn: deposit.extraMetadata.isbn,
      firstPage: deposit.extraMetadata.firstpage,
      lastPage: deposit.extraMetadata.lastpage,
      authors: deposit.toJSON().authors,
      resource: `${environment.publicUrl}/deposits/${deposit._id.toHexString()}/view`,
      publisher: deposit.extraMetadata.publisher,
      references: deposit.references,
      publicationDate: date,
      issn: deposit.extraMetadata.issn ?? deposit.communityPopulated.issn,
      journal_title: deposit.extraMetadata.journalTitle,
    };

    return transformedCrossref;
  }

  /**
   * Maps review decisions to Crossref recommendation constants.
   *
   * @param {ReviewDecision} decision - The review decision.
   * @returns {CROSSREF_REVIEW_RECOMENDATIONS} The corresponding Crossref recommendation.
   */
  private reviewDecisionTransform(decision: ReviewDecision): CROSSREF_REVIEW_RECOMENDATIONS {
    const map = new Map<ReviewDecision, CROSSREF_REVIEW_RECOMENDATIONS>([
      [ReviewDecision.accepted, CROSSREF_REVIEW_RECOMENDATIONS.accept],
      [ReviewDecision.majorRevision, CROSSREF_REVIEW_RECOMENDATIONS.majorRevision],
      [ReviewDecision.minorRevision, CROSSREF_REVIEW_RECOMENDATIONS.minorRevision],
    ]);
    const recommendation = map.get(decision);
    assertIsDefined(recommendation);
    return recommendation;
  }
}
