import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MessagesService } from './messages.service';
import { Message, MessageSchema } from './messages.schema';
import { MessageController } from './message.controller';
import { UsersModule } from '../users/users.module';
import { TransformerModule } from '../transformer/transformer.module';
import { ConversationsModule } from '../conversations/conversations.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }]),
    forwardRef(() => UsersModule),
    forwardRef(() => TransformerModule),
    forwardRef(() => ConversationsModule),
  ],
  providers: [MessagesService],
  controllers: [MessageController],
  exports: [MessagesService],
})
export class MessageModule {}
