import { MockRender } from 'ng-mocks';
import { ReviewListComponent } from './review-list.component';
import { TestBed } from '@angular/core/testing';

describe('MyreviewsComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ReviewListComponent],
    });
  });

  it('should create', () => {
    const fixture = MockRender(ReviewListComponent);
    expect(fixture.point.componentInstance).toBeDefined();
    fixture.detectChanges();
    expect(fixture.point.componentInstance).toBeTruthy();
  });
});
