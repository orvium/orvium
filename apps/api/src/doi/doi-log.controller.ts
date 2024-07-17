import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { DoiLogDTO } from '../dtos/doiLog.dto';
import { DoiLogService } from './doi-log.service';
import { assertIsDefined } from '../utils/utils';
import { Request } from 'express';
import { UserService } from '../users/user.service';
import { TransformerService } from '../transformer/transformer.service';
import { AuthorizationService, COMMUNITY_ACTIONS } from '../authorization/authorization.service';
import { CommunitiesService } from '../communities/communities.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

/**
 * Controller for handling operations related to DOI (Digital Object Identifiers) Logs in the application.
 *
 * @tags DoiLog
 * @controller doi-log
 */
@ApiTags('DoiLog')
@Controller('doi-log')
export class DoiLogController {
  /**
   * Instantiates a DoiLogController
   * @param {DoiLogService} doiLogService - Service for Doilogs information management.
   * @param {UserService} userService - Service for user data management.
   * @param {TransformerService} transformerService - Service for data transformation tasks.
   * @param {AuthorizationService} authorizationService - Service for handling authorization tasks.
   * @param {CommunitiesService} communitiesService - Service for community data management.
   */
  constructor(
    private readonly doiLogService: DoiLogService,
    private readonly userService: UserService,
    private readonly transformerService: TransformerService,
    private readonly authorizationService: AuthorizationService,
    private readonly communityService: CommunitiesService
  ) {}

  /**
   * GET - Retrieves the DOI log entry for a specific resource by its unique identifier. This method checks if the logged-in
   * user has the appropriate permissions to access the DOI log information within the context of the associated community.
   *
   * @param {Request} req - The HTTP request object, which includes the user's authentication information.
   * @param {string} id - The MongoDB ObjectId as a string that uniquely identifies the resource for which the DOI log is requested.
   * @returns {Promise<DoiLogDTO>} A promise that resolves to the `DoiLogDTO` which contains detailed information about the DOI log entry.
   * @throws {UnauthorizedException} If the user is not found or does not have permission to view the DOI log.
   * @throws {NotFoundException} If either the DOI log entry or the associated community is not found.
   */
  @ApiOperation({ summary: 'Get doiLog by resource id' })
  @UseGuards(JwtAuthGuard)
  @Get(':id([0-9a-f]{24})')
  async getDoiLog(@Req() req: Request, @Param('id') id: string): Promise<DoiLogDTO> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');

    const doiLog = await this.doiLogService.findByResourceId(id);
    assertIsDefined(doiLog, 'DoiLog not found');

    const community = await this.communityService.findById(doiLog.community);
    assertIsDefined(community, 'Community not found');

    const ability = await this.authorizationService.defineAbilityFor(user);
    this.authorizationService.canDo(ability, COMMUNITY_ACTIONS.moderate, community);

    return this.transformerService.toDTO(doiLog, DoiLogDTO);
  }
}
