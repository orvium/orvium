import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { google } from '@google-analytics/data/build/protos/protos';
import IRunReportResponse = google.analytics.data.v1beta.IRunReportResponse;

/**
 * Type alias for a hydrated document of Metrics, which includes methods like save(),
 * find(), etc., from Mongoose.
 */
export type MetricsDocument = HydratedDocument<Metrics>;

/**
 * Represents analytical metrics reports for various entities within the system.
 * This class is designed to store report data for deposits, communities, and reviews.
 * Each property holds a report response which can include numerous metrics and dimensions depending on the query made to Google Analytics.
 */
@Schema({ collection: 'metrics', timestamps: true, toJSON: { virtuals: true } })
export class Metrics {
  /**
   * Optional report data for deposits. This data includes metrics such as page views, unique visitors etc., specific to deposit activities.
   */
  @Prop({ type: MongooseSchema.Types.Mixed })
  depositReport?: IRunReportResponse;

  /**
   * Optional report data for communities. Similar to deposit reports, but for community-related metrics.
   */
  @Prop({ type: MongooseSchema.Types.Mixed })
  communityReport?: IRunReportResponse;

  /**
   * Optional report data for reviews. Contains metrics related to review activities within the system.
   */
  @Prop({ type: MongooseSchema.Types.Mixed })
  reviewReport?: IRunReportResponse;
}

/**
 * Schema factory for the Metrics class.
 */
export const MetricsSchema = SchemaFactory.createForClass(Metrics);
