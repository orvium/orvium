import { Controller, Get } from '@nestjs/common';
import { BlockchainService } from './blockchain.service';
import { BlockchainNetworkDTO } from '../dtos/blockchain-network.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { plainToClassCustom } from '../transformer/utils';

/**
 * Controller for handling blockchain-related API requests.
 * This controller provides endpoints for accessing information about blockchain networks.
 *
 * @controller blockchain
 * @tag 'blockchain' - Tag used for grouping related endpoints within the Swagger documentation.
 */
@ApiTags('blockchain')
@Controller('blockchain')
export class BlockchainController {
  /**
   * Constructor to create an instance of BlockchainController.
   * @param {BlockchainService} blochainService - The service used for accessing blockchain data.
   */
  constructor(private readonly blochainService: BlockchainService) {}

  /**
   * GET - Retrieves an array of blockchain networks currently configured in the application.
   * This endpoint maps to a GET request that returns data in the form of an array of BlockchainNetworkDTO.
   *
   * @returns {Promise<BlockchainNetworkDTO[]>} Returns a promise that, when resolved, yields an array of BlockchainNetworkDTO.
   */
  @ApiOperation({ summary: 'Get blockchain networks' })
  @Get()
  async getBlockchainNetworks(): Promise<BlockchainNetworkDTO[]> {
    const blockchainNetworks = await this.blochainService.find({});
    return plainToClassCustom(BlockchainNetworkDTO, blockchainNetworks);
  }
}
