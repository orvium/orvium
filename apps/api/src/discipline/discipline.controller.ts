import { Controller, Get } from '@nestjs/common';
import { DisciplineService } from './discipline.service';
import { DisciplineDTO } from '../dtos/discipline.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { plainToClassCustom } from '../transformer/utils';

/**
 * Controller for handling operations related to disciplines in the application.
 *
 * @tags disciplines
 * @controller disciplines
 */
@ApiTags('disciplines')
@Controller('disciplines')
export class DisciplineController {
  /**
   * Instantiates a DisciplineController
   * @param {DisciplineService} disciplineService - Service for disciplines data management.
   */
  constructor(private readonly disciplineService: DisciplineService) {}

  /**
   * GET - Retrieves all scientific disciplines defined within the application. These disciplines categorize publications
   * and other scholarly content according to their specific scientific fields.
   *
   * @returns {Promise<DisciplineDTO[]>} - A promise that resolves to an array of `DisciplineDTO` instances.
   */
  @ApiOperation({ summary: 'List diciplines' })
  @Get('')
  async getDisciplines(): Promise<DisciplineDTO[]> {
    const disciplines = await this.disciplineService.find({});
    return plainToClassCustom(DisciplineDTO, disciplines);
  }
}
