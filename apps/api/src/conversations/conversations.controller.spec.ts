import { Test, TestingModule } from '@nestjs/testing';
import { ConversationsController } from './conversations.controller';
import { createConversation, createMessage, createUser, factoryMessage } from '../utils/test-data';
import { request } from 'express';
import { assertIsDefined } from '../utils/utils';
import { cleanCollections, MongooseTestingModule } from '../utils/mongoose-testing.module';
import { EventService } from '../event/event.service';
import { MessagesService } from '../messages/messages.service';

describe('ConversationsController', () => {
  let controller: ConversationsController;
  let messageService: MessagesService;
  let module: TestingModule;
  let eventService: EventService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [MongooseTestingModule.forRoot('ConversationsController')],
      controllers: [ConversationsController],
      providers: [],
    }).compile();
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    controller = module.get(ConversationsController);
    eventService = module.get(EventService);
    messageService = module.get(MessagesService);
    await cleanCollections(module);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should send dummy notification', async () => {
    const user = await createUser(module);
    expect(controller).toBeDefined();
    const spy = jest.spyOn(eventService, 'create');
    await controller.dummyNotification({
      user: { sub: user.userId },
    } as unknown as typeof request);
    expect(spy).toHaveBeenCalled();
  });

  it('should add message', async () => {
    const { conversation, user1 } = await createConversation(module);

    const populatedConversation = await controller.addMessage(
      { user: { sub: user1.userId } } as unknown as typeof request,
      { message: '' },
      conversation._id.toHexString()
    );
    assertIsDefined(populatedConversation, 'conversation not defined');
    const conversationMessages = await messageService.find({ conversation: conversation._id });
    const numberOfMessages = Object.keys(conversationMessages).length;
    expect(numberOfMessages).toBe(1);
  });

  it('should emit chat message received event', async () => {
    const { conversation, user1 } = await createConversation(module);

    const spy = jest.spyOn(eventService, 'create');
    await controller.addMessage(
      { user: { sub: user1.userId } } as unknown as typeof request,
      { message: 'hi' },
      conversation._id.toHexString()
    );
    expect(spy).toHaveBeenCalled();
  });

  it('should emit chat unread message event', async () => {
    const { conversation, user1 } = await createConversation(module);

    await messageService.messageModel.create({
      conversation: conversation._id,
      content: 'example',
      sender: user1._id,
      createdAt: new Date('11/11/2021'),
    });

    const spy = jest.spyOn(eventService, 'create');

    await controller.addMessage(
      { user: { sub: user1.userId } } as unknown as typeof request,
      { message: 'next message' },
      conversation._id.toHexString()
    );

    expect(spy).toHaveBeenCalled();
  });

  describe('conversations', () => {
    it('should get all conversations', async () => {
      const { user1 } = await createConversation(module);

      const conversations = await controller.getConversations({
        user: { sub: user1.userId },
      } as unknown as typeof request);

      expect(conversations.length).toBe(1);
    });

    it('should get all conversations with messages read at', async () => {
      const user = await createUser(module);
      const { user1, conversation } = await createConversation(module);
      await createMessage(module, conversation, user, { message: { readAt: Date.now() } });
      const conversations = await controller.getConversations({
        user: { sub: user1.userId },
      } as unknown as typeof request);

      expect(conversations.length).toBe(1);
    });

    it('should get conversations by id', async () => {
      const { conversation, user1 } = await createConversation(module);

      const result = await controller.getConversation(
        { user: { sub: user1.userId } } as unknown as typeof request,
        conversation._id.toHexString()
      );
      expect(result._id).toEqual(conversation._id.toHexString());
    });

    it('should exist a conversation', async () => {
      const user = await createUser(module);
      const user2 = await createUser(module);

      const conversation = await controller.createConversation(
        { user: { sub: user.userId } } as unknown as typeof request,
        {
          recipient: user2._id.toHexString(),
        }
      );
      expect(conversation.participants).toEqual([user2._id.toHexString(), user._id.toHexString()]);

      // Trying to create the same conversation should return the already existing one
      const conversation2 = await controller.createConversation(
        { user: { sub: user.userId } } as unknown as typeof request,
        {
          recipient: user2._id.toHexString(),
        }
      );
      expect(conversation._id).toBe(conversation2._id);
    });

    it('should create a conversation', async () => {
      const user = await createUser(module);
      const user2 = await createUser(module);

      const conversation = await controller.createConversation(
        { user: { sub: user.userId } } as unknown as typeof request,
        {
          recipient: user2._id.toHexString(),
        }
      );
      expect(conversation).toBeDefined();
    });
  });

  it('should send event when notification cooldown is down', async () => {
    const user = await createUser(module);
    const user2 = await createUser(module);

    const conversation = await controller.createConversation(
      { user: { sub: user.userId } } as unknown as typeof request,
      {
        recipient: user2._id.toHexString(),
      }
    );

    const messages = [
      factoryMessage.build({
        conversation: conversation._id,
        sender: user._id,
        content: 'first message',
        readAt: new Date('12/12/2022 12:30'),
        createdAt: new Date('12/12/2022 12:00'),
      }),
      factoryMessage.build({
        conversation: conversation._id,
        sender: user._id,
        createdAt: new Date('12/12/2022 15:00'),
        content: 'second message',
      }),
    ];
    await messageService.messageModel.insertMany(messages);

    const notificationSpy = jest.spyOn(eventService, 'create');
    await controller.addMessage(
      { user: { sub: user.userId } } as unknown as typeof request,
      { message: 'Hello!' },
      conversation._id
    );

    expect(notificationSpy).toHaveBeenCalled();
  });

  it('should not send event when notification cooldown is up', async () => {
    const { conversation, user1 } = await createConversation(module);

    const offset = 3600;
    const date = new Date();
    const newDate = date.setTime(date.getTime() - offset);
    const messages = [
      factoryMessage.build({
        conversation: conversation._id,
        sender: user1._id,
        content: 'first message',
        createdAt: new Date(newDate),
      }),
    ];

    await messageService.messageModel.insertMany(messages);

    const notificationSpy = jest.spyOn(eventService, 'create');
    await controller.addMessage(
      { user: { sub: user1.userId } } as unknown as typeof request,
      { message: 'Hello!' },
      conversation._id.toHexString()
    );

    expect(notificationSpy).toHaveBeenCalledTimes(0);
  });

  it('should send conversation with messages pending', async () => {
    const { conversation, user1, user2 } = await createConversation(module);
    await messageService.messageModel.insertMany([
      factoryMessage.build({ conversation: conversation._id, sender: user2._id, content: 'test' }),
    ]);

    const conversations = await controller.getConversations({
      user: { sub: user1.userId },
    } as unknown as typeof request);
    expect(conversations.length).toBe(1);
    const resultConversation = conversations.pop();
    assertIsDefined(resultConversation, 'Conversation not found');
    expect(resultConversation._id).toBe(conversation._id.toHexString());
    expect(resultConversation.messagesPending).toBe(true);
  });

  it('should send conversation without messages pending', async () => {
    const { conversation, user1, user2 } = await createConversation(module);

    let conversations = await controller.getConversations({
      user: { sub: user1.userId },
    } as unknown as typeof request);

    expect(conversations.length).toBe(1);
    let resultConversation = conversations.pop();
    assertIsDefined(resultConversation, 'Conversation not found');
    expect(resultConversation._id).toBe(conversation._id.toHexString());
    expect(resultConversation.messagesPending).toBe(false);

    await messageService.messageModel.insertMany([
      factoryMessage.build({ sender: user2, content: 'test', readAt: new Date() }),
    ]);
    conversations = await controller.getConversations({
      user: { sub: user1.userId },
    } as unknown as typeof request);
    resultConversation = conversations.pop();
    assertIsDefined(resultConversation, 'Conversation not found');
    expect(resultConversation.messagesPending).toBe(false);
  });

  it('should add last message date', async () => {
    // conversation with message read - should be the second
    const { conversation, user1, user2 } = await createConversation(module);
    await createMessage(module, conversation, user2, {
      message: {
        createdAt: new Date('2020-01-01'),
        readAt: new Date('2020-01-01'),
      },
    });

    await createMessage(module, conversation, user2, {
      message: {
        createdAt: new Date('2020-01-02'),
      },
    });

    const conversations = await controller.getConversations({
      user: { sub: user1.userId },
    } as unknown as typeof request);

    expect(conversations.length).toBe(1);
    expect(conversations[0]._id).toBe(conversation._id.toHexString());
    expect(conversations[0].lastMessageDate).toStrictEqual(new Date('2020-01-02'));
  });
});
