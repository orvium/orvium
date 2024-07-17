import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { environment } from '../environments/environment';
import { Conversation, ConversationSchema } from './conversations.schema';
import { ConversationsService } from './conversations.service';
import { AwsStorageService } from '../common/aws-storage-service/aws-storage.service';

describe('ConversationsService', () => {
  let service: ConversationsService;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(environment.test.mongoUri),
        MongooseModule.forFeature([
          {
            name: Conversation.name,
            schema: ConversationSchema,
            collection: 'conversationController-conversation',
          },
        ]),
      ],
      providers: [ConversationsService, { provide: AwsStorageService, useValue: {} }],
    }).compile();

    service = module.get(ConversationsService);
  });

  afterEach(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
