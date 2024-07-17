import { PublicProfileComponent } from './public-profile.component';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import {
  factoryDepositPopulatedDTO,
  factoryFeedback,
  factoryReviewPopulatedDTO,
  factoryUserPrivateDTO,
} from '../../shared/test-data';
import { of } from 'rxjs';
import { MockComponent, MockProvider, MockRender } from 'ng-mocks';
import { BreakpointObserver } from '@angular/cdk/layout';
import { DefaultService, DepositsQueryDTO } from '@orvium/api';
import { AppSnackBarService } from '../../services/app-snack-bar.service';
import { DialogService } from '../../dialogs/dialog.service';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ButtonsMenuComponent } from '../../buttons-menu/buttons-menu.component';

describe('PublicProfileComponent', () => {
  const reviews = [factoryReviewPopulatedDTO.build()];
  const profile = factoryUserPrivateDTO.build({ isOnboarded: true });
  const routeSnapshot = {
    data: of({ profile }),
    snapshot: { data: { profile } },
    paramMap: of(
      convertToParamMap({
        nickname: profile.nickname,
      })
    ),
  };
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        PublicProfileComponent,
        HttpClientTestingModule,
        NoopAnimationsModule,
        MockComponent(ButtonsMenuComponent),
      ],
      providers: [
        MockProvider(DialogService, {
          openCustom: jest.fn().mockReturnValue(of({})),
        }),
        MockProvider(BreakpointObserver, {
          observe: jest.fn().mockReturnValue(of({ matches: false, breakpoints: {} })),
        }),
        MockProvider(AppSnackBarService, {
          info: jest.fn().mockReturnValue(of({})),
        }),
        MockProvider(DefaultService, {
          getPublicProfile: jest.fn().mockReturnValue(of(profile)),
          getReviews: jest.fn().mockReturnValue(of(reviews)),
          createFeedback: jest.fn().mockReturnValue(of({})),
          getDeposits: jest.fn().mockReturnValue(
            of({
              deposits: factoryDepositPopulatedDTO.buildList(1),
              count: 1,
            } as DepositsQueryDTO)
          ),
        }),
        { provide: ActivatedRoute, useValue: routeSnapshot },
      ],
    });
  });

  it('should create', () => {
    const fixture = MockRender(PublicProfileComponent);
    expect(fixture.point.componentInstance).toBeDefined();
    fixture.detectChanges();
    expect(fixture.point.componentInstance).toBeTruthy();
  });

  it('should open share and report', () => {
    const feedback = factoryFeedback.build();
    const fixture = MockRender(PublicProfileComponent);
    fixture.point.componentInstance.report(feedback);
    fixture.point.componentInstance.openShare();
  });
});
