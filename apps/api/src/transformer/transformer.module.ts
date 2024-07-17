import { forwardRef, Module } from '@nestjs/common';
import { TransformerService } from './transformer.service';
import { ReviewModule } from '../review/review.module';

@Module({
  imports: [forwardRef(() => ReviewModule)],
  providers: [TransformerService],
  exports: [TransformerService],
})
export class TransformerModule {}
