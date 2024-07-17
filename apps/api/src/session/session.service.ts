import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Session, SessionDocument } from './session.schema';
import { AnyKeys, Model, Types } from 'mongoose';
import { StrictFilterQuery } from '../utils/types';

/**
 * Service for handling SessionService.
 */
@Injectable()
export class SessionService {
  /**
   * Constructs an instance of SessionService with required services.
   *
   * @param {Model<Session>} sessionModel - Model for Session.
   */
  constructor(@InjectModel(Session.name) public sessionModel: Model<Session>) {}

  /**
   * Creates a new session.
   *
   * @param {AnyKeys<Session>} filter - The session data to create the document with.
   * @returns {Promise<SessionDocument>} A promise that resolves to the newly created session document.
   */
  async create(filter: AnyKeys<Session>): Promise<SessionDocument> {
    return await this.sessionModel.create(filter);
  }

  /**
   * Retrieves an array of session documents that match the provided filter criteria.
   *
   * @param {StrictFilterQuery<Session>} filter - The filter criteria to apply to the session search.
   * @returns {Promise<SessionDocument[]>} A promise that resolves to an array of session documents.
   */
  async find(filter: StrictFilterQuery<Session>): Promise<SessionDocument[]> {
    return await this.sessionModel.find(filter).exec();
  }

  /**
   * Retrieves a single session document based on the provided filter criteria.
   *
   * @param {StrictFilterQuery<Session>} filter - The filter criteria to find the session.
   * @returns {Promise<SessionDocument | null>} A promise that resolves to a session document or null if not found.
   */
  async findOneByFilter(filter: StrictFilterQuery<Session>): Promise<SessionDocument | null> {
    return await this.sessionModel.findOne(filter).exec();
  }

  /**
   * Retrieves a session document by its ID.
   *
   * @param {string} id - The ID of the session to find.
   * @returns {Promise<SessionDocument | null>} A promise that resolves to a session document or null if not found.
   */
  async findOneById(id: string): Promise<SessionDocument | null> {
    return await this.sessionModel.findById(id).exec();
  }

  /**
   * Deletes a session from the database by its ID.
   *
   * @param {string | Types.ObjectId} id - The ID of the session to delete.
   * @returns {Promise<void>} A promise that resolves when the session is deleted.
   */
  async deleteSession(id: string | Types.ObjectId): Promise<void> {
    await this.sessionModel.deleteOne({ _id: id });
  }
}
