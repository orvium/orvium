import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class DomainDTO {
  /**
   * Email domain
   * @example "orvium"
   */
  @Expose()
  emailDomain!: string;
}
