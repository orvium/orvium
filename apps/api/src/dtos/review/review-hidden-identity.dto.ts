import { Transform } from 'class-transformer';
import { UserSummaryDTO } from '../user/user-summary.dto';

const hiddenOwnerProfile: UserSummaryDTO = {
  _id: 'fake',
  userId: 'fake',
  firstName: 'Hidden',
  lastName: 'Identity',
  nickname: 'anonymous-reviewer',
  gravatar: 'abe0509a6539276354ba2e283317688a',
  institutions: [],
  bannerURL: undefined,
  avatar: undefined,
};

export const HIDDEN_IDENTITY = 'Hidden Identity';
export class ReviewHiddenIdentityDTO {
  @Transform(() => hiddenOwnerProfile) ownerProfile: UserSummaryDTO = hiddenOwnerProfile;

  @Transform(() => HIDDEN_IDENTITY) author = HIDDEN_IDENTITY;
  @Transform(() => 'fake') creator = 'fake';
  @Transform(() => undefined) avatar = undefined;
  @Transform(() => 'abe0509a6539276354ba2e283317688a')
  gravatar = 'abe0509a6539276354ba2e283317688a';
}
