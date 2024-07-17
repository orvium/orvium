import { Module } from '@nestjs/common';
import { DisciplineService } from './discipline.service';
import { DisciplineController } from './discipline.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Discipline, DisciplineSchema } from './discipline.schema';

@Module({
  providers: [DisciplineService],
  controllers: [DisciplineController],
  imports: [MongooseModule.forFeature([{ name: Discipline.name, schema: DisciplineSchema }])],
  exports: [DisciplineService],
})
export class DisciplineModule {}
