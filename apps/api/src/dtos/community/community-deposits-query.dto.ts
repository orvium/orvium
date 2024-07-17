import { IsNumber, IsOptional, IsString } from 'class-validator';
import { DepositStatus } from '../../deposit/deposit.schema';
import { PaginationParamsDTO } from '../pagination-params.dto';

export class CommunityDepositsQueryDTO extends PaginationParamsDTO {
  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @IsString()
  sort?: string;

  @IsOptional()
  @IsString()
  status?: DepositStatus;

  @IsOptional()
  @IsNumber()
  newTrackTimestamp?: number;

  @IsOptional()
  @IsString()
  moderator?: string;

  @IsOptional()
  @IsString()
  acceptedFor?: string;

  @IsOptional()
  ids?: string[];
}
