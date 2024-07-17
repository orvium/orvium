import { forwardRef, Module } from '@nestjs/common';
import { InstitutionService } from './institution.service';
import { InstitutionController } from './institution.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Institution, InstitutionSchema } from './institution.schema';
import { EventModule } from '../event/event.module';
import { User, UserSchema } from '../users/user.schema';
import { UsersModule } from '../users/users.module';

@Module({
  providers: [InstitutionService],
  controllers: [InstitutionController],
  imports: [
    MongooseModule.forFeature([
      { name: Institution.name, schema: InstitutionSchema },
      { name: User.name, schema: UserSchema },
    ]),
    EventModule,
    forwardRef(() => UsersModule),
  ],
  exports: [InstitutionService],
})
export class InstitutionModule {}
