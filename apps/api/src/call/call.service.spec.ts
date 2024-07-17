import { CommunityDocument } from '../communities/communities.schema';
import { factoryCommunity } from '../utils/test-data';
import { CallService } from './call.service';
import { Call, CallType } from './call.schema';
import { Test, TestingModule } from '@nestjs/testing';
import { CommunitiesService } from '../communities/communities.service';
import { cleanCollections, MongooseTestingModule } from '../utils/mongoose-testing.module';

describe('CallsService', () => {
  let service: CallService;
  let communityDocument: CommunityDocument;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [MongooseTestingModule.forRoot('CallService')],
      providers: [],
    }).compile();
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    service = module.get(CallService);
    await cleanCollections(module);

    const communityService = module.get(CommunitiesService);

    communityDocument = await communityService.create(factoryCommunity.build());
    const call: Call = {
      title: 'Call',
      description: 'Description',
      callType: CallType.papers,
      scope: '',
      guestEditors: 'John Doe',
      disciplines: ['Social Sciences'],
      contact: 'contact',
      contactEmail: 'contact@gmail.com',
      visible: false,
      community: communityDocument._id,
    };
    await service.callModel.insertMany([call]);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find calls', async () => {
    const result = await service.find({ community: communityDocument._id });
    expect(result.length).toBe(1);
  });
});
