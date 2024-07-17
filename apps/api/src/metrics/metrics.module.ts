import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MetricsService } from './metrics.service';
import { Metrics, MetricsSchema } from './metrics.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Metrics.name, schema: MetricsSchema }])],
  providers: [MetricsService],
  exports: [MetricsService],
  controllers: [],
})
export class MetricsModule {}
