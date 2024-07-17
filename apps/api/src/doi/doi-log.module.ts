import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DoiLog, DoiLogSchema } from './doi-log.schema';
import { DoiLogService } from './doi-log.service';
import { HttpModule } from '@nestjs/axios';
import { CommunitiesModule } from '../communities/communities.module';
import { UsersModule } from '../users/users.module';
import { TransformerModule } from '../transformer/transformer.module';
import { DepositModule } from '../deposit/deposit.module';
import { ReviewModule } from '../review/review.module';
import { DoiLogController } from './doi-log.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: DoiLog.name, schema: DoiLogSchema }]),
    HttpModule,
    forwardRef(() => UsersModule),
    forwardRef(() => CommunitiesModule),
    forwardRef(() => TransformerModule),
    forwardRef(() => DepositModule),
    forwardRef(() => ReviewModule),
  ],
  providers: [DoiLogService],
  exports: [DoiLogService],
  controllers: [DoiLogController],
})
export class DoiLogModule {}
