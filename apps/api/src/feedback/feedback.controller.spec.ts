import { Test, TestingModule } from '@nestjs/testing';
import { FeedbackController } from './feedback.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { environment } from '../environments/environment';
import { FeedbackService } from './feedback.service';
import { Feedback, FeedbackSchema } from './feedback.schema';
import { EventEmitter2 } from '@nestjs/event-emitter';

jest.mock('../event/event.service');
jest.mock('@nestjs/event-emitter');

describe('Feedback Controller', () => {
  let controller: FeedbackController;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(environment.test.mongoUri),
        MongooseModule.forFeature([{ name: Feedback.name, schema: FeedbackSchema }]),
      ],
      providers: [FeedbackService, EventEmitter2],
      controllers: [FeedbackController],
    }).compile();

    controller = module.get(FeedbackController);
  });

  afterEach(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
