import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { createAdmin, createUser, factoryCommunity } from '../utils/test-data';
import { CommunitiesService } from '../communities/communities.service';
import { assertIsDefined } from '../utils/utils';
import { MongooseTestingModule } from '../utils/mongoose-testing.module';

describe('UsersService', () => {
  let service: UserService;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [MongooseTestingModule.forRoot('UsersService')],
      providers: [],
    }).compile();
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    service = module.get(UserService);
    await service.userModel.deleteMany();
    await module.get(CommunitiesService).communityModel.deleteMany();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find users', async () => {
    await createUser(module);
    const result = await service.find({});
    expect(result.length).toBe(1);
  });

  it('should find one user', async () => {
    const user = await createUser(module);
    const result = await service.findOne({ nickname: user.nickname });
    assertIsDefined(result);
    expect(result.nickname).toBe(user.nickname);
  });

  it('should find by id', async () => {
    const user = await createUser(module);
    const result = await service.findById(user._id);
    assertIsDefined(result);
    expect(result.userId).toBe(user.userId);
  });

  it('should add community to user', async () => {
    const user = await createUser(module);
    const communityDocument = await module
      .get(CommunitiesService)
      .communityModel.create(factoryCommunity.build());
    const communityWithUser = await service.addCommunity(user, communityDocument);
    expect(communityWithUser.followersCount).toBe(1);

    // Adding the same user again should not increase the follower count
    const communityWithUserRepeated = await service.addCommunity(user, communityDocument);
    expect(communityWithUserRepeated.followersCount).toBe(1);
  });

  it('should getLoggedUser when impersonating', async () => {
    const user = await createUser(module);
    const admin = await createAdmin(module);
    admin.impersonatedUser = user.userId;
    await admin.save();

    const loggedUser = await service.getLoggedUser({
      user: { sub: admin.userId },
    } as unknown as Express.Request);
    assertIsDefined(loggedUser);
    expect(loggedUser._id.toHexString()).toBe(user._id.toHexString());

    const loggedUserSkipImpersonate = await service.getLoggedUser(
      { user: { sub: admin.userId } } as unknown as Express.Request,
      true
    );
    assertIsDefined(loggedUserSkipImpersonate);
    expect(loggedUserSkipImpersonate._id.toHexString()).toBe(admin._id.toHexString());
  });

  it('should getLoggedUser', async () => {
    const user = await createUser(module);
    const spy = jest.spyOn(service.userModel, 'findOne');

    const loggedUser = await service.getLoggedUser({
      user: { sub: user.userId },
    } as unknown as Express.Request);
    assertIsDefined(loggedUser);
    expect(loggedUser._id.toHexString()).toBe(user._id.toHexString());
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should getLoggedUser null when does not exist', async () => {
    await createUser(module);
    const spy = jest.spyOn(service.userModel, 'findOne');

    const nullUser = await service.getLoggedUser({
      user: { sub: 'asdfasdfasdf' },
    } as unknown as Express.Request);
    expect(nullUser).toBeNull();

    const nullUser2 = await service.getLoggedUser({
      user: 'anonymous',
    } as unknown as Express.Request);
    expect(nullUser2).toBeNull();

    const nullUser3 = await service.getLoggedUser({} as unknown as Express.Request);
    expect(nullUser3).toBeNull();

    expect(spy).toHaveBeenCalledTimes(1);
  });
});
