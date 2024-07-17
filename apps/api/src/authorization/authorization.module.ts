import { Global, Module } from '@nestjs/common';
import { AuthorizationService } from './authorization.service';
import { CommunitiesModule } from '../communities/communities.module';
import { InviteModule } from '../invite/invite.module';

@Global()
@Module({
  imports: [CommunitiesModule, InviteModule],
  providers: [AuthorizationService],
  exports: [AuthorizationService],
})
export class AuthorizationModule {}
