import { HttpModule } from '@nestjs/axios';
import { forwardRef, Module } from '@nestjs/common';
import { CrossrefService } from './crossref.service';
import { ReviewModule } from '../review/review.module';
import { DoiLogModule } from '../doi/doi-log.module';

@Module({
  imports: [HttpModule, forwardRef(() => ReviewModule), DoiLogModule],
  providers: [CrossrefService],
  exports: [CrossrefService],
})
export class CrossrefModule {}
