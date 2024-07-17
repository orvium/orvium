import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AnyKeys, Model, SortOrder, Types } from 'mongoose';
import { IInviteData, Invite, InviteDocument } from './invite.schema';
import { NestedMongoQuery, StrictFilterQuery } from '../utils/types';
import { UserDocument } from '../users/user.schema';

export interface InvitePopulatedDocument extends Omit<InviteDocument, ''> {
  senderPopulated: UserDocument;
}

export type InviteFilterQuery = StrictFilterQuery<
  InviteDocument & NestedMongoQuery<IInviteData, 'data'>
>;

/**
 * Service for managing invite operations.
 */
@Injectable()
export class InviteService {
  /**
   * Constructs an instance of InviteService.
   *
   * @param {Model<Invite>} inviteModel - The Mongoose model for invite documents.
   */
  constructor(@InjectModel(Invite.name) public inviteModel: Model<Invite>) {}

  /**
   * Creates a new invite document in the database.
   *
   * @param {AnyKeys<Invite>} filter - Initial data for creating the invite.
   * @returns {Promise<InviteDocument>} A promise that resolves with the newly created invite document.
   */
  async create(filter: AnyKeys<Invite>): Promise<InviteDocument> {
    return this.inviteModel.create(filter);
  }

  /**
   * Retrieves an invite document by its ID and populates related sender information.
   *
   * @param {string | Types.ObjectId} id - The ID of the invite to find.
   * @returns {Promise<InvitePopulatedDocument | null>} A promise that resolves with the populated invite document if found, or null if not found.
   */
  async findById(id: string | Types.ObjectId): Promise<InvitePopulatedDocument | null> {
    return await this.inviteModel
      .findById(id)
      .populate<{ senderPopulated: UserDocument }>('senderPopulated')
      .exec();
  }

  /**
   * Retrieves a single invite document based on a specified filter and populates related sender information.
   *
   * @param {InviteFilterQuery} filter - The criteria used to find a specific invite document.
   * @returns {Promise<InvitePopulatedDocument | null>} A promise that resolves with the populated invite document if found, or null if not found.
   */
  async findOne(filter: InviteFilterQuery): Promise<InvitePopulatedDocument | null> {
    return this.inviteModel
      .findOne(filter)
      .populate<{ senderPopulated: UserDocument }>('senderPopulated')
      .exec();
  }

  /**
   * Retrieves multiple invite documents based on a specified filter, sorts them, and populates related sender information.
   *
   * @param {InviteFilterQuery} filter - The criteria used to find invite documents.
   * @returns {Promise<InvitePopulatedDocument[]>} A promise that resolves with an array of populated invite documents.
   */
  async find(filter: InviteFilterQuery): Promise<InvitePopulatedDocument[]> {
    return this.inviteModel
      .find(filter)
      .populate<{ senderPopulated: UserDocument }>('senderPopulated')
      .sort({ createdOn: -1 })
      .exec();
  }

  /**
   * Checks if an invite exists based on a specified filter.
   *
   * @param {InviteFilterQuery} filter - Criteria to check the existence of the invite.
   * @returns {Promise<Pick<InviteDocument, '_id'> | null>} A promise that resolves with the document ID if the invite exists, or null otherwise.
   */
  async exists(filter: InviteFilterQuery): Promise<Pick<InviteDocument, '_id'> | null> {
    return this.inviteModel.exists(filter);
  }

  /**
   * Retrieves a limited list of invite documents based on a specified filter, with pagination and sorting, and populates sender info.
   *
   * @param {InviteFilterQuery} filter - The criteria used to find invite documents.
   * @param {number} [limit=10] - Maximum number of documents to return.
   * @param {number} [page=0] - Page number for pagination (zero-indexed).
   * @param {string | Record<string, SortOrder>} [sort={ createdOn: -1 }] - Sorting criteria.
   * @returns {Promise<InvitePopulatedDocument[]>} A promise that resolves with an array of populated invite documents.
   */
  async findWithLimitExec(
    filter: InviteFilterQuery,
    limit = 10,
    page = 0,
    sort: string | Record<string, SortOrder> = { createdOn: -1 }
  ): Promise<InvitePopulatedDocument[]> {
    return this.inviteModel
      .find(filter)
      .populate<{ senderPopulated: UserDocument }>('senderPopulated')
      .sort(sort)
      .skip(page * limit)
      .limit(limit)
      .exec();
  }
}
