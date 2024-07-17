import { InjectModel } from '@nestjs/mongoose';
import { AnyKeys, Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { Template, TemplateDocument } from './template.schema';
import { ReviewInvitationEmailEvent } from '../event/events/reviewInvitationEmailEvent';
import { StrictFilterQuery } from '../utils/types';

/**
 * Service for handling TemplateService.
 */
@Injectable()
export class TemplateService {
  /**
   * Constructs an instance of SessionService with required services.
   *
   * @param {Model<Template>} templateModel - Model for Template.
   */
  constructor(@InjectModel(Template.name) public templateModel: Model<Template>) {}

  /**
   * Creates a new template in the database.
   *
   * @param {AnyKeys<Template>} filter - The template data to create the document with.
   * @returns {Promise<TemplateDocument>} A promise that resolves to the newly created template document.
   */
  async create(filter: AnyKeys<Template>): Promise<TemplateDocument> {
    return await this.templateModel.create(filter);
  }

  /**
   * Retrieves a single template document based on the provided filter criteria.
   *
   * @param {StrictFilterQuery<TemplateDocument>} filter - The filter criteria to find the template.
   * @returns {Promise<TemplateDocument | null>} A promise that resolves to a template document or null if not found.
   */
  async findOne(filter: StrictFilterQuery<TemplateDocument>): Promise<TemplateDocument | null> {
    return this.templateModel.findOne(filter).exec();
  }

  /**
   * Retrieves an array of template documents that match the provided filter criteria.
   *
   * @param {StrictFilterQuery<TemplateDocument>} filter - The filter criteria to apply to the template search.
   * @returns {Promise<TemplateDocument[]>} A promise that resolves to an array of template documents.
   */
  async find(filter: StrictFilterQuery<TemplateDocument>): Promise<TemplateDocument[]> {
    return await this.templateModel.find(filter).exec();
  }

  /**
   * Generates HTML content for a given review invitation email event using a template.
   *
   * @param {ReviewInvitationEmailEvent} event - The event data containing the template name and associated community.
   * @returns {Promise<string>} A promise that resolves to the generated HTML string.
   */
  async getHTMLFromEvent(event: ReviewInvitationEmailEvent): Promise<string> {
    let templateHTML = '';

    // Check custom community templates
    const customTemplateSource = await this.templateModel
      .findOne({
        name: event.emailTemplateName,
        community: event.data.community,
      })
      .lean();

    if (!customTemplateSource) {
      const defaultTemplateSource = await this.templateModel
        .findOne({ name: event.emailTemplateName })
        .lean();
      templateHTML = defaultTemplateSource?.template ?? '';
    } else {
      templateHTML = customTemplateSource.template;
    }
    const mail = event.getEmailTemplate(templateHTML);
    return (mail?.html as string) || '';
  }
}
