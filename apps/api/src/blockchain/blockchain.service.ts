import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AnyKeys, Model } from 'mongoose';
import { BlockchainNetwork, BlockchainNetworkDocument } from './blockchain.schema';
import { StrictFilterQuery } from '../utils/types';

/**
 * Service responsible for managing blockchain network data.
 */
@Injectable()
export class BlockchainService {
  /**
   * Constructs a new instance of BlockchainService.
   *
   * @param blockchainNetworkModel The mongoose model for BlockchainNetwork.
   */
  constructor(
    @InjectModel(BlockchainNetwork.name)
    public blockchainNetworkModel: Model<BlockchainNetwork>
  ) {}

  /**
   * Finds blockchain networks that match a given filter.
   *
   * @param filter A strict filter query that conforms to the BlockchainNetworkDocument structure.
   * @returns A Promise that resolves to an array of BlockchainNetwork.
   */
  async find(filter: StrictFilterQuery<BlockchainNetworkDocument>): Promise<BlockchainNetwork[]> {
    return this.blockchainNetworkModel.find(filter).lean();
  }

  /**
   * Creates a new blockchain network entry from a raw JSON object.
   *
   * @param rawJson An object containing key-value pairs for BlockchainNetwork fields.
   * @returns A Promise that resolves to the newly created BlockchainNetworkDocument.
   */
  async create(rawJson: AnyKeys<BlockchainNetwork>): Promise<BlockchainNetworkDocument> {
    const blockchainNetwork = new this.blockchainNetworkModel(rawJson);
    return blockchainNetwork.save();
  }
}
