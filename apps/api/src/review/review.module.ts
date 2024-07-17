import { forwardRef, Module } from '@nestjs/common';
import { ReviewService } from './review.service';
import { ReviewController } from './review.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Review, ReviewSchema } from './review.schema';
import { DepositModule } from '../deposit/deposit.module';
import { UsersModule } from '../users/users.module';
import { EventModule } from '../event/event.module';
import { InviteModule } from '../invite/invite.module';
import { CommonModule } from '../common/common.module';
import { TransformerModule } from '../transformer/transformer.module';
import { DataciteModule } from '../datacite/datacite.module';
import { CrossrefModule } from '../crossref/crossref.module';
import { MetricsModule } from '../metrics/metrics.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Review.name, schema: ReviewSchema }]),
    forwardRef(() => DepositModule),
    forwardRef(() => UsersModule),
    EventModule,
    forwardRef(() => InviteModule),
    forwardRef(() => CommonModule),
    forwardRef(() => TransformerModule),
    forwardRef(() => DataciteModule),
    forwardRef(() => CrossrefModule),
    MetricsModule,
  ],
  providers: [ReviewService],
  controllers: [ReviewController],
  exports: [ReviewService],
})
export class ReviewModule {}
