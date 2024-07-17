import { Test, TestingModule } from '@nestjs/testing';
import { FeedbackService } from './feedback.service';
import { MongooseModule } from '@nestjs/mongoose';
import { environment } from '../environments/environment';
import { Feedback, FeedbackSchema } from './feedback.schema';
import { assertIsDefined } from '../utils/utils';
import { FeedbackDTO } from '../dtos/feedback.dto';

describe('FeedbackService', () => {
  let service: FeedbackService;
  let module: TestingModule;

  const feedback: FeedbackDTO = {
    email: 'test@example.com',
    description: 'test',
    data: {},
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [FeedbackService],
      imports: [
        MongooseModule.forRoot(environment.test.mongoUri),
        MongooseModule.forFeature([{ name: Feedback.name, schema: FeedbackSchema }]),
      ],
    }).compile();

    service = module.get(FeedbackService);
    await service.feedbackModel.deleteMany();
    await service.feedbackModel.insertMany([feedback]);
  });

  afterEach(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find one', async () => {
    const value = await service.findOne({ email: 'test@example.com' });
    expect(value?.email).toBe(feedback.email);
  });

  it('should find one by id', async () => {
    const value = await service.findOne({ email: 'test@example.com' });
    assertIsDefined(value);
    const f = await service.findById(value._id);
    expect(f?.email).toBe(feedback.email);
  });

  it('should create', async () => {
    await service.create(feedback);
    feedback.screenshot =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAALQAAAC0CAYAAAA9zQYyAAAABGdBTUEAALG';
    await service.create(feedback);
    const values = await service.feedbackModel.find({});
    expect(values.length).toBe(3);
  });
});
