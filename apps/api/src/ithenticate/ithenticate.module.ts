import { forwardRef, Module } from '@nestjs/common';
import { IthenticateService } from './ithenticate.service';
import { HttpModule } from '@nestjs/axios';
import { UsersModule } from '../users/users.module';
import { DepositModule } from '../deposit/deposit.module';
import { IthenticateController } from './ithenticate.controller';
import { CommunitiesModule } from '../communities/communities.module';
import { EventModule } from '../event/event.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    HttpModule,
    UsersModule,
    forwardRef(() => DepositModule),
    CommunitiesModule,
    EventModule,
    CommonModule,
  ],
  providers: [IthenticateService],
  exports: [IthenticateService],
  controllers: [IthenticateController],
})
export class IthenticateModule {}
