import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PaginationParamsDTO {
  @IsOptional()
  @IsNumber()
  @Min(0)
  page?: number;

  @ApiProperty({ enum: [10, 25], enumName: 'PaginationLimit' })
  @IsOptional()
  @IsEnum([10, 25])
  limit?: 10 | 25;
}
