import { forwardRef, Module } from '@nestjs/common';
import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './conversations.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Conversation, ConversationSchema } from './conversations.schema';
import { DepositModule } from '../deposit/deposit.module';
import { UsersModule } from '../users/users.module';
import { TransformerModule } from '../transformer/transformer.module';
import { EventModule } from '../event/event.module';
import { MessageModule } from '../messages/message.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Conversation.name, schema: ConversationSchema }]),
    forwardRef(() => DepositModule),
    forwardRef(() => UsersModule),
    forwardRef(() => TransformerModule),
    forwardRef(() => EventModule),
    forwardRef(() => MessageModule),
  ],
  providers: [ConversationsService],
  controllers: [ConversationsController],
  exports: [ConversationsService],
})
export class ConversationsModule {}
