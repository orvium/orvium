import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class PermissionsDTO {
  /**
   * Permission of the community
   * @example "['read','join']"
   */
  @Expose()
  community!: string[];
}
