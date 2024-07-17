import { lastValueFrom, of } from 'rxjs';
import { MockComponent, MockProvider, MockRender, ngMocks } from 'ng-mocks';
import { ReviewViewComponent } from './review-view.component';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { EthereumService } from '../../blockchain/ethereum.service';
import { TestBed } from '@angular/core/testing';
import { AppSnackBarService } from '../../services/app-snack-bar.service';
import { BreakpointObserver } from '@angular/cdk/layout';
import { SeoTagsService } from '../../services/seo-tags.service';
import { DefaultService, ReviewStatus } from '@orvium/api';
import { ProfileService } from '../../profile/profile.service';
import {
  factoryDepositPopulatedDTO,
  factoryFeedback,
  factoryFileMetadata,
  factoryReviewPopulatedDTO,
  factoryUserPrivateDTO,
} from '../../shared/test-data';
import { SpinnerService } from '../../spinner/spinner.service';
import { DialogService } from '../../dialogs/dialog.service';
import { ConfirmDialogComponent } from '../../dialogs/confirm-dialog/confirm-dialog.component';
import { NGXLogger } from 'ngx-logger';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { FontAwesomeTestingModule } from '@fortawesome/angular-fontawesome/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef } from '@angular/material/dialog';
import { ButtonsMenuComponent } from '../../buttons-menu/buttons-menu.component';

describe('ReviewViewComponent', () => {
  const profile = factoryUserPrivateDTO.build({
    isOnboarded: true,
    emailPendingConfirmation: 'pending@example.com',
  });
  const deposit = factoryDepositPopulatedDTO.build();
  const review = factoryReviewPopulatedDTO.build({
    file: factoryFileMetadata.build(),
    extraFiles: [factoryFileMetadata.build()],
  });
  const routeSnapshot = {
    paramMap: of(
      convertToParamMap({
        reviewId: review._id,
      })
    ),
  };

  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [
        ReviewViewComponent,
        MatIconTestingModule,
        FontAwesomeTestingModule,
        NoopAnimationsModule,
        MockComponent(ButtonsMenuComponent),
      ],
      providers: [
        MockProvider(EthereumService, {
          init: jest.fn().mockReturnValue(of(true)),
          isReady: () => false,
          payReviewer: jest.fn().mockReturnValue(
            of({
              hash: '12',
              confirmations: 2,
              wait: jest.fn().mockReturnValue(lastValueFrom(of(undefined))),
            })
          ),
        }),
        MockProvider(BreakpointObserver, {
          observe: jest.fn().mockReturnValue(of({ matches: false, breakpoints: {} })),
        }),
        MockProvider(ProfileService, {
          updateProfile: jest.fn().mockReturnValue(of(profile)),
          getProfile: () => of(profile),
        }),
        MockProvider(SeoTagsService, {
          setGeneralSeo: jest.fn().mockReturnValue([
            [
              { name: 'description', content: `${deposit.title} review by ${review.author}` },
              { name: 'og:title', content: deposit.title },
              {
                name: 'og:description',
                content: `Read now "${deposit.title}" review by ${review.author}`,
              },
              { name: 'og:url', content: '123' + 'www.example.com' },
              { name: 'og:site_name', content: 'Orvium' },
            ],
          ]),
          removeTagsAndCanonical: jest.fn(),
        }),
        MockProvider(DialogService, {
          openCustom: jest.fn().mockReturnValue({
            afterClosed: () => of(false),
          } as MatDialogRef<ConfirmDialogComponent>),
        }),
        MockProvider(DefaultService, {
          getReview: jest.fn().mockReturnValue(of(review)),
          createFeedback: jest.fn().mockReturnValue(of({})),
          getDeposit: jest.fn().mockReturnValue(of(deposit)),
        }),
        MockProvider(SpinnerService, {
          show: jest.fn().mockReturnValue(null),
          hide: jest.fn().mockReturnValue(null),
        }),
        MockProvider(AppSnackBarService, {
          info: jest
            .fn()
            .mockReturnValue('Please, deposit first some ORV tokens to make the reward'),
          error: jest
            .fn()
            .mockReturnValue(
              'No Ethereum provider detected, check if Metamask is installed in your browser'
            ),
        }),
        MockProvider(NGXLogger),
        { provide: ActivatedRoute, useValue: routeSnapshot },
      ],
    })
  );

  it('should create', () => {
    const fixture = MockRender(ReviewViewComponent);
    expect(fixture).toBeDefined();
  });

  it('should report', () => {
    const feedback = factoryFeedback.build();
    const fixture = MockRender(ReviewViewComponent);
    fixture.point.componentInstance.reportReview(feedback);
  });

  it('should create with less data', () => {
    const newReview = factoryReviewPopulatedDTO.build({
      status: ReviewStatus.Draft,
      file: undefined,
      decision: undefined,
    });
    const fixture = MockRender(ReviewViewComponent);
    const profileService = TestBed.inject(ProfileService);
    fixture.point.componentInstance.peerReview = newReview;
    fixture.point.componentInstance.profile = undefined;
    ngMocks.reset();
    jest.spyOn(profileService, 'getProfile').mockReturnValue(of(undefined));
    fixture.point.componentInstance.ngOnInit();
    expect(fixture).toBeDefined();
  });

  it('should delete meta elements', () => {
    const fixture = MockRender(ReviewViewComponent);
    const service = fixture.point.injector.get(SeoTagsService);
    fixture.point.componentInstance.ngOnDestroy();
    fixture.detectChanges();
    expect(service.removeTagsAndCanonical).toHaveBeenCalled();
  });

  it('should open pay review dialog', () => {
    const fixture = MockRender(ReviewViewComponent);
    const dialogService = fixture.point.injector.get(DialogService);
    const ethereumService = fixture.point.injector.get(EthereumService);
    fixture.point.componentInstance.balanceTokens = '1';
    ngMocks.reset();
    jest.spyOn(ethereumService, 'isReady').mockReturnValue(true);
    fixture.point.componentInstance.showPayReviewer();
    expect(ethereumService.isReady).toHaveBeenCalled();
    expect(dialogService.openCustom).toHaveBeenCalled();
  });

  it('should not open pay review dialog when ethereum is not ready', () => {
    const fixture = MockRender(ReviewViewComponent);
    const snackbarService = fixture.point.injector.get(AppSnackBarService);
    fixture.detectChanges();
    fixture.point.componentInstance.showPayReviewer();
    expect(snackbarService.error).toHaveBeenCalled();
    fixture.point.componentInstance.openShare();
  });

  it('should refresh actions and not refres balance', () => {
    const fixture = MockRender(ReviewViewComponent);
    fixture.detectChanges();
    fixture.point.componentInstance.refreshActions(review);
    fixture.point.componentInstance.deposit = deposit;
    const ethereumService = fixture.point.injector.get(EthereumService);
    fixture.point.componentInstance.refreshBalance();
    expect(ethereumService.getUserTokenBalance).toHaveBeenCalledTimes(0);
  });

  it('should check if the deposit is starred', () => {
    const fixture = MockRender(ReviewViewComponent);
    fixture.detectChanges();
    expect(fixture.point.componentInstance.isStarred(deposit)).toBe(false);
  });

  it('should not open pay review dialog when there are no tokens', () => {
    const fixture = MockRender(ReviewViewComponent);
    const snackbarService = fixture.point.injector.get(AppSnackBarService);
    const ethereumService = fixture.point.injector.get(EthereumService);
    jest.spyOn(ethereumService, 'isReady').mockReturnValue(true);
    fixture.point.componentInstance.balanceTokens = '0';
    fixture.detectChanges();
    fixture.point.componentInstance.showPayReviewer();
    expect(snackbarService.info).toHaveBeenCalled();
  });

  it('should pay reviewer', () => {
    const fixture = MockRender(ReviewViewComponent);
    const ethereumService = fixture.point.injector.get(EthereumService);
    fixture.point.componentInstance.payReviewer('2');
    expect(ethereumService.payReviewer).toHaveBeenCalled();
  });

  it('should return error when trying to mark deposit with star', () => {
    const fixture = MockRender(ReviewViewComponent);
    fixture.point.componentInstance.profile = undefined;
    fixture.point.componentInstance.star(deposit);
    const snackBarService = fixture.point.injector.get(AppSnackBarService);
    expect(snackBarService.error).toHaveBeenCalled();
  });

  it('should mark deposit with star', () => {
    const fixture = MockRender(ReviewViewComponent);
    fixture.point.componentInstance.profile = factoryUserPrivateDTO.build();
    fixture.point.componentInstance.profile.starredDeposits = [];
    fixture.point.componentInstance.star(deposit);
    const profileService = fixture.point.injector.get(ProfileService);
    expect(profileService.updateProfile).toHaveBeenCalled();
  });
});
