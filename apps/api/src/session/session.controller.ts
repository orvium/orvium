import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseArrayPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthorizationService, COMMUNITY_ACTIONS } from '../authorization/authorization.service';
import { CommunitiesService } from '../communities/communities.service';
import { SessionService } from './session.service';
import { SessionDTO } from '../dtos/session/session.dto';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { Session, SessionDocument } from './session.schema';
import { UserService } from '../users/user.service';
import { assertIsDefined, getMd5Hash } from '../utils/utils';
import { AnyKeys } from 'mongoose';
import { SessionCreateDTO } from '../dtos/session/session-create.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SessionUpdateDTO } from '../dtos/session/session-update.dto';
import { TransformerService } from '../transformer/transformer.service';
import { SpeakerDTO } from '../dtos/speaker.dto';
import { StrictFilterQuery } from '../utils/types';
import { JwtOrAnonymousGuard } from '../auth/jwt-or-anonymous-guard.service';

/**
 * Controller responsible for managing conference sessions within the platform
 *
 * @tags session
 * @controller session
 */
@ApiTags('session')
@Controller('session')
export class SessionController {
  /**
   * Instantiates a SessionController object.
   *
   * @param {AuthorizationService} authorizationService - Service for handling authorization tasks.
   * @param {CommunitiesService} communitiesService - Service for community data management.
   * @param {SessionService} sessionService - Service for conference sessions data management.
   * @param {UserService} userService - Service for user data management.
   * @param {TransformerService} transformerService - Service for data transformation tasks.
   */
  constructor(
    private readonly authorizationService: AuthorizationService,
    private readonly communityService: CommunitiesService,
    private readonly sessionService: SessionService,
    private readonly userService: UserService,
    private readonly transformerService: TransformerService
  ) {}

  /**
   * GET - Retrieves a list of conference sessions based on the provided community ID and optional filtering criteria.
   *
   * @param communityId - The ID of the community.
   * @param query - Optional text query for session search.
   * @param track - Optional track filter.
   * @param dates - Optional date filter.
   * @returns An array of session DTOs.
   */
  @ApiOperation({ summary: 'List conference sessions' })
  @UseGuards(JwtOrAnonymousGuard)
  @Get('')
  @ApiQuery({ name: 'query', required: false })
  @ApiQuery({ name: 'newTrackTimestamp', required: false })
  @ApiQuery({ name: 'dates', required: false })
  async getSessions(
    @Query('communityId') communityId: string,
    @Query('query') query?: string,
    @Query('newTrackTimestamp') track?: number,
    @Query('dates', new ParseArrayPipe({ separator: ',', optional: true })) dates?: string[]
  ): Promise<SessionDTO[]> {
    let filter: StrictFilterQuery<SessionDocument> = {};

    if (dates && dates.length > 0) {
      const datesFilter = [];
      for (const date of dates) {
        const startDate: Date = new Date(date);
        const endDate: Date = new Date(date);
        endDate.setDate(endDate.getDate() + 1);
        datesFilter.push({ dateStart: { $gt: startDate, $lt: endDate } });
      }
      filter = { $or: datesFilter };
    }

    filter.community = communityId;

    if (query) {
      filter.$text = { $search: query };
    }

    if (track) {
      filter.newTrackTimestamp = { $eq: track };
    }

    const sessions = await this.sessionService.find(filter);
    return this.transformerService.transformToDto(sessions, SessionDTO, null);
  }

  /**
   * GET - Retrieves details of a specific conference session.
   *
   * @param id - The ID of the session to retrieve.
   * @returns A session DTO.
   * @throws {NotFoundException} If the session is not found.
   */
  @ApiOperation({ summary: 'Retrieve session' })
  @UseGuards(JwtOrAnonymousGuard)
  @Get(':id([0-9a-f]{24})')
  async getSession(@Param('id') id: string): Promise<SessionDTO> {
    const session = await this.sessionService.findOneById(id);
    assertIsDefined(session);
    return this.transformerService.transformToDto(session, SessionDTO, null);
  }

  /**
   * POST - Creates a new conference session.
   *
   * @param req - The HTTP request object.
   * @param newSession - Data transfer object for creating a new session.
   * @returns A session DTO.
   * @throws {UnauthorizedException} If user is not found or lacks permission.
   * @throws {NotFoundException} If the community is not found.
   */
  @ApiOperation({ summary: 'Create a session' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('')
  async createSession(
    @Req() req: Request,
    @Body() newSession: SessionCreateDTO
  ): Promise<SessionDTO> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');
    const ability = await this.authorizationService.defineAbilityFor(user);
    const community = await this.communityService.findById(newSession.community);
    assertIsDefined(community, 'Community not found');
    this.authorizationService.canDo(ability, COMMUNITY_ACTIONS.moderate, community);

    const query: AnyKeys<Session> = {
      title: newSession.title,
      creator: user._id,
      dateStart: newSession.dateStart,
      dateEnd: newSession.dateEnd,
      community: newSession.community,
      speakers: [],
      description: newSession.description,
      newTrackTimestamp: newSession.newTrackTimestamp,
      deposits: [],
    };
    const session = await this.sessionService.create(query);
    return this.transformerService.transformToDto(session, SessionDTO, user);
  }

  /**
   * PATCH - Updates an existing conference session.
   *
   * @param req - The HTTP request object.
   * @param payload - Data transfer object for updating the session.
   * @param id - The ID of the session to update.
   * @returns Updated session DTO.
   * @throws {NotFoundException} If the session or community is not found.
   * @throws {UnauthorizedException} If the user lacks permission.
   */
  @ApiOperation({ summary: 'Update a session' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id([0-9a-f]{24})')
  async updateSession(
    @Req() req: Request,
    @Body() payload: SessionUpdateDTO,
    @Param('id') id: string
  ): Promise<SessionDTO> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');
    const session = await this.sessionService.findOneById(id);
    assertIsDefined(session, 'Session not found');
    const community = await this.communityService.findById(session.community.toString());
    assertIsDefined(community, 'Community not found');
    const ability = await this.authorizationService.defineAbilityFor(user);
    this.authorizationService.canDo(ability, COMMUNITY_ACTIONS.moderate, community);

    // Authors update
    if (payload.speakers) {
      const speakers: SpeakerDTO[] = [];
      for (const speaker of payload.speakers) {
        speaker.gravatar = getMd5Hash(speaker.firstName + speaker.lastName);
        speakers.push(speaker);
      }
      payload.speakers = speakers;
    }

    const included = community.newTracks.some(
      track => track.timestamp === payload.newTrackTimestamp
    );

    if (!included) {
      throw new NotFoundException('This track is not available in the community');
    }

    Object.assign(session, payload);
    const savedSession = await session.save();
    return this.transformerService.transformToDto(savedSession, SessionDTO, user);
  }

  /**
   * DETELE - Deletes a conference session.
   * @param req - The HTTP request object.
   * @param id - The ID of the session to delete.
   * @returns The deleted session DTO.
   * @throws {NotFoundException} If the session or community is not found.
   * @throws {UnauthorizedException} If the user lacks permission.
   */
  @ApiOperation({ summary: 'Delete a session' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id([0-9a-f]{24})')
  async deleteSession(@Req() req: Request, @Param('id') id: string): Promise<SessionDTO> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');
    const ability = await this.authorizationService.defineAbilityFor(user);
    const session = await this.sessionService.findOneById(id);
    assertIsDefined(session, 'Session not found');
    const community = await this.communityService.findOneByFilter({ _id: session.community });
    assertIsDefined(community, 'Community not found');
    this.authorizationService.canDo(ability, COMMUNITY_ACTIONS.moderate, community);

    await session.deleteOne();
    return this.transformerService.transformToDto(session, SessionDTO, user);
  }
}
