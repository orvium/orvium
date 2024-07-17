import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type InstitutionDocument = HydratedDocument<Institution>;

/**
 * Represents an educational or research institution within the system.
 * This class is used to store information about institutions, which can be utilized for various features
 * like user affiliations, email validation, or more.
 */
@Schema({ collection: 'institution', timestamps: true, toJSON: { virtuals: true } })
export class Institution {
  /**
   * The full, official name of the institution. It is required and trimmed of whitespace
   */
  @Prop({ required: true, trim: true }) name!: string;

  /**
   * The internet domain associated with the institution (e.g., "example.edu"). Required and trimmed.
   */
  @Prop({ required: true, trim: true }) domain!: string;

  /**
   * The country where the institution is located. Optional and trimmed.
   */
  @Prop({ trim: true }) country?: string;

  /**
   * The city where the institution is based. Optional and trimmed.
   */
  @Prop({ trim: true }) city?: string;

  /**
   * An alternative name or abbreviation for the institution. Optional and trimmed
   */
  @Prop({ trim: true }) synonym?: string;
}

/**
 * Schema factory for the Institution class
 */
export const InstitutionSchema = SchemaFactory.createForClass(Institution);
