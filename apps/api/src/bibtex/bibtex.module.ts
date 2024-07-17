import { Module } from '@nestjs/common';
import { BibtexService } from './bibtex.service';
import { HttpModule } from '@nestjs/axios';
import { BibtexController } from './bibtex.controller';

@Module({
  imports: [HttpModule],
  providers: [BibtexService],
  exports: [BibtexService],
  controllers: [BibtexController],
})
export class BibtexModule {}
