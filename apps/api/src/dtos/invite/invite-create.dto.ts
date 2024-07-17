import { IsDefined, IsString } from 'class-validator';
import { InviteType } from '../../invite/invite.schema';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateInviteData {
  depositId!: string;
  reviewerName!: string;
  message!: string;
  dateLimit?: Date;
}

export class CreateInviteDTO {
  /**
   * Invitation type
   * @example review
   */
  @ApiProperty({ enum: InviteType, enumName: 'InviteType' })
  @IsString()
  inviteType!: InviteType;

  /**
   * Invitation addressee
   * @example john@example.com
   */
  @IsString() addressee!: string;

  @IsDefined() @Type(() => CreateInviteData) data!: CreateInviteData;
}
