import { Test, TestingModule } from '@nestjs/testing';
import { UserDocument } from '../users/user.schema';
import { UserService } from '../users/user.service';
import { factoryUser } from '../utils/test-data';
import { request } from 'express';
import { assertIsDefined } from '../utils/utils';
import { MongooseTestingModule } from '../utils/mongoose-testing.module';
import { MessagesService } from './messages.service';
import { MessageController } from './message.controller';
import { ConversationDocument } from '../conversations/conversations.schema';
import { ConversationsService } from '../conversations/conversations.service';

describe('MessageController', () => {
  let controller: MessageController;
  let userDocument1: UserDocument;
  let userDocument2: UserDocument;
  let userService: UserService;
  let conversationService: ConversationsService;
  let messageService: MessagesService;
  let module: TestingModule;
  let conversationDocument: ConversationDocument;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [MongooseTestingModule.forRoot('MessageController')],
      controllers: [MessageController],
      providers: [],
    }).compile();
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    controller = module.get(MessageController);
    userService = module.get(UserService);
    conversationService = module.get(ConversationsService);
    messageService = module.get(MessagesService);

    await userService.userModel.deleteMany();
    userDocument1 = await userService.userModel.create(factoryUser.build({ roles: ['admin'] }));
    userDocument2 = await userService.userModel.create(factoryUser.build());

    await conversationService.conversationModel.deleteMany();
    await conversationService.conversationModel.create({
      participants: [userDocument1._id, userDocument2._id],
    });
    conversationDocument = (await conversationService.conversationModel.findOne({
      participants: userDocument1._id,
    })) as ConversationDocument;
    await messageService.messageModel.deleteMany();

    for (let i = 0; i < 10; i++) {
      await messageService.messageModel.create({
        content: `test-${i + 1}`,
        conversation: conversationDocument._id,
        createdAt: new Date(),
        sender: userDocument1._id,
      });
    }
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get conversation messages', async () => {
    const messages = await controller.getConversationMessages(
      { user: { sub: userDocument1.userId } } as unknown as typeof request,
      conversationDocument._id.toHexString()
    );
    assertIsDefined(messages, 'conversation not defined');
    const ConversationMessages = await messageService.find({
      conversation: conversationDocument._id,
    });
    const NumberOfMessages = Object.keys(ConversationMessages).length;
    expect(NumberOfMessages).toBe(10);
  });

  it('should get conversation last messages', async () => {
    let messages = await controller.getConversationMessages(
      { user: { sub: userDocument1.userId } } as unknown as typeof request,
      conversationDocument._id.toHexString()
    );
    assertIsDefined(messages, 'conversation not defined');

    for (let i = 0; i < 3; i++) {
      await messageService.messageModel.create({
        content: `new test-${i + 1}`,
        conversation: conversationDocument._id,
        createdAt: new Date(),
        sender: userDocument1._id,
      });
    }

    const lastMessage = messages.reduce((prev, val) =>
      prev.createdAt > val.createdAt ? prev : val
    );

    messages = await controller.getConversationMessages(
      {
        user: { sub: userDocument1.userId },
      } as unknown as typeof request,
      conversationDocument._id.toHexString(),
      lastMessage.createdAt.toISOString()
    );

    expect(messages.length).toBe(3);
  });

  it('should get previous messages', async () => {
    let messages = await controller.getConversationMessages(
      { user: { sub: userDocument1.userId } } as unknown as typeof request,
      conversationDocument._id.toHexString()
    );
    assertIsDefined(messages, 'conversation not defined');

    for (let i = 0; i < 2; i++) {
      await messageService.messageModel.create({
        content: `old test-${i + 1}`,
        conversation: conversationDocument._id,
        createdAt: new Date('01/01/2000'),
        sender: userDocument1._id,
      });
    }

    const firstMessage = messages.reduce((prev, val) =>
      prev.createdAt < val.createdAt ? prev : val
    );

    messages = await controller.getConversationMessages(
      {
        user: { sub: userDocument1.userId },
      } as unknown as typeof request,
      conversationDocument._id.toHexString(),
      undefined,
      firstMessage.createdAt.toISOString()
    );

    expect(messages.length).toBe(2);
  });
});
