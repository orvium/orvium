import { Test, TestingModule } from '@nestjs/testing';
import { SessionService } from './session.service';
import { createCommunity, createSession } from '../utils/test-data';
import { cleanCollections, MongooseTestingModule } from '../utils/mongoose-testing.module';
import { assertIsDefined } from '../utils/utils';

describe('SessionService', () => {
  let service: SessionService;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [MongooseTestingModule.forRoot('SessionService')],
      providers: [],
    }).compile();
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    service = module.get(SessionService);
    await cleanCollections(module);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should get community sessions', async () => {
    const { community } = await createCommunity(module);
    await createSession(module, community);
    const result = await service.find({ community: community._id });
    expect(result.length).toBe(1);
  });

  it('should get session', async () => {
    const { community } = await createCommunity(module);
    const { session } = await createSession(module, community);
    session.newTrackTimestamp = community.newTracks[0].timestamp;
    await session.save();
    const result = await service.findOneByFilter({ newTrackTimestamp: session.newTrackTimestamp });
    assertIsDefined(result);
    expect(result.community.toString()).toBe(session.community.toHexString());
  });

  it('should delete session', async () => {
    const { community } = await createCommunity(module);
    const { session } = await createSession(module, community);
    await service.deleteSession(session._id);
    const result = await service.find({ community: community._id });
    expect(result.length).toBe(0);
  });
});
