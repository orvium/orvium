import { Module } from '@nestjs/common';
import { AwsStorageService } from './aws-storage-service/aws-storage.service';

@Module({
  imports: [],
  providers: [AwsStorageService],
  exports: [AwsStorageService],
})
export class CommonModule {}
