import { PaginationParamsDTO } from '../pagination-params.dto';
import { IsArray, IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
import { DepositStatus } from '../../deposit/deposit.schema';
import { ApiProperty } from '@nestjs/swagger';

export class GetDepositsQueryParams extends PaginationParamsDTO {
  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @IsString()
  creator?: string;

  @IsOptional()
  @IsString()
  community?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiProperty({ name: 'communityChildren[]' })
  communityChildren?: string[];

  @IsOptional()
  @IsString()
  doi?: string;

  @IsOptional()
  @IsString()
  orcid?: string;

  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  until?: string;

  @IsOptional()
  @IsString()
  discipline?: string;

  @IsOptional()
  @IsString()
  status?: DepositStatus;

  @IsOptional()
  @IsNumber()
  newTrackTimestamp?: number;

  @IsOptional()
  @IsString()
  sort?: string;

  @IsOptional()
  @IsBoolean()
  hasReviews?: boolean;
}
