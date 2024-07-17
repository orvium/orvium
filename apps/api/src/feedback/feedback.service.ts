import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Feedback, FeedbackDocument } from './feedback.schema';
import { FeedbackDTO } from '../dtos/feedback.dto';
import { StrictFilterQuery } from '../utils/types';

/**
 * Service for managing feedback operations.
 */
@Injectable()
export class FeedbackService {
  /**
   * Constructs an instance of FeedbackService.
   *
   * @param {Model<Feedback>} feedbackModel - The Mongoose model for feedback documents.
   */
  constructor(@InjectModel(Feedback.name) public feedbackModel: Model<Feedback>) {}

  /**
   * Retrieves a single feedback document based on a specified filter.
   *
   * @param {StrictFilterQuery<FeedbackDocument>} filter - The criteria used to find a specific feedback document.
   * @returns {Promise<FeedbackDocument | null>} A promise that resolves with the feedback document if found, or null if not found.
   */
  async findOne(filter: StrictFilterQuery<FeedbackDocument>): Promise<FeedbackDocument | null> {
    return this.feedbackModel.findOne(filter).exec();
  }

  /**
   * Retrieves a feedback document by its ID.
   *
   * @param {string | Types.ObjectId} id - The ID of the feedback to find.
   * @returns {Promise<FeedbackDocument | null>} A promise that resolves with the feedback document if found, or null if not found.
   */
  async findById(id: string | Types.ObjectId): Promise<FeedbackDocument | null> {
    return this.feedbackModel.findById(id);
  }

  /**
   * Creates a new feedback document in the database.
   *
   * @param {FeedbackDTO} feedback - The data transfer object containing the necessary information to create a feedback document.
   * @returns {Promise<FeedbackDocument>} A promise that resolves with the newly created feedback document.
   * This method also handles the conversion of a base64-encoded screenshot into a Buffer, if included in the feedback.
   */
  async create(feedback: FeedbackDTO): Promise<FeedbackDocument> {
    if (feedback.screenshot) {
      feedback.screenshot = Buffer.from((feedback.screenshot as string).split(',')[1], 'base64');
    }
    const createdFeedback = new this.feedbackModel(feedback);
    return createdFeedback.save();
  }
}
