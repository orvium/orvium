import { IsBoolean, IsDate, IsOptional, IsString } from 'class-validator';
import { IsNotBlankValidator } from '../../utils/isNotBlankValidator';
import {
  AccessRight,
  BibtexReferences,
  DepositStatus,
  PublicationType,
  ReviewType,
} from '../../deposit/deposit.schema';
import { Type } from 'class-transformer';
import { ExtraMetadata } from '../extrametadata.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Reference } from '../reference.dto';
import { AuthorUpdateDTO } from '../author-update.dto';

export class UpdateDepositDTO {
  /**
   * Publication title
   * @example "My first publication"
   */
  @IsOptional()
  @IsString()
  @IsNotBlankValidator({ message: 'Title should not be empty' })
  title?: string;

  /**
   * Publication abstract
   * @example "This is a publication about the galaxy"
   */
  @IsOptional() @IsString() abstract?: string;

  /**
   * Editor ID assigned to the publication
   * @example "617298619ff9664a706ca6fb"
   */
  @IsOptional() @IsString() assignee?: string;

  /**
   * Publication Type
   * @example "Research article"
   */
  @ApiProperty({ enum: PublicationType, enumName: 'PublicationType' })
  @IsOptional()
  @IsString()
  publicationType?: PublicationType;

  /**
   * Publication access rights
   * @example "CC CY"
   */
  @ApiProperty({ enum: AccessRight, enumName: 'AccessRight' })
  @IsOptional()
  @IsString()
  accessRight?: AccessRight;

  /**
   * Publication date
   * @example 21/10/2023
   */
  @IsOptional() @IsDate() publicationDate?: Date;

  /**
   * Submission date
   * @example 21/10/2023
   */
  @IsOptional() @IsDate() submissionDate?: Date;

  /**
   * Publication status
   * @example "accepted"
   */
  @ApiProperty({ enum: DepositStatus, enumName: 'DepositStatus' })
  @IsOptional()
  @IsString()
  status?: DepositStatus;

  /**
   * Visibility of the peer reviews
   * @example "Open Review"
   */
  @ApiProperty({ enum: ReviewType, enumName: 'ReviewType' })
  @IsOptional()
  @IsString()
  reviewType?: ReviewType;

  /**
   * List of authors of the publication
   */
  @IsOptional() @Type(() => AuthorUpdateDTO) authors?: AuthorUpdateDTO[];

  /**
   * List of blockchain transaction associated with this publication
   */
  @ApiProperty({ type: 'object', required: false, additionalProperties: true })
  @IsOptional()
  transactions?: unknown;

  /**
   * Keccak256 hash of the main publication file.
   * Keccak256 is a cryptographic function built into solidity. Can be used for cryptographic signature with a small size.
   */
  @IsOptional() @IsString() keccak256?: string;

  /**
   * List of keywords for the publication
   * @example ["Medical"]
   */
  @IsOptional() @IsString({ each: true }) keywords?: string[];

  /**
   * DOI of the publication
   * @example "https://doi.org/10.0000/0000"
   */
  @IsOptional() @IsString() doi?: string;

  /**
   * List of disciplines associated to the publication
   * @example ["urban-rural"]
   */
  @IsOptional() @IsString({ each: true }) disciplines?: string[];

  /**
   * List of references of the publication
   */
  @IsOptional() @Type(() => Reference) references?: Reference[];

  /**
   * List of bibtex references of the publication
   */
  @IsOptional() @Type(() => BibtexReferences) bibtexReferences?: BibtexReferences[];

  /**
   * The track timestamp of the publication
   * @example 15437645678
   */
  @IsOptional() newTrackTimestamp?: number;

  /**
   * This flag enables the creation of peer reviews for this publication
   * @example "true"
   */
  @IsOptional() @IsBoolean() canBeReviewed?: boolean;

  /**
   * Deposit internal option to give permission to authors to invite reviewers
   * @example false
   */
  @IsOptional() @IsBoolean() canAuthorInviteReviewers?: boolean;

  /**
   * The url of the associated git repository
   * @example "https://github.com/orvium/zenodo"
   */
  @IsOptional() @IsString() gitRepository?: string;

  /**
   * Extra information required by journals and conferences
   */
  @IsOptional() @Type(() => ExtraMetadata) extraMetadata?: ExtraMetadata;

  /**
   * Html extracted automatically for the main publication file
   * @example "<p>This publication is about...</p>"
   */
  @IsOptional() @IsString() html?: string;
}
