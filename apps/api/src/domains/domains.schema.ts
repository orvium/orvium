import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

/**
 * Type alias for a hydrated document of a Domain.
 */
export type DomainDocument = HydratedDocument<Domain>;

/**
 * Represents an email domain entity within the system.
 * This class is used to store and manage unique email domains that are allowed or recognized
 * by the system, typically for purposes of validating user email addresses during registration or other processes.
 */
@Schema({ collection: 'domains', timestamps: true })
export class Domain {
  /**
   * Unique email domain to be stored and managed. trimmed of whitespace.
   */
  @Prop({ required: true, unique: true, trim: true })
  emailDomain!: string;
}

/**
 * Schema factory for the Domain class.
 */
export const DomainSchema = SchemaFactory.createForClass(Domain);
