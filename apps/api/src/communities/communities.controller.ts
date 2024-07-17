import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DepositDocument, DepositStatus } from '../deposit/deposit.schema';
import { CommunitiesService, CommunityDocumentPopulated } from './communities.service';
import { UserService } from '../users/user.service';
import { Request, Response } from 'express';
import { DepositService } from '../deposit/deposit.service';
import { assertIsDefined, CommunityCLASSNAME, encryptJson } from '../utils/utils';
import { CommunityPopulatedDTO } from '../dtos/community/community-populated.dto';
import { CommunityCreateDto } from '../dtos/community/community-create.dto';
import { CommunityPrivateDTO } from '../dtos/community/community-private.dto';
import { AuthGuard } from '@nestjs/passport';
import { AuthorizationService, COMMUNITY_ACTIONS } from '../authorization/authorization.service';
import { AnyKeys, SortOrder, Types } from 'mongoose';
import { ModeratorAddedToCommunityEvent } from '../event/events/moderatorAddedToCommunityEvent';
import { EventService } from '../event/event.service';
import { UpdateUserRoleDTO } from '../dtos/user/update-user-role.dto';
import {
  AccessRight,
  Community,
  CommunityStatus,
  CommunityType,
  SubscriptionType,
} from './communities.schema';
import { ReviewDocument, ReviewStatus } from '../review/review.schema';
import { ReviewService } from '../review/review.service';
import { CommunityModeratorDTO } from '../dtos/community/community-moderator.dto';
import { ModeratorUpdateDTO } from '../dtos/community/community-moderator-update.dto';
import { CommunityUpdateDto } from '../dtos/community/community-update.dto';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiProperty,
  ApiQuery,
  ApiResponse,
  ApiTags,
  refs,
} from '@nestjs/swagger';
import { DepositsQueryDTO } from '../dtos/deposit/deposit-query.dto';
import { ReviewsPopulatedQueryDTO } from '../dtos/review/review-query.dto';
import { TransformerService } from '../transformer/transformer.service';
import { CommunitySubmittedEvent } from '../event/events/communitySubmittedEvent';
import { ModeratorRole } from './communities-moderator.schema';
import { CommunityChangedToPendingApprovalEvent } from '../event/events/communityChangedToPendingApprovalEvent';
import sanitizeHtml from 'sanitize-html';
import { CreateImageDTO } from '../dtos/create-file.dto';
import { defaultSanitizeOptions } from '../template/template.controller';
import { extname } from 'path';
import { FileMetadata } from '../dtos/filemetadata.dto';
import { AwsStorageService } from '../common/aws-storage-service/aws-storage.service';
import { PutObjectCommandInput } from '@aws-sdk/client-s3';
import { SignedUrlDTO } from '../dtos/signedUrl.dto';
import { environment } from '../environments/environment';
import { IsDefined, IsOptional, IsString } from 'class-validator';
import { CommunityDTO } from '../dtos/community/community.dto';
import { CommunityAcceptedEvent } from '../event/events/communtyAcceptedEvent';
import { SessionService } from '../session/session.service';
import { StrictFilterQuery } from '../utils/types';
import { InviteDocument, InviteStatus } from '../invite/invite.schema';
import { InviteService } from '../invite/invite.service';
import { InviteQueryDTO } from '../dtos/invite/invite-query.dto';
import { JwtOrAnonymousGuard } from '../auth/jwt-or-anonymous-guard.service';
import { GeneralNotificationEvent } from '../event/events/GeneralNotificationEvent';
import { PaginationParamsDTO } from '../dtos/pagination-params.dto';
import { CommunityDepositsQueryDTO } from '../dtos/community/community-deposits-query.dto';
import { CommunityReviewsQueryDTO } from '../dtos/community/community-reviews-query.dto';
import { EmailUsersDTO } from '../dtos/community/email-users.dto';

// Defines allowed file extensions for community-related uploads.
const COMMUNITY_ALLOWED_FILE_EXTENSIONS = ['.jpeg', '.jpg', '.png', '.webp'];

/**
 * DTO for confirming the upload of an image to a community.
 * Includes the type of image and associated metadata.
 */
export class CommunityUploadConfirmation {
  /**
   * Defines the type of the image (e.g., logo, banner).
   */
  @IsDefined() @IsString() @ApiProperty() imageType!: string;

  /**
   * Metadata associated with the file, such as name, size, MIME type, etc.
   */
  @IsDefined() @ApiProperty() fileMetadata!: FileMetadata;
}

/**
 * DTO for updating the status of a community.
 */
export class UpdateCommunityStatusDTO {
  /**
   * The new status to set for the community (e.g., active, inactive).
   */
  @IsDefined() @ApiProperty() status!: CommunityStatus;
}

/**
 * DTO for query parameters used when retrieving invites related to a community.
 * Inherits pagination parameters.
 */
export class GetCommunityInvitesQueryParams extends PaginationParamsDTO {
  /**
   * Optional filter by invite status (e.g., pending, accepted).
   */
  @ApiProperty({ required: false, enum: InviteStatus }) @IsOptional() status?: InviteStatus;

  /**
   * Optional search query to further filter invites.
   */
  @ApiProperty({ required: false }) @IsOptional() query?: string;

  /**
   * Optional list of invite IDs to retrieve specific invites.
   */
  @ApiProperty({ required: false }) @IsOptional() inviteIds?: string[];

  /**
   * Optional upper date limit for the invite creation date.
   */
  @ApiProperty({ required: false }) @IsOptional() dateLimit?: Date;

  /**
   * Optional lower date limit for the invite creation date.
   */
  @ApiProperty({ required: false }) @IsOptional() dateStart?: Date;

  /**
   * Optional sorting parameter, 1 for ascending and -1 for descending.
   */
  @ApiProperty({ required: false }) @IsOptional() sort?: 1 | -1;
}

/**
 * DTO for sending emails to multiple members of a community.
 * Contains the message and subject of the email, and a list of recipient emails.
 */
export class SendCommunityEmailsDTO {
  /**
   * The message body of the email
   */
  @IsDefined() @ApiProperty() @IsString() message!: string;

  /**
   * The subject line of the email
   */
  @IsDefined() @ApiProperty() @IsString() subject!: string;

  /**
   * Array of email addresses that will receive the email.
   */
  @IsDefined() @ApiProperty() emails!: string[];
}

/**
 * Controller responsible for handling requests related to community operations.
 * This controller provides functionality to retrieve and manage community-related data.
 *
 * @tags communities
 * @controller communities
 */
@ApiTags('communities')
@Controller('communities')
export class CommunitiesController {
  /**
   * Instantiates a CommunitiesController object.
   * @param {CommunitiesService} communitiesService - Service for community data management.
   * @param {UserService} userService - Service for user data management.
   * @param {DepositService} depositService - Service for deposits data management.
   * @param {SessionService} sessionService - Service for sessions data management.
   * @param {ReviewService} reviewService - Service for manage review.
   * @param {AuthorizationService} authorizationService - Service for handling authorization tasks.
   * @param {EventService} eventService - Service for managing events.
   * @param {TransformerService} transformerService - Service for data transformation tasks.
   * @param {AwsStorageService} storageService - Service for storage events.
   * @param {InviteService} inviteService - Service for invites events.
   */
  constructor(
    private readonly communitiesService: CommunitiesService,
    private readonly userService: UserService,
    private readonly depositService: DepositService,
    private readonly sessionService: SessionService,
    private readonly reviewService: ReviewService,
    private readonly authorizationService: AuthorizationService,
    private readonly eventService: EventService,
    private readonly transformerService: TransformerService,
    private readonly storageService: AwsStorageService,
    private readonly inviteService: InviteService
  ) {}

  /**
   * GET - Retrieves a list of all communities available in the platform. This list is not filtered and includes every community
   * that has been created and stored in the database.
   * The communities are returned as a list of populated DTOs which include detailed information suitable for client-side use.
   *
   * @returns {Promise<CommunityPopulatedDTO[]>} An array of community DTOs, each representing a fully populated community object.
   */
  @ApiOperation({ summary: 'Get all communities' })
  @UseGuards(JwtOrAnonymousGuard)
  @Get('')
  async getCommunities(): Promise<CommunityPopulatedDTO[]> {
    const communities = await this.communitiesService.find({});
    return this.transformerService.transformToDto(communities, CommunityPopulatedDTO, null);
  }

  /**
   * GET - Retrieves a filtered list of invitations for a specific community based on various criteria.
   * This method is protected by JWT authentication and requires the user to have moderation rights over the community.
   *
   * @param {Request} req - The request object, providing context and security information.
   * @param {string} id - The unique identifier of the community for which invitations are being queried.
   * @param {number} [page=1] - The page number for pagination of results (optional).
   * @param {number} [limit=10] - The maximum number of invitations to return per page (optional).
   * @param {InviteStatus} [status] - Filter for the status of invitations (e.g., pending, accepted) (optional).
   * @param {string} [query] - A text query to filter invitations based on relevant text fields (optional).
   * @param {Date} [dateLimit] - An upper limit for the invitation date to filter newer invitations (optional).
   * @param {Date} [dateStart] - A lower limit for the invitation date to filter older invitations (optional).
   * @param {number} [sort=1] - Sort order, 1 for ascending, -1 for descending based on the date limit (optional).
   * @returns {Promise<InviteQueryDTO>} - A DTO containing the filtered list of invitations and count, suitable for pagination.
   */
  @ApiOperation({ summary: 'Returns the community invitations filtered' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id([0-9a-f]{24})/moderate/invitations')
  async getCommunityInvites(
    @Req() req: Request,
    @Param('id') id: string,
    @Query()
    {
      page,
      limit,
      status,
      query,
      inviteIds,
      dateLimit,
      dateStart,
      sort,
    }: GetCommunityInvitesQueryParams
  ): Promise<InviteQueryDTO> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');
    const ability = await this.authorizationService.defineAbilityFor(user);
    this.authorizationService.canDo(ability, COMMUNITY_ACTIONS.moderate, CommunityCLASSNAME);

    const filter: StrictFilterQuery<InviteDocument> = {
      community: id,
    };

    if (query) {
      filter.$text = { $search: query };
    }
    if (status) {
      filter.status = { $eq: status };
    }
    if (inviteIds) {
      filter._id = { $in: inviteIds };
    }

    if (dateLimit || dateStart) {
      filter.dateLimit = {
        ...(dateLimit && { $lt: dateLimit }),
        ...(dateStart && { $gt: dateStart }),
      };
    }

    const count = await this.inviteService.inviteModel.countDocuments(filter);
    const invites = await this.inviteService.findWithLimitExec(
      filter,
      limit,
      page,
      sort ? { dateLimit: sort } : undefined
    );
    return this.transformerService.toDTO({ invites, count }, InviteQueryDTO);
  }

  /**
   * GET - Retrieves all communities associated with the logged-in user, including those where the user
   * is a moderator, has made deposits, or has reviews. It ensures that each community is only
   * listed once even if the user has multiple roles or contributions.
   *
   * @param {Request} req - The request instance containing user authentication info.
   * @returns {Promise<CommunityPopulatedDTO[]>} - A list of community DTOs populated with detailed information, without duplicates.
   */
  @ApiOperation({ summary: 'Get my communities' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('mycommunities')
  async getMyCommunities(@Req() req: Request): Promise<CommunityPopulatedDTO[]> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');
    const moderatorCommunities = await this.communitiesService.getModeratorCommunities(user._id);
    const deposits = await this.depositService.depositModel.find(
      { creator: user._id },
      { community: 1 }
    );
    const depositsCommunity = deposits.map(deposits => deposits.community);
    const reviews = await this.reviewService.reviewModel.find(
      { creator: user._id },
      { community: 1 }
    );
    const reviewsCommunity = reviews.map(reviews => reviews.community);
    const userCommunities = [...depositsCommunity, ...reviewsCommunity, ...moderatorCommunities];
    //To remove duplicated
    const uniqueCommunities = [...new Set(userCommunities)];
    const myCommunities = await this.communitiesService.find({ _id: { $in: uniqueCommunities } });
    return this.transformerService.transformToDto(myCommunities, CommunityPopulatedDTO, user);
  }

  /**
   * GET - Retrieves detailed information about a specific community by its ID. Depending on the user's
   * permissions, different levels of detail might be returned.
   *
   * @param {Request} req - The request instance containing user authentication info.
   * @param {string} id - The unique identifier of the community to retrieve.
   * @returns {Promise<CommunityPopulatedDTO | CommunityPrivateDTO>} - Detailed information about the community either as a public or a private DTO depending on the user's permissions.
   */
  @ApiOperation({ summary: 'Get community by id' })
  @UseGuards(JwtOrAnonymousGuard)
  @Get(':id([0-9a-f]{24})')
  @ApiOkResponse({ schema: { oneOf: refs(CommunityPopulatedDTO, CommunityPrivateDTO) } })
  async getCommunity(
    @Req() req: Request,
    @Param('id') id: string
  ): Promise<CommunityPopulatedDTO | CommunityPrivateDTO> {
    const user = await this.userService.getLoggedUser(req);
    const community = await this.communitiesService.findById(id);
    assertIsDefined(community, 'Community not found');
    const ability = await this.authorizationService.defineAbilityFor(user);

    if (ability.can('update', community)) {
      return this.transformerService.transformToDto(community, CommunityPrivateDTO, user);
    }

    return this.transformerService.transformToDto(community, CommunityPopulatedDTO, user);
  }

  /**
   * POST - Creates a new community with the details provided in the request body. Initially, the community
   * is not publicly visible and is marked as a draft. The creator of the community is automatically
   * assigned as a moderator.
   *
   * @param {Request} req - The request instance containing user authentication info.
   * @param {CommunityCreateDto} newCommunity - The data transfer object containing all required fields to create a new community.
   * @returns {Promise<CommunityPrivateDTO>} - The newly created community with private access details.
   */
  @ApiOperation({ summary: 'Create a new community' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('')
  async createCommunity(
    @Req() req: Request,
    @Body() newCommunity: CommunityCreateDto
  ): Promise<CommunityPrivateDTO> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');
    const ability = await this.authorizationService.defineAbilityFor(user);
    this.authorizationService.canDo(ability, COMMUNITY_ACTIONS.create, CommunityCLASSNAME);
    const query: AnyKeys<Community> = {
      canAuthorInviteReviewers: false,
      conferenceProceedings: [],
      name: newCommunity.name,
      description: `Description of ${newCommunity.name}`,
      creator: user._id.toHexString(),
      status: CommunityStatus.draft,
      country: '',
      subscription: SubscriptionType.free,
      logoURL: 'https://assets.orvium.io/OrviumCommunity/logo.jpg',
      bannerURL: 'https://assets.orvium.io/default-banner.jpeg',
      cardImageUrl: 'https://assets.orvium.io/default-banner.jpeg',
      acknowledgement: '',
      type: CommunityType.community,
      guidelinesURL: '',
      codename: newCommunity.codename,
      views: 0,
      newTracks: [],
      customLicenses: [AccessRight.CCBY],
      privateReviews: false,
      calendarDates: [],
      calendarVisible: false,
      followersCount: 0,
      productsVisible: false,
      showIdentityToAuthor: false,
      showIdentityToEveryone: false,
      showReviewToAuthor: false,
      showReviewToEveryone: false,
    };

    const createdCommunity = await this.communitiesService.create(query);
    await this.communitiesService.addModerator(createdCommunity, user, ModeratorRole.owner);
    const communityWithOwner = await this.communitiesService.findById(createdCommunity._id);
    assertIsDefined(communityWithOwner);
    return this.transformerService.transformToDto(communityWithOwner, CommunityPrivateDTO, user);
  }

  /**
   * PATCH - Submits a community for approval by changing its status to pending approval.
   * This method also triggers notifications to inform relevant users about the status change.
   *
   * @param {Request} req - The HTTP request object that contains the user's authentication token.
   * @param {string} id - The unique identifier of the community to submit for approval.
   * @returns {Promise<CommunityPopulatedDTO>} - A promise that resolves to the updated community details.
   * @throws {BadRequestException} - If the community is not in the Draft status.
   * @throws {UnauthorizedException} - If the user does not have permission to update the community.
   */
  @ApiOperation({ summary: 'Submit a community for approval' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id([0-9a-f]{24})/submit')
  async submitCommunity(
    @Req() req: Request,
    @Param('id') id: string
  ): Promise<CommunityPopulatedDTO> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');

    const community = await this.communitiesService.findById(id);
    assertIsDefined(community, 'Community not found');
    if (community.status !== CommunityStatus.draft) {
      throw new BadRequestException('Community is not in Draft status');
    }

    const ability = await this.authorizationService.defineAbilityFor(user);
    this.authorizationService.canDo(ability, COMMUNITY_ACTIONS.update, community);

    // Notify users about new pending approval community
    const eventCommunitySubmitted = new CommunitySubmittedEvent({
      community: community.toJSON(),
      user: user.toJSON(),
    });
    await this.eventService.create(eventCommunitySubmitted.getEventDTO());
    // Notify admins about new pending approval community
    const eventCommunityChangedToPendingApproval = new CommunityChangedToPendingApprovalEvent({
      community: community.toJSON(),
      user: user.toJSON(),
    });
    await this.eventService.create(eventCommunityChangedToPendingApproval.getEventDTO());

    community.status = CommunityStatus.pendingApproval;
    const createdCommunity = (await community.save()) as CommunityDocumentPopulated;
    return this.transformerService.transformToDto(createdCommunity, CommunityPopulatedDTO, user);
  }

  /**
   * DETELE - Deletes a community permanently if there are no associated deposits or sessions.
   * This action cannot be undone and requires the user to have deletion permissions.
   *
   * @param {Request} req - The HTTP request object containing the user's authentication details.
   * @param {string} id - The unique identifier of the community to delete.
   * @returns {Promise<CommunityPrivateDTO>} - A promise that resolves to the deleted community's details.
   * @throws {ForbiddenException} - If the community has associated deposits or sessions.
   * @throws {NotFoundException} - If the community does not exist.
   */
  @ApiOperation({ summary: 'Delete a community' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id([0-9a-f]{24})')
  async deleteCommunity(
    @Req() req: Request,
    @Param('id') id: string
  ): Promise<CommunityPrivateDTO> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');

    const community = await this.communitiesService.findOneByFilter({ _id: id });
    assertIsDefined(community, 'Community not found');

    const ability = await this.authorizationService.defineAbilityFor(user);
    this.authorizationService.canDo(ability, COMMUNITY_ACTIONS.delete, community);

    // Community will only be deleted if there are no deposits
    const deposits = await this.depositService.find({ community: id });
    if (deposits.length > 0) {
      throw new ForbiddenException('Not allowed to delete communities with publications');
    }

    // Delete moderators and owners
    const communityModerators = await this.communitiesService.findModerators({ community: id });
    for (const communityModerator of communityModerators) {
      await communityModerator.deleteOne();
    }
    await community.deleteOne();
    return this.transformerService.transformToDto(community, CommunityPrivateDTO, user);
  }

  /**
   * PATCH - Updates the details of an existing community based on the provided payload.
   * Sensitive data like API keys are encrypted before updating the community details.
   * @param {Request} req - The HTTP request object containing the user's credentials.
   * @param {CommunityUpdateDto} payload - Data transfer object containing updates to be applied to the community.
   * @param {string} id - The unique identifier of the community to update.
   * @returns {Promise<CommunityPrivateDTO>} - A promise that resolves to the updated community details.
   * @throws {UnauthorizedException} - If the user does not have update permissions or if an attempt is made to delete a track used by other items.
   */
  @ApiOperation({ summary: 'Update a community' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id([0-9a-f]{24})')
  async updateCommunity(
    @Req() req: Request,
    @Body() payload: CommunityUpdateDto,
    @Param('id') id: string
  ): Promise<CommunityPrivateDTO> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');

    const community = await this.communitiesService.findOneByFilter({ _id: id });
    assertIsDefined(community, 'Community not found');

    const ability = await this.authorizationService.defineAbilityFor(user);
    this.authorizationService.canDo(ability, COMMUNITY_ACTIONS.update, community);

    if (payload.datacite?.pass) {
      payload.datacite.pass = encryptJson(payload.datacite.pass);
    }

    if (payload.iThenticateAPIKey) {
      payload.iThenticateAPIKey = encryptJson(payload.iThenticateAPIKey);
    }

    if (payload.crossref?.pass) {
      payload.crossref.pass = encryptJson(payload.crossref.pass);
    }
    if (payload.newTracks) {
      const deletedTracks = community.newTracks.filter(
        ({ timestamp: id1 }) => !payload.newTracks?.some(({ timestamp: id2 }) => id2 === id1)
      );

      for (const track of deletedTracks) {
        const resultDeposit = await this.depositService.find({
          community: community._id,
          newTrackTimestamp: track.timestamp,
        });

        const resultSession = await this.sessionService.find({
          community: community._id,
          newTrackTimestamp: track.timestamp,
        });

        if (resultDeposit.length > 0) {
          throw new UnauthorizedException(
            `Error updating tracks. Track "${track.title}" cannot be deleted because is used in publications`
          );
        }
        if (resultSession.length > 0) {
          throw new UnauthorizedException(
            `Error updating tracks. Track "${track.title}" cannot be deleted because is used in sessions`
          );
        }
      }
    }

    if (payload.acknowledgement) {
      payload.acknowledgement = sanitizeHtml(payload.acknowledgement, defaultSanitizeOptions);
    }

    Object.assign(community, payload);
    const updatedCommunity = await community.save();
    return this.transformerService.transformToDto(updatedCommunity, CommunityPrivateDTO, user);
  }

  /**
   * PATCH - Updates the status of a specific community. This operation requires admin privileges.
   *
   * @param {Request} req - The HTTP request object, containing the user's authentication token.
   * @param {UpdateCommunityStatusDTO} payload - Data transfer object containing the new status for the community.
   * @param {string} id - The unique identifier of the community whose status is to be updated.
   * @returns {Promise<CommunityPrivateDTO>} - A promise that resolves to the updated community details.
   * @throws {UnauthorizedException} - If the user performing the update is not an admin.
   */
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id([0-9a-f]{24})/status')
  @ApiOperation({ summary: 'Update community status' })
  async updateCommunityStatus(
    @Req() req: Request,
    @Body() payload: UpdateCommunityStatusDTO,
    @Param('id') id: string
  ): Promise<CommunityPrivateDTO> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');

    const community = await this.communitiesService.findOneByFilter({ _id: id });
    assertIsDefined(community, 'Community not found');

    if (!user.roles.includes('admin')) {
      throw new UnauthorizedException('You do not have permission to change the status');
    }

    community.status = payload.status;
    const updatedCommunity = await community.save();
    return this.transformerService.transformToDto(updatedCommunity, CommunityPrivateDTO, user);
  }

  /**
   * GET - Retrieves all the deposits within a community that are moderated by the user.
   * This includes filtering options for pagination and sorting.
   *
   * @param {Request} req - The HTTP request object.
   * @param {string} communityId - The ID of the community to fetch deposits from.
   * @param {CommunityDepositsQueryDTO} queryParams - Various options to filter and sort the deposits query.
   * @returns {Promise<DepositsQueryDTO>} - A promise that resolves to a structured data containing deposits and their count.
   */
  @ApiOperation({ summary: 'Get all deposits in a community' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id([0-9a-f]{24})/moderate/deposits')
  async getModeratorDeposits(
    @Req() req: Request,
    @Param('id') communityId: string,
    @Query()
    {
      query,
      moderator,
      newTrackTimestamp,
      status,
      acceptedFor,
      page = 0,
      limit = 10,
      sort,
      ids,
    }: CommunityDepositsQueryDTO
  ): Promise<DepositsQueryDTO> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');

    const community = await this.communitiesService.findById(communityId);
    assertIsDefined(community, 'Community not found');

    const ability = await this.authorizationService.defineAbilityFor(user);
    this.authorizationService.canDo(ability, COMMUNITY_ACTIONS.moderate, community);

    const filter = this.setDepositFilter(communityId, {
      query,
      moderator,
      newTrackTimestamp,
      status,
      acceptedFor,
      ids,
    });

    let sortBy: string | Record<string, SortOrder> = { submissionDate: -1 };
    if (sort === 'popular') {
      sortBy = { views: -1 };
    }

    const count = await this.depositService.depositModel.countDocuments(filter);
    const deposits = await this.depositService.findWithLimitExec(
      filter,
      page * limit,
      limit,
      sortBy
    );
    return this.transformerService.toDTO({ deposits, count }, DepositsQueryDTO);
  }

  /**
   * GET - Fetches all reviews associated with a community, subject to various filters such as review kind and status.
   * @param {Request} req - The HTTP request object.
   * @param {string} communityId - The ID of the community to fetch reviews from.
   * @param {CommunityReviewsQueryDTO} queryParams - Filtering and pagination options for the reviews.
   * @returns {Promise<ReviewsPopulatedQueryDTO>} - A promise that resolves to a list of reviews and total count, according to the filters applied.
   */
  @ApiOperation({ summary: 'Get all reviews in a community' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id([0-9a-f]{24})/moderate/reviews')
  @ApiQuery({ name: 'page', type: 'number', required: false })
  @ApiQuery({ name: 'limit', type: 'number', required: false })
  @ApiQuery({ name: 'query', required: false })
  @ApiQuery({ name: 'reviewKind', required: false })
  @ApiQuery({ name: 'reviewStatus', required: false })
  @ApiQuery({ name: 'newTrackTimestamp', required: false })
  async getModeratorReviews(
    @Req() req: Request,
    @Param('id') communityId: string,
    @Query()
    {
      query,
      reviewKind,
      newTrackTimestamp,
      reviewStatus,
      ids,
      page = 0,
      limit = 10,
    }: CommunityReviewsQueryDTO
  ): Promise<ReviewsPopulatedQueryDTO> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');

    const community = await this.communitiesService.findById(communityId);
    assertIsDefined(community, 'Community not found');
    const ability = await this.authorizationService.defineAbilityFor(user);
    this.authorizationService.canDo(ability, COMMUNITY_ACTIONS.moderate, community);

    const reviewsFilter = await this.setReviewFilter(community._id, {
      query,
      reviewKind,
      newTrackTimestamp,
      reviewStatus,
      ids: ids,
    });

    const count = await this.reviewService.reviewModel.countDocuments(reviewsFilter);
    const reviews = await this.reviewService.findWithLimit(
      reviewsFilter,
      { creationDate: -1 },
      limit,
      page
    );

    return this.transformerService.toDTO({ reviews, count }, ReviewsPopulatedQueryDTO);
  }

  /**
   * PATCH - Updates the information of a moderator within a community.
   * Only users with appropriate permissions can perform this operation.
   *
   * @param {Request} req - The HTTP request object.
   * @param {ModeratorUpdateDTO} payload - Data transfer object containing the updated data for the moderator.
   * @param {string} communityId - The community ID where the moderator resides.
   * @param {string} moderatorId - The ID of the moderator to update.
   * @returns {Promise<CommunityModeratorDTO>} - A promise that resolves to the updated moderator's information.
   */
  @ApiOperation({ summary: 'Update moderator information' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':communityId/moderator/:userObjectId')
  async updateModerator(
    @Req() req: Request,
    @Body() payload: ModeratorUpdateDTO,
    @Param('communityId') communityId: string,
    @Param('userObjectId') moderatorId: string
  ): Promise<CommunityModeratorDTO> {
    const user = await this.userService.getLoggedUser(req);
    const community = await this.communitiesService.findOneByFilter({ _id: communityId });
    const moderator = await this.communitiesService.findModeratorById(moderatorId);

    assertIsDefined(community, 'Community not found');

    assertIsDefined(moderator, 'Moderator not found');

    const ability = await this.authorizationService.defineAbilityFor(user);

    this.authorizationService.canDo(ability, COMMUNITY_ACTIONS.update, community);

    Object.assign(moderator, payload);
    const moderatorSaved = await moderator.save();
    return this.transformerService.toDTO(moderatorSaved, CommunityModeratorDTO);
  }

  /**
   * POST - Adds a new moderator to a specified community. This operation checks if the user already exists as a moderator
   * to avoid duplicates and requires user to have update permissions on the community.
   *
   * @param {Request} req - The HTTP request object containing the user's authentication context.
   * @param {UpdateUserRoleDTO} payload - Data transfer object containing the email and role of the new moderator.
   * @param {string} communityId - The unique identifier for the community.
   * @returns {Promise<CommunityPrivateDTO>} - A promise that resolves to the updated community details.
   * @throws {UnauthorizedException} If the user is already a moderator or if the operation is unauthorized.
   */
  @ApiOperation({ summary: 'Add a new moderator to a community' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id([0-9a-f]{24})/moderator')
  async addModerator(
    @Req() req: Request,
    @Body() payload: UpdateUserRoleDTO,
    @Param('id') communityId: string
  ): Promise<CommunityPrivateDTO> {
    const user = await this.userService.getLoggedUser(req);
    const community = await this.communitiesService.findById(communityId);
    assertIsDefined(community, 'Community not found');

    const ability = await this.authorizationService.defineAbilityFor(user);
    this.authorizationService.canDo(ability, COMMUNITY_ACTIONS.update, community);

    const newModerator = await this.userService.findOne({ email: payload.email });

    assertIsDefined(newModerator, 'User not found');
    const existingModerator = await this.communitiesService.existsModerator({
      community: community._id,
      user: newModerator._id,
    });
    if (existingModerator) {
      throw new UnauthorizedException('User already assigned');
    }

    await this.communitiesService.addModerator(community, newModerator, payload.role);
    await this.userService.addCommunity(newModerator, community);
    const event = new ModeratorAddedToCommunityEvent({
      user: newModerator.toJSON(),
      community: community.toJSON(),
    });
    await this.eventService.create(event.getEventDTO());

    const communityUpdated = await this.communitiesService.findById(communityId);
    assertIsDefined(communityUpdated);

    return this.transformerService.transformToDto(communityUpdated, CommunityPrivateDTO, user);
  }

  /**
   * DELETE - Deletes a moderator from a community. This method ensures that the operation does not remove the last moderator and
   * checks that the requesting user has the necessary permissions.
   *
   * @param {Request} req - The HTTP request object containing the user's authentication context.
   * @param {string} communityId - The unique identifier of the community.
   * @param {string} userObjectId - The unique identifier of the user to remove as a moderator.
   * @returns {Promise<CommunityPrivateDTO>} - A promise that resolves to the community details after update.
   * @throws {NotFoundException} If the specified user or community does not exist.
   */
  @ApiOperation({ summary: 'Delete a community' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':communityId/moderator/:id([0-9a-f]{24})')
  async deleteModerator(
    @Req() req: Request,
    @Param('communityId') communityId: string,
    @Param('id') userObjectId: string
  ): Promise<CommunityPrivateDTO> {
    const owner = await this.userService.getLoggedUser(req);
    const community = await this.communitiesService.findOneByFilter({ _id: communityId });
    const user = await this.userService.findById(userObjectId);

    assertIsDefined(community, 'Community not found');

    assertIsDefined(user, 'User not found');

    const ability = await this.authorizationService.defineAbilityFor(owner);
    this.authorizationService.canDo(ability, COMMUNITY_ACTIONS.update, community);

    await this.communitiesService.deleteModerator(community, user);

    const communityUpdated = await this.communitiesService.findById(communityId);
    assertIsDefined(communityUpdated);

    return this.transformerService.transformToDto(communityUpdated, CommunityPrivateDTO, user);
  }

  /**
   * POST - Uploads custom images to a community's gallery or media storage.
   * This method checks for file type validity and handles the storage using AWS S3 services.
   *
   * @param {Request} req - The HTTP request object containing user's authentication context.
   * @param {string} id - The community ID to which the image is being uploaded.
   * @param {CreateImageDTO} payload - Data transfer object containing the image file and metadata.
   * @returns {Promise<SignedUrlDTO>} - A promise that resolves to the signed URL for the uploaded image.
   * @throws {UnauthorizedException} If the file extension is not allowed.
   */
  @ApiOperation({ summary: 'Upload images to a community' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id([0-9a-f]{24})/images')
  async uploadImages(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() payload: CreateImageDTO
  ): Promise<SignedUrlDTO> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');

    const community = await this.communitiesService.findById(id);
    assertIsDefined(community, 'Community not found');

    const ability = await this.authorizationService.defineAbilityFor(user);
    this.authorizationService.canDo(ability, COMMUNITY_ACTIONS.update, community);

    const file = payload.file;

    const fileExtension = extname(file.name).toLowerCase();

    if (!COMMUNITY_ALLOWED_FILE_EXTENSIONS.includes(fileExtension)) {
      throw new UnauthorizedException('Invalid extension file');
    }
    const tags: string[] = [];
    tags.push('Community');

    const fileMetadata: FileMetadata = {
      filename: `${payload.communityImage}${fileExtension}`,
      description: file.name,
      contentType: file.type,
      contentLength: file.size,
      tags: tags,
    };

    const objectKey = `communities/${community._id.toHexString()}/media/${fileMetadata.filename}`;

    const params: PutObjectCommandInput = {
      Key: objectKey,
      ContentType: fileMetadata.contentType,
      Bucket: this.storageService.publicBucket,
    };

    const signedUrl = await this.storageService.getSignedUrl('putObject', params);

    await community.save();

    return { signedUrl, fileMetadata, isMainFile: false, replacePDF: false };
  }

  /**
   * PATCH - Confirms the upload of a community image after checking the file type and
   * updating the community's image URL based on the type. This method updates the
   * image URLs for logos, banners, or cards based on the provided image type.
   *
   * @param {Request} req - The HTTP request object, providing user and authentication context.
   * @param {string} id - The identifier for the community where the image is being uploaded.
   * @param {CommunityUploadConfirmation} payload - The payload containing the file metadata and image type.
   * @returns {Promise<CommunityDTO>} - Returns the updated community data transfer object.
   * @throws {UnauthorizedException} - Throws if the file extension is not supported.
   * @throws {BadRequestException} - Throws if the image type is unknown.
   */
  @ApiOperation({ summary: 'Confirm community image upload' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id([0-9a-f]{24})/confirm/images')
  async uploadImagesConfirmation(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() payload: CommunityUploadConfirmation
  ): Promise<CommunityDTO> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');

    const community = await this.communitiesService.findById(id);
    assertIsDefined(community, 'Community not found');

    const ability = await this.authorizationService.defineAbilityFor(user);
    this.authorizationService.canDo(ability, COMMUNITY_ACTIONS.update, community);

    const fileExtension = extname(payload.fileMetadata.filename).toLowerCase();

    if (!COMMUNITY_ALLOWED_FILE_EXTENSIONS.includes(fileExtension)) {
      throw new UnauthorizedException('Invalid extension file');
    }

    const objectKey = `communities/${community._id.toHexString()}/media/${
      payload.imageType
    }${fileExtension}`;
    await this.storageService.headObject({
      objectKey: objectKey,
      bucket: this.storageService.publicBucket,
    });
    const imageUrl = `${environment.aws.endpoint}/${this.storageService.publicBucket}/${objectKey}`;

    switch (payload.imageType) {
      case 'logo':
        community.logoURL = imageUrl;
        break;
      case 'banner':
        community.bannerURL = imageUrl;
        break;
      case 'card':
        community.cardImageUrl = imageUrl;
        break;
      default:
        throw new BadRequestException('Unknown image type');
    }

    const updatedCommunity = await community.save();
    return this.transformerService.transformToDto(updatedCommunity, CommunityDTO, user);
  }

  /**
   * GET - Retrieves all communities that are currently pending approval.
   * This method is typically used by administrators to manage community approvals.
   *
   * @param {Request} req - The HTTP request object, providing user and authentication context.
   * @returns {Promise<CommunityPopulatedDTO[]>} - A promise that resolves to an array of populated community DTOs that are pending approval.
   * @throws {UnauthorizedException} - Throws if the user is not an admin.
   */
  @ApiOperation({ summary: 'Get communities pending approval' })
  @UseGuards(AuthGuard(['jwt']))
  @Get('pending-approval')
  async getCommunitiesPendingApproval(@Req() req: Request): Promise<CommunityPopulatedDTO[]> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');
    if (!user.roles.includes('admin')) {
      throw new UnauthorizedException();
    }

    const communities = await this.communitiesService.find({ status: 'pending approval' });

    return this.transformerService.transformToDto(communities, CommunityPopulatedDTO, user);
  }

  /**
   * PATCH - Changes the status of a community to 'published' if it is currently in 'pending approval' status.
   * This method also creates a related event for the change.
   *
   * @param {Request} req - The HTTP request object.
   * @param {string} id - The community ID that is being accepted.
   * @returns {Promise<CommunityPopulatedDTO>} - Returns the updated community data as a populated DTO.
   * @throws {UnauthorizedException} - Throws if the user does not have admin rights.
   * @throws {ForbiddenException} - Throws if the community is not in the correct status to be accepted.
   */
  @ApiOperation({ summary: 'Accept a community' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id([0-9a-f]{24})/accept')
  async acceptCommunity(
    @Req() req: Request,
    @Param('id') id: string
  ): Promise<CommunityPopulatedDTO> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');
    if (!user.roles.includes('admin')) {
      throw new UnauthorizedException('Only admins can perform this operation');
    }
    const community = await this.communitiesService.findOneByFilter({ _id: id });

    assertIsDefined(community, 'Community not found');

    if (community.status !== CommunityStatus.pendingApproval) {
      throw new ForbiddenException('Community is not in pending approval');
    }

    const event = new CommunityAcceptedEvent({
      user: user.toJSON(),
      community: community.toJSON(),
    });

    await this.eventService.create(event.getEventDTO());
    community.status = CommunityStatus.published;
    await community.save();
    return this.transformerService.transformToDto(community, CommunityPopulatedDTO, user);
  }

  /**
   * GET - Fetches deposits within a community that have no associated invitations,
   * which might be required for audits or compliance checks.
   *
   * @param {Request} req - The HTTP request object.
   * @param {string} communityId - The identifier of the community to check.
   * @returns {Promise<string[]>} - A promise that resolves to an array of deposit IDs without invitations.
   */
  @ApiOperation({ summary: 'Return deposits without invitations' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id([0-9a-f]{24})/moderate/no-invitations')
  async getCommunityDepositsWithoutInvites(
    @Req() req: Request,
    @Param('id') communityId: string
  ): Promise<string[]> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');
    const ability = await this.authorizationService.defineAbilityFor(user);
    this.authorizationService.canDo(ability, COMMUNITY_ACTIONS.moderate, CommunityCLASSNAME);

    const depositsWithoutInvitationsIds = await this.depositService.depositModel
      .aggregate<DepositDocument>()
      .match({
        community: new Types.ObjectId(communityId),
        status: { $in: [DepositStatus.pendingApproval, DepositStatus.preprint] },
      })
      .lookup({
        from: 'invite',
        localField: '_id',
        foreignField: 'data.depositId',
        as: 'count',
      })
      .match({
        count: { $size: 0 },
      })
      .project({ _id: 1 })
      .exec();

    return depositsWithoutInvitationsIds.map(deposit => deposit._id.toHexString());
  }

  /**
   * GET - Exports data about submissions in a community to a CSV file for reporting or analysis purposes.
   *
   * @param {Request} req - The HTTP request object.
   * @param {Response} res - The HTTP response object used to send the CSV file to the client.
   * @param {string} communityId - The community ID from which to export submissions.
   * @returns {Promise<void>}
   */
  @ApiOperation({ summary: 'Exports submissions to csv' })
  @ApiProduces('text/plain')
  @ApiResponse({ schema: { type: 'string' } })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Header('Content-Type', 'text/plain')
  @Get(':id([0-9a-f]{24})/moderate/submissions/export')
  async exportSubmissions(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') communityId: string
  ): Promise<void> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');
    const ability = await this.authorizationService.defineAbilityFor(user);
    this.authorizationService.canDo(ability, COMMUNITY_ACTIONS.moderate, CommunityCLASSNAME);

    const csv = await this.communitiesService.exportSubmisionsToCsv(communityId);
    res.attachment(`${communityId}_${new Date().toISOString()}.csv`);
    res.send(csv);
  }

  /**
   * Sends an email to multiple users within a community. This method is typically used for notifications or updates.
   *
   * @param {Request} req - The HTTP request object.
   * @param {SendCommunityEmailsDTO} payload - The data transfer object containing the message, subject, and recipient emails.
   * @param {string} communityId - The community ID within which the users reside.
   * @returns {Promise<void>}
   */
  @ApiOperation({ summary: 'Send email to users' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard(['jwt']))
  @Post(':id([0-9a-f]{24})/send-emails')
  async sendEmailToUsers(
    @Req() req: Request,
    @Body() payload: SendCommunityEmailsDTO,
    @Param('id') communityId: string
  ): Promise<void> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');
    const community = await this.communitiesService.findById(communityId);
    assertIsDefined(community, 'Community not found');
    const ability = await this.authorizationService.defineAbilityFor(user);
    this.authorizationService.canDo(ability, COMMUNITY_ACTIONS.moderate, community);

    const eventGeneralNotification = new GeneralNotificationEvent({
      community: community.toJSON(),
      subject: payload.subject,
      message: payload.message,
      recipients: payload.emails,
      sender: user.toJSON(),
    });
    await this.eventService.create(eventGeneralNotification.getEventDTO());
  }

  /**
   * GET - Retrieves emails of all users who created deposits within the specified community.
   * Useful for community managers to contact deposit creators directly.
   *
   * @param {Request} req - The HTTP request object, providing user and authentication context.
   * @param {string} id - The identifier for the community.
   * @param {CommunityDepositsQueryDTO} queryParams - Filtering options for finding deposits which include moderator info, status, timestamps, etc.
   * @returns {Promise<EmailUsersDTO[]>} - A promise that resolves to an array of user email DTOs.
   * @throws {UnauthorizedException} - If the user does not have the necessary permissions to view this data.
   */
  @ApiOperation({ summary: 'Get all deposits creators emails in a community' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id([0-9a-f]{24})/moderate/deposits/emails')
  async getModeratorDepositsEmails(
    @Req() req: Request,
    @Param('id') id: string,
    @Query()
    { query, moderator, newTrackTimestamp, status, acceptedFor, ids }: CommunityDepositsQueryDTO
  ): Promise<EmailUsersDTO[]> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');

    const community = await this.communitiesService.findById(id);
    assertIsDefined(community, 'Community not found');

    const ability = await this.authorizationService.defineAbilityFor(user);
    this.authorizationService.canDo(ability, COMMUNITY_ACTIONS.moderate, community);

    const filter = this.setDepositFilter(id, {
      query,
      moderator,
      newTrackTimestamp,
      status,
      acceptedFor,
      ids,
    });

    const deposits = await this.depositService.depositModel
      .find(filter, 'creator')
      .populate<{
        ownerProfile: {
          email: string;
          firstName: string;
          lastName: string;
          avatar: string;
          gravatar: string;
        };
      }>({
        path: 'ownerProfile',
        select: 'email firstName lastName avatar gravatar',
      })
      .lean();
    const usersInfo = new Set<EmailUsersDTO>();
    deposits.forEach(deposit => usersInfo.add(deposit.ownerProfile));
    return this.transformerService.toDTO(Array.from(usersInfo), EmailUsersDTO);
  }

  /**
   * GET - Fetches emails of all users who have created reviews within the specified community.
   * This is particularly useful for community managers or moderators who need to contact review creators.
   *
   * @param {Request} req - The HTTP request object.
   * @param {string} id - The community ID to query within.
   * @param {CommunityReviewsQueryDTO} queryParams - Filters to apply on the review search, such as review kind, status, etc.
   * @returns {Promise<EmailUsersDTO[]>} - A promise that resolves to an array of user email DTOs.
   * @throws {UnauthorizedException} - If the user does not have the necessary permissions to perform this operation.
   */
  @ApiOperation({ summary: 'Get all reviews creator emails in a community' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id([0-9a-f]{24})/moderate/reviews/emails')
  async getModeratorReviewsEmails(
    @Req() req: Request,
    @Param('id') id: string,
    @Query()
    { query, reviewKind, newTrackTimestamp, reviewStatus, ids }: CommunityReviewsQueryDTO
  ): Promise<EmailUsersDTO[]> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');

    const community = await this.communitiesService.findById(id);
    assertIsDefined(community, 'Community not found');
    const ability = await this.authorizationService.defineAbilityFor(user);
    this.authorizationService.canDo(ability, COMMUNITY_ACTIONS.moderate, community);

    const reviewsFilter = await this.setReviewFilter(community._id, {
      query,
      reviewKind,
      newTrackTimestamp,
      reviewStatus,
      ids,
    });

    const reviews = await this.reviewService.reviewModel
      .find(reviewsFilter, 'creator')
      .populate<{
        ownerProfile: {
          email: string;
          firstName: string;
          lastName: string;
          avatar: string;
          gravatar: string;
        };
      }>({
        path: 'ownerProfile',
        select: 'email firstName lastName avatar gravatar',
      })
      .lean();

    const usersInfo = new Set<EmailUsersDTO>();
    reviews.forEach(review => usersInfo.add(review.ownerProfile));
    return this.transformerService.toDTO(Array.from(usersInfo), EmailUsersDTO);
  }

  /**
   * Constructs a filter for querying deposits based on various parameters such as query string, status, timestamps, etc.
   * @param {string} communityId - The community ID to which the deposits belong.
   * @param {CommunityDepositsQueryDTO} params - Parameters used for creating the filter.
   * @returns {StrictFilterQuery<DepositDocument>} - The constructed filter object for MongoDB queries.
   */
  setDepositFilter(
    communityId: string,
    params: CommunityDepositsQueryDTO
  ): StrictFilterQuery<DepositDocument> {
    const filter: StrictFilterQuery<DepositDocument> = {
      $or: [
        {
          community: communityId,
          status: {
            $in: [
              DepositStatus.pendingApproval,
              DepositStatus.preprint,
              DepositStatus.published,
              DepositStatus.merged,
              DepositStatus.rejected,
            ],
          },
        },
        {
          community: communityId,
          status: DepositStatus.draft,
          submissionDate: { $exists: true },
        },
      ],
    };

    if (params.query) {
      filter.$text = { $search: params.query };
    }
    if (params.newTrackTimestamp) {
      filter.newTrackTimestamp = { $eq: params.newTrackTimestamp };
    }
    if (params.status) {
      filter.status = { $eq: params.status };
    }

    if (params.moderator) {
      filter.assignee = { $eq: params.moderator };
    }

    if (params.acceptedFor) {
      filter.acceptedFor = { $eq: params.acceptedFor };
    }

    if (params.ids) {
      filter._id = { $in: params.ids };
    }

    return filter;
  }

  /**
   * Creates a filter for MongoDB queries to find reviews based on multiple criteria like review kind, status, related deposits, etc.
   * @param {Types.ObjectId} communityId - The ObjectId of the community.
   * @param {CommunityReviewsQueryDTO} params - DTO containing filtering criteria for reviews.
   * @returns {Promise<StrictFilterQuery<ReviewDocument>>} - A promise that resolves to a MongoDB filter object.
   */
  async setReviewFilter(
    communityId: Types.ObjectId,
    params: CommunityReviewsQueryDTO
  ): Promise<StrictFilterQuery<ReviewDocument>> {
    const reviewsFilter: StrictFilterQuery<ReviewDocument> = {
      status: { $in: [ReviewStatus.pendingApproval, ReviewStatus.published, ReviewStatus.draft] },
      community: communityId,
    };

    if (params.query || params.newTrackTimestamp) {
      const depositsFilter: StrictFilterQuery<DepositDocument> = {
        community: communityId,
      };

      if (params.query) {
        depositsFilter.$text = { $search: params.query };
      }
      if (params.newTrackTimestamp) {
        depositsFilter.newTrackTimestamp = { $eq: params.newTrackTimestamp };
      }
      const deposits = await this.depositService.find(depositsFilter);
      const depositIds = deposits.map(deposit => deposit._id);
      reviewsFilter.deposit = { $in: depositIds };
    }

    if (params.reviewKind) {
      reviewsFilter.kind = { $eq: params.reviewKind };
    }
    if (params.reviewStatus) {
      reviewsFilter.status = { $eq: params.reviewStatus };
    }

    if (params.ids) {
      reviewsFilter._id = { $in: params.ids };
    }

    return reviewsFilter;
  }
}
