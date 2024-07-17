import { Exclude, Expose, Type } from 'class-transformer';
import {
  AcceptedFor,
  AccessRight,
  BibtexReferences,
  DepositStatus,
  HistoryLogLine,
  iThenticate,
  PublicationType,
  ReviewType,
} from '../../deposit/deposit.schema';
import { FileMetadata } from '../filemetadata.dto';
import { Reference } from '../reference.dto';
import { TransformObjectId } from '../../utils/expose-id.decorator';
import { ExtraMetadata } from '../extrametadata.dto';
import { ApiProperty } from '@nestjs/swagger';
import { AuthorDTO } from '../author.dto';
import { DoiStatus } from '../../doi/doi-log.schema';

@Exclude()
export class DepositDTO {
  /**
   * Publication ID
   * @example "617298619ff9664a706ca6fb"
   */
  @TransformObjectId() @Expose() _id!: string;

  /**
   * Publication creator ID
   * @example "617298619ff9664a706ca6fb"
   */
  @TransformObjectId() @Expose() creator!: string;

  /**
   * Editor ID assigned to the publication
   * @example "617298619ff9664a706ca6fb"
   */
  @TransformObjectId() @Expose() assignee?: string; // TODO: fix { groups: ['moderate'] }

  /**
   * Submitter nickname
   * @example "617298619ff9664a706ca6fb"
   */
  @Expose() nickname!: string;

  /**
   * Publication title
   * @example "My first publication"
   */
  @Expose() title!: string;

  /**
   * Publication abstract
   * @example "This is a publication about the galaxy"
   */
  @Expose() abstract!: string;

  /**
   * Publication Type
   * @example "Research article"
   */
  @ApiProperty({ enum: PublicationType, enumName: 'PublicationType' })
  @Expose()
  publicationType!: PublicationType;

  /**
   * Publication access rights
   */
  @ApiProperty({ enum: AccessRight, enumName: 'AccessRight' })
  @Expose()
  accessRight!: AccessRight;

  /**
   * Submission date
   * @example 21/10/2023
   */
  @Expose() submissionDate?: string;

  /**
   * Publication date
   * @example 21/10/2023
   */
  @Expose() publicationDate?: string;

  /**
   * Publication status
   */
  @ApiProperty({ enum: DepositStatus, enumName: 'DepositStatus' })
  @Expose()
  status!: DepositStatus;

  /**
   * List of peer reviews ID associated with this publication
   * @example ["617298619ff9664a706ca6fb"]
   */
  @TransformObjectId() @Expose() peerReviews!: string[];

  /**
   * Visibility of the peer reviews
   */
  @ApiProperty({ enum: ReviewType, enumName: 'ReviewType' })
  @Expose()
  reviewType!: ReviewType;

  /**
   * The submission might be accepted for poster or conference talk. Optional value.
   */
  @ApiProperty({ enum: AcceptedFor, enumName: 'AcceptedFor' })
  @Expose()
  acceptedFor!: AcceptedFor;

  /**
   * List of authors of the publication
   */
  @Expose() @Type(() => AuthorDTO) authors!: AuthorDTO[];

  /**
   * List of blockchain transaction associated with this publication
   */
  @ApiProperty({ type: 'object', required: false, additionalProperties: true })
  @Expose()
  transactions?: Record<string, unknown>;

  @Expose() publicationFile?: FileMetadata;

  /**
   * List of optional extra publication files metadata
   */
  @Expose() files!: FileMetadata[];

  /**
   * Extra information required by journals and conferences
   */
  @Expose() extraMetadata!: ExtraMetadata;

  /**
   * Submitter gravatar
   * @example 4d950dd20ef84d1ce7552c78c577ba00
   */
  @Expose() gravatar?: string;

  /**
   * The url of the image put in the profile avatar
   * @example https://s3.eu-central-1.amazonaws.com/public-files.example.com/profile/61f12bb224a817c22e70f108/media/avatar.png
   */
  @Expose() avatar?: string;

  /**
   * List of keywords for the publication
   * @example ["Medical"]
   */
  @Expose() keywords!: string[];

  /**
   * Keccak256 hash of the main publication file.
   * Keccak256 is a cryptographic function built into solidity. Can be used for cryptographic signature with a small size.
   */
  @Expose() keccak256?: string;

  /**
   * DOI of the publication
   * @example "https://doi.org/10.0000/0000"
   */
  @Expose() doi?: string;

  /**
   * Status of the DOI
   * @example "Published"
   */
  @ApiProperty({ enum: DoiStatus, enumName: 'DoiStatus' })
  @Expose()
  doiStatus?: string;

  /**
   * The url of the publication in the platform
   * @example "https://dapp.orvium.io/deposits/63a09f6ce3d5ff0813586171/view"
   */
  @Expose() url?: string;

  /**
   * The url for the pdf of the publication. This pdf might have been automatically generated.
   * @example "https://dapp.orvium.io/api/v1/deposits/63a09f6ce3d5ff0813586171/pdf"
   */
  @Expose() pdfUrl?: string;

  /**
   * List of disciplines associated to the publication
   * @example ["urban-rural"]
   */
  @Expose() disciplines: string[] = [];

  /**
   * List of references of the publication
   */
  @Expose() references!: Reference[];

  /**
   * List of bibtex references of the publication
   */
  @Expose() bibtexReferences!: BibtexReferences[];

  /**
   * Date of the creation of the publication
   */
  @Expose() createdOn?: Date;

  /**
   * Version number of the publication
   * @example 2
   */
  @Expose() version!: number;

  /**
   * Community ID where the publication have been submitted
   * @example "5fa1908fd29a17dc961cc435"
   */
  @TransformObjectId() @Expose() community!: string;

  /**
   * Html extracted automatically for the main publication file
   * @example "<p>This publication is about...</p>"
   */
  @Expose() html?: string;

  /**
   * List of images extracted automatically for the main publication file
   * @example ["image1.png","image2.png"]
   */
  @Expose() images!: string[];

  /**
   * This flag enables the creation of peer reviews for this publication
   * @example "true"
   */
  @Expose() canBeReviewed!: boolean;

  /**
   * Deposit option to give permission to author to invite reviewers
   * @example false
   */
  @Expose() canAuthorInviteReviewers!: boolean;

  /**
   * The url of the associated git repository
   * @example "https://github.com/orvium/zenodo"
   */
  @Expose() gitRepository?: string;

  /**
   * List of actions available
   * @example ["update"]
   */
  @Expose() actions: string[] = [];

  /**
   * The ID of this publication in the openAire platform
   * @example "doi_dedup___::71a1f023e1981fc47ae76982e646722d"
   */
  @Expose() openAireIdentifier?: string;

  /**
   * The number of views of the publication
   * @example 1555
   */
  @Expose() views!: number;

  /**
   * A flag that check if you're viewing in the last version of the publication
   */
  @Expose() isLatestVersion!: boolean;

  /**
   * The track timestamp of the publication
   * @example 15437645678
   */
  @Expose() newTrackTimestamp?: number;

  /**
   * List of the actions made in the publication
   */
  @Expose({ groups: ['moderate'] })
  @Type(() => HistoryLogLine)
  history: HistoryLogLine[] = [];

  @Expose({ groups: ['moderate'] }) @Type(() => iThenticate) iThenticate?: iThenticate;
}
