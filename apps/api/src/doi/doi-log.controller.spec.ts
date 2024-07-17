import { DoiLogController } from './doi-log.controller';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanCollections, MongooseTestingModule } from '../utils/mongoose-testing.module';
import { createCommunity, createDoiLog, createUser } from '../utils/test-data';
import { request } from 'express';
import { UnauthorizedException } from '@nestjs/common';

describe('DoiLogController', () => {
  let controller: DoiLogController;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [MongooseTestingModule.forRoot('DoiLogController')],
      providers: [],
      controllers: [DoiLogController],
    }).compile();

    controller = module.get(DoiLogController);
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    await cleanCollections(module);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get doiLog', async () => {
    const { moderator, community } = await createCommunity(module);
    const doiLog = await createDoiLog(module, { doiLog: { community: community._id } });
    const res = await controller.getDoiLog(
      { user: { sub: moderator.userId } } as unknown as typeof request,
      doiLog.resource.toHexString()
    );
    expect(res).toBeDefined();
  });

  it('should throw error if user is not authorized to get doilog', async () => {
    const { community } = await createCommunity(module);
    const doiLog = await createDoiLog(module, { doiLog: { community: community._id } });
    const user = await createUser(module);
    await expect(
      controller.getDoiLog(
        { user: { sub: user.userId } } as unknown as typeof request,
        doiLog.resource.toHexString()
      )
    ).rejects.toThrow(new UnauthorizedException('Unauthorized action moderate'));
  });
});
