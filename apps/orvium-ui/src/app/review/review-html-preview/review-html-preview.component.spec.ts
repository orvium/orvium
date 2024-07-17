import { TestBed } from '@angular/core/testing';

import { ReviewHtmlPreviewComponent } from './review-html-preview.component';
import { MockRender } from 'ng-mocks';

describe('ReviewHtmlPreviewComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ReviewHtmlPreviewComponent],
    });
  });

  it('should create', () => {
    const fixture = MockRender(ReviewHtmlPreviewComponent);
    expect(fixture.point.componentInstance).toBeDefined();
    fixture.detectChanges();
  });
});
