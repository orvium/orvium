import { Exclude, Expose, Type } from 'class-transformer';
import { CommunityDTO } from './community.dto';
import { CommunityModeratorDTO } from './community-moderator.dto';

@Exclude()
export class CommunityPopulatedDTO extends CommunityDTO {
  /**
   * List of conferences associated with this community
   */
  @Expose() @Type(() => CommunityDTO) conferenceProceedingsPopulated!: CommunityDTO[];

  /**
   * List of moderators of the community
   */
  @Expose() @Type(() => CommunityModeratorDTO) moderatorsPopulated!: CommunityModeratorDTO[];
}
