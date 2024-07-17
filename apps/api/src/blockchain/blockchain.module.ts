import { Module } from '@nestjs/common';
import { BlockchainService } from './blockchain.service';
import { BlockchainController } from './blockchain.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { BlockchainNetwork, BlockchainNetworkSchema } from './blockchain.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: BlockchainNetwork.name, schema: BlockchainNetworkSchema }]),
  ],
  providers: [BlockchainService],
  controllers: [BlockchainController],
})
export class BlockchainModule {}
