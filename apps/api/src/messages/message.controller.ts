import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';
import { assertIsDefined } from '../utils/utils';
import { TransformerService } from '../transformer/transformer.service';
import { UserService } from '../users/user.service';
import { MessageDTO } from '../dtos/message.dto';
import { ConversationsService } from '../conversations/conversations.service';
import { MessageDocument } from './messages.schema';
import { StrictFilterQuery } from '../utils/types';

const MESSAGE_LIMIT = 10;

/**
 * Controller for handling operations with message within the application.
 *
 * @tags message
 * @controller message
 */
@ApiTags('message')
@Controller('message')
export class MessageController {
  /**
   * Instantiates a MessageController object.
   *
   * @param {MessageService} messageService - Service for messageService handling in the platform.
   * @param {ConversationService} conversationService - Service for sessions data management.
   * @param {TransformerService} transformerService - Service for data transformation tasks.
   * @param {UserService} userService - Service for user data management.
   */
  constructor(
    private readonly messageService: MessagesService,
    private readonly conversationService: ConversationsService,
    private readonly transformerService: TransformerService,
    private readonly userService: UserService
  ) {}

  /**
   * GET - Retrieves messages from a specific conversation applying optional date filters for message retrieval.
   * This method ensures that only messages from the specified time range are fetched and marks unread messages
   * as read if they are not sent by the current user.
   *
   * @param {Request} req - The request object, used here to identify the logged-in user.
   * @param {string} conversationId - The unique identifier of the conversation from which messages are to be retrieved.
   * @param {string} [fromDate] - An optional start date to filter messages; only messages sent after this date will be included.
   * @param {string} [beforeDate] - An optional end date to filter messages; only messages sent before this date will be considered.
   * @returns {Promise<MessageDTO[]>} - A promise that resolves to an array of messages that represent the conversation.
   */
  @ApiOperation({ summary: 'List conversation messages' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiQuery({ name: 'fromDate', required: false })
  @ApiQuery({ name: 'beforeDate', required: false })
  async getConversationMessages(
    @Req() req: Request,
    @Query('conversationId') conversationId: string,
    @Query('fromDate') fromDate?: string,
    @Query('beforeDate') beforeDate?: string
  ): Promise<MessageDTO[]> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');
    const conversation = await this.conversationService.conversationModel.findOne({
      _id: conversationId,
      participants: user._id,
    });
    assertIsDefined(conversation, 'Conversation not found');
    //Mark as read
    await this.messageService.messageModel.updateMany(
      { conversation: conversation._id, readAt: null, sender: { $ne: user._id } },
      { readAt: Date.now() }
    );
    const query: StrictFilterQuery<MessageDocument> = {
      conversation: conversation._id,
    };
    if (fromDate) {
      query.createdAt = { $gt: fromDate };
    }

    if (beforeDate) {
      query.createdAt = { $lt: beforeDate };
    }

    const messages = await this.messageService.find(query, { createdAt: -1 }, MESSAGE_LIMIT);

    return this.transformerService.toDTO(messages, MessageDTO);
  }
}
