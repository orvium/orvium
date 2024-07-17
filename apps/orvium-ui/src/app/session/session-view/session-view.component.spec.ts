import { SessionViewComponent } from './session-view.component';
import {
  factoryCommunityPopulatedDTO,
  factoryDepositPopulatedDTO,
  factorySessionDTO,
  factoryUserPrivateDTO,
} from '../../shared/test-data';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { MockComponent, MockProvider, MockRender } from 'ng-mocks';
import { BehaviorSubject, of } from 'rxjs';
import { DefaultService, UserPrivateDTO } from '@orvium/api';
import { ProfileService } from '../../profile/profile.service';
import { TestBed } from '@angular/core/testing';
import { DepositsListComponent } from '../../deposits/deposits-list/deposits-list.component';
import { CommunityService } from '../../communities/community.service';

describe('SessionViewComponent', () => {
  const community = factoryCommunityPopulatedDTO.build({
    newTracks: [{ title: 'example', timestamp: 15 }],
  });
  const deposit = factoryDepositPopulatedDTO.build();
  const session = factorySessionDTO.build({
    community: community._id,
    deposits: [deposit._id],
    newTrackTimestamp: 15,
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SessionViewComponent, MockComponent(DepositsListComponent)],
      providers: [
        MockProvider(DefaultService, {
          getDeposit: jest.fn().mockReturnValue(of(deposit)),
          getCommunity: jest.fn().mockReturnValue(of(community)),
          getSession: jest.fn().mockReturnValue(of(session)),
        }),
        MockProvider(ProfileService, {
          profile: new BehaviorSubject<UserPrivateDTO | undefined>(factoryUserPrivateDTO.build()),
        }),
        MockProvider(CommunityService, {
          getCommunityActions: jest
            .fn()
            .mockReturnValue({ update: true, moderate: true, submit: true }),
        }),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(
              convertToParamMap({
                sessionId: session._id,
              })
            ),
          },
        },
      ],
    });
  });

  it('should create', () => {
    const fixture = MockRender(SessionViewComponent);
    fixture.detectChanges();
    expect(fixture.point.componentInstance).toBeTruthy();
  });
});
