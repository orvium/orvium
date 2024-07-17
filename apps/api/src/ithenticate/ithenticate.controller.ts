import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserService } from '../users/user.service';
import { DepositService } from '../deposit/deposit.service';
import { Request } from 'express';
import { assertIsDefined, encryptJson } from '../utils/utils';
import { AuthorizationService, COMMUNITY_ACTIONS } from '../authorization/authorization.service';
import { IthenticateService } from './ithenticate.service';
import {
  EulaAcceptListItem,
  EulaVersion,
  EulaVersionAvailableLanguagesEnum,
  SimilarityMetadata as ISimilarityMetadata,
  SimilarityMetadataAllOfTopMatches as ISimilarityMetadataAllOfTopMatches,
  SimilarityViewerUrlResponse,
  SimpleSubmissionResponse,
  SimpleSubmissionResponseStatusEnum,
  Submission,
  SubmissionErrorCodeEnum,
  SubmissionStatusEnum,
  SuccessMessage,
} from '@orvium/ithenticate-client';
import { CommunitiesService } from '../communities/communities.service';
import { IThenticateReportReadyEvent } from '../event/events/iThenticateReportReady';
import { EventService } from '../event/event.service';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiExcludeEndpoint,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { CommunityDocument } from '../communities/communities.schema';
import { CommunityPopulatedDTO } from '../dtos/community/community-populated.dto';

export class SimilarityMetadataAllOfTopMatches implements ISimilarityMetadataAllOfTopMatches {
  /**
   * Source name
   * @type {string}
   * @memberof SimilarityMetadataAllOfTopMatches
   */
  @ApiProperty({ required: false }) 'name'?: string;
  /**
   * Match percentage
   * @type {number}
   * @memberof SimilarityMetadataAllOfTopMatches
   */
  @ApiProperty({ required: false }) 'percentage'?: number;
  /**
   * Matching submission id
   * @type {string}
   * @memberof SimilarityMetadataAllOfTopMatches
   */
  @ApiProperty({ required: false }) 'submission_id'?: string;
  /**
   * Matching submission source type (INTERNET, PUBLICATION, SUBMITTED_WORK)
   * @type {string}
   * @memberof SimilarityMetadataAllOfTopMatches
   */
  @ApiProperty({ required: false }) 'source_type'?: string;
  /**
   * number of matching words
   * @type {number}
   * @memberof SimilarityMetadataAllOfTopMatches
   */
  @ApiProperty({ required: false }) 'matched_word_count_total'?: number;
  /**
   * date match was submitted
   * @type {string}
   * @memberof SimilarityMetadataAllOfTopMatches
   */
  @ApiProperty({ required: false }) 'submitted_date'?: string;
  /**
   * intitution name for matched SUBMITTED_WORK types
   * @type {string}
   * @memberof SimilarityMetadataAllOfTopMatches
   */
  @ApiProperty({ required: false }) 'institution_name'?: string;
}

export class IthenticatePayload {
  @IsString() @ApiProperty() depositId!: string;
}

export class SimilarityMetadata implements ISimilarityMetadata {
  /**
   * Represents the percentage match against all sources
   * @type {number}
   * @memberof SimilarityMetadata
   */
  @ApiProperty() 'overall_match_percentage': number;
  /**
   * Represents the percentage match against internet
   * @type {number}
   * @memberof SimilarityMetadata
   */
  @ApiProperty({ type: 'number', nullable: true, required: false }) 'internet_match_percentage'?:
    | number
    | null;
  /**
   * Represents the percentage match against all publications
   * @type {number}
   * @memberof SimilarityMetadata
   */
  @ApiProperty({ type: 'number', nullable: true, required: false })
  'publication_match_percentage'?: number | null;
  /**
   * Represents the percentage match against all submitted works
   * @type {number}
   * @memberof SimilarityMetadata
   */
  @ApiProperty({ type: 'number', nullable: true, required: false })
  'submitted_works_match_percentage'?: number | null;
  /**
   *
   * @type {string}
   * @memberof SimilarityMetadata
   */
  @ApiProperty() 'submission_id': string;
  /**
   * possible values PENDING, COMPLETE
   * @type {string}
   * @memberof SimilarityMetadata
   */
  @ApiProperty() 'status': string;
  /**
   * Time the report finished generating.  If not set the report has not finished generating
   * @type {string}
   * @memberof SimilarityMetadata
   */
  @ApiProperty() 'time_generated': string;
  /**
   * Time the report was requested
   * @type {string}
   * @memberof SimilarityMetadata
   */
  @ApiProperty() 'time_requested': string;
  /**
   * Top matches
   * @type {Array<SimilarityMetadataAllOfTopMatches>}
   * @memberof SimilarityMetadata
   */
  @ApiProperty({ type: SimilarityMetadataAllOfTopMatches, isArray: true })
  'top_matches': SimilarityMetadataAllOfTopMatches[];
  /**
   * Largest individual matched word count, 0 if there isn\'t a match to this submission.
   * @type {number}
   * @memberof SimilarityMetadata
   */
  @ApiProperty() 'top_source_largest_matched_word_count': number;
}

export class webhookPayload {
  @IsString() @ApiProperty() key!: string;
  @IsString() @ApiProperty() communityId!: string;
}

export class webhookStatusPayload {
  @ApiProperty() active!: boolean;
}

export class SimilarityViewerUrlResponseDTO implements SimilarityViewerUrlResponse {
  /**
   * URL to be used to access Cloud Viewer visualization of similarity report matches
   * @type {string}
   * @memberof SimilarityViewerUrlResponse
   */
  @ApiProperty() viewer_url?: string;
}

export class EulaViewResponse {
  @IsString() @ApiProperty() html!: string;
}

export class EulaAcceptListItemClass implements EulaAcceptListItem {
  /**
   * The unique id of the user in the external system
   * @type {string}
   * @memberof EulaAcceptListItem
   */
  @ApiProperty() user_id?: string;
  /**
   * The timestamp marking when the EULA was accepted
   * @type {string}
   * @memberof EulaAcceptListItem
   */
  @ApiProperty() accepted_timestamp?: string;
  /**
   * The language code for which language instance of the EULA version was accepted
   * @type {string}
   * @memberof EulaAcceptListItem
   */
  @ApiProperty() language?: string;
  /**
   * The unique name of the EULA Version
   * @type {string}
   * @memberof EulaAcceptListItem
   */
  @ApiProperty() version?: string;
}

export class SubmissionClass implements Submission {
  /**
   * the owner of the submission
   * @type {string}
   * @memberof Submission
   */
  @ApiProperty() owner?: string;
  /**
   * the title of the submission
   * @type {string}
   * @memberof Submission
   */
  @ApiProperty() title?: string;
  /**
   * the current status of the Submission
   * @type {string}
   * @memberof Submission
   */
  @ApiProperty({ enum: SubmissionStatusEnum, enumName: 'SubmissionStatusEnum' })
  status?: SubmissionStatusEnum;
  /**
   * the unique ID of the submission
   * @type {string}
   * @memberof Submission
   */
  @ApiProperty() id?: string;
  /**
   * an error code representing the type of error encountered (if applicable)
   * @type {string}
   * @memberof Submission
   */
  @ApiProperty({ enum: SubmissionErrorCodeEnum, enumName: 'SubmissionErrorCodeEnum' })
  error_code?: SubmissionErrorCodeEnum;
}

export class SimpleSubmissionResponseClass implements SimpleSubmissionResponse {
  /**
   * the unique ID of the submission
   * @type {string}
   * @memberof SimpleSubmissionResponse
   */
  @ApiProperty() id?: string;
  /**
   * the owner of the submission
   * @type {string}
   * @memberof SimpleSubmissionResponse
   */
  @ApiProperty() owner?: string;
  /**
   * the title of the submission
   * @type {string}
   * @memberof SimpleSubmissionResponse
   */
  @ApiProperty() title?: string;
  /**
   * the current status of the Submission
   * @type {string}
   * @memberof SimpleSubmissionResponse
   */
  @ApiProperty({
    enum: SimpleSubmissionResponseStatusEnum,
    enumName: 'SimpleSubmissionResponseStatusEnum',
  })
  status?: SimpleSubmissionResponseStatusEnum;
  /**
   * RFC3339 timestamp of when this submission was initially created. This is the time at which the POST to /submissions was made.
   * @type {string}
   * @memberof SimpleSubmissionResponse
   */
  @ApiProperty() created_time?: string;
}

export class EulaVersionClass implements EulaVersion {
  /**
   * The unique name of the EULA Version
   * @type {string}
   * @memberof EulaVersion
   */
  @ApiProperty() version?: string;
  /**
   * The starting date indicating when acceptence of this EULA is considered valid
   * @type {string}
   * @memberof EulaVersion
   */
  @ApiProperty() valid_from?: string;
  /**
   * The ending date indicating when acceptence of this EULA is no longer valid
   * @type {string}
   * @memberof EulaVersion
   */
  @ApiProperty() valid_until?: string | null;
  /**
   * The url where the corresponding EULA page can be found
   * @type {string}
   * @memberof EulaVersion
   */
  @ApiProperty() url?: string;
  /**
   * The languages (instances) of this version. 21 language locales are currently supported.
   * @type {Array<string>}
   * @memberof EulaVersion
   */
  @ApiProperty() available_languages?: EulaVersionAvailableLanguagesEnum[];
}

/**
 * Controller for handling operations with IthenticateController (antiplagiarim) in the application.
 *
 * @tags ithenticate
 * @controller ithenticate
 */
@ApiTags('ithenticate')
@Controller('ithenticate')
export class IthenticateController {
  /**
   * Instantiates a IthenticateController object.
   *
   * @param {CommunitiesService} communitiesService - Service for community data management.
   * @param {UserService} userService - Service for user data management.
   * @param {DepositService} depositService - Service for deposits data management.
   * @param {AuthorizationService} authorizationService - Service for handling authorization tasks.
   * @param {IthenticateService} ithenticateService - Service for ithenticateService plagiarims data management.
   * @param {EventService} eventService - Service for managing events.
   */
  constructor(
    private readonly communitiesService: CommunitiesService,
    private readonly userService: UserService,
    private readonly depositService: DepositService,
    private readonly authorizationService: AuthorizationService,
    private readonly ithenticateService: IthenticateService,
    private readonly eventService: EventService
  ) {}

  /**
   * GET - Fetches the End User License Agreement (EULA) for iThenticate associated with a specified community.
   * This function requires user authentication and that the user has moderation privileges on the specified community.
   * It checks if the community has an iThenticate configuration before attempting to retrieve the EULA.
   *
   * @param {Request} req - The HTTP request object, used to authenticate the user.
   * @param {string} communityId - The unique identifier of the community whose iThenticate EULA is to be retrieved.
   * @returns {Promise<EulaVersionClass>} - Returns a promise that resolves to the EULA details of the specified community's iThenticate setup.
   * @throws {UnauthorizedException} - If the user is not found or does not have the necessary permissions.
   * @throws {NotFoundException} - If the specified community is not found or if iThenticate is not configured for the community.
   */
  @ApiOperation({ summary: 'Retrieve iThenticate EULA' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':communityId([0-9a-f]{24})/eula')
  async getIThenticateEULA(
    @Req() req: Request,
    @Param('communityId') communityId: string
  ): Promise<EulaVersionClass> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');

    const community = await this.communitiesService.findOneByFilter({ _id: communityId });
    assertIsDefined(community, 'Community not found');
    const ability = await this.authorizationService.defineAbilityFor(user);
    this.authorizationService.canDo(ability, COMMUNITY_ACTIONS.moderate, community);

    assertIsDefined(community.iThenticateAPIKey, 'iThenticate must be configured');
    return await this.ithenticateService.getEULA(community.iThenticateAPIKey);
  }

  /**
   * GET - Retrieves the HTML version of the EULA for iThenticate for a given community.
   * This endpoint is protected and requires authentication and authorization to ensure that only users with
   * moderation rights can access the iThenticate EULA content. It verifies that the community has iThenticate configured
   * before fetching the EULA.
   *
   * @param {Request} req - The incoming HTTP request containing the user's token for authentication.
   * @param {string} communityId - MongoDB ObjectId as a string specifying the community for which to retrieve the EULA.
   * @returns {Promise<EulaViewResponse>} - A promise that resolves to an object containing the HTML content of the EULA.
   * @throws {UnauthorizedException} - If the user is not authenticated or does not have moderation rights.
   * @throws {NotFoundException} - If the community does not exist or if iThenticate is not configured for the community.
   */
  @ApiExcludeEndpoint()
  @UseGuards(JwtAuthGuard)
  @Get(':communityId([0-9a-f]{24})/eula-view')
  async getIThenticateEULAHTML(
    @Req() req: Request,
    @Param('communityId') communityId: string
  ): Promise<EulaViewResponse> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');

    const community = await this.communitiesService.findOneByFilter({ _id: communityId });
    assertIsDefined(community, 'Community not found');
    const ability = await this.authorizationService.defineAbilityFor(user);
    this.authorizationService.canDo(ability, COMMUNITY_ACTIONS.moderate, community);

    assertIsDefined(community.iThenticateAPIKey, 'iThenticate must be configured');

    const response = await this.ithenticateService.getEULAHTML(community.iThenticateAPIKey);
    return { html: response };
  }

  /**
   * POST - Accepts the EULA for iThenticate on behalf of the user for a specific community.
   * This endpoint requires authentication and appropriate authorization to ensure that only users with
   * moderation rights in the specified community can accept the EULA. This method also checks if iThenticate is configured
   * for the community before accepting the EULA.
   *
   * @param {Request} req - The HTTP request object containing the user's authentication information.
   * @param {string} communityId - The unique identifier for the community associated with the EULA.
   * @param {string} version - The version number of the EULA that is being accepted.
   * @returns {Promise<EulaAcceptListItemClass>} - A promise that resolves to an object containing details of the EULA acceptance.
   * @throws {UnauthorizedException} - If the user is not authenticated or does not have moderation rights in the community.
   * @throws {NotFoundException} - If no community is found, or if iThenticate is not configured for the community.
   */
  @ApiOperation({ summary: 'Accept iThenticate EULA' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':communityId([0-9a-f]{24})/eula/:version/accept')
  @ApiCreatedResponse({ type: EulaAcceptListItemClass })
  async acceptIThenticateEULA(
    @Req() req: Request,
    @Param('communityId') communityId: string,
    @Param('version') version: string
  ): Promise<EulaAcceptListItemClass> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');

    const community = await this.communitiesService.findOneByFilter({ _id: communityId });
    assertIsDefined(community, 'Community not found');
    assertIsDefined(community.iThenticateAPIKey, 'iThenticate must be configured');
    const ability = await this.authorizationService.defineAbilityFor(user);
    this.authorizationService.canDo(ability, COMMUNITY_ACTIONS.moderate, community);

    const response = await this.ithenticateService.acceptEULA(
      String(user._id),
      community.iThenticateAPIKey,
      version
    );
    user.iThenticateEULAAccepted = true;
    await user.save();
    return response;
  }

  /**
   * GET - Retrieves a list of EULA  acceptances for iThenticate associated with a specific community.
   * This method checks whether the user has moderation rights in the specified community and
   * whether iThenticate is configured for that community.
   *
   * @param {Request} req - The HTTP request object that includes the user's token for authentication.
   * @param {string} communityId - The unique identifier for the community for which to retrieve EULA acceptances.
   * @returns {Promise<EulaAcceptListItemClass[]>} - A promise that resolves to an array of EULA acceptance records.
   * @throws {UnauthorizedException} - If the user is not authenticated or does not have the required moderation rights.
   * @throws {NotFoundException} - If the specified community is not found or iThenticate is not configured for it.
   */
  @ApiOperation({ summary: 'Retrieve EULA acceptance' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':communityId([0-9a-f]{24})/eula/acceptance')
  async getIThenticateEULAAcceptance(
    @Req() req: Request,
    @Param('communityId') communityId: string
  ): Promise<EulaAcceptListItemClass[]> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');

    const community = await this.communitiesService.findOneByFilter({ _id: communityId });
    assertIsDefined(community, 'Community not found');
    assertIsDefined(community.iThenticateAPIKey, 'iThenticate must be configured');
    const ability = await this.authorizationService.defineAbilityFor(user);
    this.authorizationService.canDo(ability, COMMUNITY_ACTIONS.moderate, community);

    return await this.ithenticateService.getEULAAcceptance(
      user._id.toHexString(),
      community.iThenticateAPIKey
    );
  }

  /**
   * GET - Retrieves detailed information about an iThenticate submission for a specific deposit within a community.
   * This requires the user to have moderator privileges in the community and checks if iThenticate is properly configured.
   * It ensures that there is an existing submission for the deposit and returns the current status of the iThenticate submission.
   *
   * @param {Request} req - The HTTP request object containing the user's authentication information.
   * @param {string} communityId - MongoDB ObjectId representing the community in which the deposit resides.
   * @param {string} depositId - MongoDB ObjectId representing the deposit for which submission information is being retrieved.
   * @returns {Promise<SubmissionClass>} - A promise that resolves to the iThenticate submission details.
   * @throws {UnauthorizedException} - Thrown if the user is not authenticated or lacks the necessary permissions.
   * @throws {NotFoundException} - Thrown if the community/deposit does not exist, or if there is no iThenticate submission associated.
   */
  @ApiOperation({ summary: 'Retrieve an iThenticate submission' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':communityId([0-9a-f]{24})/submissions/:depositId')
  async getIThenticateSubmissionInfo(
    @Req() req: Request,
    @Param('communityId') communityId: string,
    @Param('depositId') depositId: string
  ): Promise<SubmissionClass> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');

    const deposit = await this.depositService.findById(depositId);
    assertIsDefined(deposit, 'Deposit not found');
    assertIsDefined(deposit.iThenticate?.submissionId, 'No submission for this publication');

    const community = await this.communitiesService.findById(communityId);
    assertIsDefined(community, 'Community not found');
    assertIsDefined(community.iThenticateAPIKey, 'iThenticate must be configured');

    const ability = await this.authorizationService.defineAbilityFor(user);
    this.authorizationService.canDo(ability, COMMUNITY_ACTIONS.moderate, community);

    const submission = await this.ithenticateService.infoSubmission(
      deposit.iThenticate.submissionId,
      community.iThenticateAPIKey
    );
    if (submission.status === SubmissionStatusEnum.Created) {
      deposit.iThenticate.submissionStatus = SimpleSubmissionResponseStatusEnum.Created;
    } else if (submission.status === SubmissionStatusEnum.Processing) {
      deposit.iThenticate.submissionStatus = SimpleSubmissionResponseStatusEnum.Processing;
    } else if (submission.status === SubmissionStatusEnum.Completed) {
      deposit.iThenticate.submissionStatus = SimpleSubmissionResponseStatusEnum.Complete;
    }
    deposit.markModified('iThenticate');
    await deposit.save();
    return submission;
  }

  /**
   * POST - Submits a deposit for plagiarism checking via the iThenticate API for a specific community.
   * This method checks if iThenticate is configured for the given community, verifies user permissions,
   * and submits the specified deposit to iThenticate. It updates the deposit record with the submission
   * details and returns the submission response from iThenticate.
   *
   * @param {Request} req - The HTTP request object, including user authentication.
   * @param {IthenticatePayload} payload - The payload containing the deposit ID intended for submission.
   * @param {string} communityId - The MongoDB ObjectId as a string for the community associated with the deposit.
   * @returns {Promise<SimpleSubmissionResponseClass>} - Returns a promise that resolves to the iThenticate submission response details.
   * @throws {UnauthorizedException} - Thrown if the user is not authenticated, not necessary permissions,
   *                or if the community or deposit is not found or not properly configured for iThenticate submissions.
   */
  @ApiOperation({ summary: 'Create submission' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':communityId([0-9a-f]{24})/submissions')
  @ApiCreatedResponse({ type: SimpleSubmissionResponseClass })
  async createIThenticateSubmission(
    @Req() req: Request,
    @Body() payload: IthenticatePayload,
    @Param('communityId') communityId: string
  ): Promise<SimpleSubmissionResponseClass> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');

    const community = await this.communitiesService.findOneByFilter({ _id: communityId });
    assertIsDefined(community, 'Community not found');
    assertIsDefined(community.iThenticateAPIKey, 'iThenticate must be configured');
    const ability = await this.authorizationService.defineAbilityFor(user);
    this.authorizationService.canDo(ability, COMMUNITY_ACTIONS.moderate, community);

    const deposit = await this.depositService.findById(payload.depositId);
    assertIsDefined(deposit, 'Deposit not found');

    const simpleSubmissionResponse = await this.ithenticateService.createSubmission(
      deposit,
      community.iThenticateAPIKey,
      user
    );

    deposit.iThenticate = {
      submissionId: simpleSubmissionResponse.id,
      submissionStatus: SimpleSubmissionResponseStatusEnum.Created,
      submitter: user._id.toHexString(),
    };
    await deposit.save();

    return simpleSubmissionResponse;
  }

  /**
   * PATCH - Uploads a file associated with a deposit to an existing iThenticate submission within a specific community.
   * This requires that the community is configured with an iThenticate  and that the deposit has
   * a publication file ready for submission. It checks user permissions, updates the submission status, and
   * handles the file upload to iThenticate.
   *
   * @param {Request} req - The HTTP request object that includes user authentication details.
   * @param {string} communityId - The ObjectId for the community as a string.
   * @param {string} submissionId - The iThenticate submission ID to which the file will be uploaded.
   * @param {IthenticatePayload} payload - Payload containing the deposit ID whose file is to be uploaded.
   * @returns {Promise<SuccessMessage>} - A promise that resolves to a success message (file has been uploaded), or an error message.
   * @throws {UnauthorizedException} - Thrown if the user does not have appropriate permissions.
   * @throws {NotFoundException} - Thrown if the community, deposit, or necessary configurations are not found.
   * @throws {BadRequestException} - Thrown if the required parameters for the iThenticate submission are not properly set up or missing.
   */
  @ApiOperation({ summary: 'Upload file' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':communityId([0-9a-f]{24})/submissions/:submissionId')
  async uploadFileToSubmission(
    @Req() req: Request,
    @Param('communityId') communityId: string,
    @Param('submissionId') submissionId: string,
    @Body() payload: IthenticatePayload
  ): Promise<SuccessMessage> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');

    const community = await this.communitiesService.findOneByFilter({ _id: communityId });
    assertIsDefined(community, 'Community not found');
    const ability = await this.authorizationService.defineAbilityFor(user);
    this.authorizationService.canDo(ability, COMMUNITY_ACTIONS.moderate, community);

    assertIsDefined(community.iThenticateAPIKey, 'iThenticate must be configured');

    const deposit = await this.depositService.findById(payload.depositId);
    assertIsDefined(deposit, 'Deposit not found');
    assertIsDefined(deposit.publicationFile, 'Deposit file not found');
    assertIsDefined(deposit.iThenticate, 'Create a submission for this publication first');

    const response = await this.ithenticateService.uploadFileToSubmission(
      submissionId,
      {
        id: deposit._id.toHexString(),
        publication: { filename: deposit.publicationFile.filename },
      },
      community.iThenticateAPIKey
    );

    deposit.iThenticate.submissionStatus = SimpleSubmissionResponseStatusEnum.Processing;
    deposit.markModified('iThenticate');
    await deposit.save();

    return response;
  }

  /**
   * PATCH - Initiates the generation of a similarity report for a previously uploaded submission in iThenticate.
   * This method checks if the user has the necessary permissions and if the community has been configured
   * with an iThenticate API key. It updates the submission's status to 'PENDING' and saves this status in the database.
   *
   * @param {Request} req - The HTTP request object containing the user's authentication details.
   * @param {string} communityId - The unique identifier of the community where the deposit resides.
   * @param {string} submissionId - The iThenticate submission ID for which the similarity report will be generated.
   * @returns {Promise<SuccessMessage>} - A promise that resolves to a success message or rejects with an error.
   * @throws {UnauthorizedException} - If the user lacks the necessary permissions to perform this action.
   * @throws {NotFoundException} - If no valid community, deposit, or iThenticate configuration is found.
   * @throws {BadRequestException} - If the necessary preconditions for generating a report are not met.
   */
  @ApiOperation({ summary: 'Generate similarity report' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':communityId([0-9a-f]{24})/submissions/:submissionId/similarity')
  async generateSimilarityReport(
    @Req() req: Request,
    @Param('communityId') communityId: string,
    @Param('submissionId') submissionId: string
  ): Promise<SuccessMessage> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');

    const community = await this.communitiesService.findOneByFilter({ _id: communityId });
    assertIsDefined(community, 'Community not found');
    assertIsDefined(community.iThenticateAPIKey, 'iThenticate must be configured');
    const deposit = await this.depositService.findOne({
      // @ts-expect-error
      'iThenticate.submissionId': submissionId,
    });
    assertIsDefined(deposit, 'Publication not found');
    assertIsDefined(deposit.iThenticate, 'Create a submission for this publication first');
    const ability = await this.authorizationService.defineAbilityFor(user);
    this.authorizationService.canDo(ability, COMMUNITY_ACTIONS.moderate, community);

    const response = await this.ithenticateService.generateSimilarityReport(
      submissionId,
      community.iThenticateAPIKey
    );

    deposit.iThenticate.similarityReportStatus = 'PENDING';
    deposit.markModified('iThenticate');
    await deposit.save();

    return response;
  }

  /**
   * GET - Retrieves the similarity report for a deposit's submission from iThenticate.
   * This method ensures that all prerequisites for accessing the report are met. The method updates the
   * deposit's status based on the report's status and saves these changes to the database.
   *
   * @param {Request} req - The HTTP request object that includes user authentication information to verify permissions.
   * @param {string} communityId - The ObjectId of the community where the deposit resides.
   * @param {string} depositId - The unique identifier of the deposit for which the similarity report is to be retrieved.
   * @returns {Promise<SimilarityMetadata>} - A promise that resolves to the similarity report metadata.
   * @throws {UnauthorizedException} - Thrown if the user does not have permission to perform this action.
   * @throws {NotFoundException} - Thrown if no matching deposit, community, or configured iThenticate details are found.
   * @throws {BadRequestException} - Thrown if the necessary conditions for accessing a similarity report are not met.
   */
  @ApiOperation({ summary: 'Retrieve similarity report' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':communityId([0-9a-f]{24})/submissions/:depositId/similarity')
  async getIThenticateReport(
    @Req() req: Request,
    @Param('communityId') communityId: string,
    @Param('depositId') depositId: string
  ): Promise<SimilarityMetadata> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');

    const deposit = await this.depositService.findById(depositId);
    assertIsDefined(deposit, 'Deposit not found');
    assertIsDefined(deposit.iThenticate?.submissionId, 'No submission for this publication');

    const community = await this.communitiesService.findById(communityId);
    assertIsDefined(community, 'Community not found');
    assertIsDefined(community.iThenticateAPIKey, 'iThenticate must be configured');

    const ability = await this.authorizationService.defineAbilityFor(user);
    this.authorizationService.canDo(ability, COMMUNITY_ACTIONS.moderate, community);

    const report = await this.ithenticateService.getSimilarityReport(
      deposit.iThenticate.submissionId,
      community.iThenticateAPIKey
    );
    if (report.status === 'COMPLETE') {
      deposit.iThenticate.similarityReportStatus = 'COMPLETE';
    } else if (report.status === 'PENDING') {
      deposit.iThenticate.similarityReportStatus = 'PENDING';
    }
    deposit.markModified('iThenticate');
    await deposit.save();
    return report;
  }

  /**
   * GET - Retrieves a URL that provides direct access to the similarity report viewer.
   * This functionality is critical for users who need to review similarity reports directly
   * in their web browser without downloading the report. The method ensures that all required conditions are met.
   *
   * @param {Request} req - The HTTP request object containing user authentication data to verify permissions.
   * @param {string} communityId - The ObjectId for the community associated with the submission.
   * @param {string} submissionId - The unique identifier for the submission within iThenticate.
   * @returns {Promise<SimilarityViewerUrlResponse>} - A promise that resolves to an object containing the URL.
   * @throws {UnauthorizedException} - If the user does not have sufficient permissions to access the report.
   * @throws {NotFoundException} - If no valid community or submission is found, or if the iThenticate is not configured.
   */
  @ApiOperation({ summary: 'Retrieve similarity report URL' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':communityId([0-9a-f]{24})/submissions/:submissionId/viewer-url')
  @ApiOkResponse({ type: SimilarityViewerUrlResponseDTO })
  async getSimilarityReportURL(
    @Req() req: Request,
    @Param('communityId') communityId: string,
    @Param('submissionId') submissionId: string
  ): Promise<SimilarityViewerUrlResponse> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');

    const community = await this.communitiesService.findOneByFilter({ _id: communityId });
    assertIsDefined(community, 'Community not found');
    const ability = await this.authorizationService.defineAbilityFor(user);
    this.authorizationService.canDo(ability, COMMUNITY_ACTIONS.moderate, community);

    assertIsDefined(community.iThenticateAPIKey, 'iThenticate must be configured');

    return await this.ithenticateService.getSimilarityReportUrl(
      submissionId,
      community.iThenticateAPIKey,
      user._id.toHexString()
    );
  }

  /**
   * POST - Configures iThenticate for a given community by setting up an API key and potentially a webhook.
   * This ensures that iThenticate can only be set up once per community to prevent reconfiguration.
   * It handles the creation of a new webhook if none already exists and checks for the necessity
   * of accepting an EULA based on the tenant's features.
   *
   * @param {Request} req - The HTTP request object that includes authentication details to verify user permissions.
   * @param {webhookPayload} payload - Contains the community ID and the new API key to be configured for iThenticate.
   * @returns {Promise<CommunityDocument>} - A promise that resolves to the updated community document after setting up iThenticate.
   * @throws {UnauthorizedException} - If the user does not have moderation rights over the community.
   * @throws {ForbiddenException} - If iThenticate is already configured for the community, to prevent accidental overwrites.
   * @throws {NotFoundException} - If the specified community is not found in the database.
   */
  @ApiOperation({ summary: 'Setup iThenticate' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('setup')
  @ApiCreatedResponse({ type: CommunityPopulatedDTO })
  async setupIThenticate(
    @Req() req: Request,
    @Body() payload: webhookPayload
  ): Promise<CommunityDocument> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');
    const community = await this.communitiesService.findOneByFilter({ _id: payload.communityId });
    assertIsDefined(community, 'Community not found');

    const ability = await this.authorizationService.defineAbilityFor(user);
    this.authorizationService.canDo(ability, COMMUNITY_ACTIONS.moderate, community);

    if (community.iThenticateWebhook) {
      throw new ForbiddenException('iThenticate previously configured. Please, contact Orvium');
    }

    community.iThenticateAPIKey = encryptJson(payload.key);
    await community.save();

    const EULARequired = (
      await this.ithenticateService.getFeaturesEnabled(community.iThenticateAPIKey)
    ).tenant?.require_eula;
    if (EULARequired) {
      community.iThenticateEULANeeded = true;
    }

    const existingWebhooks = await this.ithenticateService.listWebhooks(
      community.iThenticateAPIKey
    );
    if (existingWebhooks.length > 0) {
      community.iThenticateWebhook = existingWebhooks[0].id;

      return await community.save();
    }

    const webhook = await this.ithenticateService.createWebhook(community.iThenticateAPIKey);
    community.iThenticateWebhook = webhook.id;

    return await community.save();
  }

  /**
   * Retrieves the current status of the iThenticate configuration for a specific community.
   * This function checks if both the API key and the webhook are properly configured and active for the community,
   * indicating that iThenticate features are operational for its members.
   *
   * @param {Request} req - The HTTP request object containing the user's authentication data.
   * @param {string} communityId - The unique identifier of the community for which to check the iThenticate status.
   * @returns {Promise<webhookStatusPayload>} - A promise resolving to an object indicating whether iThenticate is active.
   * @throws {UnauthorizedException} - If the user does not have the required permissions to view the status.
   * @throws {NotFoundException} - If the community does not exist or if configuration details like the API key or webhook are missing.
   */
  @ApiOperation({ summary: 'Retrieve iThenticate status' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':communityId([0-9a-f]{24})/status')
  async getIThenticateStatus(
    @Req() req: Request,
    @Param('communityId') communityId: string
  ): Promise<webhookStatusPayload> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');

    const community = await this.communitiesService.findOneByFilter({ _id: communityId });
    assertIsDefined(community, 'Community not found');

    if (!community.iThenticateAPIKey) {
      return { active: false };
    }

    if (!community.iThenticateWebhook) {
      return { active: false };
    }

    await this.ithenticateService.webhookInfo(
      community.iThenticateWebhook,
      community.iThenticateAPIKey
    );

    return { active: true };
  }

  /**
   * POST - Handles webhook events sent by iThenticate for updates on submission and similarity report statuses.
   * Depending on the event type indicated by the presence of certain identifiers in the payload,
   * it updates the corresponding deposit's status within the system's database.
   *
   * @param {string} payload - The JSON string payload received from the webhook, which needs to be parsed.
   * @returns {Promise<void>} - A promise resolving to nothing upon successful processing of the event.
   */
  @ApiExcludeEndpoint()
  @Post('webhooks/events')
  async webhookEvent(@Body() payload: string): Promise<void> {
    const parsedPayload = JSON.parse(payload);
    if (parsedPayload.id) {
      // id means SUBMISSION_COMPLETE
      await this.depositService.findOneAndUpdate(
        {
          // @ts-expect-error
          'iThenticate.submissionId': parsedPayload.id,
        },
        {
          'iThenticate.submissionStatus': SimpleSubmissionResponseStatusEnum.Complete,
        }
      );
    } else if (parsedPayload.submission_id) {
      // submission_id means SIMILARITY_COMPLETE
      const deposit = await this.depositService.findOne({
        // @ts-expect-error
        'iThenticate.submissionId': parsedPayload.submission_id,
      });
      const submitter = await this.userService.findOne({
        _id: deposit?.iThenticate?.submitter,
      });
      if (deposit && submitter) {
        assertIsDefined(deposit.iThenticate);
        deposit.iThenticate.similarityReportStatus = 'COMPLETE';
        deposit.markModified('iThenticate');
        await deposit.save();
        const eventReportReady = new IThenticateReportReadyEvent({
          deposit: deposit.toJSON(),
          submitter: submitter.toJSON(),
        });
        await this.eventService.create(eventReportReady.getEventDTO());
      }
    }
  }
}
