import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { InstitutionService } from './institution.service';
import { Institution } from './institution.schema';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';
import { InstitutionDTO } from '../dtos/institution/institution.dto';
import { CreateInstitutionDTO } from '../dtos/institution/create-institution.dto';
import { assertIsDefined } from '../utils/utils';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { plainToClassCustom } from '../transformer/utils';
import { UserService } from '../users/user.service';
import { AnyKeys } from 'mongoose';

/**
 * Controller for handling operations with research institutions in the application.
 *
 * @tags institutions
 * @controller institutions
 */
@ApiTags('institutions')
@Controller('institutions')
export class InstitutionController {
  /**
   * Instantiates a InstitutionController
   * @param {InstitutionService} institutionService - Service for institutions information management.
   * @param {UserService} userService - Service for user data management.
   */
  constructor(
    private readonly institutionService: InstitutionService,
    private readonly userService: UserService
  ) {}

  /**
   * GET - Retrieves an institution configured in the application. You need to supply the domain name of the institution (e.g. myinstitution.org).
   * If the institution is available, this endpoint will return details such as institution's name, country, etc.
   *
   * @param {string} domain - The domain name associated with the institution, used to fetch its details.
   * @returns {InstitutionDTO} - An object containing detailed information about the institution, such as its name, country, etc.
   */
  @ApiOperation({ summary: 'List institutions' })
  @Get('')
  async getInstitution(@Query('domain') domain: string): Promise<InstitutionDTO> {
    const topLevelDomain = domain.split('.').slice(-2).join('.');
    const institution = await this.institutionService.findOne({ domain: topLevelDomain });
    return plainToClassCustom(InstitutionDTO, institution);
  }

  /**
   * POST - Creates a new institution with the details specified in the request payload.
   * It will throw an error if another institution with the same domain already exists.
   * Only system admins can create new institutions.
   *
   * @param {Request} req - The request object, which includes user and authentication information.
   * @param {CreateInstitutionDTO} newInstitution - The data transfer object containing all data to create an institution.
   * @returns {InstitutionDTO} - An object containing the newly created institution's data if the operation is successful.
   * @throws {UnauthorizedException} - Thrown if the user does not have administrative rights or if an institution exists.
   */
  @ApiOperation({ summary: 'Create an institution' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('')
  async createInstitution(
    @Req() req: Request,
    @Body() newInstitution: CreateInstitutionDTO
  ): Promise<InstitutionDTO> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');
    const hasRights = this.institutionService.canCreateInstitution(user);
    if (!hasRights) {
      throw new UnauthorizedException();
    }
    if (await this.institutionService.exists({ domain: newInstitution.domain })) {
      throw new UnauthorizedException('Institution already exists');
    }
    const query: AnyKeys<Institution> = {
      domain: newInstitution.domain,
      name: newInstitution.name,
      city: newInstitution.city,
      country: newInstitution.country,
      synonym: newInstitution.synonym,
    };

    const institution = await this.institutionService.create(query);
    return plainToClassCustom(InstitutionDTO, institution);
  }
}
