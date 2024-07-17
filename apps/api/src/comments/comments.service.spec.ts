import { Test, TestingModule } from '@nestjs/testing';
import { CommentsService } from './comments.service';
import { MongooseTestingModule } from '../utils/mongoose-testing.module';

describe('CommentsService', () => {
  let service: CommentsService;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      controllers: [],
      imports: [MongooseTestingModule.forRoot('CommentsService')],
      providers: [],
    }).compile();
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    service = module.get(CommentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
