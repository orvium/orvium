import { ReviewCardComponent } from './review-card.component';
import { MockRender } from 'ng-mocks';
import { ReviewDecision } from '@orvium/api';
import { factoryReviewPopulatedDTO } from '../../shared/test-data';
import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('ReviewCardComponent', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [ReviewCardComponent, RouterTestingModule, NoopAnimationsModule],
    })
  );

  it('should create', () => {
    const fixture = MockRender(ReviewCardComponent, { review: factoryReviewPopulatedDTO.build() });
    expect(fixture).toBeDefined();
  });

  it('should show minor revision icon', () => {
    const fixture = MockRender(ReviewCardComponent, {
      review: factoryReviewPopulatedDTO.build({ decision: ReviewDecision.MinorRevision }),
    });
    expect(fixture.point.componentInstance.reviewIcon.icon).toEqual('published_with_changes');
  });

  it('should show major revision icon', () => {
    const fixture = MockRender(ReviewCardComponent, {
      review: factoryReviewPopulatedDTO.build({ decision: ReviewDecision.MajorRevision }),
    });
    expect(fixture.point.componentInstance.reviewIcon.icon).toEqual('error');
  });
});
