import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommunitiesService } from './communities.service';
import { Community, CommunitySchema } from './communities.schema';
import { CommunitiesController } from './communities.controller';
import { UsersModule } from '../users/users.module';
import { DepositModule } from '../deposit/deposit.module';
import { EventModule } from '../event/event.module';
import { CommunityModerator, CommunityModeratorSchema } from './communities-moderator.schema';
import { ReviewModule } from '../review/review.module';
import { CommonModule } from '../common/common.module';
import { TransformerModule } from '../transformer/transformer.module';
import { MetricsModule } from '../metrics/metrics.module';
import { SessionModule } from '../session/session.module';
import { InviteModule } from '../invite/invite.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Community.name, schema: CommunitySchema },
      { name: CommunityModerator.name, schema: CommunityModeratorSchema },
    ]),
    forwardRef(() => UsersModule),
    forwardRef(() => DepositModule),
    EventModule,
    SessionModule,
    forwardRef(() => ReviewModule),
    forwardRef(() => CommonModule),
    forwardRef(() => TransformerModule),
    forwardRef(() => InviteModule),
    MetricsModule,
  ],
  providers: [CommunitiesService],
  exports: [CommunitiesService],
  controllers: [CommunitiesController],
})
export class CommunitiesModule {}
