import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

/**
 * Represents a fully hydrated Mongoose document of the BlockchainNetwork.
 */
export type BlockchainNetworkDocument = HydratedDocument<BlockchainNetwork>;

/**
 * Schema definition for the blockchain network entity.
 * This schema defines the structure and data types of the BlockchainNetwork
 */
@Schema({ collection: 'network', timestamps: true, toJSON: { virtuals: true } })
export class BlockchainNetwork {
  /**
   * The technical name of the blockchain network used internally.
   */
  @Prop({ required: true })
  name!: string;

  /**
   * The human-readable name of the network displayed in the UI
   */
  @Prop({ required: true })
  displayName!: string;

  /**
   * Unique identifier for the blockchain network, used to distinguish between different networks.
   */
  @Prop({ required: true, unique: true })
  networkId!: number;

  /**
   * Blockchain address for the application smart contract.
   */
  @Prop({ required: true })
  appAddress!: string;

  /**
   * Blockchain address for the escrow smart contract.
   */
  @Prop({ required: true })
  escrowAddress!: string;

  /**
   * Blockchain address for the token smart contract.
   */
  @Prop({ required: true })
  tokenAddress!: string;

  /**
   * URL to the blockchain explorer page for this network.
   */
  @Prop({ required: true })
  explorerUrl!: string;
}

/**
 * Schema factory for BlockchainNetwork.
 */
export const BlockchainNetworkSchema = SchemaFactory.createForClass(BlockchainNetwork);
