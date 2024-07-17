import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { DepositModule } from '../deposit/deposit.module';
import { UsersModule } from '../users/users.module';
import { SessionService } from './session.service';
import { SessionController } from './session.controller';
import { CommunitiesModule } from '../communities/communities.module';
import { Session, SessionSchema } from './session.schema';
import { TransformerModule } from '../transformer/transformer.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Session.name, schema: SessionSchema }]),
    forwardRef(() => UsersModule),
    forwardRef(() => CommunitiesModule),
    forwardRef(() => DepositModule),
    forwardRef(() => TransformerModule),
  ],
  providers: [SessionService],
  controllers: [SessionController],
  exports: [SessionService],
})
export class SessionModule {}
