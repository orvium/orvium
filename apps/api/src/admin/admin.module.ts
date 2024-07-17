import { Module } from '@nestjs/common';

import { UsersModule } from '../users/users.module';

import { TransformerModule } from '../transformer/transformer.module';
import { AdminController } from './admin.controller';
import { ConfigurationModule } from '../configuration/configuration.module';
import { AwsStorageService } from '../common/aws-storage-service/aws-storage.service';

@Module({
  imports: [UsersModule, ConfigurationModule, TransformerModule],
  providers: [AwsStorageService],
  exports: [],
  controllers: [AdminController],
})
export class AdminModule {}
