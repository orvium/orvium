import { Module } from '@nestjs/common';
import { OaipmhService } from './oaipmh.service';
import { DepositModule } from '../deposit/deposit.module';
import { OaipmhController } from './oaipmh.controller';
import { CommunitiesModule } from '../communities/communities.module';

@Module({
  providers: [OaipmhService],
  imports: [DepositModule, CommunitiesModule],
  exports: [OaipmhService],
  controllers: [OaipmhController],
})
export class OaipmhModule {}
