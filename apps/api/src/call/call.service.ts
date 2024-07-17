import { Injectable } from '@nestjs/common';
import { Call, CallDocument } from './call.schema';
import { InjectModel } from '@nestjs/mongoose';
import { AnyKeys, Model } from 'mongoose';
import { StrictFilterQuery } from '../utils/types';

/**
 * Service for managing conference calls for abstracts, papers, ect.
 */
@Injectable()
export class CallService {
  /**
   * Initializes a new instance of the CallService.
   *
   * @param callModel The Mongoose model for call documents.
   */
  constructor(@InjectModel(Call.name) public callModel: Model<Call>) {}

  /**
   * Creates a new call record.
   *
   * @param filter The properties to set on the new call record.
   * @returns A Promise resolving to the newly created CallDocument.
   */
  async create(filter: AnyKeys<Call>): Promise<CallDocument> {
    return this.callModel.create(filter);
  }

  /**
   * Finds call records matching the given filter.
   *
   * @param filter A query filter that conforms to the CallDocument structure to find matching records.
   * @returns A Promise that resolves to an array of CallDocument.
   */
  async find(filter: StrictFilterQuery<CallDocument>): Promise<CallDocument[]> {
    return this.callModel.find(filter).exec();
  }

  /**
   * Finds a single call record matching the given filter.
   *
   * @param filter A query filter that conforms to the CallDocument structure to find one matching record.
   * @returns A Promise that resolves to a CallDocument or null if no match is found.
   */
  async findOne(filter: StrictFilterQuery<CallDocument>): Promise<CallDocument | null> {
    return this.callModel.findOne(filter).exec();
  }
}
