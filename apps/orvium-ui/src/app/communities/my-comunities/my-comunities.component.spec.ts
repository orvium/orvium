import { TestBed } from '@angular/core/testing';

import { MyComunitiesComponent } from './my-comunities.component';
import { MockProvider, MockRender } from 'ng-mocks';
import { CommunityPopulatedDTO, DefaultService } from '@orvium/api';
import { of } from 'rxjs';
import { factoryCommunityPopulatedDTO } from '../../shared/test-data';
import { ActivatedRoute } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('MyComunitiesComponent', () => {
  const community = factoryCommunityPopulatedDTO.build();
  const communities: CommunityPopulatedDTO[] = [
    { ...community, actions: ['join'], views: 1 },
    { ...community, _id: '1234', views: 2 },
  ];
  const routeSnapshot = {
    data: of({ communities }),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MyComunitiesComponent, NoopAnimationsModule],
      providers: [
        MockProvider(DefaultService, {
          getMyCommunities: jest.fn().mockReturnValue(of(communities)),
        }),
        { provide: ActivatedRoute, useValue: routeSnapshot },
      ],
    });
  });

  it('should create', () => {
    const fixture = MockRender(MyComunitiesComponent);
    expect(fixture.point.componentInstance).toBeDefined();
    fixture.detectChanges();
    expect(fixture.point.componentInstance).toBeTruthy();
  });
});
