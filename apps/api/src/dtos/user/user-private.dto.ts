import { Exclude, Expose } from 'class-transformer';
import { UserPublicDTO } from './user-public.dto';

@Exclude()
export class UserPrivateDTO extends UserPublicDTO {
  /**
   * User ID string
   * @example 5fa1908fd29a17dc961cc435
   */
  @Expose() userId!: string;

  /**
   * User provider ids
   * @example ["google|qwerasdfqwerer"]
   */
  @Expose() providerIds!: string[];

  /**
   * Publications where the user is mentioned as author or submitter in the platform
   * @example [63a09f6ce3d5ff0813586171,63a09f6ce3d5ff0813586176]
   */
  @Expose() starredDeposits!: string[];

  /**
   * Check if the user has finished the sign-up
   * @example false
   */
  @Expose() isOnboarded!: boolean;

  /**
   * User email
   * @example example@example.com
   */
  @Expose() email?: string;

  /**
   * Temporary value when the user is confirming a new email
   * @example false
   */
  @Expose() emailPendingConfirmation?: string;

  /**
   * User roles in the platform
   * @example [moderator, admin]
   */
  @Expose() roles!: string[];

  /**
   * User profile completion percentage
   * @example 66
   */
  @Expose() percentageComplete!: number;

  /**
   * User invitation url
   * @example https://www.example.com
   */
  @Expose() inviteToken?: string;

  /**
   * Check if the user has accepted the Terms and Conditions
   * @example true
   */
  @Expose() acceptedTC!: boolean;

  /**
   * Check if the user is impersonating another user
   * @example false
   */
  @Expose() impersonatedUser?: string;

  /**
   * Check if the user has accepted the ithenticate eula
   * @example false
   */
  @Expose() iThenticateEULAAccepted?: boolean;
}
