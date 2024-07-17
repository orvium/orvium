import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type DisciplineDocument = HydratedDocument<Discipline>;

/**
 * Represents an academic or professional discipline in the system.
 * This class is used to store and manage distinct disciplines, allowing for categorization
 * and filtering of content, users, or any system entities based on their relevant disciplines.
 */
@Schema({ collection: 'disciplines', timestamps: true, toJSON: { virtuals: true } })
export class Discipline {
  /**
   * The unique and official name of the discipline, which is used as an identifier.
   */
  @Prop({ required: true, unique: true, trim: true })
  name!: string;

  /**
   *  An optional description of the discipline, providing additional context.
   */
  @Prop({ trim: true })
  description?: string;
}

/**
 * Schema factory for the Discipline class.
 */
export const DisciplineSchema = SchemaFactory.createForClass(Discipline);
