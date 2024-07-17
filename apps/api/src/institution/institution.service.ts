import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AnyKeys, Model } from 'mongoose';
import { Institution, InstitutionDocument } from './institution.schema';
import { UserDocument } from '../users/user.schema';
import { StrictFilterQuery } from '../utils/types';

/**
 * Service for managing institution operations.
 */
@Injectable()
export class InstitutionService {
  /**
   * Constructs an instance of InstitutionService.
   *
   * @param {Model<Institution>} institutionModel - The Mongoose model for institution documents.
   */
  constructor(@InjectModel(Institution.name) public institutionModel: Model<Institution>) {}

  /**
   * Creates a new institution document in the database.
   *
   * @param {AnyKeys<Institution>} filter - Initial data for creating the institution.
   * @returns {Promise<InstitutionDocument>} A promise that resolves with the newly created institution document.
   */
  async create(filter: AnyKeys<Institution>): Promise<InstitutionDocument> {
    return this.institutionModel.create(filter);
  }

  /**
   * Checks if an institution exists based on a specified filter.
   *
   * @param {StrictFilterQuery<InstitutionDocument>} filter - Criteria to check the existence of the institution.
   * @returns {Promise<Pick<InstitutionDocument, '_id'> | null>} A promise that resolves with the document ID if the institution exists, or null otherwise.
   */
  async exists(
    filter: StrictFilterQuery<InstitutionDocument>
  ): Promise<Pick<InstitutionDocument, '_id'> | null> {
    return this.institutionModel.exists(filter);
  }

  /**
   * Retrieves a single institution document based on a specified filter.
   *
   * @param {StrictFilterQuery<InstitutionDocument>} conditions - The criteria used to find a specific institution document.
   * @returns {Promise<InstitutionDocument | null>} A promise that resolves with the institution document if found, or null if not found.
   */
  async findOne(
    conditions: StrictFilterQuery<InstitutionDocument>
  ): Promise<InstitutionDocument | null> {
    return this.institutionModel.findOne(conditions).exec();
  }

  /**
   * Determines if a user has the rights to create an institution.
   * This typically checks if the user has an 'admin' role.
   *
   * @param {UserDocument} user - The user document to check roles against.
   * @returns {boolean} True if the user has the necessary rights to create an institution, false otherwise.
   */
  canCreateInstitution(user: UserDocument): boolean {
    let hasRights = false;
    // Admin can create version
    if (user.roles.includes('admin')) {
      hasRights = true;
    }
    return hasRights;
  }
}
