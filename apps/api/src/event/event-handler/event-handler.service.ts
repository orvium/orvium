import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventService } from '../event.service';
import { FeedbackCreatedEvent } from '../events/feedbackCreatedEvent';
import { AppEvent } from '../event';

/**
 * Service for handling application-wide events.
 */
@Injectable()
export class EventHandlerService {
  /**
   * Constructs an instance of EventHandlerService.
   *
   * @param {EventService} eventService - The service used for creating event-related records.
   */
  constructor(private readonly eventService: EventService) {}

  /**
   * Handles the 'feedback.created' event by creating a new event record based on the feedback received.
   * This method is triggered whenever a 'feedback.created' event is dispatched.
   *
   * @param {FeedbackCreatedEvent} payload - The payload containing the feedback event details.
   * @returns {Promise<void>} A promise that resolves when the event record has been created.
   */
  @OnEvent('feedback.created')
  async handleFeedbackCreatedEvent(payload: FeedbackCreatedEvent): Promise<void> {
    await this.eventService.create(payload.getEventDTO());
  }

  /**
   * Logs any event that occurs within the application. This method is triggered for every event dispatched.
   *
   * @param {AppEvent} payload - The payload of the event that was triggered.
   */
  @OnEvent('**')
  logEvent(payload: AppEvent): void {
    Logger.debug('log event', payload);
  }
}
