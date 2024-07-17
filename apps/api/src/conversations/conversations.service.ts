import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Conversation, ConversationDocument } from './conversations.schema';
import { UserDocument } from '../users/user.schema';
import { StrictFilterQuery } from '../utils/types';

/**
 * Service for managing conversation data.
 */
@Injectable()
export class ConversationsService {
  /**
   * Creates an instance of ConversationsService.
   */
  constructor(@InjectModel(Conversation.name) public conversationModel: Model<Conversation>) {}

  /**
   * Finds conversation documents based on a given filter and populates participant details.
   *
   * @param {StrictFilterQuery<ConversationDocument>} filter - A MongoDB query filter to find matching conversation documents.
   * @returns {Promise<ConversationDocument[]>} A Promise resolving to an array of populated conversation documents.
   */
  async find(filter: StrictFilterQuery<ConversationDocument>): Promise<ConversationDocument[]> {
    return this.conversationModel
      .find(filter)
      .populate<{ participantsPopulated: UserDocument[] }>(['participantsPopulated'])
      .exec();
  }

  /**
   * Finds a single conversation document by its ID and populates participant details.
   *
   * @param {string | Types.ObjectId} id - The identifier of the conversation document to retrieve.
   * @returns {Promise<ConversationDocument | null>} A Promise resolving to the populated conversation document if found, null otherwise.
   */
  async findById(id: string | Types.ObjectId): Promise<ConversationDocument | null> {
    return this.conversationModel
      .findById(id)
      .populate<{ participantsPopulated: UserDocument[] }>(['participantsPopulated'])
      .exec();
  }
}
