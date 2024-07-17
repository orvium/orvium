import { Body, Controller, Post } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { FeedbackDTO } from '../dtos/feedback.dto';
import { FeedbackCreatedEvent } from '../event/events/feedbackCreatedEvent';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

/**
 * Controller for handling operations with feedback received in the application.
 *
 * @tags feedback
 * @controller feedback
 */
@ApiTags('feedback')
@Controller('feedback')
export class FeedbackController {
  /**
   * Instantiates a FeedbackController
   * @param {FeedbackController} feedbackController - Service for feedback management.
   * @param {EventEmitter2} eventEmitter - Service for EventEmitter data handling.
   */
  constructor(
    private readonly feedbackService: FeedbackService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  /**
   * POST - Submits a new feedback report to the system. This method allows users to report various issues or suggestions,
   * such as technical problems, feature requests, or inappropriate content concerns. Upon creation, the feedback is
   * stored, and a notification is sent to system administrators detailing the feedback for further action.
   *
   * @param {FeedbackDTO} feedback - The feedback data transferred from client to server.
   */
  @ApiOperation({ summary: 'Create feedback' })
  @Post('')
  async createFeedback(@Body() feedback: FeedbackDTO): Promise<void> {
    const feedbackCreated = await this.feedbackService.create(feedback);

    await this.eventEmitter.emitAsync(
      'feedback.created',
      new FeedbackCreatedEvent({ feedback: feedbackCreated })
    );
  }
}
