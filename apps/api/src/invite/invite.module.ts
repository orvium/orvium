import { forwardRef, Module } from '@nestjs/common';
import { InviteService } from './invite.service';
import { InviteController } from './invite.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module';
import { Invite, InviteSchema } from './invite.schema';
import { DepositModule } from '../deposit/deposit.module';
import { EventModule } from '../event/event.module';
import { ReviewModule } from '../review/review.module';
import { TransformerModule } from '../transformer/transformer.module';
import { TemplateModule } from '../template/template.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Invite.name, schema: InviteSchema }]),
    forwardRef(() => UsersModule),
    forwardRef(() => DepositModule),
    EventModule,
    forwardRef(() => ReviewModule),
    forwardRef(() => TransformerModule),
    forwardRef(() => TemplateModule),
  ],
  providers: [InviteService],
  exports: [InviteService],
  controllers: [InviteController],
})
export class InviteModule {}
