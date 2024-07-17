import { Controller, Get } from '@nestjs/common';
import { TransformerService } from '../transformer/transformer.service';
import { VideoDTO } from '../dtos/video.dto';
import { ConfigurationService } from './configuration.service';
import { assertIsDefined } from '../utils/utils';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

/**
 * Controller responsible for handling configurations and settings within the application.
 *
 * @tags configurarion
 * @controller configuration
 */
@ApiTags('configuration')
@Controller('configuration')
export class ConfigurationController {
  /**
   * Instantiates a ConfigurationController object.
   * @param {ConfigurationController} configurationService - Service for configuration data management.
   * @param {TransformerService} transformerService - Service for data transformation tasks.
   */
  constructor(
    private readonly configurationService: ConfigurationService,
    private readonly transformerService: TransformerService
  ) {}

  /**
   * Retrieves a list of configured videos from the system. These videos are typically used to guide users
   * through the application's features or provide other informational content.
   *
   * @returns {Promise<VideoDTO[]>} - A promise that resolves to an array of VideoDTO objects representing the videos configured in the system.
   * @throws {NotFoundException} - If no video configuration can be found, a NotFoundException is thrown.
   *
   */
  @ApiOperation({ summary: 'List videos' })
  @Get('videos')
  async getVideos(): Promise<VideoDTO[]> {
    // Retrieve video configurations using the ConfigurationService
    const configVideos = await this.configurationService.findOne({});
    // Ensure that the retrieved configuration is not undefined
    assertIsDefined(configVideos, 'ConfigVideos not found');
    // Convert the video data to DTOs using the TransformerService
    return this.transformerService.toDTO(configVideos.videos, VideoDTO);
  }
}
