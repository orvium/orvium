import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Header,
  HttpException,
  NotFoundException,
  NotImplementedException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { DepositService, PopulatedDepositDocument } from './deposit.service';
import { extname } from 'path';
import {
  AcceptedFor,
  AccessRight,
  Author,
  Deposit,
  DepositDocument,
  DepositStatus,
  PublicationType,
  ReviewType,
} from './deposit.schema';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request, Response } from 'express';
import { UserService } from '../users/user.service';
import { AnyKeys, isValidObjectId, SortOrder } from 'mongoose';
import { EventService } from '../event/event.service';
import { v4 as uuidv4 } from 'uuid';
import { DataciteService } from '../datacite/datacite.service';
import { AwsStorageService } from '../common/aws-storage-service/aws-storage.service';
import { CreateDepositDTO } from '../dtos/deposit/create-deposit.dto';
import { UpdateDepositDTO } from '../dtos/deposit/update-deposit.dto';
import { DepositPopulatedDTO } from '../dtos/deposit/deposit-populated.dto';
import { FileMetadata } from '../dtos/filemetadata.dto';
import { Citation } from '../dtos/citation.dto';
import {
  AuthorizationService,
  DEPOSIT_ACTIONS,
  REVIEW_ACTIONS,
} from '../authorization/authorization.service';
import { DepositChangedToPendingApprovalEvent } from '../event/events/depositChangedToPendingApprovalEvent';
import { FileUploadedEvent } from '../event/events/fileUploadedEvent';
import { DepositImportService } from './deposit-import.service';
import { addToArrayIf, assertIsDefined, DepositCLASSNAME, getMd5Hash } from '../utils/utils';
import { DepositAcceptedEvent } from '../event/events/depositAcceptedEvent';
import { DepositSubmittedEvent } from '../event/events/depositSubmittedEvent';
import { Doi } from '@orvium/datacite-client';
import { DepositRejectedByModeratorEvent } from '../event/events/depositRejectedByModerator';
import { EditorAssignedEvent } from '../event/events/editorAssignedEvent';
import { CommunitiesService } from '../communities/communities.service';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiQuery, ApiTags } from '@nestjs/swagger';
import { TopDisciplinesDTO } from '../dtos/top-disciplines.dto';
import { SignedUrlDTO } from '../dtos/signedUrl.dto';
import { DepositDraftedByModeratorEvent } from '../event/events/depositDraftedByModerator';
import { PutObjectCommandInput } from '@aws-sdk/client-s3';
import { CreateFileDTO } from '../dtos/create-file.dto';
import { IsBoolean, IsDefined, IsString } from 'class-validator';
import { TransformerService } from '../transformer/transformer.service';
import sanitizeHtml from 'sanitize-html';
import { defaultSanitizeOptions } from '../template/template.controller';
import { CreateDepositWithDoiDTO } from '../dtos/deposit/create-deposit-with-doi.dto';
import { CommunityType } from '../communities/communities.schema';
import { DepositPublishedEvent } from '../event/events/depositPublishedEvent';
import { DepositBackToPendingApprovalEvent } from '../event/events/depositBackToPendingApprovalEvent';
import { StrictFilterQuery } from '../utils/types';
import { JwtOrAnonymousGuard } from '../auth/jwt-or-anonymous-guard.service';
import { CrossrefService } from '../crossref/crossref.service';
import { AuthGuard } from '@nestjs/passport';
import { DepositsQueryDTO } from '../dtos/deposit/deposit-query.dto';
import { GetDepositsQueryParams } from '../dtos/deposit/get-deposits-queryparams.dto';

/**
 * Allowed file extensions for uploads within the system
 */
const ALLOWED_FILE_EXTENSIONS = [
  '.pdf',
  '.doc',
  '.docx',
  '.txt',
  '.jpeg',
  '.jpg',
  '.png',
  '.gif',
  '.md',
  '.csv',
  '.tex',
  '.rtf',
  '.epub',
  '.mp4',
  '.odt',
  '.zip',
];
/**
 * Data Transfer Object for uploading files.
 */
export class UploadFilePayload {
  /**
   * Represent the metadata of the file
   */
  @IsDefined() @ApiProperty() fileMetadata!: FileMetadata;

  /**
   * Flag indicating if the file is the main one of the deposit
   */
  @IsBoolean() @ApiProperty() isMainFile!: boolean;

  /**
   * Flags to indicate whether it should replaced by a PDF file
   */
  @IsBoolean() @ApiProperty() replacePDF!: boolean;
}

/**
 * Payload for assigning an editor.
 */
export class AssignEditorPayload {
  /**
   * Assigneed editor
   */
  @IsString() @ApiProperty() assignee!: string;
}

/**
 * Payload for assigning an editorial decision based on predefined acceptance categories.
 */
export class AssignEditorialDecisionPayload {
  /**
   * AcceptedFor enum to ensure the decision is within the allowed values, poster, presentation, etc.
   */
  @IsDefined()
  @ApiProperty({
    enum: AcceptedFor,
    enumName: 'AcceptedFor',
  })
  acceptedFor!: AcceptedFor;
}

/**
 * Payload for moderating a deposit with a specific reason.
 */
export class ModerateDepositPayload {
  /**
   * Moderating reason
   */
  @IsString() @ApiProperty() reason!: string;
}

/**
 * Generic payload for sending string data.
 */
export class StringDataPayload {
  @IsString() @ApiProperty() data!: string;
}

/**
 * This controller provides endpoints for managing deposits in the system,
 * allowing users to create and interact with deposits such as publications, abstracts,
 * and articles. It integrates services for authentication, user management, data citation,
 * and storage among others to facilitate these operations.
 *
 * @tags deposits
 * @controller deposits
 */
@ApiTags('deposits')
@Controller('deposits')
export class DepositController {
  /**
   * Instantiates a DepositController object.
   *
   * @param {DepositService} depositService - Service for deposits data management.
   * @param {ImportDepositService} importDepositService - Service for importing deposits.
   * @param {UserService} userService - Service for user data management.
   * @param {EventService} eventService - Service for managing events.
   * @param {DataciteService} dataciteService - Service for datacite citations.
   * @param {CrossrefService} crossrefService - Service for crossref references.
   * @param {AwsStorageService} storageService - Service for storage events.
   * @param {AuthorizationService} authorizationService - Service for handling authorization tasks.
   * @param {CommunitiesService} communitiesService - Service for community data management.
   * @param {TransformerService} transformerService - Service for data transformation tasks.
   */
  constructor(
    private readonly depositService: DepositService,
    private readonly importDepositService: DepositImportService,
    private readonly userService: UserService,
    private readonly eventService: EventService,
    private readonly dataciteService: DataciteService,
    private readonly crossrefService: CrossrefService,
    private readonly storageService: AwsStorageService,
    private readonly authorizationService: AuthorizationService,
    private readonly communitiesService: CommunitiesService,
    private readonly transformerService: TransformerService
  ) {}

  /**
   * POST - Creates a new deposit based on the provided data. This method handles the business logic
   * for validating and storing the new deposit data, ensuring that the user has the necessary
   * permissions, and that the associated community data is correctly linked and populated.
   *
   * @param {Request} req The incoming HTTP request containing the user's authentication data.
   * @param {CreateDepositDTO} newDeposit The data transfer object containing the data needed to create the deposit.
   * @returns {Promise<DepositPopulatedDTO>} Returns a promise that resolves to the populated data transfer object of the deposit.
   */
  @ApiOperation({ summary: 'Create a new deposit' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('')
  async createDeposit(
    @Req() req: Request,
    @Body() newDeposit: CreateDepositDTO
  ): Promise<DepositPopulatedDTO> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');
    const ability = await this.authorizationService.defineAbilityFor(user);
    const communityPopulated = await this.communitiesService.findById(newDeposit.community);
    assertIsDefined(communityPopulated, 'Community not found');
    this.authorizationService.canDo(ability, DEPOSIT_ACTIONS.create, DepositCLASSNAME);
    const query: AnyKeys<Deposit> = {
      canAuthorInviteReviewers: communityPopulated.canAuthorInviteReviewers,
      creator: user._id,
      nickname: user.nickname,
      gravatar: user.gravatar,
      avatar: user.avatar,
      authors: [],
      references: [],
      bibtexReferences: [],
      title: newDeposit.title,
      accessRight: AccessRight.CCBY,
      community: newDeposit.community,
      publicationType: PublicationType.article,
      disciplines: [],
      status: DepositStatus.draft,
      peerReviews: [],
      reviewType: ReviewType.openReview,
      files: [],
      keywords: [],
      createdOn: new Date(),
      isLatestVersion: true,
      version: 1,
      parent: uuidv4(),
      canBeReviewed: true,
      views: 0,
      history: [],
      images: [],
      acceptedFor: AcceptedFor.None,
      extraMetadata: {
        conferenceTitle:
          communityPopulated.type === CommunityType.conference
            ? communityPopulated.name
            : undefined,
        journalTitle:
          communityPopulated.type === CommunityType.journal ? communityPopulated.name : undefined,
        issn: communityPopulated.issn ? communityPopulated.issn : undefined,
      },
    };

    const depositCreated = await this.depositService.create(query);
    const depositCreatedPopulated = await this.depositService.findById(depositCreated._id);
    assertIsDefined(depositCreatedPopulated);

    return this.transformerService.depositPopulatedToDto(depositCreatedPopulated, user);
  }

  /**
   * POST - Creates a new deposit by importing metadata from the url that the DOI points to.
   * The information is extracted using metatags from the HTML webpage, normally `citation_` metatags.
   * The main publication file is also uploaded to the new publication created if `citation_pdf_url` is available.
   * If the DOI points to a Figshare repository, it uses the Figshare API to retrieve some metadata and files.
   *
   * @param {Request} req the request
   * @param {CreateDepositDTO} newDeposit data with the DOI
   * @returns {deposit}
   */
  @ApiOperation({ summary: 'Create a deposit by importing from DOI' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('createWithDOI')
  async createWithDOI(
    @Req() req: Request,
    @Body() newDeposit: CreateDepositWithDoiDTO
  ): Promise<DepositPopulatedDTO> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');
    const ability = await this.authorizationService.defineAbilityFor(user);
    this.authorizationService.canDo(ability, DEPOSIT_ACTIONS.create, DepositCLASSNAME);
    assertIsDefined(newDeposit.doi, 'DOI was not defined');
    const communityPopulated = await this.communitiesService.findById(newDeposit.community);
    assertIsDefined(communityPopulated, 'Community not found');
    const query: AnyKeys<Deposit> = {
      canAuthorInviteReviewers: communityPopulated.canAuthorInviteReviewers,
      creator: user._id,
      nickname: user.nickname,
      gravatar: user.gravatar,
      avatar: user.avatar,
      title: 'Publication with DOI: ' + newDeposit.doi,
      doi: newDeposit.doi,
      authors: [],
      references: [],
      bibtexReferences: [],
      accessRight: AccessRight.CC0,
      community: newDeposit.community,
      publicationType: PublicationType.article,
      disciplines: [],
      status: DepositStatus.draft,
      peerReviews: [],
      reviewType: ReviewType.openReview,
      files: [],
      keywords: [],
      createdOn: new Date(),
      isLatestVersion: true,
      version: 1,
      parent: uuidv4(),
      canBeReviewed: true,
      views: 0,
      history: [],
      images: [],
      acceptedFor: AcceptedFor.None,
      extraMetadata: {},
    };
    const depositCreated = await this.importDepositService.importDeposit(query);
    const depositCreatedPopulated = await this.depositService.findById(depositCreated._id);
    assertIsDefined(depositCreatedPopulated);
    return this.transformerService.depositPopulatedToDto(depositCreatedPopulated, user);
  }

  /**
   * POST - Creates a new revision of an existing deposit. This method is used to start a new version of a deposit,
   * allowing updates and changes without affecting the original published or pending content. It checks if
   * a newer version already exists to prevent duplicate revisions and ensures the operation is allowed under
   * the current user's permissions.
   *
   * @param {Request} req - The incoming HTTP request containing the user's session and potentially other metadata.
   * @param {string} id - The MongoDB ObjectID (as a string) of the deposit for which a new revision is to be created.
   * @returns {Promise<DepositPopulatedDTO>} - Returns a populated data transfer object representing the newly created
   * @throws {UnauthorizedException} If there is already a new version created or if the user does not have permissions.
   * @throws {NotFoundException} If the deposit Origin or depositDestination cannot be found.
   */
  @ApiOperation({ summary: 'Create a new revision of the deposit' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id([0-9a-f]{24})/createRevision')
  async createDepositRevision(
    @Req() req: Request,
    @Param('id') id: string
  ): Promise<DepositPopulatedDTO> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');

    const deposit = await this.depositService.findOne({
      _id: id,
    });
    assertIsDefined(deposit, 'Deposit not found');

    const ability = await this.authorizationService.defineAbilityFor(user);
    this.authorizationService.canDo(ability, DEPOSIT_ACTIONS.createVersion, deposit);

    const existingDepositRevision = await this.depositService.findOne({
      version: deposit.version + 1,
      parent: deposit.parent,
    });

    if (existingDepositRevision) {
      throw new UnauthorizedException(
        'There is already a new version created for this publication'
      );
    }

    const depositNotPopulated = await this.depositService.depositModel.findById(id).lean();
    assertIsDefined(depositNotPopulated, 'depositNotPopulated not defined');

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _id, ...depositObject } = depositNotPopulated;

    let newVersion = new this.depositService.depositModel({
      ...depositObject,
      creator: deposit.ownerProfile._id,
      community: deposit.community._id,
      status: DepositStatus.draft,
      peerReviews: [],
      createdOn: new Date(),
      isLatestVersion: false,
      version: deposit.version + 1,
      views: 0,
      history: [],
      publicationFile: undefined,
      html: undefined,
      pdfUrl: undefined,
    });

    newVersion = await newVersion.save();

    await this.storageService.copyRecursiveS3(
      `${deposit._id.toHexString()}`,
      `${newVersion._id.toHexString()}`
    );

    const newVersionPopulated = await this.depositService.findById(newVersion._id);
    assertIsDefined(newVersionPopulated);
    return this.transformerService.depositPopulatedToDto(newVersionPopulated, user);
  }

  /**
   * PATCH - Merges files and other content from a revision of a deposit into the original deposit. This is typically
   * used to update the main deposit record with changes that were made in a branched-off revision. This could
   * include updates to files, metadata, and other associated content.
   *
   * @param {Request} req - The HTTP request object, used to extract the user's session and other context.
   * @param {string} sourceId - The identifier of the deposit revision that should be merged into the original deposit.
   * @returns {Promise<DepositPopulatedDTO>} - Returns a populated data transfer object for the deposit.
   * @throws {UnauthorizedException} If there is already a new version created or if the user does not have permissions.
   * @throws {NotFoundException} If the depositOrigin or depositDestination cannot be found.
   */
  @ApiOperation({ summary: 'Merges a revision into a deposit' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id([0-9a-f]{24})/merge')
  async mergeRevisions(
    @Req() req: Request,
    @Param('id') sourceId: string
  ): Promise<DepositPopulatedDTO> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');

    const depositOrigin = await this.depositService.findOne({
      _id: sourceId,
    });
    assertIsDefined(depositOrigin, 'Deposit origin not found');

    const depositDestination = await this.depositService.findOne({
      parent: depositOrigin.parent,
      status: { $in: [DepositStatus.preprint, DepositStatus.published] },
    });
    assertIsDefined(depositDestination, 'Deposit destination not found');

    const ability = await this.authorizationService.defineAbilityFor(user);
    this.authorizationService.canDo(ability, DEPOSIT_ACTIONS.moderate, depositOrigin);

    depositDestination.publicationFile = depositOrigin.publicationFile;
    depositDestination.files = depositOrigin.files;
    depositDestination.pdfUrl = depositOrigin.pdfUrl;
    depositDestination.html = depositOrigin.html;
    depositDestination.history.push({
      createdAt: new Date(),
      username: `${user.firstName} ${user.lastName}`,
      description: `Publication version ${depositOrigin.version} merged.`,
    });
    depositDestination.images = depositOrigin.images;
    depositDestination.markModified('history');
    depositDestination.markModified('images');

    await this.storageService.copyRecursiveS3(
      `${depositOrigin._id.toHexString()}`,
      `${depositDestination._id.toHexString()}`
    );
    await depositDestination.save();

    depositOrigin.status = DepositStatus.merged;
    depositOrigin.parent = `${depositOrigin.parent}-merged`;

    return this.transformerService.depositPopulatedToDto(
      (await depositOrigin.save()) as PopulatedDepositDocument,
      user
    );
  }

  /**
   * GET - Retrieves the top disciplines based on the number of deposits within each discipline.
   * This method is useful for understanding which areas of research or study are currently most active.
   *
   * @returns {Promise<TopDisciplinesDTO[]>} Array of top disciplines data transfer objects.
   */
  @ApiOperation({ summary: 'Get top disciplines' })
  @Get('topDisciplines')
  async getTopDisciplines(): Promise<TopDisciplinesDTO[]> {
    const topDisciplines = (await this.depositService.aggregate([
      { $match: { status: { $in: [DepositStatus.published, DepositStatus.preprint] } } },
      { $unwind: '$disciplines' },
      { $sortByCount: '$disciplines' },
      { $limit: 10 },
    ])) as { _id: string; count: number }[];

    return topDisciplines;
  }

  /**
   * GET - Retrieves all deposits created by the logged-in user that are marked as the latest version.
   * This method checks user authentication and retrieves only those deposits where the logged-in user
   * is the creator or listed as an author. It sorts the results by last updated time.
   *
   * @param {Request} req - The HTTP request object that includes user authentication.
   * @returns {Promise<DepositPopulatedDTO[]>} Returns a promise that resolves to an array of deposit populated DTOs.
   * @throws {UnauthorizedException} If the user is not logged in or not found.
   */
  @ApiOperation({ summary: 'Get deposits created by the logged user' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('myDeposits')
  async getMyDeposits(@Req() req: Request): Promise<DepositPopulatedDTO[]> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');
    const deposits = await this.depositService.find(
      {
        $or: [
          {
            creator: user._id,
            isLatestVersion: true,
          },
          {
            'authors.userId': user.userId,
            isLatestVersion: true,
          },
        ],
      },
      { updatedAt: -1 }
    );

    return this.transformerService.depositPopulatedToDtoArray(deposits, user);
  }

  /**
   * GET - Fetches all deposits that have been starred by the logged-in user. It uses the user's stored
   * starred deposits array to query the database and retrieve the deposit details.
   *
   * @param {Request} req - The HTTP request object containing the user's authentication information.
   * @returns {Promise<DepositPopulatedDTO[]>} Returns a promise that resolves to an array of deposit populated DTOs for the starred deposits.
   * @throws {UnauthorizedException} If the user is not authenticated.
   */
  @ApiOperation({ summary: 'Get starred deposits of the logged user' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('starred')
  async getMyStarredDeposits(@Req() req: Request): Promise<DepositPopulatedDTO[]> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');
    const deposits = await this.depositService.find({
      _id: { $in: user.starredDeposits },
    });
    return this.transformerService.depositPopulatedToDtoArray(deposits, user);
  }

  /**
   * Retrieves the details of a single deposit identified by its ID. This method first verifies the user's
   * permission to access the deposit and then retrieves it if authorized.
   *
   * @param {Request} req - The HTTP request object that includes the user's credentials.
   * @param {string} depositId - The unique identifier of the deposit to retrieve.
   * @returns {Promise<DepositPopulatedDTO>} Returns a promise that resolves to a deposit populated DTO.
   * @throws {NotFoundException} If the deposit is not found.
   * @throws {UnauthorizedException} If the user is not authorized to view the deposit.
   */
  @ApiOperation({ summary: 'Get a deposit by its id' })
  @UseGuards(JwtOrAnonymousGuard)
  @Get(':id([0-9a-f]{24})')
  async getDeposit(
    @Req() req: Request,
    @Param('id') depositId: string
  ): Promise<DepositPopulatedDTO> {
    const user = await this.userService.getLoggedUser(req);
    let deposit = await this.depositService.findById(depositId);
    assertIsDefined(deposit, 'Deposit not found');
    const ability = await this.authorizationService.defineAbilityFor(user);
    this.authorizationService.canDo(ability, DEPOSIT_ACTIONS.read, deposit);
    deposit = await this.depositService.setPresignedURLs(deposit);
    return this.transformerService.depositPopulatedToDto(deposit, user);
  }

  /**
   * GET - Retrieves all versions of a specific deposit by its ID, filtered by user permissions.
   * This ensures that users can only see the versions of deposits they are authorized to view.
   *
   * @param {Request} req - The HTTP request object containing user authentication.
   * @param {string} id - The deposit ID to retrieve versions for.
   * @returns {Promise<DepositPopulatedDTO[]>} Returns a promise that resolves to an array of all accessible deposit versions.
   * @throws {NotFoundException} If the initial deposit is not found.
   */
  @ApiOperation({ summary: 'Get all versions of a deposit' })
  @UseGuards(JwtOrAnonymousGuard)
  @Get(':id([0-9a-f]{24})/versions')
  async getDepositVersions(
    @Req() req: Request,
    @Param('id') id: string
  ): Promise<DepositPopulatedDTO[]> {
    const deposit = await this.depositService.findById(id);
    assertIsDefined(deposit, 'Deposit not found');
    const user = await this.userService.getLoggedUser(req);
    // Get the user
    const allVersions = await this.depositService.find({ parent: deposit.parent });
    const result: PopulatedDepositDocument[] = [];
    const ability = await this.authorizationService.defineAbilityFor(user);
    for (const deposit of allVersions) {
      if (ability.can('read', deposit)) {
        result.push(deposit);
      }
    }
    return this.transformerService.depositPopulatedToDtoArray(result, user);
  }

  /**
   * PATCH - Rejects a deposit, changing its status to 'rejected' and logs the reason for rejection.
   * Access is restricted to authorized users only.
   *
   * @param {Request} req - The HTTP request object.
   * @param {string} id - The ID of the deposit to reject.
   * @param {ModerateDepositPayload} payload - The rejection details including the reason.
   * @returns {Promise<DepositPopulatedDTO>} - The updated deposit after rejection.
   * @throws {ForbiddenException} - If the deposit is not in a status that allows rejection.
   * @throws {UnauthorizedException} - If the user is not allowed to perform the rejection.
   */
  @ApiOperation({ summary: 'Rejects a deposit, changing its status to rejected' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id([0-9a-f]{24})/reject')
  async rejectDeposit(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() payload: ModerateDepositPayload
  ): Promise<DepositPopulatedDTO> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');

    const deposit = await this.depositService.findOne({ _id: id });
    assertIsDefined(deposit, 'Deposit not found');

    const ability = await this.authorizationService.defineAbilityFor(user);
    this.authorizationService.canDo(ability, DEPOSIT_ACTIONS.moderate, deposit);

    if (deposit.status !== DepositStatus.pendingApproval) {
      throw new ForbiddenException('Deposit is not in pending approval');
    }

    assertIsDefined(deposit.community, 'Community not found');

    const event = new DepositRejectedByModeratorEvent({
      deposit: deposit.toJSON(),
      community: deposit.communityPopulated.toJSON(),
      reason: payload.reason,
      user: user.toJSON(),
    });
    await this.eventService.create(event.getEventDTO());
    deposit.history.push(event.getHistoryTemplate());
    deposit.markModified('history');
    deposit.status = DepositStatus.rejected;

    let depositUpdated = (await deposit.save()) as PopulatedDepositDocument;
    depositUpdated = await this.depositService.setPresignedURLs(depositUpdated);
    return this.transformerService.depositPopulatedToDto(depositUpdated, user);
  }

  /**
   * PATCH - Updates the status of a specific deposit to 'draft'. This operation is typically part of a moderation process
   * where a deposit needs to be revised before it can be approved. This method is protected by authentication and
   * authorization checks.
   *
   * @param {Request} req - The HTTP request object, which includes the user's authentication information.
   * @param {ModerateDepositPayload} payload - Contains the reasoning or additional metadata about why the deposit is being drafted.
   * @param {string} id - The unique identifier of the deposit to update.
   * @returns {Promise<DepositPopulatedDTO>} - Returns a promise that resolves to the updated deposit data transfer object.
   * @throws {UnauthorizedException} - Thrown if the user is not authenticated or does not have the required permissions to draft the deposit.
   * @throws {ForbiddenException} - Thrown if the deposit is not in a state that allows it to be drafted (e.g., it's already approved).
   * @throws {NotFoundException} - Thrown if the deposit or required related entities (like the community) are not found.
   */
  @ApiOperation({ summary: 'Update the status of a deposit to draft' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id/draft')
  async draftDeposit(
    @Req() req: Request,
    @Body() payload: ModerateDepositPayload,
    @Param('id') id: string
  ): Promise<DepositPopulatedDTO> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');

    const deposit = await this.depositService.findOne({ _id: id });
    assertIsDefined(deposit, 'Deposit not found');

    const ability = await this.authorizationService.defineAbilityFor(user);
    this.authorizationService.canDo(ability, DEPOSIT_ACTIONS.moderate, deposit);

    if (deposit.status !== DepositStatus.pendingApproval) {
      throw new ForbiddenException('Deposit is not in pending approval');
    }

    assertIsDefined(deposit.community, 'Community not found');

    const event = new DepositDraftedByModeratorEvent({
      deposit: deposit.toJSON(),
      community: deposit.communityPopulated.toJSON(),
      reason: payload.reason,
      user: user.toJSON(),
    });
    await this.eventService.create(event.getEventDTO());
    deposit.history.push(event.getHistoryTemplate());
    deposit.markModified('history');
    deposit.status = DepositStatus.draft;

    let depositUpdated = (await deposit.save()) as PopulatedDepositDocument;
    depositUpdated = await this.depositService.setPresignedURLs(depositUpdated);
    return this.transformerService.depositPopulatedToDto(depositUpdated, user);
  }

  /**
   * PATCH - Assigns an editor to a specific deposit based on the deposit's ID and the user ID of the editor.
   * This method performs several checks to ensure the operation is valid, including authentication, authorization,
   * and validation of both the deposit and the editor.
   *
   * @param {Request} req - The HTTP request object, which includes the user's authentication information.
   * @param {AssignEditorPayload} payload - Contains the user ID of the editor to be assigned to the deposit.
   * @param {string} id - The unique identifier of the deposit to which an editor is being assigned.
   * @returns {Promise<DepositPopulatedDTO>} - Returns a promise that resolves to the deposit data transfer object.
   * @throws {UnauthorizedException} - Thrown if the user is not authenticated or does not have the required permissions.
   * @throws {NotFoundException} - Thrown if the deposit or the editor specified by the user ID are not found within the system.
   * @throws {ForbiddenException} - Thrown if the operation is not allowed due to the deposit's current state or other business rules.
   */
  @ApiOperation({ summary: 'Assigns an editor to the given deposit' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id([0-9a-f]{24})/assign')
  async assignEditor(
    @Req() req: Request,
    @Body() payload: AssignEditorPayload,
    @Param('id') id: string
  ): Promise<DepositPopulatedDTO> {
    const deposit = await this.depositService.findOne({ _id: id });
    assertIsDefined(deposit, 'Deposit not found');

    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');

    const ability = await this.authorizationService.defineAbilityFor(user);
    this.authorizationService.canDo(ability, DEPOSIT_ACTIONS.moderate, deposit);

    if (payload.assignee) {
      const moderatorDocument = await this.communitiesService.communityModeratorModel.findOne({
        user: payload.assignee,
        community: deposit.community._id,
      });
      assertIsDefined(moderatorDocument, 'Assignee not found');

      deposit.assignee = moderatorDocument.user;
      const community = await this.communitiesService.findById(deposit.community._id);
      assertIsDefined(community, 'community not defined');
      const event = new EditorAssignedEvent({
        user: user.toJSON(),
        deposit: deposit.toJSON(),
        community: community.toJSON(),
      });
      await this.eventService.create(event.getEventDTO());
    } else {
      deposit.assignee = undefined;
    }
    await deposit.save();
    let updatedDepositPopulated = await this.depositService.findById(deposit._id);
    assertIsDefined(updatedDepositPopulated, 'Populated deposit not found');
    updatedDepositPopulated = await this.depositService.setPresignedURLs(updatedDepositPopulated);
    return this.transformerService.depositPopulatedToDto(updatedDepositPopulated, user);
  }

  /**
   * PATCH - Assigns an editorial decision to a specific deposit. This decision could categorize the deposit as a poster,
   * presentation (used only for conferences). The method ensures that the user is authenticated and authorized to
   * perform this action and updates the deposit's status accordingly.
   *
   * @param {Request} req - The HTTP request object containing the user's authentication data.
   * @param {AssignEditorialDecisionPayload} payload - The payload containing the editorial decision.
   * @param {string} id - The unique identifier of the deposit to which the editorial decision will be assigned.
   * @returns {Promise<DepositPopulatedDTO>} - Returns a promise that resolves to the updated deposit data transfer object.
   * @throws {UnauthorizedException} - Thrown if the user does not have the necessary permissions to perform this action.
   * @throws {NotFoundException} - Thrown if no deposit is found corresponding to the provided ID.
   */
  @ApiOperation({ summary: 'Assign as poster/presentation talk' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id([0-9a-f]{24})/assignEditorialDecision')
  async assignEditorialDecision(
    @Req() req: Request,
    @Body() payload: AssignEditorialDecisionPayload,
    @Param('id') id: string
  ): Promise<DepositPopulatedDTO> {
    const deposit = await this.depositService.findOne({ _id: id });
    assertIsDefined(deposit, 'Deposit not found');

    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');

    const ability = await this.authorizationService.defineAbilityFor(user);
    this.authorizationService.canDo(ability, DEPOSIT_ACTIONS.moderate, deposit);

    deposit.acceptedFor = payload.acceptedFor;
    await deposit.save();

    return this.transformerService.depositPopulatedToDto(deposit, user);
  }

  /**
   * PATCH - Accepts a deposit that is currently in pending approval status. This method will change the deposit's status
   * indicating it has been accepted. It ensures that the user is authenticated and authorized. If provided, a reason
   * for the acceptance can be logged as part of the deposit's history.
   *
   * @param {Request} req - The HTTP request object containing the user's authentication data.
   * @param {string} id - The unique identifier of the deposit to accept.
   * @param {ModerateDepositPayload} [payload] - Optional payload containing the reason for deposit acceptance.
   * @returns {Promise<DepositPopulatedDTO>} - Returns a promise that resolves to the updated deposit data transfer object.
   * @throws {UnauthorizedException} - Thrown if the user does not have the necessary permissions to perform this action.
   * @throws {NotFoundException} - Thrown if no deposit is found corresponding to the provided ID.
   * @throws {ForbiddenException} - Thrown if the deposit is not in the pending approval status.
   */
  @ApiOperation({ summary: 'Accept a deposit' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id([0-9a-f]{24})/accept')
  async acceptDeposit(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() payload?: ModerateDepositPayload
  ): Promise<DepositPopulatedDTO> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');

    const deposit = await this.depositService.findOne({ _id: id });

    assertIsDefined(deposit, 'Deposit not found');

    const ability = await this.authorizationService.defineAbilityFor(user);
    this.authorizationService.canDo(ability, DEPOSIT_ACTIONS.moderate, deposit);

    if (deposit.status !== DepositStatus.pendingApproval) {
      throw new ForbiddenException('Deposit is not in pending approval');
    }

    assertIsDefined(deposit.community, 'Community not found');

    const event = new DepositAcceptedEvent({
      deposit: deposit.toJSON(),
      user: user.toJSON(),
      community: deposit.communityPopulated.toJSON(),
      reason: payload?.reason,
    });

    await this.eventService.create(event.getEventDTO());
    deposit.history.push(event.getHistoryTemplate());
    deposit.markModified('history');
    deposit.status = DepositStatus.preprint;

    let depositUpdated = (await deposit.save()) as PopulatedDepositDocument;
    depositUpdated = await this.depositService.setPresignedURLs(depositUpdated);
    return this.transformerService.depositPopulatedToDto(depositUpdated, user);
  }

  /**
   * PATCH - Publishes a deposit if it is in the preprint stage. It checks if the user is authorized and updates
   * the deposit's status to published. All changes, including status updates, are recorded in the deposit's
   * history.
   *
   * @param {Request} req - The HTTP request object which includes the user's authentication information.
   * @param {string} id - The ID of the deposit to be published.
   * @returns {Promise<DepositPopulatedDTO>} - A promise that resolves to the updated deposit data transfer object.
   * @throws {UnauthorizedException} If the user does not have permission to perform the action.
   * @throws {NotFoundException} If no deposit is found with the provided ID.
   * @throws {ForbiddenException} If the deposit is not in the preprint status, hence cannot be published.
   */
  @ApiOperation({ summary: 'Publish a deposit' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id([0-9a-f]{24})/publish')
  async publishDeposit(@Req() req: Request, @Param('id') id: string): Promise<DepositPopulatedDTO> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');

    const deposit = await this.depositService.findOne({ _id: id });

    assertIsDefined(deposit, 'Deposit not found');

    const ability = await this.authorizationService.defineAbilityFor(user);
    this.authorizationService.canDo(ability, DEPOSIT_ACTIONS.moderate, deposit);
    if (deposit.status !== DepositStatus.preprint) {
      throw new ForbiddenException('Deposit is not in preprint');
    }

    assertIsDefined(deposit.community, 'Community not found');

    const event = new DepositPublishedEvent({
      deposit: deposit.toJSON(),
      user: user.toJSON(),
      community: deposit.communityPopulated.toJSON(),
    });

    await this.eventService.create(event.getEventDTO());
    deposit.history.push(event.getHistoryTemplate());
    deposit.markModified('history');
    deposit.status = DepositStatus.published;

    const depositUpdated = (await deposit.save()) as PopulatedDepositDocument;
    return this.transformerService.depositPopulatedToDto(depositUpdated, user);
  }

  /**
   * PATCH - Changes the status of a deposit back to 'pending approval' if it currently is either 'preprint' or 'published'.
   * This action is logged and an event related to the status change is created and stored. The method checks if
   * the user has the necessary permissions to perform this action and verifies the current status of the deposit
   * to ensure it's eligible for the status change.
   *
   * @param {Request} req - The HTTP request object, containing user and authentication info.
   * @param {string} id - The unique identifier of the deposit to modify.
   * @param {ModerateDepositPayload} [payload] - Optional payload containing reasons for the status change.
   * @returns {Promise<DepositPopulatedDTO>} - A promise that resolves with the updated deposit information.
   * @throws {UnauthorizedException} - Thrown if the user does not have permission to modify the deposit.
   * @throws {NotFoundException} - Thrown if no deposit is found with the given ID.
   * @throws {ForbiddenException} - Thrown if the deposit is not in a status that allows it to be returned to pending approval.
   */
  @ApiOperation({ summary: 'Return deposit to pending approval' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id([0-9a-f]{24})/pending-approval')
  async depositToPendingApproval(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() payload?: ModerateDepositPayload
  ): Promise<DepositPopulatedDTO> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');

    const deposit = await this.depositService.findOne({ _id: id });

    assertIsDefined(deposit, 'Deposit not found');

    const ability = await this.authorizationService.defineAbilityFor(user);
    this.authorizationService.canDo(ability, DEPOSIT_ACTIONS.moderate, deposit);

    const authorizedStatus = [DepositStatus.preprint, DepositStatus.published];
    if (!authorizedStatus.includes(deposit.status)) {
      throw new ForbiddenException('Deposit is not in preprint or published');
    }

    assertIsDefined(deposit.community, 'Community not found');

    const event = new DepositBackToPendingApprovalEvent({
      deposit: deposit.toJSON(),
      user: user.toJSON(),
      community: deposit.communityPopulated.toJSON(),
      reason: payload?.reason,
    });

    await this.eventService.create(event.getEventDTO());
    deposit.history.push(event.getHistoryTemplate());
    deposit.markModified('history');
    deposit.status = DepositStatus.pendingApproval;

    const depositUpdated = (await deposit.save()) as PopulatedDepositDocument;
    return this.transformerService.depositPopulatedToDto(depositUpdated, user);
  }

  /**
   * PATCH - Updates an existing deposit based on provided changes. This method can handle multiple updates including
   * updating deposit status (e.g., from draft to published), modifying authors, and linking the deposit to a
   * specific track within a community. Each modification checks for user permissions and validates the new data to
   * maintain integrity and security. The method also ensures that changes to the deposit's are authorized and valid
   * within the current community context.
   *
   * @param {Request} req - The HTTP request object that includes user authentication.
   * @param {UpdateDepositDTO} payload - The data transfer object containing all the desired updates.
   * @param {string} id - The unique identifier of the deposit to be updated.
   * @returns {Promise<DepositPopulatedDTO>} - A promise that resolves with the updated deposit data, enriched with related entities and URLs.
   * @throws {NotFoundException} - Thrown if no deposit with the specified ID is found, or required linked entities like tracks are missing.
   * @throws {UnauthorizedException} - Thrown if the user does not have the necessary permissions to perform the update.
   * @throws {ForbiddenException} - Thrown if attempting to update to an unauthorized status or modify HTML content without sufficient permissions.
   */
  @ApiOperation({ summary: 'Update a deposit' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id([0-9a-f]{24})')
  async updateDeposit(
    @Req() req: Request,
    @Body() payload: UpdateDepositDTO,
    @Param('id') id: string
  ): Promise<DepositPopulatedDTO> {
    const deposit = await this.depositService.findOne({ _id: id });
    assertIsDefined(deposit, 'Deposit not found');
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');

    const ability = await this.authorizationService.defineAbilityFor(user);
    this.authorizationService.canDo(ability, DEPOSIT_ACTIONS.update, deposit);

    if (payload.html && payload.html !== deposit.html) {
      if (ability.cannot(DEPOSIT_ACTIONS.moderate, deposit)) {
        delete payload.html;
      } else {
        payload.html = sanitizeHtml(payload.html, defaultSanitizeOptions);
      }
    }

    // Published Status update
    if (
      payload.status &&
      payload.status !== deposit.status &&
      payload.status === DepositStatus.published
    ) {
      this.authorizationService.canDo(ability, DEPOSIT_ACTIONS.moderate, deposit);
      // Check if the deposit is now the last version or not
      await this.depositService.updateToLastVersion(deposit);
      deposit.publicationDate = new Date();
    }

    // Authors update
    if (payload.authors) {
      const authors: Author[] = [];
      for (const authorPayload of payload.authors) {
        const author: Author = authorPayload;
        const authorRegistered = author.email
          ? await this.userService.findOne({ email: author.email })
          : undefined;
        if (authorRegistered) {
          author.userId = authorRegistered.userId;
          author.userObjectId = authorRegistered._id;
          author.nickname = authorRegistered.nickname;
          author.avatar = authorRegistered.avatar;
        }
        author.gravatar = author.email
          ? getMd5Hash(author.email)
          : getMd5Hash(author.firstName + author.lastName);
        authors.push(author);
      }
      payload.authors = authors;
    }
    if (
      deposit.communityPopulated.newTracks.length > 0 &&
      !deposit.newTrackTimestamp &&
      !payload.newTrackTimestamp
    ) {
      throw new NotFoundException('You need to choose a valid community track');
    }

    if (payload.newTrackTimestamp && deposit.newTrackTimestamp !== payload.newTrackTimestamp) {
      const newTrack = deposit.communityPopulated.newTracks.find(
        track => track.timestamp === payload.newTrackTimestamp
      );
      if (!newTrack) {
        throw new NotFoundException('Please select a valid track');
      }
      assertIsDefined(newTrack, 'Please select a valid track');
      payload.newTrackTimestamp = newTrack.timestamp;
    }

    Object.assign(deposit, payload);
    await deposit.save();
    let updatedDepositPopulated = await this.depositService.findById(deposit._id);
    assertIsDefined(updatedDepositPopulated, 'Populated deposit not found');
    updatedDepositPopulated = await this.depositService.setPresignedURLs(updatedDepositPopulated);
    return this.transformerService.depositPopulatedToDto(updatedDepositPopulated, user);
  }

  /**
   * PATCH - Submits a deposit for review by changing its status from Draft to Pending Approval. This method updates the
   * submission date to the current time and logs this transition in the deposit's history. Additionally, it notifies
   * both users and administrators within the community about the new submission awaiting approval.
   *
   * @param {Request} req - The HTTP request object that includes user authentication.
   * @param {string} id - The unique identifier of the deposit to be submitted.
   * @returns {Promise<DepositPopulatedDTO>} - A promise that resolves to the updated deposit data.
   * @throws {BadRequestException} - Thrown if the deposit is not in the required Draft status.
   * @throws {NotFoundException} - Thrown if the deposit or required user information is not found.
   */
  @ApiOperation({ summary: 'Submit a deposit to a community' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id([0-9a-f]{24})/submit')
  async submitDeposit(@Req() req: Request, @Param('id') id: string): Promise<DepositPopulatedDTO> {
    const deposit = await this.depositService.findOne({ _id: id });
    assertIsDefined(deposit, 'Deposit not found');
    if (deposit.status !== DepositStatus.draft) {
      throw new BadRequestException('Deposit must be in Draft status');
    }

    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');

    const ability = await this.authorizationService.defineAbilityFor(user);
    this.authorizationService.canDo(ability, DEPOSIT_ACTIONS.update, deposit);

    deposit.submissionDate = new Date();
    // Notify users about new pending approval deposits
    const eventDepositSubmitted = new DepositSubmittedEvent({
      deposit: deposit.toJSON(),
      user: user.toJSON(),
      community: deposit.communityPopulated.toJSON(),
    });
    await this.eventService.create(eventDepositSubmitted.getEventDTO());
    // Notify admins about new pending approval deposits
    const eventDepositChangedToPendingApproval = new DepositChangedToPendingApprovalEvent({
      deposit: deposit.toJSON(),
      community: deposit.communityPopulated.toJSON(),
    });
    await this.eventService.create(eventDepositChangedToPendingApproval.getEventDTO());

    deposit.history.push(eventDepositSubmitted.getHistoryTemplate());
    deposit.markModified('history');
    deposit.status = DepositStatus.pendingApproval;
    await this.userService.addCommunity(user, deposit.communityPopulated);
    let depositSaved = (await deposit.save()) as PopulatedDepositDocument;
    depositSaved = await this.depositService.setPresignedURLs(depositSaved);
    return this.transformerService.depositPopulatedToDto(depositSaved, user);
  }

  /**
   * GET - Retrieves a filtered list of deposits based on the provided query parameters. This method handles complex filtering
   * criteria including creator identity, community membership, review presence, DOI, ORCID, track timestamps,
   * and specific date ranges. It supports pagination and sorting by popularity or submission date. The method also
   * applies security filters to ensure that sensitive information like author emails are only visible to authenticated
   * users, and that all returned deposits are either published or in preprint status to safeguard unpublished data.
   *
   * @param {Request} req - The HTTP request object containing user credentials and other request metadata.
   * @param {GetDepositsQueryParams} queryParams - Custom query parameters for filtering and pagination.
   * @returns {Promise<DepositsQueryDTO>} - A promise that resolves to an object containing the filtered list of deposits.
   * @throws {BadRequestException} - Thrown if any community IDs in the filters are invalid.
   */
  @ApiOperation({ summary: 'Get a list of deposits' })
  @UseGuards(JwtOrAnonymousGuard)
  @Get('')
  async getDeposits(
    @Req() req: Request,
    @Query() queryParams: GetDepositsQueryParams
  ): Promise<DepositsQueryDTO> {
    const publicStatus: DepositStatus[] = [DepositStatus.published, DepositStatus.preprint];
    const user = await this.userService.getLoggedUser(req);
    const pageSize = 10;
    const skip = pageSize * (queryParams.page ?? 0);
    const filter: StrictFilterQuery<DepositDocument> = {};
    if (queryParams.creator) {
      const creatorUser = await this.userService.findById(queryParams.creator);
      // using "dummy value" to avoid null values returning always true
      filter.$and = [
        {
          $or: [
            { creator: queryParams.creator },
            {
              authors: {
                $elemMatch: { nickname: { $eq: creatorUser?.nickname || 'dummy value' } },
              },
            },
          ],
        },
      ];
    }

    if (queryParams.query) {
      filter.$text = { $search: queryParams.query };
    }

    if (queryParams.community || queryParams.communityChildren) {
      // Initialize filter array if needed
      filter.$and = filter.$and ?? [];

      if (queryParams.communityChildren) {
        for (const communityId of queryParams.communityChildren) {
          if (!isValidObjectId(communityId)) {
            throw new BadRequestException('Community not valid');
          }
        }
      }

      filter.$and.push({
        $or: [
          ...addToArrayIf(!!queryParams.community, { community: queryParams.community }),
          ...addToArrayIf(!!queryParams.communityChildren, {
            community: { $in: queryParams.communityChildren },
            publicationType: {
              $in: [
                PublicationType.article,
                PublicationType.conferencePaper,
                PublicationType.preprint,
              ],
            },
          }),
        ],
      });
    }

    if (queryParams.hasReviews) {
      filter.peerReviews = { $ne: [] };
    }

    if (queryParams.doi) {
      filter.doi = { $eq: queryParams.doi };
    }
    if (queryParams.orcid) {
      filter.authors = { $elemMatch: { orcid: { $eq: queryParams.orcid } } };
    }
    if (queryParams.newTrackTimestamp) {
      // search by track timestamp
      filter.newTrackTimestamp = { $eq: queryParams.newTrackTimestamp };
    }

    if (queryParams.discipline) {
      filter.disciplines = { $elemMatch: { $eq: queryParams.discipline } };
    }
    if (queryParams.from) {
      filter.submissionDate = { $gte: queryParams.from };
    }
    if (queryParams.until) {
      filter.submissionDate = { $lte: queryParams.until };
    }
    if (queryParams.from && queryParams.until) {
      filter.submissionDate = { $gte: queryParams.from, $lte: queryParams.until };
    }
    filter.status = { $in: [DepositStatus.published, DepositStatus.preprint] };
    if (queryParams.status && publicStatus.includes(queryParams.status)) {
      filter.status = { $eq: queryParams.status };
    }
    filter.isLatestVersion = true;

    let sortBy: string | Record<string, SortOrder> = { submissionDate: -1 };
    if (queryParams.sort === 'popular') {
      sortBy = { views: -1 };
    }

    const count = await this.depositService.depositModel.countDocuments(filter);
    const deposits = await this.depositService.findWithLimitExec(filter, skip, pageSize, sortBy);
    const ability = await this.authorizationService.defineAbilityFor(user);
    for (const deposit of deposits) {
      deposit.peerReviews = deposit.peerReviews.filter(review =>
        ability.can(REVIEW_ACTIONS.read, review)
      );
    }

    if (!user) {
      for (const deposit of deposits) {
        this.depositService.deleteAuthorsEmail(deposit);
      }
    }

    const depositsDTO = await this.transformerService.depositPopulatedToDtoArray(deposits, user);

    const depositQuery: DepositsQueryDTO = { deposits: depositsDTO, count };
    return depositQuery;
  }

  /**
   * DELETE - Deletes a specific deposit by its identifier if it meets the criteria for deletion. This method performs
   * a series of checks to ensure the user has the right to delete the deposit and that the deposit does not have
   * any associated peer reviews, which would prevent deletion. It handles the deletion of all associated files
   * from storage, including the main publication file and any additional files.
   *
   * @param {Request} req - The HTTP request object that includes user authentication and potentially other data.
   * @param {string} id - The unique identifier of the deposit to be deleted, expected to be a valid MongoDB ObjectId.
   * @returns {Promise<DepositPopulatedDTO>} - A promise that resolves to the deleted deposit's data.
   * @throws {UnauthorizedException} - If the deposit has associated peer reviews or if the user does not have permissions.
   * @throws {NotFoundException} - If no deposit is found corresponding to the provided id.
   */
  @ApiOperation({ summary: 'Delete deposit' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id([0-9a-f]{24})')
  async deleteDeposit(@Req() req: Request, @Param('id') id: string): Promise<DepositPopulatedDTO> {
    const deposit = await this.depositService.findOne({
      _id: id,
    });
    assertIsDefined(deposit, 'Deposit not found');

    const user = await this.userService.getLoggedUser(req);
    const ability = await this.authorizationService.defineAbilityFor(user);
    this.authorizationService.canDo(ability, DEPOSIT_ACTIONS.delete, deposit);

    if (deposit.peerReviews.length > 0) {
      throw new UnauthorizedException('Publications with reviews cannot be deleted');
    }

    // Delete publication files
    if (deposit.publicationFile) {
      const objectKey = `${deposit._id.toHexString()}/${deposit.publicationFile.filename}`;
      await this.storageService.delete(objectKey);
    }

    // Delete review files
    for (const file of deposit.files) {
      const objectKey = `${deposit._id.toHexString()}/${file.filename}`;
      await this.storageService.delete(objectKey);
    }

    await deposit.deleteOne();
    return this.transformerService.depositPopulatedToDto(deposit, user);
  }

  /**
   * POST - Upload of a file associated with a deposit. This method validates the filename format, updates the
   * deposit's file metadata, and potentially sets the file as the main publication file. It logs the upload event
   * and updates the corresponding fields in the deposit record. The method ensures that the operation is performed
   * by an authorized user and that the deposit exists. Additionally, it checks the file's existence in the storage
   * to confirm the upload before making any updates.
   *
   * @param {Request} req - The HTTP request object that includes user authentication.
   * @param {string} id - The unique identifier of the deposit to confirm the file upload for.
   * @param {UploadFilePayload} payload - The payload containing the file metadata and flags for main file.
   * @returns {Promise<DepositPopulatedDTO>} - A promise that resolves to the updated deposit data.
   * @throws {BadRequestException} - Thrown if the filename does not meet the required format.
   * @throws {NotFoundException} - Thrown if the deposit is not found or if the file does not exist in storage.
   */
  @ApiOperation({ summary: 'Confirm uploaded file in a deposit' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id([0-9a-f]{24})/files/confirm')
  async uploadFileConfirmationDeposit(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() payload: UploadFilePayload
  ): Promise<DepositPopulatedDTO> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');

    const deposit = await this.depositService.findOne({ _id: id });
    assertIsDefined(deposit, 'Deposit not found');

    const ability = await this.authorizationService.defineAbilityFor(user);
    this.authorizationService.canDo(ability, DEPOSIT_ACTIONS.update, deposit);

    //Check filename correct like extra-{ObjectId}-{timestamp}.{extension}
    const checkFilename = new RegExp(
      '^(publication|extra)-([0-9a-f]{24})(-([0-9]{13}))?\\.([0-9a-z]{2,4})$'
    );
    if (!checkFilename.test(payload.fileMetadata.filename)) {
      throw new BadRequestException('Invalid filename');
    }
    const fileExtension = extname(payload.fileMetadata.filename).toLowerCase();
    const objectKey = `${deposit._id.toHexString()}/${payload.fileMetadata.filename}`;
    await this.storageService.headObject({ objectKey });

    if (payload.isMainFile) {
      if (payload.replacePDF) {
        deposit.pdfUrl = payload.fileMetadata.filename;
      } else {
        deposit.publicationFile = payload.fileMetadata;
        if (fileExtension === '.pdf') {
          deposit.pdfUrl = payload.fileMetadata.filename;
        }

        const event = new FileUploadedEvent({
          depositOrReview: deposit.toJSON(),
          filename: payload.fileMetadata.filename,
        });

        await this.eventService.create(event.getEventDTO());
      }
    } else {
      deposit.files.push(payload.fileMetadata);
      deposit.markModified('files');
    }

    const depositSaved = await deposit.save();
    let depositPopulated = await this.depositService.findById(depositSaved._id.toHexString());
    assertIsDefined(depositPopulated, 'depositPopulated not found');
    depositPopulated = await this.depositService.setPresignedURLs(depositPopulated);
    return this.transformerService.depositPopulatedToDto(depositPopulated, user);
  }

  /**
   * POST - Uploads a file to a deposit, handling main publications or additional files differently based on the query parameters.
   * It also manages file validation based on allowed extensions and handles the creation of signed URLs for file uploads.
   * This method ensures that only authorized users can upload files to specific deposits, and it will generate the
   * appropriate metadata for the uploaded file.
   *
   * @param {Request} req - The HTTP request object containing user authentication details.
   * @param {string} id - The unique identifier of the deposit to which the file is being uploaded.
   * @param {CreateFileDTO} payload - The data transfer object containing the file information.
   * @param {boolean} isMainFile - A boolean flag indicating whether the file is a main file of the deposit.
   * @param {boolean} [replacePDF=false] - A boolean flag indicating whether to replace an existing PDF file.
   * @returns {Promise<SignedUrlDTO>} - A promise resolved with the signed URL and metadata necessary for the client to upload the file.
   * @throws {UnauthorizedException} - If the file extension is not allowed or if the user does not have permission to update the deposit.
   * @throws {NotFoundException} - If no deposit is found corresponding to the provided id.
   */
  @ApiOperation({ summary: 'Uploads a file to a deposit' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id([0-9a-f]{24})/files')
  @ApiQuery({ name: 'replacePDF', type: 'boolean', required: false })
  async uploadFile(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() payload: CreateFileDTO,
    @Query('isMainFile') isMainFile: boolean,
    // eslint-disable-next-line @typescript-eslint/no-inferrable-types
    @Query('replacePDF') replacePDF: boolean = false
  ): Promise<SignedUrlDTO> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');

    const deposit = await this.depositService.findOne({ _id: id });
    assertIsDefined(deposit, 'Deposit not found');

    const ability = await this.authorizationService.defineAbilityFor(user);
    this.authorizationService.canDo(ability, DEPOSIT_ACTIONS.update, deposit);

    const file = payload.file;
    const fileExtension = extname(file.name).toLowerCase();

    if (!ALLOWED_FILE_EXTENSIONS.includes(fileExtension)) {
      throw new UnauthorizedException('Invalid extension file');
    }

    // Set filename depending on file type
    let generatedFilename = '';
    const tags: string[] = [];
    if (isMainFile) {
      generatedFilename = `publication-${deposit._id.toHexString()}${fileExtension}`;
      tags.push('Publication');
      // If we are uploading a new main file, delete old metadata
      if (!replacePDF) {
        deposit.publicationFile = undefined;
        deposit.pdfUrl = undefined;
        delete deposit.html;
      }
    } else {
      const time = Date.now();
      generatedFilename = `extra-${deposit._id.toHexString()}-${time}${fileExtension}`;
    }

    const fileMetadata: FileMetadata = {
      filename: generatedFilename,
      description: file.name,
      contentType: file.type,
      contentLength: file.size,
      tags: tags,
    };

    const objectKey = `${deposit._id.toHexString()}/${fileMetadata.filename}`;

    const params: PutObjectCommandInput = {
      Key: objectKey,
      ContentType: fileMetadata.contentType,
      Bucket: this.storageService.privateBucket,
    };

    const signedUrl = await this.storageService.getSignedUrl('putObject', params);

    await deposit.save();

    return { signedUrl, fileMetadata, isMainFile, replacePDF };
  }

  /**
   * GET - Retrieves a signed URL for accessing the PDF file. This method checks if the deposit exists
   * and is not in draft status before generating the URL. It ensures that the deposit has a valid PDF URL
   * and utilizes AWS S3 services to generate accessible links for the client.
   *
   * @param {string} id - The unique identifier of the deposit whose PDF file is to be retrieved.
   * @param {Response} response - The HTTP response object used to redirect to the PDF file URL.
   * @throws {UnauthorizedException} - If the deposit is in draft status or if there is no PDF URL set.
   * @throws {NotFoundException} - If no deposit is found with the given ID.
   */
  @ApiOperation({ summary: 'Gets the PDF file for a deposit' })
  @Get([':id([0-9a-f]{24})/pdf', ':id([0-9a-f]{24})/publication.pdf'])
  async getDepositFilePDF(@Param('id') id: string, @Res() response: Response): Promise<void> {
    const deposit = await this.depositService.findById(id);
    assertIsDefined(deposit, 'Deposit not found');

    if (deposit.status === DepositStatus.draft) {
      throw new UnauthorizedException('Deposit should not be draft');
    }

    assertIsDefined(deposit.pdfUrl, 'pdfUrl not set');
    const objectKey = `${deposit._id.toHexString()}/${deposit.pdfUrl}`;
    const params = {
      Key: objectKey,
      Bucket: this.storageService.privateBucket,
    };
    const signedUrl = await this.storageService.getSignedUrl('getObject', params);
    response.redirect(signedUrl);
  }

  /**
   * GET - Redirects to a signed URL for accessing a specified file of a deposit.
   * This method verifies the deposit's existence and checks that it is not in draft status.
   * It locates the file within the deposit's associated files by filename, then generates
   * a signed URL using AWS S3 services.
   *
   * @param {string} id - The unique identifier of the deposit to access the file from.
   * @param {string} filename - The name of the file to retrieve.
   * @param {Response} response - The HTTP response object used for redirection to the file's URL.
   * @throws {UnauthorizedException} - Thrown if the deposit is in draft status or the file does not exist.
   * @throws {NotFoundException} - Thrown if no deposit or file is found with the specified identifiers.
   */
  @ApiOperation({ summary: 'Gets a file for a deposit' })
  @Get(':id([0-9a-f]{24})/files/:filename')
  async getDepositFile(
    @Param('id') id: string,
    @Param('filename') filename: string,
    @Res() response: Response
  ): Promise<void> {
    const deposit = await this.depositService.findById(id);
    assertIsDefined(deposit, 'Deposit not found');

    if (deposit.status === DepositStatus.draft) {
      throw new UnauthorizedException('Deposit should not be draft');
    }
    const allDepositFiles = deposit.files.concat(deposit.publicationFile || []);
    const storedFile = allDepositFiles.find(file => file.filename === filename);
    assertIsDefined(storedFile, 'File not found');
    const objectKey = `${deposit._id.toHexString()}/${storedFile.filename}`;
    const params = {
      Key: objectKey,
      Bucket: this.storageService.privateBucket,
    };
    const signedUrl = await this.storageService.getSignedUrl('getObject', params);
    response.redirect(signedUrl);
  }

  /**
   * DELETE - Deletes a specified file from a deposit's file collection and updates the deposit's record.
   * This method first checks the user's permissions and the existence of the deposit and the file.
   * It then deletes the file from the storage and updates the deposit's file list.
   *
   * @param {Request} req - The HTTP request object containing the user's session for authorization.
   * @param {string} id - The unique identifier of the deposit from which the file will be deleted.
   * @param {string} filename - The name of the file to be deleted.
   * @returns {DepositPopulatedDTO} - The updated deposit data after the file deletion.
   * @throws {NotFoundException} - If the deposit or the file is not found.
   * @throws {UnauthorizedException} - If the user does not have permission to modify the deposit.
   */
  @ApiOperation({ summary: 'Delete deposit file' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id([0-9a-f]{24})/files/:filename')
  async deleteDepositFile(
    @Req() req: Request,
    @Param('id') id: string,
    @Param('filename') filename: string
  ): Promise<DepositPopulatedDTO> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');
    const deposit = await this.depositService.findOne({ _id: id });
    assertIsDefined(deposit, 'Deposit not found');
    const ability = await this.authorizationService.defineAbilityFor(user);
    this.authorizationService.canDo(ability, DEPOSIT_ACTIONS.update, deposit);
    const index = deposit.files.findIndex(file => file.filename === filename);
    if (index === -1) {
      throw new NotFoundException('File not found');
    }
    const storedFile = deposit.files[index];
    const objectKey = `${deposit._id.toHexString()}/${storedFile.filename}`;
    await this.storageService.delete(objectKey);
    deposit.files.splice(index, 1); // Removes item from files
    deposit.markModified('files');
    const depositSaved = await deposit.save();
    let depositPopulated = await this.depositService.findById(depositSaved._id.toHexString());
    assertIsDefined(depositPopulated, 'depositPopulated nor found');
    depositPopulated = await this.depositService.setPresignedURLs(depositPopulated);
    return this.transformerService.depositPopulatedToDto(depositPopulated, user);
  }

  /**
   * GET - Retrieves a specified image associated with a deposit and redirects to its URL.
   * This method constructs the path to the image file based on the deposit ID and image filename,
   * obtains a signed URL from the storage service, and redirects the client to this URL.
   *
   * @param {string} id - The unique identifier of the deposit associated with the image.
   * @param {string} image - The filename of the image to retrieve.
   * @param {Response} response - The HTTP response object used to redirect to the image URL.
   * @throws {NotFoundException} - If the deposit or the image does not exist.
   */
  @ApiOperation({ summary: 'Get deposit images' })
  @Get(':id([0-9a-f]{24})/media/:image/')
  async getDepositImages(
    @Param('id') id: string,
    @Param('image') image: string,
    @Res() response: Response
  ): Promise<void> {
    // TODO fix this visibility check for binary files
    const deposit = await this.depositService.findById(id);
    assertIsDefined(deposit, 'Deposit not found');

    const objectKey = `${deposit._id.toHexString()}/media/${image}`;
    const signedUrl = await this.storageService.getSignedUrl('getObject', {
      Key: objectKey,
      Bucket: this.storageService.privateBucket,
    });
    response.redirect(signedUrl);
  }

  /**
   * GET - Fetches and returns the citation information for a specific deposit in APA format.
   *
   * @param {string} id - The unique identifier of the deposit for which the citation is requested.
   * @returns {Citation} - The citation object containing the formatted APA citation string.
   * @throws {NotFoundException} - If no deposit could be found corresponding to the provided ID.
   */
  @ApiOperation({ summary: 'Get deposit citation' })
  @Get(':id([0-9a-f]{24})/citation')
  async getCitation(@Param('id') id: string): Promise<Citation> {
    const deposit = await this.depositService.findById(id);
    assertIsDefined(deposit, 'Deposit not found');

    const citation = new Citation();
    citation.apa = this.depositService.getAPACitation(deposit);
    return citation;
  }

  /**
   * GET - Retrieves and returns the BibTeX citation string for a given deposit based on its unique identifier.
   * The BibTeX citation includes all the necessary bibliographic metadata formatted specifically for
   * use in BibTeX-enabled document preparation systems.
   *
   * @param {string} id - The unique identifier of the deposit for which the BibTeX citation is required.
   * @returns {string} - The BibTeX formatted citation string.
   * @throws {NotFoundException} - If no deposit is found corresponding to the provided ID.
   */
  @ApiOperation({ summary: 'Get deposit BibTeX citation' })
  @Get(':id([0-9a-f]{24})/bibtex')
  @Header('Content-Type', 'text/plain')
  async getBibtex(@Param('id') id: string): Promise<string> {
    return await this.depositService.getBibtexCitation(id);
  }

  /**
   * POST - Generates and previews DOI metadata registration information for a specific deposit.
   * This method supports both DataCite and Crossref DOI providers, depending on the community configuration.
   * The function will check if the community associated with the deposit is configured for DataCite or Crossref
   * and generate the appropriate DOI metadata in JSON or XML format respectively.
   *
   * @param {string} id - The unique identifier of the deposit for which DOI metadata is being generated.
   * @returns {StringDataPayload} - Returns DOI metadata as a string encapsulated within a data payload object.
   * @throws {NotFoundException} - If no deposit is found for the provided ID or if the DOI provider is not configured.
   */
  @ApiOperation({ summary: 'Preview DOI Metadata registration for DataCite/Crossref provider' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id([0-9a-f]{24})/doi-preview')
  async previewDOIRegistration(
    @Req() req: Request,
    @Param('id') id: string
  ): Promise<StringDataPayload> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');

    const deposit = await this.depositService.findById(id);
    assertIsDefined(deposit, 'Deposit not found');

    const ability = await this.authorizationService.defineAbilityFor(user);
    this.authorizationService.canDo(ability, DEPOSIT_ACTIONS.moderate, deposit);

    if (deposit.communityPopulated.datacite) {
      const json = this.dataciteService.generateDOIMetadata(deposit);
      return { data: JSON.stringify(json) };
    } else if (deposit.communityPopulated.crossref) {
      return { data: this.crossrefService.createDepositXML(deposit) };
    } else {
      throw new NotFoundException('DOI provider is not configured!');
    }
  }

  /**
   * POST- Creates a DOI for a specified deposit. This method determines whether to use DataCite or Crossref
   * based on the community's configuration linked to the deposit. It handles DOI generation and returns the
   * DOI as a string or any error message encountered during the DOI creation process.
   *
   * @param {string} id - The unique identifier of the deposit for which to create a DOI.
   * @returns {StringDataPayload} - Returns a payload containing the DOI string or an error message.
   * @throws {NotFoundException} - If no deposit is found for the provided ID or if no DOI provider is configured.
   * @throws {HttpException} - If an error occurs during the DOI generation process.
   */
  @ApiOperation({ summary: 'Create a DOI for a deposit using DataCite/Crossref provider' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id([0-9a-f]{24})/doi')
  async createDoi(@Req() req: Request, @Param('id') id: string): Promise<StringDataPayload> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');

    const deposit = await this.depositService.findById(id);
    assertIsDefined(deposit, 'Deposit not found');

    const ability = await this.authorizationService.defineAbilityFor(user);
    this.authorizationService.canDo(ability, DEPOSIT_ACTIONS.moderate, deposit);

    if (deposit.communityPopulated.datacite) {
      const result = { data: '' };
      try {
        result.data = await this.dataciteService.generateDOI(deposit);
      } catch (error: unknown) {
        console.log(error);
        result.data = (error as HttpException).message;
      }
      return result;
    } else if (deposit.communityPopulated.crossref) {
      return { data: await this.crossrefService.generateDepositDOI(deposit) };
    } else {
      throw new NotFoundException('DOI provider is not configured!');
    }
  }

  /**
   * Retrieves DOI  metadata for a specific deposit based on its ID.
   * This method checks the community settings associated with the deposit to determine whether to use
   * DataCite or Crossref for fetching the DOI metadata.
   *
   * @param {string} id - The unique identifier of the deposit for which to retrieve DOI metadata.
   * @returns {Doi} - Returns the DOI metadata associated with the deposit.
   * @throws {NotImplementedException} - If the feature is not implemented for Crossref.
   * @throws {NotFoundException} - If no deposit is found for the provided ID, or if no DOI provider is configured.
   */
  @ApiOperation({ summary: 'Get the metadata for a DOI associated with a deposit' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id([0-9a-f]{24})/doi')
  async getDoi(@Req() req: Request, @Param('id') id: string): Promise<Doi> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');

    const deposit = await this.depositService.findById(id);
    assertIsDefined(deposit, 'Deposit not found');

    const ability = await this.authorizationService.defineAbilityFor(user);
    this.authorizationService.canDo(ability, DEPOSIT_ACTIONS.moderate, deposit);

    if (deposit.communityPopulated.datacite) {
      return await this.dataciteService.getDoiMetadata(deposit);
    } else if (deposit.communityPopulated.crossref) {
      // TODO Not implemented
      throw new NotImplementedException('Featured not implemented');
    } else {
      throw new NotFoundException('DOI provider is not configured!');
    }
  }

  /**
   * Retrieves a list of deposits that are currently pending approval. This function is restricted to users with
   * administrative privileges and returns an array of deposits in a populated DTO format that includes additional
   * details about each deposit.
   *
   * @param {Request} req - The incoming HTTP request containing user and authentication data.
   * @returns {DepositPopulatedDTO[]} - An array of deposits that are pending approval.
   * @throws {UnauthorizedException} - If the user does not have administrative privileges.
   */
  @ApiOperation({ summary: 'Get deposits pending approval' })
  @UseGuards(AuthGuard(['jwt']))
  @Get('pendingApproval')
  async getDepositsPendingApproval(@Req() req: Request): Promise<DepositPopulatedDTO[]> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');
    if (!user.roles.includes('admin')) {
      throw new UnauthorizedException();
    }

    const deposits = await this.depositService.find({ status: DepositStatus.pendingApproval });
    return this.transformerService.depositPopulatedToDtoArray(deposits, user);
  }
}
