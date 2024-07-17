import { Test, TestingModule } from '@nestjs/testing';
import { EventService } from './event.service';
import { EventStatus, RETRY_NUMBER } from './event.schema';
import { CommentCreatedEvent } from './events/commentCreatedEvent';
import { createUser } from '../utils/test-data';
import { ConfirmationEmailEvent } from './events/confirmationEmailEvent';
import { Require_id, Types } from 'mongoose';
import { Commentary } from '../comments/comments.schema';
import { MongooseTestingModule } from '../utils/mongoose-testing.module';

describe('EventService', () => {
  let service: EventService;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [MongooseTestingModule.forRoot('EventService')],
    }).compile();

    service = module.get(EventService);
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    await service.eventModel.deleteMany();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create and find event', async () => {
    const user = await createUser(module);
    const event = new CommentCreatedEvent({
      comment: {
        _id: new Types.ObjectId(),
        resource: new Types.ObjectId(),
        tags: [],
        content: 'Comment content',
        parent: new Types.ObjectId(),
        resourceModel: 'Deposit',
        user_id: user._id,
        hasReplies: false,
      } as unknown as Require_id<Commentary>,
      user: user.toJSON(),
    });
    const eventDocument = await service.create(event.getEventDTO());
    expect(eventDocument.status).toBe(EventStatus.PENDING);
    const findEventDocument = await service.findOne({ _id: eventDocument._id });
    expect(findEventDocument).toBeDefined();
    expect(findEventDocument?.status).toBe(EventStatus.PENDING);
  });

  it('should change event status', async () => {
    const event = new ConfirmationEmailEvent({ code: '', email: '' });
    let eventDocument = await service.create(event.getEventDTO());
    expect(eventDocument.status).toBe(EventStatus.PENDING);
    eventDocument = await service.setAsProcessing(eventDocument);
    expect(eventDocument.status).toBe(EventStatus.PROCESSING);
    eventDocument = await service.setAsProcessed(eventDocument);
    expect(eventDocument.status).toBe(EventStatus.PROCESSED);
    eventDocument = await service.setAsFailed(eventDocument);
    expect(eventDocument.status).toBe(EventStatus.FAILED);
  });

  it('should set failed when retry count is reached', async () => {
    const event = new ConfirmationEmailEvent({ code: '', email: '' });
    let eventDocument = await service.create(event.getEventDTO());
    eventDocument = await service.setAsProcessing(eventDocument);
    expect(eventDocument.status).toBe(EventStatus.PROCESSING);
    eventDocument.retryCount = RETRY_NUMBER;
    await eventDocument.save();
    eventDocument = await service.setAsPending(eventDocument);
    expect(eventDocument.status).toBe(EventStatus.FAILED);
  });
});
