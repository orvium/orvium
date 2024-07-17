import { Exclude, Expose } from 'class-transformer';
import { TransformObjectId } from '../utils/expose-id.decorator';

@Exclude()
export class AppNotificationDTO {
  /**
   * Notification ID
   * @example 5fa1908fd29a17dc961cc435
   */
  @TransformObjectId() @Expose() _id!: string;

  /**
   * User ID
   * @example 5fa1908fd29a17dc961cc435
   */
  @Expose() userId!: string;

  /**
   * Notification title
   * @example "New deposit pending approval"
   */
  @Expose() title!: string;

  /**
   * Notification content
   * @example "Publication accepted in Orvium Community."
   */
  @Expose() body!: string;

  /**
   * Icon to show with the notification
   * @example "example.png"
   */
  @Expose() icon!: string;

  /**
   * Mark the date where the notification was created
   * @example 21/12/2022
   */
  @Expose() createdOn!: Date;

  /**
   * Check if the user have read the notification
   * @example true
   */
  @Expose() isRead!: boolean;

  /**
   * Notification actions
   * @example [Update]
   */
  @Expose() action?: string;
}
