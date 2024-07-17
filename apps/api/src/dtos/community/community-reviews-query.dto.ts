import { IsNumber, IsOptional, IsString } from 'class-validator';
import { ReviewKind, ReviewStatus } from '../../review/review.schema';
import { PaginationParamsDTO } from '../pagination-params.dto';

export class CommunityReviewsQueryDTO extends PaginationParamsDTO {
  @IsOptional()
  @IsNumber()
  newTrackTimestamp?: number;

  @IsOptional()
  @IsString()
  reviewKind?: ReviewKind;

  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @IsString()
  reviewStatus?: ReviewStatus;

  @IsOptional()
  ids?: string[];
}
