import { Exclude, Expose, Type } from 'class-transformer';
import { UserSummaryDTO } from '../user/user-summary.dto';
import { CommentTags } from '../../comments/comments.schema';
import { TransformObjectId } from '../../utils/expose-id.decorator';
import { ApiProperty } from '@nestjs/swagger';

@Exclude()
export class CommentDTO {
  /**
   * Comment ID
   * @example 542c2b97bac0595474108b48
   */
  @TransformObjectId() @Expose() _id!: string;

  /**
   * Comment author user ID
   * @example 6203d0923fec3d1531fca950
   */
  @TransformObjectId() @Expose() user_id!: string;

  /**
   * Comment community ID
   * @example 6203d0923fec3d1531fca950
   */
  @TransformObjectId() @Expose() community!: string;

  @Expose() @Type(() => UserSummaryDTO) user!: UserSummaryDTO;

  /**
   * Place where the comment was created
   * @example DepositDocument
   */
  @TransformObjectId() @Expose() resource!: string;

  /**
   * Message of the comment
   * @example Very nice presentation! A broad overview of the field.
   */
  @Expose() content!: string;

  /**
   * Tags of the author of the comment
   * @example [author, moderator]
   */
  @ApiProperty({ enum: CommentTags, enumName: 'CommentTags' })
  @Expose()
  tags!: CommentTags[];

  /**
   * Comment id of the previous comment of the conversation
   * @example [author, moderator]
   */
  @TransformObjectId() @Expose() parent?: string;

  /**
   * Mark if the comment has any reply
   * @example false
   */
  @Expose() hasReplies!: boolean;

  /**
   * Comment creation date
   * @example 21/12/2022
   */
  @Expose() createdAt!: Date;

  /**
   * Comment actions
   * @example []
   */
  @Expose() actions: string[] = [];
}
