import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Discipline, DisciplineDocument } from './discipline.schema';
import { StrictFilterQuery } from '../utils/types';

/**
 * Service for managing discipline-related operations.
 */
@Injectable()
export class DisciplineService {
  /**
   * Constructs a new instance of DisciplineService.
   *
   * @param {Model<Discipline>} disciplineModel - The Mongoose model for discipline documents.
   */
  constructor(@InjectModel(Discipline.name) public disciplineModel: Model<Discipline>) {}

  /**
   * Retrieves discipline documents based on a specified filter.
   *
   * @param {StrictFilterQuery<DisciplineDocument>} filter - The criteria used to find discipline documents.
   * @returns {Promise<DisciplineDocument[]>} A promise that resolves with an array of discipline documents.
   * This method provides a way to query discipline documents from the database according to a specified set of criteria.
   */
  async find(filter: StrictFilterQuery<DisciplineDocument>): Promise<DisciplineDocument[]> {
    return this.disciplineModel.find(filter).exec();
  }
}
