import { MongooseModule } from '@nestjs/mongoose';
import { Call, CallSchema } from './call.schema';
import { CallService } from './call.service';
import { CallController } from './call.controller';
import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { CommunitiesModule } from '../communities/communities.module';
import { TransformerModule } from '../transformer/transformer.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Call.name, schema: CallSchema }]),
    UsersModule,
    CommunitiesModule,
    TransformerModule,
  ],
  providers: [CallService],
  controllers: [CallController],
  exports: [CallService],
})
export class CallModule {}
