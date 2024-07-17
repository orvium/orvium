import { IsDefined } from 'class-validator';

export class RequestDataDTO {
  /**
   * A user's personal data
   * @example 'User' = {}
   */
  @IsDefined() data!: string;
}
