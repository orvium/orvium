import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type FeedbackDocument = HydratedDocument<Feedback>;

/**
 * Represents feedback provided by users of the system. This can include general comments,
 * issues or bugs they've encountered, and other types of feedback.
 */
@Schema({ collection: 'feedback', timestamps: true, toJSON: { virtuals: true } })
export class Feedback {
  /**
   * The date and time when the feedback was created. Default is the current date and time.
   */
  @Prop({ default: Date.now() })
  created!: Date;

  /**
   * The email address of the user providing the feedback. It is optional and stored in lowercase.
   */
  @Prop({ trim: true, lowercase: true })
  email?: string;

  /**
   *  A description of the feedback, detailing the user's experience or issues.
   */
  @Prop({ trim: true })
  description!: string;

  /**
   * An optional screenshot provided by the user to illustrate the feedback.
   */
  @Prop({ type: MongooseSchema.Types.Buffer })
  screenshot?: Buffer;

  /**
   * Any additional data related to the feedback in a mixed type format, which allows for storing various types of data.
   */
  @Prop({ type: MongooseSchema.Types.Mixed })
  data?: Record<string, unknown>;
}

/**
 * Schema factory for the Feedback class
 */
export const FeedbackSchema = SchemaFactory.createForClass(Feedback);
