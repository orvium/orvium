import { IsMongoId, IsOptional, IsString } from 'class-validator';
import { IsNotBlankValidator } from '../../utils/isNotBlankValidator';
import { ApiProperty } from '@nestjs/swagger';
import { DepositCLASSNAME, ReviewCLASSNAME } from '../../utils/utils';

export class CreateCommentDTO {
  /**
   * Message of the comment
   * @example Very nice presentation! A broad overview of the field.
   */
  @IsString() @IsNotBlankValidator({ message: 'Comment should not be empty' }) content!: string;
  @IsMongoId() resource!: string;
  /**
   * Place where the comment was created
   * @example Deposit
   */
  @IsString()
  @IsNotBlankValidator()
  @ApiProperty({ enum: [DepositCLASSNAME, ReviewCLASSNAME] })
  resourceModel!: typeof DepositCLASSNAME | typeof ReviewCLASSNAME;

  /**
   * Comment id of the previous comment of the conversation
   * @example [author, moderator]
   */
  @IsOptional() @IsMongoId() parent?: string;
}
