import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Domain, DomainDocument } from './domains.schema';
import { StrictFilterQuery } from '../utils/types';

/**
 * Service for managing domain-related operations.
 */
@Injectable()
export class DomainsService {
  /**
   * Constructs a new instance of DomainsService.
   *
   * @param {Model<Domain>} domainModel - The Mongoose model for domain documents.
   */
  constructor(@InjectModel(Domain.name) public domainModel: Model<Domain>) {}

  /**
   * Retrieves domain documents based on a specified filter.
   *
   * @param {StrictFilterQuery<DomainDocument>} filter - The criteria used to find domain documents.
   * @returns {Promise<DomainDocument[]>} A promise that resolves with an array of domain documents.
   */
  async find(filter: StrictFilterQuery<DomainDocument>): Promise<DomainDocument[]> {
    return this.domainModel.find(filter).exec();
  }

  /**
   * Retrieves a single domain document based on a specified filter.
   *
   * @param {StrictFilterQuery<DomainDocument>} filter - The criteria used to find a specific domain document.
   * @returns {Promise<DomainDocument | null>} A promise that resolves with the domain document if found, or null if not found.
   */
  async findOne(filter: StrictFilterQuery<DomainDocument>): Promise<DomainDocument | null> {
    return this.domainModel.findOne(filter).exec();
  }
}
