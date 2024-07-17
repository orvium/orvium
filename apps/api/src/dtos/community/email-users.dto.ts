import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class EmailUsersDTO {
  /**
   * User name
   * @example john
   */
  @Expose() firstName!: string;
  /**
   * User lastname
   * @example doe
   */
  @Expose() lastName!: string;
  /**
   * User email
   * @example example@example.com
   */
  @Expose() email!: string;
  /**
   * User avatar
   * @example image
   */
  @Expose() avatar?: string;
  /**
   * User gravatar
   * @example
   */
  @Expose() gravatar!: string;

  /**
   * An array of actions
   * @example [Update]
   */
  @Expose() actions?: string[];
}
