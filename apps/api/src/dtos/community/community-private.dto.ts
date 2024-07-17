import { Exclude, Expose, Type } from 'class-transformer';
import { StripeDTO } from '../stripe.dto';
import { CrossrefDTO } from '../crossref.dto';
import { CommunityPopulatedDTO } from './community-populated.dto';
import { DataCiteDTO } from '../dataCite.dto';

@Exclude()
export class CommunityPrivateDTO extends CommunityPopulatedDTO {
  // eslint-disable-next-line @typescript-eslint/no-inferrable-types
  @Expose() isPrivateDTO: boolean = true;
  @Expose() @Type(() => StripeDTO) stripeAccount?: StripeDTO;

  /**
   * Community iThenticateEULAN needed
   * @example true
   */
  @Expose() iThenticateEULANeeded?: boolean;

  @Expose() @Type(() => CrossrefDTO) crossref?: CrossrefDTO | null;
  @Expose() @Type(() => DataCiteDTO) datacite?: DataCiteDTO | null;
}
