import { Injectable } from '@nestjs/common';

/**
 * AppService provides application-specific services
 * to handle various types of business logic and data retrieval.
 */
@Injectable()
export class AppService {
  /**
   * Retrieves a simple greeting message.
   *
   * @returns An object containing a greeting message.
   */
  getData(): { message: string } {
    return { message: 'Hello API' };
  }
}
