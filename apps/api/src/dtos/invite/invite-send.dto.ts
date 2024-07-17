import { IsEmail } from 'class-validator';

export class SendInviteBody {
  /**
   * emails of the invitation
   * @example [john@example.com]
   */
  @IsEmail({}, { each: true })
  emails!: string[];
}
