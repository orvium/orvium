import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { CreateConversationDTO } from '../dtos/conversation/create-conversation.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';
import { UserService } from '../users/user.service';
import { ConversationsService } from './conversations.service';
import { assertIsDefined } from '../utils/utils';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { TransformerService } from '../transformer/transformer.service';
import { EventService } from '../event/event.service';
import { MessagesService } from '../messages/messages.service';
import { ConversationPopulatedDTO } from '../dtos/conversation/conversation-populated.dto';
import { ConversationDocument } from './conversations.schema';
import { FakeEventData, TestEvent } from '../event/events/testEvent';
import { AuthorizationService, CONVERSATION_ACTIONS } from '../authorization/authorization.service';
import { ChatMessageReceivedEvent } from '../event/events/chatMessageRecievedEvent';
import { unreadMessagesReceiveEvent } from '../event/events/unreadMessagesReceivedEvent';

/**
 * Data Transfer Object (DTO) for adding messages.
 */
export class AddMessage {
  /**
   * The content of the message
   */
  @IsString()
  @ApiProperty({
    description: 'Content of the message in text format',
    example: 'Hello Jon, thanks for submitting your publication to our journal',
  })
  message!: string;
}

/**
 * Controller for handling operations related to conversations in the application.
 * Secured by JWT authentication using guards.
 */
@ApiTags('conversations')
@Controller('conversations')
export class ConversationsController {
  /**
   * Instantiates a ConversationController
   * @param {UserService} userService - Service for user data management.
   * @param {ConversationService} conversationService - Service for sessions data management.
   * @param {TransformerService} transformerService - Service for data transformation tasks.
   * @param {EventService} eventService - Service for managing events.
   * @param {MessagesService} messagesService - Service for handling messages.
   * @param {AuthorizationService} authorizationService - Service for handling authorization tasks.
   */
  constructor(
    private readonly userService: UserService,
    private readonly conversationService: ConversationsService,
    private readonly transformerService: TransformerService,
    private readonly eventService: EventService,
    private readonly messageService: MessagesService,
    private readonly authorizationService: AuthorizationService
  ) {}

  /**
   * GET - Retrieves all conversations for the logged-in user (chat), checking for unread messages
   * and applying user-specific transformations for data privacy.
   *
   * @param {Request} req - The incoming request object containing user authentication data.
   * @returns {Promise<ConversationPopulatedDTO[]>} - A promise resolved with the list of populated conversation data transfer objects.
   */
  @ApiOperation({ summary: 'List conversations' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('')
  async getConversations(@Req() req: Request): Promise<ConversationPopulatedDTO[]> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');
    const ability = await this.authorizationService.defineAbilityFor(user);

    const conversations = await this.conversationService.find({ participants: user._id });

    for (const conversation of conversations) {
      this.authorizationService.canDo(ability, CONVERSATION_ACTIONS.read, conversation);
    }
    const conversationsPopulated = await this.transformerService.transformToDto(
      conversations,
      ConversationPopulatedDTO,
      user
    );

    for (const conversation of conversationsPopulated) {
      const lastMessage = await this.messageService.findOne(
        {
          conversation: conversation._id,
        },
        { createdAt: -1 }
      );
      if (
        lastMessage &&
        !lastMessage.readAt &&
        lastMessage.sender.toHexString() !== user._id.toHexString()
      ) {
        conversation.messagesPending = true;
      } else {
        conversation.messagesPending = false;
      }
      conversation.lastMessageDate = lastMessage?.createdAt;
    }

    return conversationsPopulated;
  }

  /**
   * GET - Retrieves a specific conversation by its ID, ensuring the requesting user has permission to access it.
   *
   * @param {Request} req - The request object.
   * @param {string} id - The unique identifier of the conversation to retrieve.
   * @returns {Promise<ConversationPopulatedDTO>} - The requested conversation if found and accessible.
   */
  @ApiOperation({ summary: 'Retrieve a conversation' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id([0-9a-f]{24})')
  async getConversation(
    @Req() req: Request,
    @Param('id') id: string
  ): Promise<ConversationPopulatedDTO> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');

    const conversation = await this.conversationService.findById(id);
    assertIsDefined(conversation, 'conversation not found');
    const ability = await this.authorizationService.defineAbilityFor(user);

    this.authorizationService.canDo(ability, CONVERSATION_ACTIONS.read, conversation);

    assertIsDefined(conversation, 'Conversation not found');
    return this.transformerService.transformToDto(conversation, ConversationPopulatedDTO, user);
  }

  /**
   * POST - Creates a new conversation based on the provided recipient and initial message data.
   * @param {Request} req - The request object with user authentication.
   * @param {CreateConversationDTO} newConversation - DTO containing information to create a new conversation.
   * @returns {Promise<ConversationPopulatedDTO>} - The newly created conversation populated with data.
   */
  @ApiOperation({ summary: 'Create a conversation' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('')
  async createConversation(
    @Req() req: Request,
    @Body() newConversation: CreateConversationDTO
  ): Promise<ConversationPopulatedDTO> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');

    const recipient = await this.userService.findById(newConversation.recipient);
    assertIsDefined(recipient, 'Recipient not found');

    const existingConversation = await this.conversationService.find({
      participants: { $all: [user._id, recipient._id] },
    });
    if (existingConversation.length > 0) {
      return this.transformerService.transformToDto(
        existingConversation.pop() as ConversationDocument,
        ConversationPopulatedDTO,
        user
      );
    }
    const conversationCreated = await this.conversationService.conversationModel.create({
      participants: [newConversation.recipient, user._id],
    });
    const conversationCreatedPopulated = await this.conversationService.findById(
      conversationCreated._id
    );
    assertIsDefined(conversationCreatedPopulated, 'conversation not found');

    return this.transformerService.transformToDto(
      conversationCreatedPopulated,
      ConversationPopulatedDTO,
      user
    );
  }

  //TODO and verify if used
  @ApiOperation({ summary: 'Fake endpoint' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('dummyNotification')
  async dummyNotification(@Req() req: Request): Promise<void> {
    const user = await this.userService.getLoggedUser(req);
    const data = {
      user: user?.toJSON(),
    } as FakeEventData;
    const fakeEvent = new TestEvent(data);
    await this.eventService.create(fakeEvent.getEventDTO());
  }

  /**
   * PATCH - Adds a new message to an existing conversation, ensuring all participants can view the message.
   *
   * @param {Request} req - User request containing authentication details.
   * @param {AddMessage} payload - Data transfer object containing the message content.
   * @param {string} id - The ID of the conversation to which the message will be added.
   * @returns {Promise<ConversationPopulatedDTO>} - Updated conversation data including the new message.
   */
  @ApiOperation({ summary: 'Create a message' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id([0-9a-f]{24})')
  async addMessage(
    @Req() req: Request,
    @Body() payload: AddMessage,
    @Param('id') id: string
  ): Promise<ConversationPopulatedDTO> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');
    const conversation = await this.conversationService.findById(id);
    assertIsDefined(conversation, 'Conversation not found');

    const ability = await this.authorizationService.defineAbilityFor(user);
    this.authorizationService.canDo(ability, CONVERSATION_ACTIONS.read, conversation);

    const newMessage = {
      createdAt: new Date(),
      sender: user._id,
      content: payload.message,
      conversation: conversation._id,
    };

    const lastMessage = await this.messageService.findOne(
      {
        sender: user._id,
        conversation: conversation._id,
      },
      { createdAt: -1 }
    );

    await this.messageService.messageModel.create(newMessage);

    const recipientId = conversation.participants.find(
      participant => participant.toHexString() !== user._id.toHexString()
    );

    assertIsDefined(recipientId, 'recipient id not defined');
    const recipientUser = await this.userService.findById(recipientId.toHexString());
    assertIsDefined(recipientUser, 'recipient user not defined');

    if (!lastMessage) {
      const event = new ChatMessageReceivedEvent({
        user: user.toJSON(),
        recipientUser: recipientUser.toJSON(),
        conversation: conversation.toJSON(),
      });
      await this.eventService.create(event.getEventDTO());
    } else if (newMessage.createdAt.getTime() - lastMessage.createdAt.getTime() > 3600 * 1000) {
      const event = new unreadMessagesReceiveEvent({
        user: user.toJSON(),
        recipientUser: recipientUser.toJSON(),
        conversation: conversation.toJSON(),
      });
      await this.eventService.create(event.getEventDTO());
    }

    return this.transformerService.transformToDto(conversation, ConversationPopulatedDTO, user);
  }
}
