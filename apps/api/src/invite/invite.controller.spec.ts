import { Test, TestingModule } from '@nestjs/testing';
import { InviteController } from './invite.controller';
import { DepositService } from '../deposit/deposit.service';
import { InviteService } from './invite.service';
import { EventService } from '../event/event.service';
import { InviteStatus, InviteType } from './invite.schema';
import { createDeposit, createInvite, createUser, factoryTemplate } from '../utils/test-data';
import { request } from 'express';
import { ForbiddenException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateInviteDTO } from '../dtos/invite/invite-create.dto';
import { InviteUpdateDTO } from '../dtos/invite/invite-update.dto';
import { assertIsDefined, encryptJson, generateObjectId } from '../utils/utils';
import { cleanCollections, MongooseTestingModule } from '../utils/mongoose-testing.module';
import { TemplateService } from '../template/template.service';

describe('InviteController', () => {
  let controller: InviteController;
  let depositService: DepositService;
  let eventService: EventService;
  let inviteService: InviteService;
  let module: TestingModule;
  let templateService: TemplateService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [MongooseTestingModule.forRoot('InviteController')],
      controllers: [InviteController],
      providers: [],
    }).compile();
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    controller = module.get(InviteController);
    depositService = module.get(DepositService);
    eventService = module.get(EventService);
    inviteService = module.get(InviteService);
    templateService = module.get(TemplateService);
    await cleanCollections(module);

    const template = factoryTemplate.build({
      name: 'review-invitation',
    });

    await templateService.templateModel.insertMany(template);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get all the invitations for the deposit id if you are the owner', async () => {
    const { deposit, author } = await createDeposit(module, {
      deposit: { canAuthorInviteReviewers: true },
    });

    const createInviteDTO: CreateInviteDTO = {
      inviteType: InviteType.review,
      addressee: 'reviewer@email.com',
      data: {
        depositId: deposit._id.toHexString(),
        reviewerName: 'Example',
        message: 'test-data',
      },
    };
    await controller.createInvite(
      { user: { sub: author.userId } } as unknown as typeof request,
      createInviteDTO
    );
    const result = await controller.getDepositInvites(
      { user: { sub: author.userId } } as unknown as typeof request,
      deposit._id.toHexString()
    );
    expect(result.length).toBe(1);
    expect(result[0].message).toBe(undefined);
  });

  it('should raise exception when user can not invite reviewers', async () => {
    const { deposit } = await createDeposit(module);
    const user = await createUser(module);
    await expect(
      controller.getDepositInvites(
        { user: { sub: user.userId } } as unknown as typeof request,
        deposit._id.toHexString()
      )
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should raise exception when user not exist', async () => {
    const { deposit } = await createDeposit(module);
    await expect(
      controller.getDepositInvites(
        { user: { sub: 'xxx' } } as unknown as typeof request,
        deposit._id.toHexString()
      )
    ).rejects.toThrow(NotFoundException);
  });

  it('should raise exception when deposit not exist', async () => {
    const user = await createUser(module);
    await expect(
      controller.getDepositInvites(
        { user: { sub: user.userId } } as unknown as typeof request,
        generateObjectId()
      )
    ).rejects.toThrow(NotFoundException);
  });

  it('should create a new invite', async () => {
    const { deposit, author } = await createDeposit(module, {
      deposit: { canAuthorInviteReviewers: true },
    });

    const createInviteDTO: CreateInviteDTO = {
      inviteType: InviteType.review,
      addressee: 'reviewer@email.com',
      data: {
        depositId: deposit._id.toHexString(),
        reviewerName: 'Example',
        message: 'test message',
      },
    };
    const result = await controller.createInvite(
      { user: { sub: author.userId } } as unknown as typeof request,
      createInviteDTO
    );
    expect(result.sender).toStrictEqual(author._id.toHexString());
  });

  it('should send a test invite', async () => {
    const { deposit, author } = await createDeposit(module, {
      deposit: { canAuthorInviteReviewers: true },
    });

    const spy = jest.spyOn(templateService, 'getHTMLFromEvent').mockImplementation();
    const createInviteDTO: CreateInviteDTO = {
      inviteType: InviteType.review,
      addressee: 'reviewer@email.com',
      data: {
        depositId: deposit._id.toHexString(),
        reviewerName: 'Example',
        message: 'test message',
      },
    };
    await controller.postInvitePreview(
      { user: { sub: author.userId } } as unknown as typeof request,
      createInviteDTO
    );
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should fail createInvite when user not exist', async () => {
    const { deposit } = await createDeposit(module, {
      deposit: { canAuthorInviteReviewers: true },
    });
    const createInviteDTO: CreateInviteDTO = {
      inviteType: InviteType.review,
      addressee: 'reviewer@email.com',
      data: {
        depositId: deposit._id.toHexString(),
        reviewerName: 'Example',
        message: 'test message',
      },
    };
    await expect(
      controller.createInvite(
        { user: { sub: 'xxx' } } as unknown as typeof request,
        createInviteDTO
      )
    ).rejects.toThrow(NotFoundException);
  });

  it('should fail createUser when deposit not exist', async () => {
    const user = await createUser(module);
    const createInviteDTO: CreateInviteDTO = {
      inviteType: InviteType.review,
      addressee: 'reviewer@email.com',
      data: {
        depositId: generateObjectId(),
        reviewerName: 'Example',
        message: 'test message',
      },
    };
    await expect(
      controller.createInvite(
        { user: { sub: user.userId } } as unknown as typeof request,
        createInviteDTO
      )
    ).rejects.toThrow(NotFoundException);
  });

  it('should work when the user self-invite', async () => {
    const { deposit, author } = await createDeposit(module, {
      deposit: { canAuthorInviteReviewers: true },
    });
    assertIsDefined(author.email);
    const createInviteDTO: CreateInviteDTO = {
      inviteType: InviteType.review,
      addressee: author.email,
      data: {
        depositId: deposit._id.toHexString(),
        reviewerName: 'Example',
        message: 'test message',
      },
    };

    const result = await controller.createInvite(
      { user: { sub: author.userId } } as unknown as typeof request,
      createInviteDTO
    );

    expect(result.sender).toStrictEqual(author._id.toHexString());
    expect(result.addressee).toStrictEqual(author.email);
  });

  it('should raise exception when invite already exists', async () => {
    const { deposit, author } = await createDeposit(module, {
      deposit: { canAuthorInviteReviewers: true },
    });
    await createInvite(module, {
      sender: author,
      invite: {
        addressee: 'example@example.com',
        data: {
          depositId: deposit._id,
        },
      },
    });
    const createInviteDTO: CreateInviteDTO = {
      inviteType: InviteType.review,
      addressee: 'example@example.com',
      data: {
        depositId: deposit._id.toHexString(),
        reviewerName: 'Example',
        message: 'test message',
      },
    };
    await expect(
      controller.createInvite(
        { user: { sub: author.userId } } as unknown as typeof request,
        createInviteDTO
      )
    ).rejects.toThrow(ForbiddenException);
  });

  it('should get all user invites', async () => {
    const user = await createUser(module);
    const { invite } = await createInvite(module, {
      invite: { addressee: user.email, status: InviteStatus.accepted, message: 'test-message' },
    });
    const result = await controller.myInvites(
      {
        user: { sub: user.userId },
      } as unknown as typeof request,
      { status: InviteStatus.accepted }
    );

    expect(result.invites.length).toBe(1);
    expect(result.invites[0]._id).toStrictEqual(invite._id.toHexString());
    expect(result.invites[0].message).toBe('test-message');
  });

  it('should get paginated user invites', async () => {
    const invitedUser = await createUser(module);
    const sender = await createUser(module);
    const { deposit, community } = await createDeposit(module);
    for (const {} of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]) {
      await createInvite(module, {
        sender,
        community,
        deposit,
        invite: {
          addressee: invitedUser.email,
          status: InviteStatus.pending,
          inviteType: InviteType.review,
        },
      });
    }

    let result = await controller.myInvites(
      {
        user: { sub: invitedUser.userId },
      } as unknown as typeof request,
      {}
    );
    expect(result.count).toBe(11);
    expect(result.invites.length).toBe(10);
    result = await controller.myInvites(
      {
        user: { sub: invitedUser.userId },
      } as unknown as typeof request,
      { page: 1 }
    );

    expect(result.invites.length).toBe(1);
  });

  it('should fail myInvites when user not exist', async () => {
    await expect(
      controller.myInvites({ user: { sub: 'xxx' } } as unknown as typeof request, {})
    ).rejects.toThrow(NotFoundException);
  });

  it('should get all user sent invites', async () => {
    const user = await createUser(module);
    const { invite } = await createInvite(module, {
      sender: user,
      invite: { message: 'test-message' },
    });
    const result = await controller.mySentInvites(
      {
        user: { sub: user.userId },
      } as unknown as typeof request,
      {}
    );
    expect(result.count).toBe(1);
    expect(result.invites[0]._id).toStrictEqual(invite._id.toHexString());
    expect(result.invites[0].message).toBe('test-message');
  });

  it('should fail mySentInvites when user not exist', async () => {
    await expect(
      controller.mySentInvites({ user: { sub: 'xxx' } } as unknown as typeof request, {})
    ).rejects.toThrow(NotFoundException);
  });

  it('should check if user has been invited', async () => {
    const invitedUser = await createUser(module, { user: { email: 'test@example.com' } });
    const notInvitedUser = await createUser(module);
    const { deposit, community } = await createDeposit(module);
    await createInvite(module, {
      sender: notInvitedUser,
      community,
      deposit,
      invite: {
        addressee: invitedUser.email,
        status: InviteStatus.pending,
      },
    });
    let result = await controller.hasBeenInvited(
      { user: { sub: invitedUser.userId } } as unknown as typeof request,
      deposit._id.toHexString()
    );

    expect(result).toBeTruthy();

    result = await controller.hasBeenInvited(
      { user: { sub: notInvitedUser.userId } } as unknown as typeof request,
      deposit._id.toHexString()
    );
    expect(result).toBeFalsy();
  });

  it('should fail createDeposit when user not exist', async () => {
    const { deposit } = await createDeposit(module, {
      deposit: { canAuthorInviteReviewers: true },
    });
    await expect(
      controller.hasBeenInvited(
        { user: { sub: 'xxx' } } as unknown as typeof request,
        deposit._id.toHexString()
      )
    ).rejects.toThrow(NotFoundException);
  });

  it('should update invite', async () => {
    const invitedUser = await createUser(module);
    const { deposit } = await createDeposit(module);
    const { invite } = await createInvite(module, {
      deposit,
      invite: {
        status: InviteStatus.pending,
        addressee: invitedUser.email,
      },
    });
    const inviteUpdateDTO: InviteUpdateDTO = {
      status: InviteStatus.accepted,
    };
    const spy = jest.spyOn(eventService, 'create');
    const result = await controller.updateInvite(
      { user: { sub: invitedUser.userId } } as unknown as typeof request,
      inviteUpdateDTO,
      invite._id.toHexString()
    );
    expect(result.status).toBe(InviteStatus.accepted);
    expect(spy).toHaveBeenCalled();
  });

  it('should update invite reject', async () => {
    const { deposit, author } = await createDeposit(module, {
      deposit: { canAuthorInviteReviewers: true },
    });
    const addressee = await createUser(module);
    const { invite } = await createInvite(module, {
      sender: author,
      deposit: deposit,
      invite: {
        addressee: addressee.email,
      },
    });

    const spy = jest.spyOn(eventService, 'create');
    const result = await controller.updateInvite(
      { user: { sub: addressee.userId } } as unknown as typeof request,
      { status: InviteStatus.rejected },
      invite._id.toHexString()
    );
    expect(result.status).toBe(InviteStatus.rejected);
    expect(spy).toHaveBeenCalled();
  });

  it('should fail updateInvite when user not exist', async () => {
    const { invite } = await createInvite(module, {});
    const inviteUpdateDTO: InviteUpdateDTO = {
      status: InviteStatus.accepted,
    };
    await expect(
      controller.updateInvite(
        { user: { sub: 'xxx' } } as unknown as typeof request,
        inviteUpdateDTO,
        invite._id.toHexString()
      )
    ).rejects.toThrow(NotFoundException);
  });

  it('should raise exception when user can not update invite', async () => {
    const user = await createUser(module);
    const { invite } = await createInvite(module, {});
    const inviteUpdateDTO: InviteUpdateDTO = {
      status: InviteStatus.accepted,
    };
    await expect(
      controller.updateInvite(
        { user: { sub: user.userId } } as unknown as typeof request,
        inviteUpdateDTO,
        invite._id.toHexString()
      )
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should raise exception when invite not exist', async () => {
    const inviteUpdateDTO: InviteUpdateDTO = {
      status: InviteStatus.accepted,
    };
    const user = await createUser(module);
    await expect(
      controller.updateInvite(
        { user: { sub: user.userId } } as unknown as typeof request,
        inviteUpdateDTO,
        generateObjectId()
      )
    ).rejects.toThrow(NotFoundException);
  });

  it('should fail createInvite when deposit not exist', async () => {
    const user = await createUser(module);
    const { invite } = await createInvite(module, {
      invite: { addressee: user.email },
    });
    const inviteUpdateDTO: InviteUpdateDTO = {
      status: InviteStatus.accepted,
    };
    await expect(
      controller.updateInvite(
        { user: { sub: user.userId } } as unknown as typeof request,
        inviteUpdateDTO,
        invite._id.toHexString()
      )
    ).rejects.toThrow(NotFoundException);
  });

  it('should reject invite using token', async () => {
    const { invite } = await createInvite(module, {});
    const today = new Date();
    const tomorrow = today.setDate(today.getDate() + 1);
    const rejectToken = encryptJson({
      expiration: tomorrow,
      id: invite._id,
      status: InviteStatus.rejected,
    });
    const result = await controller.inviteReviewerToken(rejectToken);
    expect(result.message).toBe('Invitation rejected');
    const rejectedInviteDocument = await inviteService.inviteModel.findOne({
      _id: invite._id,
    });
    assertIsDefined(rejectedInviteDocument);
    expect(rejectedInviteDocument.status).toBe(InviteStatus.rejected);
  });

  it('should accept invite using token', async () => {
    const { deposit } = await createDeposit(module);
    const { invite } = await createInvite(module, { deposit });

    const spyEvent = jest.spyOn(eventService, 'create');
    const today = new Date();
    const tomorrow = today.setDate(today.getDate() + 1);
    const rejectToken = encryptJson({
      expiration: tomorrow,
      id: invite._id,
      status: InviteStatus.accepted,
    });
    const result = await controller.inviteReviewerToken(rejectToken);
    expect(result.message).toBe('Invitation accepted');
    const rejectedInviteDocument = await inviteService.inviteModel.findOne({
      _id: invite._id,
    });
    assertIsDefined(rejectedInviteDocument);
    expect(rejectedInviteDocument.status).toBe(InviteStatus.accepted);
    expect(spyEvent).toHaveBeenCalled();
  });

  it('should not update accepted/rejected invite', async () => {
    const { deposit } = await createDeposit(module);
    const user = await createUser(module);
    const { invite: invite1 } = await createInvite(module, {
      deposit,
      invite: {
        addressee: user.email,
        status: InviteStatus.rejected,
      },
    });

    const today = new Date();
    const tomorrow = today.setDate(today.getDate() + 1);
    const rejectToken = encryptJson({
      expiration: tomorrow,
      id: invite1._id,
      status: InviteStatus.accepted,
    });
    const result = await controller.inviteReviewerToken(rejectToken);
    expect(result.message).toBe('Invitation already accepted or rejected');
  });

  it('should fail inviteReviewerToken when invite not exist', async () => {
    const today = new Date();
    const tomorrow = today.setDate(today.getDate() + 1);
    const rejectToken = encryptJson({
      expiration: tomorrow,
      id: '6087d8f758c481eb3e4a9e10',
      status: InviteStatus.accepted,
    });
    await expect(controller.inviteReviewerToken(rejectToken)).rejects.toThrow(NotFoundException);
  });

  // TODO Activate later on again
  // it('should raise exception when invite has expired', async () => {
  //   const today = new Date();
  //   const yesterday = today.setDate(today.getDate() - 1);
  //   const rejectToken = encryptJson({ expiration: yesterday, id: inviteDocument._id, status: INVITE_STATUS.accepted });
  //   await expect(controller.inviteReviewerToken(
  //     rejectToken
  //   )).rejects.toThrow(UnauthorizedException);
  // });

  it('should raise exception when invite deposit not exist', async () => {
    const today = new Date();
    const { deposit } = await createDeposit(module);
    const { invite } = await createInvite(module, { deposit });
    await depositService.depositModel.deleteOne(deposit._id);

    const tomorrow = today.setDate(today.getDate() + 1);
    const rejectToken = encryptJson({
      expiration: tomorrow,
      id: invite._id,
      status: InviteStatus.accepted,
    });
    await expect(controller.inviteReviewerToken(rejectToken)).rejects.toThrow(NotFoundException);
  });

  it('should detect invalid status', async () => {
    const { invite } = await createInvite(module, {});
    const today = new Date();
    const tomorrow = today.setDate(today.getDate() + 1);
    const rejectToken = encryptJson({
      expiration: tomorrow,
      id: invite._id,
      status: 'xxx',
    });
    const result = await controller.inviteReviewerToken(rejectToken);
    expect(result.message).toBe('Invalid invitation status');
  });

  it('should throw exception if author doesnt have permissions to invite reviewers', async () => {
    const { deposit, author } = await createDeposit(module);
    const createInviteDTO: CreateInviteDTO = {
      addressee: 'example@example.com,',
      inviteType: InviteType.review,
      data: {
        depositId: deposit._id.toHexString(),
        reviewerName: 'Example',
        message: 'test message',
      },
    };

    await expect(
      controller.createInvite(
        { user: { sub: author.userId } } as unknown as typeof request,
        createInviteDTO
      )
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should find a invite', async () => {
    const sender = await createUser(module);
    const { invite } = await createInvite(module, { sender });
    const result = await inviteService.findOne({ _id: invite._id.toHexString() });
    expect(result?._id.toHexString()).toBe(invite._id.toHexString());
  });

  it('should find without defining limit and skip', async () => {
    const sender = await createUser(module);

    await createInvite(module, { sender });
    await createInvite(module, { sender });

    const result = await inviteService.findWithLimitExec({ sender: sender._id }, 10);
    expect(result.length).toBe(2);
  });
});
