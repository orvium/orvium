import { InviteStatus, InviteType } from '../../invite/invite.schema';
import { Exclude, Expose } from 'class-transformer';
import { TransformObjectId } from '../../utils/expose-id.decorator';
import { ApiProperty } from '@nestjs/swagger';
import { InvitationDataDTO } from '../invitation-data.dto';

@Exclude()
export class InviteDTO {
  /**
   *  Invite ID
   * @example 6059d81f1ac885000823eef2
   */
  @TransformObjectId() @Expose() _id!: string;

  /**
   *  Invitation type
   * @example review
   */
  @ApiProperty({ enum: InviteType, enumName: 'InviteType' })
  @Expose()
  inviteType!: InviteType;

  /**
   *  Invitation status
   * @example pending
   */
  @ApiProperty({ enum: InviteStatus, enumName: 'InviteStatus' })
  @Expose()
  status!: InviteStatus;

  @TransformObjectId() @Expose() sender!: string;

  /**
   *  Invitation addressee
   * @example john@example.com
   */
  @Expose() addressee!: string;

  /**
   *  Invitation create on
   * @example 2021-03-23T11:59:27.880+00:00
   */
  @Expose() createdOn!: Date;
  // data can contain ObjectIds that is why we use @TransformObjectId
  @TransformObjectId() @Expose() data!: InvitationDataDTO;

  /**
   *  Invitation actions
   * @example [Update]
   */
  @Expose() actions: string[] = [];

  /**
   *  Limit date of the invitation
   * @example 2023-04-23T11:59:27.880+00:00
   */
  @Expose() dateLimit?: Date;

  /**
   *  The invitation message send to the reviewer
   * @example Dear John, I would like to invite you to review my publication
   */
  @Expose({ groups: ['readMessage'] }) message?: string;
}
