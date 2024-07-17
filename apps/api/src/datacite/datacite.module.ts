import { Module } from '@nestjs/common';
import { DataciteService } from './datacite.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [DataciteService],
  exports: [DataciteService],
})
export class DataciteModule {}
