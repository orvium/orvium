import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, SortOrder } from 'mongoose';
import { Message, MessageDocument } from './messages.schema';
import { StrictFilterQuery } from '../utils/types';

/**
 * Service for handling MessagesService.
 */
@Injectable()
export class MessagesService {
  /**
   * Constructs an instance of MessagesServices.
   *
   * @param {Model<Message>} messageModel - The model for Messages, injected using dependency injection.
   */
  constructor(@InjectModel(Message.name) public messageModel: Model<Message>) {}

  /**
   * Finds messages based on a filter, sorting, and optionally limiting the number of results.
   *
   * @param {StrictFilterQuery<MessageDocument>} filter - The criteria used to filter the messages.
   * @param {string | Record<string, SortOrder>} [sort={ createdOn: -1 }] - The sorting order of the results.
   * @param {number} [limit] - Optional maximum number of messages to return.
   * @returns {Promise<MessageDocument[]>} A promise that resolves with an array of message documents.
   */
  async find(
    filter: StrictFilterQuery<MessageDocument>,
    sort: string | Record<string, SortOrder> = { createdOn: -1 },
    limit?: number
  ): Promise<MessageDocument[]> {
    let query = this.messageModel.find(filter);
    if (sort) {
      query = query.sort(sort);
    }
    if (limit) {
      query = query.limit(limit);
    }
    return query.exec();
  }

  /**
   * Finds a single message based on a filter and sorting order.
   *
   * @param {StrictFilterQuery<MessageDocument>} filter - The criteria used to filter the messages.
   * @param {string | Record<string, SortOrder>} sort - The sorting order of the result.
   * @returns {Promise<MessageDocument | null>} A promise that resolves with a message document or null if no message is found.
   */
  async findOne(
    filter: StrictFilterQuery<MessageDocument>,
    sort: string | Record<string, SortOrder>
  ): Promise<MessageDocument | null> {
    return this.messageModel.findOne(filter).sort(sort).exec();
  }
}
