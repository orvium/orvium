import { DoiStatus } from '../doi/doi-log.schema';
import { IsString } from 'class-validator';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class DoiLogDTO {
  /**
   * Doi
   * @example "10.55835/5fa1908fd29a17dc961cc435" @Expose()
   */
  @Expose() @IsString() doi!: string;

  /**
   * Status of the doi
   * @example published
   */
  @Expose() @IsString() status!: DoiStatus;

  /**
   * Data related to the submission of the doi, can be an error or success message
   * @example published
   */
  @Expose() @IsString() data?: string;
}
