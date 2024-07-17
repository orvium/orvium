import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Template, TemplateSchema } from './template.schema';
import { TemplateService } from './template.service';
import { TemplateController } from './template.controller';
import { UsersModule } from '../users/users.module';
import { TransformerModule } from '../transformer/transformer.module';
import { CommunitiesModule } from '../communities/communities.module';
import { DepositModule } from '../deposit/deposit.module';
import { ReviewModule } from '../review/review.module';
import { InviteModule } from '../invite/invite.module';
import { EmailService } from '../email/email.service';
import { ConversationsModule } from '../conversations/conversations.module';

@Module({
  controllers: [TemplateController],
  imports: [
    MongooseModule.forFeature([{ name: Template.name, schema: TemplateSchema }]),
    forwardRef(() => TransformerModule),
    forwardRef(() => UsersModule),
    forwardRef(() => CommunitiesModule),
    forwardRef(() => DepositModule),
    forwardRef(() => ReviewModule),
    forwardRef(() => InviteModule),
    forwardRef(() => ConversationsModule),
  ],
  providers: [TemplateService, EmailService],
  exports: [TemplateService],
})
export class TemplateModule {}
