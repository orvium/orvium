import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { CommunityCLASSNAME, DepositCLASSNAME, ReviewCLASSNAME } from '../utils/utils';

export type DoiLogDocument = HydratedDocument<DoiLog>;

/**
 * Enum for the status of a DOI (Digital Object Identifier) process.
 * @enum {string}
 *
 * @property {string} processing - status required before published
 * @property {string} published - final status
 * @property {string} failed - failed status
 */
export enum DoiStatus {
  processing = 'processing',
  published = 'published',
  failed = 'failed',
}

/**
 * Represents a log entry for DOI submission and processing within the system.
 * This class is used to track the status of DOI registrations for various resources such as deposits and reviews.
 */
@Schema({ collection: 'doiLog', timestamps: true, toJSON: { virtuals: true } })
export class DoiLog {
  /**
   * A unique identifier for the DOI submission, used to track and manage submissions.
   */
  @Prop({ required: true })
  submissionId!: number;

  /**
   * The actual DOI string that uniquely identifies a resource.
   */
  @Prop({ required: true })
  doi!: string;

  /**
   * Current status of the DOI process, reference to enum DoiStatus.
   */
  @Prop({
    required: true,
    enum: Object.values(DoiStatus),
    default: DoiStatus.processing,
  })
  status!: DoiStatus;

  /**
   * The path or identifier for the file associated with the DOI.
   */
  @Prop({ required: true })
  file!: string;

  /**
   * Optional additional data or metadata associated with the DOI submission.
   */
  @Prop()
  data?: string;

  /**
   * Reference to the community to which the DOI-submitted resource belongs
   */
  @Prop({
    required: true,
    ref: CommunityCLASSNAME,
    type: MongooseSchema.Types.ObjectId,
  })
  community!: Types.ObjectId;

  /**
   * The MongoDB ObjectId of the resource for which the DOI is registered
   */
  @Prop({
    required: true,
    type: MongooseSchema.Types.ObjectId,
    refPath: 'resourceModel',
  })
  resource!: Types.ObjectId;

  /**
   *  Indicates the model of the resource (either a Deposit or a Review)
   */
  @Prop({
    type: String,
    required: true,
    enum: [DepositCLASSNAME, ReviewCLASSNAME],
  })
  resourceModel!: typeof DepositCLASSNAME | typeof ReviewCLASSNAME;
}

/**
 * Schema factory for the DoiLog class.
 */
export const DoiLogSchema = SchemaFactory.createForClass(DoiLog);
