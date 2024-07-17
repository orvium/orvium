import { Test, TestingModule } from '@nestjs/testing';
import { EventHandlerService } from './event-handler.service';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EventService } from '../event.service';

jest.mock('../event.service');

describe('EventHandlerService', () => {
  let service: EventHandlerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EventHandlerService, EventService],
      imports: [
        EventEmitterModule.forRoot({
          wildcard: true,
        }),
      ],
    }).compile();

    service = module.get(EventHandlerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
