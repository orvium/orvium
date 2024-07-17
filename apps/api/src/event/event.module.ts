import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventService } from './event.service';
import { AppEvent, EventSchema } from './event.schema';
import { EventHandlerService } from './event-handler/event-handler.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: AppEvent.name, schema: EventSchema }])],
  providers: [EventService, EventHandlerService],
  exports: [EventService],
})
export class EventModule {}
