import { MyReviewsComponent } from './my-reviews.component';
import { MockComponent, MockInstance, MockProvider, MockRender, MockReset } from 'ng-mocks';
import { BehaviorSubject, of } from 'rxjs';
import { ProfileService } from '../../profile/profile.service';
import { DefaultService, ReviewStatus, UserPrivateDTO } from '@orvium/api';
import { factoryReviewPopulatedDTO, factoryUserPrivateDTO } from '../../shared/test-data';
import { ActivatedRoute } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TestBed } from '@angular/core/testing';
import { ReviewListComponent } from '../review-list/review-list.component';

describe('InvitationsPanelComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MyReviewsComponent, NoopAnimationsModule, MockComponent(ReviewListComponent)],
      providers: [
        MockProvider(DefaultService, {
          getMyReviews: jest.fn().mockReturnValue(
            of({
              reviews: [
                factoryReviewPopulatedDTO.build({ status: ReviewStatus.Published }),
                factoryReviewPopulatedDTO.build({ status: ReviewStatus.Draft }),
                factoryReviewPopulatedDTO.build({ status: ReviewStatus.PendingApproval }),
              ],
              count: 2,
            })
          ),
        }),
        MockProvider(ProfileService, {
          profile: new BehaviorSubject<UserPrivateDTO | undefined>(factoryUserPrivateDTO.build()),
        }),
        { provide: ActivatedRoute, useValue: { snapshot: { fragment: {} } } },
      ],
    });
  });

  afterEach(MockReset);

  it('should create', () => {
    MockInstance(
      ProfileService,
      'profile',
      new BehaviorSubject<UserPrivateDTO | undefined>(factoryUserPrivateDTO.build())
    );
    const fixture = MockRender(MyReviewsComponent);
    expect(fixture.point.componentInstance).toBeDefined();
    fixture.detectChanges();

    expect(fixture.point.componentInstance.reviews[0].status).toBe(ReviewStatus.Draft);
    expect(fixture.point.componentInstance.reviews[2].status).toBe(ReviewStatus.Published);
  });
});
