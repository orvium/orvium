import { IsOptional, IsString } from 'class-validator';
import { PaginationParamsDTO } from '../pagination-params.dto';

export class CommunityPaymentsQueryDTO extends PaginationParamsDTO {
  @IsOptional()
  @IsString()
  paymentStatus?: string;

  @IsOptional()
  @IsString()
  query?: string;
}
