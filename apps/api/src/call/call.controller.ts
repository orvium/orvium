import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CallService } from './call.service';
import { Call, CallType } from './call.schema';
import { assertIsDefined } from '../utils/utils';
import { CallDTO } from '../dtos/call/call.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CallUpdateDTO } from '../dtos/call/call-update.dto';
import { AnyKeys } from 'mongoose';
import { CallCreateDTO } from '../dtos/call/call-create.dto';
import { Request } from 'express';
import { UserService } from '../users/user.service';
import { CommunitiesService } from '../communities/communities.service';
import { AuthorizationService, COMMUNITY_ACTIONS } from '../authorization/authorization.service';
import { TransformerService } from '../transformer/transformer.service';
import { StrictFilterQuery } from '../utils/types';
import { JwtOrAnonymousGuard } from '../auth/jwt-or-anonymous-guard.service';

/**
 * Controller for managing calls for papers or abstracts related to different communities within the platform.
 * Provides functionalities to list, create, update, and delete calls with appropriate permissions.
 *
 * @tags call
 * @controller call
 */
@ApiTags('call')
@Controller('call')
export class CallController {
  /**
   * Instantiates a CallController object.
   * @param {CallService} callService - Service for call data management.
   * @param {CommunitiesService} communitiesService - Service for community data management.
   * @param {UserService} userService - Service for user data management.
   * @param {AuthorizationService} authorizationService - Service for handling authorization tasks.
   * @param {TransformerService} transformerService - Service for data transformation tasks.
   */
  constructor(
    private readonly callService: CallService,
    private readonly communitiesService: CommunitiesService,
    private readonly userService: UserService,
    private readonly authorizationService: AuthorizationService,
    private readonly transformerService: TransformerService
  ) {}

  /**
   * Retrieves a list of all calls, optionally filtered by a community. This can include both public and
   * moderation-required calls depending on the user's role within the specified community.
   *
   * @param {Request} req - The incoming request object that includes user authentication.
   * @param {string} [community] - Optional community ID to filter the calls.
   * @returns {Promise<CallDTO[]>} - A list of calls wrapped in a data transfer object array.
   */
  @ApiOperation({ summary: 'List all calls for papers/abstracts' })
  @UseGuards(JwtOrAnonymousGuard)
  @Get('')
  @ApiQuery({ name: 'community', required: false, description: 'Optional filtering by community' })
  async getCalls(@Req() req: Request, @Query('community') community?: string): Promise<CallDTO[]> {
    const query: StrictFilterQuery<Call> = {
      visible: true,
    };
    const user = await this.userService.getLoggedUser(req);

    if (community) {
      query.community = community;
      const communityDocument = await this.communitiesService.findById(community);
      assertIsDefined(communityDocument, 'Community not found');

      // Check if moderator and show also non-visible calls
      const actions = await this.authorizationService.getSubjectActions(user, communityDocument);
      if (actions.includes('moderate')) {
        delete query.visible;
      }
    }

    const calls = await this.callService.find(query);
    return this.transformerService.toDTO(calls, CallDTO);
  }

  /**
   * GET - Retrieves detailed information about a specific call identified by its ID.
   *
   * @param {Request} req - The request object containing user credentials.
   * @param {string} id - The unique identifier of the call to retrieve.
   * @returns {Promise<CallDTO>} - Detailed information about the call wrapped in a DTO.
   */
  @ApiOperation({ summary: 'Retrieve a call for papers/abstracts' })
  @UseGuards(JwtOrAnonymousGuard)
  @Get(':id([0-9a-f]{24})')
  async getCall(@Req() req: Request, @Param('id') id: string): Promise<CallDTO> {
    const user = await this.userService.getLoggedUser(req);

    const call = await this.callService.findOne({ _id: id });
    assertIsDefined(call, 'Call not found');

    if (!call.visible) {
      // check if moderator

      const community = await this.communitiesService.findOneByFilter({ _id: call.community });
      assertIsDefined(community, 'Community not found');

      const actions = await this.authorizationService.getSubjectActions(user, community);
      if (!actions.includes('moderate')) {
        throw new ForbiddenException('User not allowed to view this call');
      }
    }

    return this.transformerService.toDTO(call, CallDTO);
  }

  /**
   * PATCH - Updates an existing call with new data provided through the request payload.
   * Only fields provided in the payload will be updated; others will remain unchanged.
   *
   * @param {Request} req - The request object containing user authentication.
   * @param {CallUpdateDTO} payload - The updated data for the call.
   * @param {string} id - The ID of the call to update.
   * @returns {Promise<CallDTO>} - The updated call data, wrapped in a DTO.
   */
  @ApiOperation({ summary: 'Update a call for paper/abstract' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id([0-9a-f]{24})')
  async updateCall(
    @Req() req: Request,
    @Body() payload: CallUpdateDTO,
    @Param('id') id: string
  ): Promise<CallDTO> {
    const user = await this.userService.getLoggedUser(req);
    const call = await this.callService.findOne({ _id: id });
    assertIsDefined(call, 'Call not found');
    const community = await this.communitiesService.findOneByFilter({ _id: call.community });
    assertIsDefined(community, 'Community not found');
    const ability = await this.authorizationService.defineAbilityFor(user);
    this.authorizationService.canDo(ability, COMMUNITY_ACTIONS.moderate, community);
    Object.assign(call, payload);

    return this.transformerService.toDTO(await call.save(), CallDTO);
  }

  /**
   * POST - Creates a new call for papers or abstracts based on the details provided in the request body.
   * The new call is initially not visible publicly until explicitly updated.
   *
   * @param {Request} req - The request object containing user authentication details.
   * @param {CallCreateDTO} newCall - The data needed to create the new call.
   * @returns {Promise<CallDTO>} - The newly created call, wrapped in a DTO.
   */
  @ApiOperation({ summary: 'Create a call for papers/abstracts' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('')
  async createCall(@Req() req: Request, @Body() newCall: CallCreateDTO): Promise<CallDTO> {
    const query: AnyKeys<Call> = {
      title: newCall.title,
      deadline: undefined,
      description: '',
      callType: CallType.papers,
      scope: '',
      guestEditors: '',
      disciplines: [],
      contact: '',
      contactEmail: '',
      visible: false,
      community: newCall.community,
    };
    const user = await this.userService.getLoggedUser(req);
    const community = await this.communitiesService.findById(newCall.community);
    const ability = await this.authorizationService.defineAbilityFor(user);
    assertIsDefined(community, 'Community not found');
    this.authorizationService.canDo(ability, COMMUNITY_ACTIONS.moderate, community);
    const createdCall = await this.callService.create(query);

    return this.transformerService.toDTO(createdCall, CallDTO);
  }

  /**
   * Permanently deletes a call and its associated data. This action cannot be undone.
   *
   * @param {Request} req - The request object containing user authentication.
   * @param {string} id - The unique identifier of the call to delete.
   * @returns {Promise<CallDTO>} - Confirmation of the deleted call, wrapped in a DTO.
   */
  @ApiOperation({ summary: 'Delete a call for papers/abstract' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id([0-9a-f]{24})')
  async deleteCall(@Req() req: Request, @Param('id') id: string): Promise<CallDTO> {
    const call = await this.callService.findOne({
      _id: id,
    });
    assertIsDefined(call, 'Call not found');
    const user = await this.userService.getLoggedUser(req);
    const community = await this.communitiesService.findOneByFilter({ _id: call.community });
    const ability = await this.authorizationService.defineAbilityFor(user);
    assertIsDefined(community, 'Community not found');
    this.authorizationService.canDo(ability, COMMUNITY_ACTIONS.moderate, community);
    await call.deleteOne();

    return this.transformerService.toDTO(call, CallDTO);
  }
}
