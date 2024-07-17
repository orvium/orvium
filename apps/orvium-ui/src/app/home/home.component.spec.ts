import { HomeComponent } from './home.component';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import {
  factoryCommunityPopulatedDTO,
  factoryDepositsQuery,
  factoryUserPrivateDTO,
} from '../shared/test-data';
import { MockComponent, MockProvider, MockRender } from 'ng-mocks';
import { ProfileService } from '../profile/profile.service';
import { AppSnackBarService } from '../services/app-snack-bar.service';
import { TopDisciplinesQuery } from '../model/orvium';
import { SeoTagsService } from '../services/seo-tags.service';
import { DefaultService, SubscriptionType, UserPrivateDTO } from '@orvium/api';
import { DialogService } from '../dialogs/dialog.service';
import { TestBed } from '@angular/core/testing';
import { AuthenticationService } from '../auth/authentication.service';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { FontAwesomeTestingModule } from '@fortawesome/angular-fontawesome/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ShareMediaComponent } from '../shared/share-media/share-media.component';
import { DepositsListComponent } from '../deposits/deposits-list/deposits-list.component';
import { CommunityCardComponent } from '../communities/community-card/community-card.component';
import { CommunityService } from '../communities/community.service';

describe('HomeComponent', () => {
  const depositsQuery = factoryDepositsQuery.build();
  const routeSnapshot = {
    paramMap: of(
      convertToParamMap({
        query: depositsQuery,
      })
    ),
  };
  const topDisciplines: TopDisciplinesQuery[] = [
    { _id: 'Abnormal Psychology', count: 2 },
    { _id: 'Biology', count: 3 },
  ];
  const communities = [
    factoryCommunityPopulatedDTO.build(),
    factoryCommunityPopulatedDTO.build({ subscription: SubscriptionType.Premium }),
  ];
  const profile = factoryUserPrivateDTO.build();

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HomeComponent,
        MatIconTestingModule,
        FontAwesomeTestingModule,
        NoopAnimationsModule,
        MockComponent(ShareMediaComponent),
        MockComponent(DepositsListComponent),
        MockComponent(CommunityCardComponent),
      ],
      providers: [
        MockProvider(ProfileService, {
          profile: new BehaviorSubject<UserPrivateDTO | undefined>(profile),
          getProfile: jest.fn().mockReturnValue(of(profile)),
        }),
        MockProvider(DefaultService, {
          getCommunities: jest.fn().mockReturnValue(of(communities)),
          getTopDisciplines: jest.fn().mockReturnValue(of(topDisciplines)),
          createCommunity: jest.fn().mockReturnValue(of(communities)),
          getDeposits: jest.fn().mockReturnValue(of(depositsQuery)),
        }),
        MockProvider(DialogService, {
          openCustom: jest.fn().mockReturnValue(of({})),
        }),
        MockProvider(AppSnackBarService, {
          info: jest.fn().mockReturnValue('You need to complete your profile first'),
        }),
        MockProvider(AuthenticationService, {
          login: jest.fn().mockImplementation(),
        }),
        MockProvider(CommunityService, {
          createCommunityDialog: jest.fn().mockImplementation(),
        }),
        { provide: ActivatedRoute, useValue: routeSnapshot },
      ],
    });
  });

  it('should create', () => {
    const fixture = MockRender(HomeComponent);
    expect(fixture.point.componentInstance).toBeDefined();
    fixture.detectChanges();
    expect(fixture.point.componentInstance).toBeTruthy();
  });

  it('should get communities', () => {
    const fixture = MockRender(HomeComponent);
    expect(fixture.point.componentInstance.featuredCommunities.length).toBe(1);
  });

  it('should get top disciplines', () => {
    const fixture = MockRender(HomeComponent);
    expect(fixture.point.componentInstance.topDisciplines).toEqual(topDisciplines);
  });

  it('should search by discipline', () => {
    const fixture = MockRender(HomeComponent);
    const router = fixture.point.injector.get(Router);
    const navigateSpy = jest.spyOn(router, 'navigate').mockImplementation();
    const discipline = 'biology';
    fixture.point.componentInstance.searchByDiscipline(discipline);
    expect(navigateSpy).toHaveBeenCalledWith(['/search'], {
      queryParams: { discipline: discipline, size: 10 },
      queryParamsHandling: 'merge',
    });
  });

  it('should open invite to Orvium dialog', () => {
    const fixture = MockRender(HomeComponent);
    fixture.point.componentInstance.openInviteDialog();
  });

  it('should open video dialog', () => {
    const fixture = MockRender(HomeComponent);
    fixture.point.componentInstance.openVideo();
  });

  it('should remove tags when destroyed', () => {
    const fixture = MockRender(HomeComponent);
    const tagsService = fixture.point.injector.get(SeoTagsService);
    const removeTagElementSpy = jest.spyOn(tagsService, 'removeTagsAndCanonical');
    fixture.destroy();
    expect(removeTagElementSpy).toHaveBeenCalled();
  });

  it('should call createCommunityOrLogin', () => {
    const fixture = MockRender(HomeComponent);
    fixture.point.componentInstance.createCommunityOrLogin();
  });

  it('should call createCommunityOrLogin with no profile', () => {
    const fixture = MockRender(HomeComponent);
    fixture.point.componentInstance.profile = undefined;
    fixture.point.componentInstance.createCommunityOrLogin();
  });
});
