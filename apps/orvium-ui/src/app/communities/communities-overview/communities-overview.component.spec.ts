import { CommunitiesOverviewComponent } from './communities-overview.component';
import { MockProvider, MockRender } from 'ng-mocks';
import { ProfileService } from '../../profile/profile.service';
import { of } from 'rxjs';
import { factoryCommunityPopulatedDTO, factoryUserPrivateDTO } from '../../shared/test-data';
import { CommunityPopulatedDTO, DefaultService } from '@orvium/api';
import { TestBed } from '@angular/core/testing';
import { AuthenticationService } from '../../auth/authentication.service';
import { ActivatedRoute } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { DialogService } from '../../dialogs/dialog.service';
import { MatSnackBarModule } from '@angular/material/snack-bar';

describe('CommunitiesOverviewComponent', () => {
  const community = factoryCommunityPopulatedDTO.build();
  let communities: CommunityPopulatedDTO[] = [
    { ...community, actions: ['join'], views: 1 },
    { ...community, _id: '1234', views: 2 },
  ];
  const routeSnapshot = {
    data: of({ communities }),
  };
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CommunitiesOverviewComponent, MatSnackBarModule, NoopAnimationsModule],
      providers: [
        MockProvider(ProfileService, {
          getProfile: jest.fn().mockReturnValue(of(factoryUserPrivateDTO.build())),
        }),
        MockProvider(DefaultService, {
          getCommunities: jest.fn().mockReturnValue(of(communities)),
          getMyCommunities: jest.fn().mockReturnValue(of(communities)),
        }),
        MockProvider(AuthenticationService, {
          login: jest.fn().mockReturnValue(null),
        }),
        MockProvider(DialogService, {
          openInputDialog: jest.fn().mockReturnValue({
            afterClosed: () => of(true),
          }),
        }),
        { provide: ActivatedRoute, useValue: routeSnapshot },
      ],
    });
  });

  it('should create', () => {
    const fixture = MockRender(CommunitiesOverviewComponent);
    expect(fixture.point.componentInstance).toBeDefined();
    fixture.detectChanges();
    expect(fixture.point.componentInstance).toBeTruthy();
  });

  it('should create without profile', () => {
    const fixture = MockRender(CommunitiesOverviewComponent);
    fixture.point.componentInstance.profile = undefined;
    fixture.detectChanges();
    fixture.point.componentInstance.ngOnInit();
    expect(fixture.point.componentInstance).toBeDefined();
    fixture.detectChanges();
    expect(fixture.point.componentInstance).toBeTruthy();
  });

  it('should call createCommunityOrLogin', () => {
    const fixture = MockRender(CommunitiesOverviewComponent);
    fixture.point.componentInstance.createCommunityOrLogin();
  });

  it('should order communities and with the same amount of views', () => {
    communities = [
      { ...community, actions: ['join'], views: 1, _id: '4321' },
      { ...community, _id: '1234', views: 1 },
    ];
    const fixture = MockRender(CommunitiesOverviewComponent);
    fixture.point.componentInstance.orderCommunities();
    expect(fixture.point.componentInstance.communities[0]._id).toBe('1234');
  });

  it('should order communities and with 0 views', () => {
    communities = [
      { ...community, actions: ['join'], views: 0, _id: '4321' },
      { ...community, _id: '1234', views: 0 },
    ];
    const fixture = MockRender(CommunitiesOverviewComponent);
    fixture.point.componentInstance.orderCommunities();
    expect(fixture.point.componentInstance.communities[0]._id).toBe('4321');
  });

  it('should call createCommunityOrLogin with no profile', () => {
    const fixture = MockRender(CommunitiesOverviewComponent);
    fixture.point.componentInstance.profile = undefined;
    fixture.point.componentInstance.createCommunityOrLogin();
  });
});
