import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { InvitePopulatedDocument, InviteService } from './invite.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserService } from '../users/user.service';
import { Invite, InviteDocument, InviteStatus, InviteType } from './invite.schema';
import { DepositService } from '../deposit/deposit.service';
import { EventService } from '../event/event.service';
import { Request } from 'express';
import { InviteDTO } from '../dtos/invite/invite.dto';
import { InviteUpdateDTO } from '../dtos/invite/invite-update.dto';
import {
  AuthorizationService,
  DEPOSIT_ACTIONS,
  INVITE_ACTIONS,
} from '../authorization/authorization.service';
import { assertIsDefined, decryptJson } from '../utils/utils';
import { ReviewInvitationAcceptedEvent } from '../event/events/reviewInvitationAcceptedEvent';
import { ReviewInvitationEmailEvent } from '../event/events/reviewInvitationEmailEvent';
import { CreateInviteDTO } from '../dtos/invite/invite-create.dto';
import { TransformerService } from '../transformer/transformer.service';
import { TemplateService } from '../template/template.service';
import { ReviewInvitationRejectedEvent } from '../event/events/reviewInvitationRejectedEvent';
import { ReviewInvitationAcceptedConfirmationEvent } from '../event/events/reviewInvitationAcceptedConfirmationEvent';
import {
  ApiBearerAuth,
  ApiExcludeEndpoint,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import { ReviewHtmlPreviewDTO } from '../dtos/reviewHtmlPreview.dto';
import { AnyKeys, Require_id, Types } from 'mongoose';
import { InviteQueryDTO } from '../dtos/invite/invite-query.dto';
import { StrictFilterQuery } from '../utils/types';
import { PaginationParamsDTO } from '../dtos/pagination-params.dto';
import { IsOptional } from 'class-validator';
import { InvitePopulatedDTO } from '../dtos/invite/invite-populated.dto';

class MyInvitesQueryParams extends PaginationParamsDTO {
  @ApiProperty({ required: false, enum: InviteStatus }) @IsOptional() status?: InviteStatus;
}

/**
 * Controller for handling operations with invitations in the application.
 *
 * @tags Invitations
 * @controller invites
 */
@ApiTags('Invitations')
@Controller('invites')
export class InviteController {
  /**
   * Instantiates a DepositController object.
   *
   * @param {InviteService} inviteService - Service for invitations data management.
   * @param {UserService} userService - Service for user data management.
   * @param {DepositService} depositService - Service for deposits data management.
   * @param {EventService} eventService - Service for managing events.
   * @param {AuthorizationService} authorizationService - Service for handling authorization tasks.
   * @param {TransformerService} transformerService - Service for data transformation tasks.
   * @param {TemplateService} templateService - Service for platform templates data management.
   */
  constructor(
    private readonly inviteService: InviteService,
    private readonly userService: UserService,
    private readonly depositService: DepositService,
    private readonly eventService: EventService,
    private readonly authorizationService: AuthorizationService,
    private readonly transformerService: TransformerService,
    private readonly templateService: TemplateService
  ) {}

  /**
   * POST - Sends an invitation to a user to review (peer-review or copy editing) a deposit based on the
   * provided data in the request. It checks if the sender has the required permissions to invite
   * reviewers and whether a valid invitation already exists to prevent duplicate pending
   * or accepted invitations.
   *
   * @param {Request} req - The HTTP request object that contains the user session and authentication info.
   * @param {InviteDTO} newInvite - Data transfer object containing all the information needed to create an invitation.
   * @returns {InviteDTO} - Returns the newly created invitation data transfer object if the invitation is successfully created.
   * @throws {UnauthorizedException} - Thrown if the user does not have permission to invite reviewers.
   * @throws {ForbiddenException} - Thrown if an invitation already exists for the user to review the same deposit.
   * @throws {NotFoundException} - Thrown if either the user or the deposit does not exist.
   */
  @ApiOperation({ summary: 'Create invitation' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('')
  async createInvite(@Req() req: Request, @Body() newInvite: CreateInviteDTO): Promise<InviteDTO> {
    const userSender = await this.userService.getLoggedUser(req);
    assertIsDefined(userSender, 'User not found');

    const deposit = await this.depositService.findById(newInvite.data.depositId);
    assertIsDefined(deposit, 'Deposit not found');

    const ability = await this.authorizationService.defineAbilityFor(userSender);
    this.authorizationService.canDo(ability, DEPOSIT_ACTIONS.inviteReviewers, deposit);

    const query: AnyKeys<Invite> = {
      inviteType: newInvite.inviteType,
      sender: userSender._id,
      addressee: newInvite.addressee,
      community: deposit.community,
      data: {
        depositId: deposit._id,
        depositTitle: deposit.title,
      },
      status: InviteStatus.pending,
      createdOn: new Date(),
      dateLimit: newInvite.data.dateLimit,
      message: newInvite.data.message,
    };
    // Check if a valid invitation already exists
    const inviteExists = await this.inviteService.exists({
      addressee: newInvite.addressee,
      'data.depositId': deposit._id,
      inviteType: newInvite.inviteType,
      status: { $in: [InviteStatus.pending, InviteStatus.accepted] },
    });
    if (inviteExists) {
      throw new ForbiddenException(
        'Another invitation to same user has been accepted or is pending'
      );
    }

    this.authorizationService.canDo(ability, DEPOSIT_ACTIONS.inviteReviewers, deposit);

    const invitation = await this.inviteService.create(query);

    const event = new ReviewInvitationEmailEvent({
      sender: userSender.toJSON(),
      deposit: deposit.toJSON(),
      destinationEmail: newInvite.addressee,
      invite: invitation.toJSON(),
      community: deposit.communityPopulated.toJSON(),
      destinationName: newInvite.data.reviewerName,
      dateLimit: newInvite.data.dateLimit,
    });

    await this.eventService.create(event.getEventDTO());
    deposit.history.push(event.getHistoryTemplate());
    deposit.markModified('history');
    await deposit.save();
    return this.transformerService.transformToDto(invitation, InviteDTO, userSender);
  }

  /**
   * POST - Generates a preview of the invitation email that would be sent for reviewing a deposit. This method
   * constructs a temporary invite object and uses it to generate an HTML email template. It does not
   * send the email but returns the generated HTML for preview purposes.
   *
   *
   * @param {Request} req - The HTTP request object, containing the user's authentication data.
   * @param {CreateInviteDTO} newInvite - The data transfer object containing information needed to create the invitation.
   * @returns {ReviewHtmlPreviewDTO} - Returns an object containing the HTML content of the invite email.
   * @throws {NotFoundException} - Thrown if no user or deposit matching the provided identifiers are found.
   * @throws {UnauthorizedException} - Thrown if the user does not have permission to send review invitations for the deposit.
   */
  @UseGuards(JwtAuthGuard)
  @Post('invitePreview')
  async postInvitePreview(
    @Req() req: Request,
    @Body() newInvite: CreateInviteDTO
  ): Promise<ReviewHtmlPreviewDTO> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');

    const deposit = await this.depositService.findById(newInvite.data.depositId);
    assertIsDefined(deposit, 'Deposit not found');
    const ability = await this.authorizationService.defineAbilityFor(user);
    this.authorizationService.canDo(ability, DEPOSIT_ACTIONS.inviteReviewers, deposit);
    assertIsDefined(user.email, 'email not defined');

    const invite: Require_id<Invite> = {
      _id: new Types.ObjectId(),
      createdOn: new Date(),
      inviteType: newInvite.inviteType,
      status: InviteStatus.pending,
      sender: user._id,
      addressee: newInvite.addressee,
      community: deposit.community,
      data: {
        depositId: deposit._id,
        depositTitle: deposit.title,
      },
      message: newInvite.data.message,
    };

    const event = new ReviewInvitationEmailEvent({
      sender: user.toJSON(),
      deposit: deposit.toJSON(),
      destinationEmail: user.email,
      community: deposit.communityPopulated.toJSON(),
      destinationName: newInvite.data.reviewerName,
      invite: invite,
    });

    const emailTemplate = await this.templateService.getHTMLFromEvent(event);

    return { html: emailTemplate };
  }

  /**
   * GET - Retrieves a list of invitations related to a specific deposit. This method is used to fetch all review and copy editing
   * invitations that have been sent for a particular deposit. It ensures that the user requesting the information has the
   * appropriate permissions to view these invitations.
   *
   * @param {Request} req - The HTTP request object that includes user authentication.
   * @param {string} depositId - The unique identifier of the deposit for which invitations are being retrieved.
   * @returns {Promise<InvitePopulatedDTO[]>} - A promise that resolves to an array of populated invitation data transfer objects.
   * @throws {NotFoundException} - Indicates that the deposit could not be found or the user's identity could not be verified.
   * @throws {UnauthorizedException} - Thrown if the user lacks permission to view the invitations.
   */
  @ApiOperation({ summary: 'List invitations' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('')
  async getDepositInvites(
    @Req() req: Request,
    @Query('depositId') depositId: string
  ): Promise<InvitePopulatedDTO[]> {
    const deposit = await this.depositService.findById(depositId);
    assertIsDefined(deposit, 'Deposit not found');
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');

    const ability = await this.authorizationService.defineAbilityFor(user);
    this.authorizationService.canDo(ability, DEPOSIT_ACTIONS.inviteReviewers, deposit);

    const invitations = await this.inviteService.find({
      inviteType: { $in: [InviteType.review, InviteType.copyEditing] },
      'data.depositId': deposit._id,
    });
    return this.transformerService.transformToDto(invitations, InvitePopulatedDTO, user);
  }

  /**
   * GET - Retrieves a paginated list of invitations sent to the logged-in user. This endpoint allows users to view their received
   * invitations filtered by status if specified. It is designed to ensure users can track invitations such as reviews or
   * copy editing requests addressed to them.
   *
   * @param {Request} req - The HTTP request object that includes user authentication.
   * @param {MyInvitesQueryParams} { page, limit, status } - Pagination and filter parameters; 'page', 'limit', 'status'.
   * @returns {Promise<InviteQueryDTO>} - A promise that resolves to an object containing an array of invitations.
   * @throws {NotFoundException} - Thrown if no user is found, indicating the user is not logged in or does not exist.
   */
  @ApiOperation({ summary: 'List my invitations' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('myInvites')
  async myInvites(
    @Req() req: Request,
    @Query() { page, limit, status }: MyInvitesQueryParams
  ): Promise<InviteQueryDTO> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');

    const filter: StrictFilterQuery<InviteDocument> = {
      addressee: user.email,
    };

    if (status) {
      filter.status = status;
    }
    const invitations = await this.inviteService.findWithLimitExec(filter, limit, page);

    const invitationsDTO = await this.transformerService.transformToDto(
      invitations,
      InvitePopulatedDTO,
      user,
      ['readMessage']
    );
    const count = await this.inviteService.inviteModel.countDocuments({ addressee: user.email });

    const invitationQuery: InviteQueryDTO = {
      invites: invitationsDTO,
      count: count,
    };
    return invitationQuery;
  }

  /**
   * GET - Retrieves a paginated list of invitations that the logged-in user has sent. This method is useful for users
   * who need to track the invitations they have dispatched for tasks such as peer reviews or copy editing. It supports
   * pagination through query parameters.
   *
   * @param {Request} req - The HTTP request object that includes user authentication.
   * @param {PaginationParamsDTO} { page, limit } - Parameters for pagination control.
   * @returns {Promise<InviteQueryDTO>} - A promise that resolves to a pagination-aware structure containing an array of invitations.
   * @throws {NotFoundException} - Thrown if no user is found, indicating the user is not logged in or does not exist.
   */
  @ApiOperation({ summary: 'List my sent invitations' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('sentInvites')
  async mySentInvites(
    @Req() req: Request,
    @Query() { page, limit }: PaginationParamsDTO
  ): Promise<InviteQueryDTO> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');

    const invitations = await this.inviteService.findWithLimitExec(
      { sender: user._id },
      limit,
      page
    );
    const count = await this.inviteService.inviteModel.countDocuments({ sender: user._id });

    const invitationsDTO = await this.transformerService.transformToDto(
      invitations,
      InvitePopulatedDTO,
      user,
      ['readMessage']
    );

    const invitationQuery: InviteQueryDTO = {
      invites: invitationsDTO,
      count: count,
    };

    return invitationQuery;
  }

  /**
   * GET - Checks whether the currently logged-in user has been invited to participate in a deposit either as a reviewer or in another capacity.
   * This method helps users verify their participation status for specific deposits based on the deposit ID provided.
   *
   * @param {Request} req - The HTTP request object that includes user authentication, used to identify the current user.
   * @param {string} depositId - The unique identifier of the deposit to check for invitations against.
   * @returns {Promise<boolean>} - Returns true if the user has an invitation for the specified deposit, false otherwise.
   * @throws {NotFoundException} - Throws an exception if either the user is not found or if the deposit does not exist.
   */
  @ApiOperation({ summary: 'Verify if invited' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('hasBeenInvited')
  async hasBeenInvited(@Req() req: Request, @Query('id') depositId: string): Promise<boolean> {
    const user = await this.userService.getLoggedUser(req);
    const deposit = await this.depositService.findById(depositId);
    assertIsDefined(deposit, 'deposit not found');
    assertIsDefined(user, 'User not found');
    const invite = await this.inviteService.exists({
      addressee: user.email,
      status: { $in: [InviteStatus.pending, InviteStatus.accepted] },
      'data.depositId': deposit._id,
    });
    return !!invite;
  }

  /**
   * PATCH - Updates an existing invitation's details, such as its status, and handles notifications based on the update.
   * This method allows users to accept or reject invitations and notifies the relevant parties of the change.
   *
   * @param {Request} req - The HTTP request object, used to authenticate and identify the user making the request.
   * @param {InviteUpdateDTO} payload - Data transfer object containing updates to the invite, such as status changes.
   * @param {string} id - The unique identifier of the invitation to update.
   * @returns {Promise<InvitePopulatedDTO>} - A promise that resolves to the updated invitation data, formatted according to the InvitePopulatedDTO schema.
   * @throws {NotFoundException} - Throws an error if the invitation, user, sender, or deposit related to the invitation cannot be found.
   * @throws {UnauthorizedException} - Throws if the user does not have permission to update the invitation.
   */
  @ApiOperation({ summary: 'Update invitation' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id([0-9a-f]{24})')
  async updateInvite(
    @Req() req: Request,
    @Body() payload: InviteUpdateDTO,
    @Param('id') id: string
  ): Promise<InvitePopulatedDTO> {
    const user = await this.userService.getLoggedUser(req);
    const invite = await this.inviteService.findById(id);

    assertIsDefined(user, 'User not found');
    assertIsDefined(invite, 'Invite not found');

    const ability = await this.authorizationService.defineAbilityFor(user);
    this.authorizationService.canDo(ability, INVITE_ACTIONS.update, invite);

    Object.assign(invite, payload);

    // If the reviewer has accepted the invitation, we notify the sender
    if (payload.status === InviteStatus.accepted) {
      const sender = await this.userService.findOne({ _id: invite.sender });
      const reviewer = await this.userService.findOne({ email: invite.addressee });
      const deposit = await this.depositService.findOne({ _id: invite.data.depositId });
      assertIsDefined(sender, 'Sender not found');
      assertIsDefined(deposit, 'Deposit not found');
      const event = new ReviewInvitationAcceptedEvent({
        sender: sender.toJSON(),
        reviewer: reviewer?.toJSON() ?? null,
        deposit: deposit.toJSON(),
        community: deposit.communityPopulated.toJSON(),
        invitation: invite.toJSON(),
      });
      await this.eventService.create(event.getEventDTO());
      deposit.history.push(event.getHistoryTemplate());
      deposit.markModified('history');
      const eventConfirmation = new ReviewInvitationAcceptedConfirmationEvent({
        sender: sender.toJSON(),
        reviewer: reviewer?.toJSON() ?? null,
        deposit: deposit.toJSON(),
        community: deposit.communityPopulated.toJSON(),
        invitation: invite.toJSON(),
      });
      await this.eventService.create(eventConfirmation.getEventDTO());
      await deposit.save();
    }

    if (payload.status === InviteStatus.rejected) {
      const sender = await this.userService.findOne({ _id: invite.sender });
      const reviewer = await this.userService.findOne({ email: invite.addressee });
      const deposit = await this.depositService.findOne({ _id: invite.data.depositId });
      assertIsDefined(sender, 'Sender not found');
      assertIsDefined(deposit, 'Deposit not found');
      const event = new ReviewInvitationRejectedEvent({
        sender: sender.toJSON(),
        reviewer: reviewer?.toJSON() ?? null,
        deposit: deposit.toJSON(),
        community: deposit.communityPopulated.toJSON(),
        invitation: invite.toJSON(),
      });
      await this.eventService.create(event.getEventDTO());
      deposit.history.push(event.getHistoryTemplate());
      deposit.markModified('history');
      await deposit.save();
    }

    const inviteUpdated = (await invite.save()) as InvitePopulatedDocument;
    return this.transformerService.transformToDto(inviteUpdated, InvitePopulatedDTO, user);
  }

  /**
   * Modify invitation status to accepted or rejected using a token.
   * The method decodes and decrypts the token, updates the invitation status accordingly,
   * and handles any related notifications or historical updates.
   *
   * @param {string} token - The encrypted token passed as a URL query parameter that contains the invitation ID and the new status.
   * @returns {Promise<{message: string}>} - Returns a message indicating the outcome of the operation (e.g., "Invitation accepted").
   * @throws {UnauthorizedException} - If the token is invalid, expired, or if the invitation status is not pending.
   * @throws {NotFoundException} - If no corresponding invitation or associated entities (user, sender, deposit) are found.
   */
  @ApiExcludeEndpoint()
  @Get('inviteReviewerToken')
  async inviteReviewerToken(
    @Query('inviteReviewerToken') token: string
  ): Promise<{ message: string }> {
    const decodedToken = decodeURIComponent(token);
    const inviteToken: { expiration: Date; id: string; status: InviteStatus } =
      decryptJson(decodedToken);
    // TODO enable this again later
    // if (new Date() > inviteToken.expiration) {
    //   throw new UnauthorizedException('The invitation link has expired. Log in to accept or reject it');
    // }
    const invite = await this.inviteService.findById(inviteToken.id);
    assertIsDefined(invite, 'Invitation not found');
    if (invite.status != InviteStatus.pending) {
      return { message: 'Invitation already accepted or rejected' };
    }
    switch (inviteToken.status) {
      case InviteStatus.accepted: {
        const sender = await this.userService.findOne({ _id: invite.sender });
        const reviewer = await this.userService.findOne({ email: invite.addressee });
        const deposit = await this.depositService.findOne({ _id: invite.data.depositId });
        assertIsDefined(sender, 'Sender not found');
        assertIsDefined(deposit, 'Deposit not found');
        const event = new ReviewInvitationAcceptedEvent({
          sender: sender.toJSON(),
          reviewer: reviewer?.toJSON() ?? null,
          invitation: invite.toJSON(),
          deposit: deposit.toJSON(),
          community: deposit.communityPopulated.toJSON(),
        });
        await this.eventService.create(event.getEventDTO());
        deposit.history.push(event.getHistoryTemplate());
        deposit.markModified('history');
        await deposit.save();
        invite.status = inviteToken.status;
        await invite.save();
        return { message: 'Invitation accepted' };
      }
      case InviteStatus.rejected: {
        invite.status = inviteToken.status;
        await invite.save();
        return { message: 'Invitation rejected' };
      }
      default: {
        return { message: 'Invalid invitation status' };
      }
    }
  }
}
