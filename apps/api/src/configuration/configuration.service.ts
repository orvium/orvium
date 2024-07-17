import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { Configuration, ConfigurationDocument } from './configuration.schema';
import { assertIsDefined } from '../utils/utils';
import { StrictFilterQuery } from '../utils/types';

/**
 * Service for managing system configurations.
 */
@Injectable()
export class ConfigurationService {
  /**
   * Creates an instance of ConfigurationService.
   */
  constructor(
    @InjectModel(Configuration.name) public configurationModel: Model<Configuration>,
    @InjectConnection() private connection: Connection
  ) {}

  /**
   * Retrieves the system configuration.
   *
   * @returns {Promise<ConfigurationDocument>} A Promise resolving to the system configuration document.
   * @throws {Error} If the configuration document is not found.
   */
  async getConfiguration(): Promise<ConfigurationDocument> {
    const configuration = await this.configurationModel.findOne();
    assertIsDefined(configuration, 'Configuration not found');
    return configuration;
  }

  /**
   * Finds a configuration document based on a given filter.
   *
   * @param {StrictFilterQuery<ConfigurationDocument>} filter - A MongoDB query filter to find a specific configuration document.
   * @returns {Promise<ConfigurationDocument | null>} A Promise resolving to the configuration document if found, or null if no document matches the filter.
   */
  async findOne(
    filter: StrictFilterQuery<ConfigurationDocument>
  ): Promise<ConfigurationDocument | null> {
    return this.configurationModel.findOne(filter).exec();
  }

  /**
   * Returns the database connection associated with the service.
   *
   * @returns {Connection} The database connection.
   */
  getConnection(): Connection {
    return this.connection;
  }
}
