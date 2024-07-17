import { InviteService } from './invite.service';
import { ProfileService } from '../profile/profile.service';
import { MockBuilder, MockInstance, MockRender, MockReset } from 'ng-mocks';
import { BehaviorSubject } from 'rxjs';
import { UserPrivateDTO } from '@orvium/api';
import { factoryUserPrivateDTO } from '../shared/test-data';

describe('InviteService', () => {
  beforeEach(() => {
    return MockBuilder(InviteService);
  });

  afterEach(MockReset);

  it('should be created', () => {
    const fixture = MockRender(InviteService);
    expect(fixture.point.componentInstance).toBeTruthy();
  });

  it('should not open if profile is undefined', () => {
    MockInstance(
      ProfileService,
      'profile',
      new BehaviorSubject<UserPrivateDTO | undefined>(undefined)
    );
    const fixture = MockRender(InviteService);
    fixture.point.componentInstance.openInviteDialog();
  });

  it('should not open if profile is not onboarded', () => {
    MockInstance(
      ProfileService,
      'profile',
      new BehaviorSubject<UserPrivateDTO | undefined>(
        factoryUserPrivateDTO.build({ isOnboarded: false })
      )
    );
    const fixture = MockRender(InviteService);
    fixture.point.componentInstance.openInviteDialog();
  });

  it('should open invite dialog', () => {
    MockInstance(
      ProfileService,
      'profile',
      new BehaviorSubject<UserPrivateDTO | undefined>(
        factoryUserPrivateDTO.build({ isOnboarded: true })
      )
    );
    const fixture = MockRender(InviteService);
    fixture.point.componentInstance.openInviteDialog();
  });
});
