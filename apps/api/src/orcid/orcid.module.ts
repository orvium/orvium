import { Module } from '@nestjs/common';
import { OrcidService } from './orcid.service';
import { HttpModule } from '@nestjs/axios';
import { OrcidController } from './orcid.controller';

@Module({
  imports: [HttpModule],
  providers: [OrcidService],
  exports: [OrcidService],
  controllers: [OrcidController],
})
export class OrcidModule {}
