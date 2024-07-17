import { forwardRef, Module } from '@nestjs/common';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { UsersModule } from '../users/users.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Commentary, CommentSchema } from './comments.schema';
import { EventModule } from '../event/event.module';
import { TransformerModule } from '../transformer/transformer.module';
import { CommonModule } from '../common/common.module';
import { DepositModule } from '../deposit/deposit.module';
import { ReviewModule } from '../review/review.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Commentary.name, schema: CommentSchema }]),
    TransformerModule,
    forwardRef(() => UsersModule),
    forwardRef(() => CommonModule),
    EventModule,
    DepositModule,
    ReviewModule,
  ],
  controllers: [CommentsController],
  providers: [CommentsService],
  exports: [CommentsService],
})
export class CommentsModule {}
