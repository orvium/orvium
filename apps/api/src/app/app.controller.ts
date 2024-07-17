import { Controller, Get } from '@nestjs/common';

import { AppService } from './app.service';

/**
 * The AppController is responsible for handling incoming HTTP requests.
 * It delegates the business logic to the AppService and returns the response.
 *
 * @class AppController
 */
@Controller()
export class AppController {
  /**
   * Constructor for AppController.
   * It injects the AppService to be used for handling business logic.
   *
   * @constructor
   * @param {AppService} appService - The service containing business logic for the application.
   */
  constructor(private readonly appService: AppService) {}

  /**
   * GET method to retrieve data. This method handles the "/" route and
   * uses the AppService to get the data.
   *
   * @returns The data retrieved by the AppService, typically returned as JSON.
   */
  @Get()
  getData() {
    return this.appService.getData();
  }
}
