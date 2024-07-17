import { TestBed } from '@angular/core/testing';
import { ReviewStatusInfoComponent } from './review-status-info.component';
import { MockRender } from 'ng-mocks';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReviewStatus } from '@orvium/api';

describe('ReviewStatusInfoComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ReviewStatusInfoComponent, NoopAnimationsModule],
    });
  });

  it('should create', () => {
    const fixture = MockRender(ReviewStatusInfoComponent);
    fixture.detectChanges();
    expect(fixture).toBeTruthy();
  });

  it('should update status classes', () => {
    const fixture = MockRender(ReviewStatusInfoComponent);
    fixture.detectChanges();
    const spy = jest.spyOn(fixture.point.componentInstance, 'setClasses');
    fixture.point.componentInstance.status = ReviewStatus.Published;
    expect(spy).toHaveBeenCalled();
  });

  it('should set status classes', () => {
    const fixture = MockRender(ReviewStatusInfoComponent);
    fixture.detectChanges();
    fixture.point.componentInstance.setClasses(ReviewStatus.Published);
    expect(fixture.point.componentInstance.completedSteps).toEqual({
      draft: true,
      pending: true,
      published: true,
    });
    fixture.point.componentInstance.setClasses(ReviewStatus.PendingApproval);
    expect(fixture.point.componentInstance.completedSteps).toEqual({
      draft: true,
      pending: true,
      published: false,
    });
    fixture.point.componentInstance.setClasses(ReviewStatus.Draft);
    expect(fixture.point.componentInstance.completedSteps).toEqual({
      draft: true,
      pending: false,
      published: false,
    });
  });
});
