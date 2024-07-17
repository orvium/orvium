import { forwardRef, Module } from '@nestjs/common';
import { DepositService } from './deposit.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Deposit, DepositSchema } from './deposit.schema';
import { DepositController } from './deposit.controller';
import { UsersModule } from '../users/users.module';
import { EventModule } from '../event/event.module';
import { DataciteModule } from '../datacite/datacite.module';
import { CommunitiesModule } from '../communities/communities.module';
import { DepositImportService } from './deposit-import.service';
import { FigshareImportService } from './figshare-import.service';
import { TemplateModule } from '../template/template.module';
import { HttpModule } from '@nestjs/axios';
import { CommonModule } from '../common/common.module';
import { TransformerModule } from '../transformer/transformer.module';
import { MetricsModule } from '../metrics/metrics.module';
import { CrossrefModule } from '../crossref/crossref.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Deposit.name, schema: DepositSchema }]),
    forwardRef(() => UsersModule),
    EventModule,
    DataciteModule,
    forwardRef(() => CommunitiesModule),
    HttpModule,
    TemplateModule,
    forwardRef(() => CommonModule),
    forwardRef(() => TransformerModule),
    MetricsModule,
    CrossrefModule,
  ],
  providers: [DepositService, DepositImportService, FigshareImportService],
  exports: [DepositService],
  controllers: [DepositController],
})
export class DepositModule {}
