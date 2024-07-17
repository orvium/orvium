import { SessionCardComponent } from './session-card.component';
import { MockProvider, MockRender } from 'ng-mocks';
import { factoryCommunityPrivateDTO, generateObjectId } from '../../shared/test-data';
import { DefaultService, SessionDTO } from '@orvium/api';
import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

function sessionTest(): SessionDTO {
  return {
    creator: 'john',
    newTrackTimestamp: 15,
    description: 'test description',
    community: 'Orvium',
    deposits: [],
    _id: generateObjectId(),
    title: 'mi session',
    speakers: [],
    actions: [],
  };
}

const community = factoryCommunityPrivateDTO.build();

describe('SessionCardComponent', () => {
  const session = sessionTest();
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SessionCardComponent, RouterTestingModule, NoopAnimationsModule],
      providers: [
        MockProvider(DefaultService, {
          getCommunity: jest.fn().mockReturnValue(of({})),
        }),
      ],
    });
  });

  it('should create', () => {
    const params = { session: session, community: community };
    const fixture = MockRender(SessionCardComponent, params);
    expect(fixture.point.componentInstance).toBeDefined();
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });
});
