import { IsEmail, IsString } from 'class-validator';
import { ModeratorRole } from '../../communities/communities-moderator.schema';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserRoleDTO {
  /**
   * User email
   * @example example@example.com
   */
  @IsEmail() email!: string;

  /**
   * User role as moderator
   * @example moderator
   */
  @ApiProperty({ enum: ModeratorRole, enumName: 'ModeratorRole' })
  @IsString()
  role!: ModeratorRole;
}
