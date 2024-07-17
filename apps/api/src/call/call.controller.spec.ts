import { CallController } from './call.controller';
import { CallService } from './call.service';
import { Call, CallDocument, CallType } from './call.schema';
import { factoryCommunity, factoryUser } from '../utils/test-data';
import { generateObjectId } from '../utils/utils';
import { Test, TestingModule } from '@nestjs/testing';
import { CommunityDocument } from '../communities/communities.schema';
import { CommunitiesService } from '../communities/communities.service';
import { NotFoundException } from '@nestjs/common';
import { AuthorizationService } from '../authorization/authorization.service';
import { UserDocument } from '../users/user.schema';
import { UserService } from '../users/user.service';
import { request } from 'express';
import { CallUpdateDTO } from '../dtos/call/call-update.dto';
import { CallCreateDTO } from '../dtos/call/call-create.dto';
import { MongooseTestingModule } from '../utils/mongoose-testing.module';
import { AnyKeys } from 'mongoose';

describe('CallController', () => {
  let controller: CallController;
  let callService: CallService;
  let communitiesService: CommunitiesService;
  let authorizationService: AuthorizationService;
  let communityDocument: CommunityDocument;
  let userService: UserService;
  let callDocument: CallDocument;
  let userDocument: UserDocument;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      controllers: [CallController],
      imports: [MongooseTestingModule.forRoot('CallController')],
      providers: [],
    }).compile();
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    controller = module.get(CallController);
    callService = module.get(CallService);
    userService = module.get(UserService);
    communitiesService = module.get(CommunitiesService);
    authorizationService = module.get(AuthorizationService);

    await communitiesService.communityModel.deleteMany();
    communityDocument = await communitiesService.communityModel.create(factoryCommunity.build());

    const call: AnyKeys<Call> = {
      title: 'Call',
      description: 'description',
      callType: CallType.papers,
      scope: 'scope',
      guestEditors: 'John Doe',
      disciplines: ['Urbanism'],
      contact: 'Helen Kingsley',
      contactEmail: 'helenkingsley@mail.com',
      visible: false,
      community: communityDocument._id,
    };
    await userService.userModel.deleteMany();
    const user1 = factoryUser.build({ roles: ['admin'] });

    await userService.userModel.create(user1);

    userDocument = (await userService.userModel.findOne({ userId: user1.userId })) as UserDocument;

    await callService.callModel.deleteMany();
    callDocument = await callService.callModel.create(call);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get calls', async () => {
    jest.spyOn(authorizationService, 'getSubjectActions').mockResolvedValue(['moderate']);
    const result = await controller.getCalls(
      { user: { sub: userDocument.userId } } as unknown as typeof request,
      communityDocument._id.toHexString()
    );
    expect(result.length).toBe(1);
  });

  it('should get call', async () => {
    jest.spyOn(authorizationService, 'getSubjectActions').mockResolvedValue(['moderate']);
    const newCall = await controller.getCall(
      { user: { sub: userDocument.userId } } as unknown as typeof request,
      callDocument._id.toHexString()
    );
    expect(newCall.title).toEqual(callDocument.title);
  });

  it('should raise exception when call not exist', async () => {
    await expect(
      controller.getCall(
        { user: { sub: userDocument.userId } } as unknown as typeof request,
        generateObjectId()
      )
    ).rejects.toThrow(NotFoundException);
  });

  it('should create call', async () => {
    const community = communityDocument;
    const callCreate: CallCreateDTO = {
      title: 'A created call',
      community: community._id.toHexString(),
    };

    const call = await controller.createCall(
      { user: { sub: userDocument.userId } } as unknown as typeof request,
      callCreate
    );
    expect(call.title).toStrictEqual(callCreate.title);
  });

  it('should update call', async () => {
    const payload: CallUpdateDTO = { title: 'Updated call' };
    const call = await controller.updateCall(
      { user: { sub: userDocument.userId } } as unknown as typeof request,
      payload,
      callDocument._id.toHexString()
    );
    expect(call.title).toBe('Updated call');
  });

  it('should delete call', async () => {
    jest.spyOn(authorizationService, 'getSubjectActions').mockResolvedValue(['moderate']);
    const newCall = await controller.getCall(
      { user: { sub: userDocument.userId } } as unknown as typeof request,
      callDocument._id.toHexString()
    );
    await controller.deleteCall(
      { user: { sub: userDocument.userId } } as unknown as typeof request,
      newCall._id
    );
    await expect(
      controller.getCall(
        { user: { sub: userDocument.userId } } as unknown as typeof request,
        newCall._id
      )
    ).rejects.toThrow(NotFoundException);
  });
});
