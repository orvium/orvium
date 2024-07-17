import { IsOptional } from 'class-validator';
import { ModeratorRole, NotificationOptions } from '../../communities/communities-moderator.schema';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ModeratorUpdateDTO {
  @IsOptional() @Type(() => NotificationOptions) notificationOptions?: NotificationOptions;

  /**
   * Community Moderator role
   * @example owner
   */
  @IsOptional()
  @ApiProperty({ enum: ModeratorRole, enumName: 'ModeratorRole' })
  moderatorRole?: ModeratorRole;
}
