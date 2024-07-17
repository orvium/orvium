import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

/**
 * Type alias for a hydrated document of AppNotification,
 * which includes Mongoose document methods like save(), find(), etc.
 */
export type AppNotificationDocument = HydratedDocument<AppNotification>;

/**
 * Represents a notification within the application. This class is used to store and manage notifications sent to users,
 * including details such as the title, body, associated icon, and whether the notification has been read.
 */
@Schema({ collection: 'notification', timestamps: true, toJSON: { virtuals: true } })
export class AppNotification {
  /**
   * The identifier of the user to whom the notification is sent.
   */
  @Prop() userId!: string;

  /**
   * The title of the notification, providing a brief overview of its purpose, whitespaces trimmed.
   */
  @Prop({ trim: true }) title!: string;

  /**
   * The main content or body of the notification, which provides more detailed information, whitespaces trimmed
   */
  @Prop({ trim: true }) body!: string;

  /**
   * A URL or a path to an icon image that may be displayed with the notification.
   */
  @Prop() icon!: string;

  /**
   * The timestamp when the notification was created.
   */
  @Prop() createdOn!: Date;

  /**
   * Flag indicating whether the notification has been read by the user. Defaults to false.
   */
  @Prop({ default: false }) isRead!: boolean;

  /**
   * Optional action URL or identifier that the user can follow or perform from the notification
   */
  @Prop() action?: string;
}

/**
 * Schema factory for the AppNotification class
 */
export const AppNotificationSchema = SchemaFactory.createForClass(AppNotification);
