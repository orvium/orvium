import { Test, TestingModule } from '@nestjs/testing';
import { OffboardingController } from './offboarding.controller';
import { createCommunity, createConversation, createMessage } from '../utils/test-data';
import { UserService } from '../users/user.service';
import { cleanCollections, MongooseTestingModule } from '../utils/mongoose-testing.module';
import { request } from 'express';
import { UnauthorizedException } from '@nestjs/common';

describe('OffboardingController', () => {
  let controller: OffboardingController;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [MongooseTestingModule.forRoot('OffboardingController')],
      controllers: [OffboardingController],
      providers: [],
    }).compile();
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    controller = module.get(OffboardingController);
    await cleanCollections(module);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should delete user', async () => {
    const { conversation, user1 } = await createConversation(module);
    await createMessage(module, conversation, user1);

    await controller.deleteProfile({
      user: { sub: user1.userId },
    } as unknown as typeof request);

    const userService = module.get(UserService);
    const exist = await userService.userModel.exists({ _id: user1._id });

    expect(exist).toBe(null);
  });

  it('should not delete user', async () => {
    const { communityOwner } = await createCommunity(module);

    await expect(
      controller.deleteProfile({
        user: { sub: communityOwner.userId },
      } as unknown as typeof request)
    ).rejects.toMatchObject(
      new UnauthorizedException('User cannot be deleted because it has communities created')
    );
  });
});
