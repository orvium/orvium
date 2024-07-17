import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OrcidData, OrcidService } from './orcid.service';

/**
 * Controller responsible for the interaction between the platform and ORCID
 * More information in https://orcid.org/.
 *
 * @tags orcid
 * @controller orcid
 */
@ApiTags('orcid')
@Controller('orcid')
export class OrcidController {
  /**
   * Instantiates a OrcidController object.
   *
   * @param {OrcidService} orcidService - Service for  handling the interaction between the platform and ORCID.
   */
  constructor(private readonly orcidService: OrcidService) {}

  /**
   * GET - Retrieves ORCID data for a specified ORCID ID.
   * The method calls a service that interacts with the ORCID API to fetch the author information.
   *
   * @param {string} orcidID - The ORCID ID for which to retrieve data.
   * @throws {NotFoundException} If no data is found for the specified ORCID ID.
   * @returns {Promise<OrcidData>} A promise that resolves to the ORCID data.
   */
  @ApiOperation({ summary: 'Get orcid author info' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getOrcidData(@Param('id') orcidID: string): Promise<OrcidData> {
    return this.orcidService.getOrcidData(orcidID);
  }
}
