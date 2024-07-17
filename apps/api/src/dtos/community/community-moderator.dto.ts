import { Exclude, Expose, Type } from 'class-transformer';
import { UserSummaryDTO } from '../user/user-summary.dto';
import { ModeratorRole, NotificationOptions } from '../../communities/communities-moderator.schema';
import { TransformObjectId } from '../../utils/expose-id.decorator';
import { ApiProperty } from '@nestjs/swagger';

@Exclude()
export class CommunityModeratorDTO {
  /**
   * Community Moderator ID
   * @example 613f801b654745000888e283
   */
  @TransformObjectId()
  @Expose()
  _id!: string;

  @Expose() @Type(() => UserSummaryDTO) user!: UserSummaryDTO;

  /**
   * Community Moderator role
   * @example owner
   */
  @ApiProperty({ enum: ModeratorRole, enumName: 'ModeratorRole' })
  @Expose()
  moderatorRole!: ModeratorRole;

  @Expose() @Type(() => NotificationOptions) notificationOptions?: NotificationOptions;

  /**
   * Community Moderator actions
   * @example [Update]
   */
  @Expose() actions?: string[];
}
