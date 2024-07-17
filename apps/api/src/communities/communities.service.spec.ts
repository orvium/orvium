import { Test, TestingModule } from '@nestjs/testing';
import {
  createCommunity,
  createDeposit,
  createDepositSet,
  createUser,
  factoryCommunity,
  factoryUser,
} from '../utils/test-data';
import { CommunitiesService } from './communities.service';
import { UserService } from '../users/user.service';
import { cleanCollections, MongooseTestingModule } from '../utils/mongoose-testing.module';
import { CommunityDocument } from './communities.schema';
import { ModeratorRole } from './communities-moderator.schema';

describe('CommunitiesService', () => {
  let service: CommunitiesService;
  const community = factoryCommunity.build();
  let communityDocument: CommunityDocument;
  let serviceUser: UserService;
  let module: TestingModule;

  const user1 = factoryUser.build({
    communities: [],
    confirmEmailCode: { codeEmail: 'pruebas@pruebas.pruebas', attemptsLeft: 5 },
  });

  const user2 = factoryUser.build({
    communities: [],
  });

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [MongooseTestingModule.forRoot('CommunitiesService')],
      providers: [],
    }).compile();
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    service = module.get(CommunitiesService);
    serviceUser = module.get(UserService);

    await cleanCollections(module);

    communityDocument = await service.communityModel.create(community);
    await serviceUser.userModel.insertMany([user1, user2]);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find communities', async () => {
    const result = await service.find({});
    expect(result.length).toBe(1);
  });

  it('should find one community', async () => {
    const result = await service.findOneByFilter({ name: community.name });
    expect(result?.name).toBe(community.name);
  });

  it('should find by id', async () => {
    const result = await service.findById(communityDocument._id.toHexString());
    expect(result?.name).toBe(communityDocument.name);
  });

  it('should exist', async () => {
    const exist = await service.exists({ name: community.name });
    expect(exist).toBeTruthy();
    const noExist = await service.exists({ name: 'Test xxx' });
    expect(noExist).toBeFalsy();
  });

  it('should export community submissions', async () => {
    const { community, communityOwner } = await createCommunity(module);
    const { preprint, published } = await createDepositSet(module, community);
    await createDeposit(module, {
      community,
      deposit: {
        assignee: communityOwner._id,
      },
    });
    const res = await service.exportSubmisionsToCsv(community._id.toHexString());
    expect(res).toStrictEqual(expect.stringContaining(`"${preprint.title}"`));
    expect(res).toStrictEqual(expect.stringContaining(`"${published.title}"`));
  });

  it('should not export community submissions if no submissions are present', async () => {
    const { community } = await createCommunity(module);
    const res = await service.exportSubmisionsToCsv(community._id.toHexString());

    expect(res).toBe('');
  });

  it('should get moderator communities', async () => {
    const { community: communityAsMember } = await createCommunity(module);
    const user = await createUser(module, {
      user: {
        communities: [communityAsMember._id],
      },
    });
    let res = await service.getModeratorCommunities(user._id);

    expect(res.length).toBe(0);

    const { community } = await createCommunity(module);
    await service.addModerator(community, user, ModeratorRole.moderator);
    res = await service.getModeratorCommunities(user._id);
    expect(res.length).toBe(1);
    expect(res.pop()?.toHexString()).toBe(community._id.toHexString());

    // add some other communities as owner
    const { community: otherCommunity } = await createCommunity(module);
    await service.addModerator(otherCommunity, user, ModeratorRole.owner);
    res = await service.getModeratorCommunities(user._id);
    expect(res.length).toBe(2);
  });
});
