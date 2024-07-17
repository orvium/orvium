import { IsString } from 'class-validator';
import { InviteStatus } from '../../invite/invite.schema';
import { ApiProperty } from '@nestjs/swagger';

export class InviteUpdateDTO {
  /**
   * Invitation update status
   * @example "pending"
   */
  @ApiProperty({ enum: InviteStatus, enumName: 'InviteStatus' })
  @IsString()
  status!: InviteStatus;
}
