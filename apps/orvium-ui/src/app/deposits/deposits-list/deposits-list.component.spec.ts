import { DepositsListComponent } from './deposits-list.component';
import { BehaviorSubject, of } from 'rxjs';
import {
  factoryDepositPopulatedDTO,
  factoryReviewPopulatedDTO,
  factoryUserPrivateDTO,
} from '../../shared/test-data';
import { AuthenticationService } from '../../auth/authentication.service';
import { AppSnackBarService } from '../../services/app-snack-bar.service';
import { DefaultService, ReviewStatus, UserPrivateDTO } from '@orvium/api';
import { MockProvider, MockRender } from 'ng-mocks';
import { ProfileService } from '../../profile/profile.service';
import { SpinnerService } from '../../spinner/spinner.service';
import { TestBed } from '@angular/core/testing';
import { assertIsDefined } from '../../shared/shared-functions';

describe('DepositsListComponent', () => {
  beforeEach(() => {
    const profile = factoryUserPrivateDTO.build();
    const review = factoryReviewPopulatedDTO.build({ status: ReviewStatus.Draft, _id: '1' });

    TestBed.configureTestingModule({
      imports: [DepositsListComponent],
      providers: [
        MockProvider(ProfileService, {
          updateProfile: jest.fn().mockReturnValue(of(profile)),
          getProfile: jest.fn().mockReturnValue(of(profile)),
          profile: new BehaviorSubject<UserPrivateDTO | undefined>(profile),
        }),
        MockProvider(AppSnackBarService, {
          info: jest.fn().mockReturnValue('You already created a review for this publication'),
        }),
        MockProvider(DefaultService, {
          createReview: jest.fn().mockReturnValue(of(review)),
        }),
        MockProvider(AuthenticationService, {
          login: jest.fn().mockReturnValue(null),
        }),
        MockProvider(SpinnerService, {
          show: jest.fn().mockReturnValue(null),
          hide: jest.fn().mockReturnValue(null),
        }),
        MockProvider(AppSnackBarService, {
          info: jest.fn().mockReturnValue('You already created a review for this publication'),
        }),
      ],
    });
  });

  it('should create', () => {
    const fixture = MockRender(DepositsListComponent);
    expect(fixture.point.componentInstance).toBeDefined();
    fixture.detectChanges();
    expect(fixture.point.componentInstance).toBeTruthy();
  });

  it('should set starred to true and correctly get the star index', () => {
    const fixture = MockRender(DepositsListComponent);
    const deposit = factoryDepositPopulatedDTO.build();
    if (fixture.point.componentInstance.profile) {
      fixture.point.componentInstance.profile.starredDeposits = [deposit._id];
    }
    const isStarred = fixture.point.componentInstance.isStarred(deposit);
    expect(isStarred).toBeTruthy();
    const isNotStarred = fixture.point.componentInstance.isStarred(
      factoryDepositPopulatedDTO.build()
    );
    expect(isNotStarred).toBe(false);
  });

  it('should call login', () => {
    const fixture = MockRender(DepositsListComponent);
    fixture.point.componentInstance.profile = undefined;
    const service = fixture.point.injector.get(AppSnackBarService);
    const spy = jest.spyOn(service, 'error');
    const deposit = factoryDepositPopulatedDTO.build();
    fixture.point.componentInstance.star(deposit);
    fixture.point.componentInstance.createReview(deposit);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('should star deposit', () => {
    const fixture = MockRender(DepositsListComponent);
    const deposit = factoryDepositPopulatedDTO.build();
    assertIsDefined(fixture.point.componentInstance.profile);
    fixture.point.componentInstance.star(deposit);
    expect(fixture.point.componentInstance.profile.starredDeposits[0]).toBe(deposit._id);
  });

  it('should unstar deposit', () => {
    const fixture = MockRender(DepositsListComponent);
    const deposit = factoryDepositPopulatedDTO.build();
    if (fixture.point.componentInstance.profile) {
      fixture.point.componentInstance.profile.starredDeposits = [deposit._id];
    }
    fixture.point.componentInstance.star(deposit);
    assertIsDefined(fixture.point.componentInstance.profile);
    expect(fixture.point.componentInstance.profile.starredDeposits.length).toBe(0);
  });

  it('should create review', () => {
    const fixture = MockRender(DepositsListComponent);
    fixture.point.componentInstance.createReview(factoryDepositPopulatedDTO.build());
    const spinnerService = fixture.point.injector.get(SpinnerService);
    const apiService = fixture.point.injector.get(DefaultService);
    expect(spinnerService.show).toHaveBeenCalled();
    expect(apiService.createReview).toHaveBeenCalled();
    expect(spinnerService.hide).toHaveBeenCalled();
  });

  it('should not create review', () => {
    const fixture = MockRender(DepositsListComponent);
    const profile = fixture.point.componentInstance.profile;
    assertIsDefined(profile);
    const review = factoryReviewPopulatedDTO.build({ creator: profile._id });
    const snackbarService = fixture.point.injector.get(AppSnackBarService);
    fixture.point.componentInstance.createReview(
      factoryDepositPopulatedDTO.build({
        peerReviews: [review._id],
        peerReviewsPopulated: [review],
      })
    );
    expect(snackbarService.info).toHaveBeenCalled();
  });
});
