import { CommunityViewComponent } from './community-view.component';
import { MockComponent, MockProvider, MockRender } from 'ng-mocks';
import { of } from 'rxjs';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { BreakpointObserver } from '@angular/cdk/layout';
import { CallDTO, CommunityType, DefaultService } from '@orvium/api';
import { SidenavService } from '../../services/sidenav.service';
import { ProfileService } from '../../profile/profile.service';
import {
  factoryCallDTO,
  factoryCommunityDTO,
  factoryCommunityPopulatedDTO,
  factoryDepositPopulatedDTO,
  factorySessionDTO,
  factoryUserPrivateDTO,
} from '../../shared/test-data';
import { DialogService } from '../../dialogs/dialog.service';
import { PageEvent } from '@angular/material/paginator';
import { HttpEvent } from '@angular/common/http';
import { CommunityService } from '../community.service';
import { InfoToolbarComponent } from '../../shared/info-toolbar/info-toolbar.component';
import { DescriptionLineComponent } from '../../shared/description-line/description-line.component';
import { HeaderComponent } from '../../shared/header/header.component';
import { DepositsListComponent } from '../../deposits/deposits-list/deposits-list.component';
import { BenefitComponent } from '../../shared/benefit/benefit.component';
import { AcknowledgementComponent } from '../../shared/acknowledgement/acknowledgement.component';
import { ShareMediaComponent } from '../../shared/share-media/share-media.component';
import { SearchBoxComponent } from '../../shared/search-box/search-box.component';
import { CommunityCalendarComponent } from '../community-calendar/community-calendar.component';
import { AlertComponent } from '../../shared/alert/alert.component';
import { CommunityCardComponent } from '../community-card/community-card.component';
import { CallForPapersCardComponent } from '../../call/call-for-papers-card/call-for-papers-card.component';
import { UserLineComponent } from '../../shared/user-line/user-line.component';
import { SpinnerService } from '../../spinner/spinner.service';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { ButtonsMenuComponent } from '../../buttons-menu/buttons-menu.component';

describe('CommunityViewComponent', () => {
  const community = factoryCommunityPopulatedDTO.build({
    conferenceProceedingsPopulated: [factoryCommunityDTO.build()],
  });
  const routeSnapshot = {
    paramMap: of(
      convertToParamMap({
        communityId: community._id,
      })
    ),
  };
  const call = factoryCallDTO.build();
  const calls = [call];
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        CommunityViewComponent,
        NoopAnimationsModule,
        MatSnackBarModule,
        MockComponent(InfoToolbarComponent),
        MockComponent(DescriptionLineComponent),
        MockComponent(HeaderComponent),
        MockComponent(DepositsListComponent),
        MockComponent(BenefitComponent),
        MockComponent(AcknowledgementComponent),
        MockComponent(ShareMediaComponent),
        MockComponent(SearchBoxComponent),
        MockComponent(CommunityCalendarComponent),
        MockComponent(AlertComponent),
        MockComponent(CommunityCardComponent),
        MockComponent(CallForPapersCardComponent),
        MockComponent(UserLineComponent),
        MockComponent(ButtonsMenuComponent),
      ],
      providers: [
        MockProvider(ProfileService, {
          getProfile: jest.fn().mockReturnValue(of(factoryUserPrivateDTO.build())),
        }),
        MockProvider(CommunityService, {
          getCommunityActions: jest.fn().mockReturnValue({
            moderate: true,
            update: true,
            submit: true,
          }),
        }),
        MockProvider(DefaultService, {
          getDeposits: jest
            .fn()
            .mockReturnValue(of({ deposits: factoryDepositPopulatedDTO.buildList(1), count: 1 })),
          getSessions: jest.fn().mockReturnValue(of([factorySessionDTO.build()])),
          getCalls: jest.fn().mockReturnValue(of([calls])),
          getCommunity: jest.fn().mockReturnValue(of(community)),
          createCall: jest.fn().mockReturnValue(of(factoryCallDTO.build())),
        }),
        MockProvider(BreakpointObserver, {
          observe: jest.fn().mockReturnValue(of({ matches: false, breakpoints: {} })),
        }),
        MockProvider(DialogService, {
          openCustom: jest.fn().mockReturnValue(of({})),
        }),
        MockProvider(SpinnerService, {
          show: jest.fn().mockReturnValue(of({})),
          hide: jest.fn().mockReturnValue(of({})),
        }),
        MockProvider(SidenavService, {
          openRight: jest.fn().mockImplementation(),
        }),
        { provide: ActivatedRoute, useValue: routeSnapshot },
      ],
    });
  });

  it('should create', () => {
    const fixture = MockRender(CommunityViewComponent);
    expect(fixture.point.componentInstance).toBeDefined();
    fixture.detectChanges();
    expect(fixture.point.componentInstance).toBeTruthy();
  });

  it('should create with filter', () => {
    const fixture = MockRender(CommunityViewComponent);
    const sidenavService = TestBed.inject(SidenavService);
    jest.spyOn(sidenavService, 'openRight');
    void fixture.point.componentInstance.openFilters();
    expect(sidenavService.openRight).toHaveBeenCalled();
  });

  it('should add moderators', () => {
    const fixture = MockRender(CommunityViewComponent);
    expect(fixture.point.componentInstance.moderators.length).toBe(2);
  });

  it('should create a call', () => {
    const fixture = MockRender(CommunityViewComponent);
    const apiService = TestBed.inject(DefaultService);
    const router = fixture.point.injector.get(Router);
    jest.spyOn(router, 'navigate').mockImplementation();
    jest
      .spyOn(apiService, 'createCall')
      .mockReturnValue(of(factoryCallDTO.build() as unknown as HttpEvent<CallDTO>));
    fixture.point.componentInstance.createCall();
    expect(apiService.createCall).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalled();
    fixture.point.componentInstance.profile = undefined;
    expect(() => fixture.point.componentInstance.createCall()).toThrow(
      new Error('There is no profile when trying to create a call')
    );
  });

  it('should show conference benefits', () => {
    const fixture = MockRender(CommunityViewComponent);
    community.type = CommunityType.Conference;
    const conferenceBenefits = [
      {
        title: 'Reliable Feedback',
        icon: 'question_answer',
        description: 'Get <strong>feedback</strong> on an early version of your latest work',
      },
      {
        title: 'Latest Findings',
        icon: 'search',
        description: 'Hear about the <strong>latest research</strong>',
      },
      {
        title: 'Make Connections',
        icon: 'groups',
        description: 'Get to know <strong>other people</strong> in your field',
      },
    ];
    const benefits = fixture.point.componentInstance.getBenefits();
    expect(benefits).toEqual(conferenceBenefits);
  });

  it('should paginate', () => {
    const fixture = MockRender(CommunityViewComponent);
    const apiService = TestBed.inject(DefaultService);
    jest.spyOn(apiService, 'getDeposits');
    const event: PageEvent = { previousPageIndex: 0, pageIndex: 1, pageSize: 10, length: 25 };
    fixture.point.componentInstance.paginate(event);
    expect(apiService.getDeposits).toHaveBeenCalled();
  });

  it('should open acknowledgement', () => {
    const fixture = MockRender(CommunityViewComponent);
    const dialogService = TestBed.inject(DialogService);
    jest.spyOn(dialogService, 'openCustom');
    fixture.point.componentInstance.openAcknowledgement();
    expect(dialogService.openCustom).toHaveBeenCalled();
  });

  it('should open calendar', () => {
    const fixture = MockRender(CommunityViewComponent);
    const dialogService = TestBed.inject(DialogService);
    jest.spyOn(dialogService, 'openCustom');
    fixture.point.componentInstance.openCalendar();
    expect(dialogService.openCustom).toHaveBeenCalled();
  });

  it('should open share', () => {
    const fixture = MockRender(CommunityViewComponent);
    const dialogService = TestBed.inject(DialogService);
    jest.spyOn(dialogService, 'openCustom');
    fixture.point.componentInstance.openShare();
    expect(dialogService.openCustom).toHaveBeenCalled();
  });

  it('should filter publications', () => {
    const fixture = MockRender(CommunityViewComponent);
    const apiService = TestBed.inject(DefaultService);
    const filterEventMock: Record<string, unknown> = {
      query: 'test publication',
    };
    fixture.point.componentInstance.filterPublications(filterEventMock);
    expect(apiService.getDeposits).toHaveBeenCalled();
  });
});
