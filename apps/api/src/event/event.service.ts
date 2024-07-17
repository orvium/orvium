import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppEvent, EventDocument, EventDTO, EventStatus, RETRY_NUMBER } from './event.schema';
import { StrictFilterQuery } from '../utils/types';

/**
 * Service for managing application events.
 */
@Injectable()
export class EventService {
  /**
   * Constructs an instance of EventService.
   *
   * @param {Model<AppEvent>} eventModel - The Mongoose model for event documents.
   */
  constructor(@InjectModel(AppEvent.name) public eventModel: Model<AppEvent>) {}

  /**
   * Creates a new event record in the database.
   *
   * @param {EventDTO} event - The event data transfer object containing the necessary event information.
   * @returns {Promise<EventDocument>} A promise that resolves with the newly created event document.
   */
  async create(event: EventDTO): Promise<EventDocument> {
    return this.eventModel.create(event);
  }

  /**
   * Retrieves a single event document based on a specified filter.
   *
   * @param {StrictFilterQuery<EventDocument>} filter - The criteria used to find a specific event document.
   * @returns {Promise<EventDocument | null>} A promise that resolves with the event document if found, or null if not found.
   */
  async findOne(filter: StrictFilterQuery<EventDocument>): Promise<EventDocument | null> {
    return this.eventModel.findOne(filter).exec();
  }

  /**
   * Retrieves multiple event documents based on a specified filter.
   *
   * @param {StrictFilterQuery<EventDocument>} filter - The criteria used to find event documents.
   * @returns {Promise<EventDocument[] | null>} A promise that resolves with an array of event documents, or null if no documents are found.
   */
  async find(filter: StrictFilterQuery<EventDocument>): Promise<EventDocument[] | null> {
    return this.eventModel.find(filter).exec();
  }

  /**
   * Updates an event document's status to processed.
   *
   * @param {EventDocument} event - The event document to update.
   * @returns {Promise<EventDocument>} A promise that resolves with the updated event document.
   */
  async setAsProcessed(event: EventDocument): Promise<EventDocument> {
    event.processedOn = Date.now();
    event.status = EventStatus.PROCESSED;
    Logger.debug(`Event ${event._id.toHexString()} processed`);
    return await event.save();
  }

  /**
   * Increments the retry count and updates an event document's status to processing.
   *
   * @param {EventDocument} event - The event document to update.
   * @returns {Promise<EventDocument>} A promise that resolves with the updated event document.
   */
  async setAsProcessing(event: EventDocument): Promise<EventDocument> {
    event.retryCount++;
    event.status = EventStatus.PROCESSING;
    Logger.debug(`Event ${event._id.toHexString()} processing`);
    return await event.save();
  }

  /**
   * Updates an event document's status to pending or failed based on the retry count.
   *
   * @param {EventDocument} event - The event document to update.
   * @returns {Promise<EventDocument>} A promise that resolves with the updated event document.
   */
  async setAsPending(event: EventDocument): Promise<EventDocument> {
    event.status = event.retryCount == RETRY_NUMBER ? EventStatus.FAILED : EventStatus.PENDING;
    Logger.debug(`Event ${event._id.toHexString()} ${event.status}`);
    return await event.save();
  }

  /**
   * Updates an event document's status to failed.
   *
   * @param {EventDocument} event - The event document to update.
   * @returns {Promise<EventDocument>} A promise that resolves with the updated event document.
   */
  async setAsFailed(event: EventDocument): Promise<EventDocument> {
    event.status = EventStatus.FAILED;
    Logger.debug(`Event ${event._id.toHexString()} failed`);
    return await event.save();
  }
}
