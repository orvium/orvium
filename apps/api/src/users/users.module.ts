import { forwardRef, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './user.schema';
import { UserController } from './user.controller';
import { EventModule } from '../event/event.module';
import { InstitutionModule } from '../institution/institution.module';
import {
  CommunityModerator,
  CommunityModeratorSchema,
} from '../communities/communities-moderator.schema';
import { HttpModule } from '@nestjs/axios';
import { TransformerModule } from '../transformer/transformer.module';
import { CommonModule } from '../common/common.module';
import { DepositModule } from '../deposit/deposit.module';
import { ReviewModule } from '../review/review.module';
import { CommunitiesModule } from '../communities/communities.module';
import { CommentsModule } from '../comments/comments.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: CommunityModerator.name, schema: CommunityModeratorSchema },
    ]),
    HttpModule,
    EventModule,
    InstitutionModule,
    forwardRef(() => ReviewModule),
    forwardRef(() => CommentsModule),
    forwardRef(() => CommunitiesModule),
    forwardRef(() => DepositModule),
    forwardRef(() => TransformerModule),
    CommonModule,
  ],
  providers: [UserService],
  exports: [UserService],
  controllers: [UserController],
})
export class UsersModule {}
