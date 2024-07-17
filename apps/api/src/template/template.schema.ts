import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { CommunityCLASSNAME } from '../utils/utils';

/**
 * Enum for categorizing templates based on their usage and scope within the application.
 *
 * @enum {string}
 * @property {string} system - Templates used by the system for general purposes.
 * @property {string} moderator - Templates used by moderator notifications
 * @property {string} community - Templates used by communities notifications
 * @property {string} publication - Templates used by publication notifications
 * @property {string} review  - Templates for reviews
 * @property {string} reviewInvitation - Templates for review invitations
 * @property {string} editor - Templates for editors
 *
 */
export enum TemplateCategory {
  system = 'system',
  moderator = 'moderator',
  community = 'community',
  publication = 'publication',
  review = 'review',
  reviewInvitation = 'review-invitation',
  editor = 'editor',
}

/**
 * Type alias for a hydrated document of a Template, which includes methods like save(),
 * find(), etc.
 */
export type TemplateDocument = HydratedDocument<Template>;

/**
 * Represents an email or document template within the system. Templates are used for creating
 * standardized documents and communications such as emails, notifications, or content pages.
 */
@Schema({
  collection: 'templates',
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Template {
  /**
   * The name of the template, which is unique within a community context.
   */
  @Prop({ required: true, trim: true })
  name!: string;

  /**
   * The title of the template, often used as the subject line for emails
   */
  @Prop({ required: true, trim: true })
  title!: string;

  /**
   * The content of the template itself, typically HTML or text.
   */
  @Prop({ required: true, trim: true })
  template!: string;

  /**
   * A brief description of what the template is used for.
   */
  @Prop({ required: true, trim: true })
  description!: string;

  /**
   * Flag to determine whether the template can be customized by the end-user.
   */
  @Prop({ required: true, default: false })
  isCustomizable!: boolean;

  /**
   * The category of the template, helping to organize templates by their use-case, reference to enum TemplateCategory
   */
  @Prop({
    required: true,
    enum: Object.values(TemplateCategory),
    default: TemplateCategory.system,
  })
  category!: TemplateCategory;

  /**
   * An optional reference to a community, if the template is community-specific
   */
  @Prop({ ref: CommunityCLASSNAME, type: MongooseSchema.Types.ObjectId })
  community?: Types.ObjectId;
}

/**
 * Schema definition for the Template class
 */
export const TemplateSchema = SchemaFactory.createForClass(Template);

TemplateSchema.index({ name: 1, community: 1 }, { unique: true });
