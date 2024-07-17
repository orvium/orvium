import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TransformerModule } from '../transformer/transformer.module';
import { ConfigurationController } from './configuration.controller';
import { Configuration, ConfigurationSchema } from './configuration.schema';
import { ConfigurationService } from './configuration.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Configuration.name, schema: ConfigurationSchema }]),
    TransformerModule,
  ],
  providers: [ConfigurationService],
  exports: [ConfigurationService],
  controllers: [ConfigurationController],
})
export class ConfigurationModule {}
