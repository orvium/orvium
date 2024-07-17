import { TestBed } from '@angular/core/testing';

import { ReviewCommentsComponent } from './review-comments.component';
import { MockRender } from 'ng-mocks';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { factoryReviewPopulatedDTO } from '../../shared/test-data';
import { CommentDTO, DefaultService } from '@orvium/api';
import { of } from 'rxjs';
import { HttpResponse } from '@angular/common/http';

describe('ReviewCommentsComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReviewCommentsComponent, HttpClientTestingModule],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = MockRender(ReviewCommentsComponent, {
      review: factoryReviewPopulatedDTO.build(),
    });
    expect(fixture.point.componentInstance).toBeTruthy();
  });

  it('should  publish comment', () => {
    const fixture = MockRender(ReviewCommentsComponent, {
      review: factoryReviewPopulatedDTO.build(),
    });
    const spy = jest
      .spyOn(fixture.point.injector.get(DefaultService), 'createComment')
      .mockImplementation(() => {
        return of({} as HttpResponse<CommentDTO>);
      });
    fixture.point.componentInstance.publishComment();

    expect(spy).toHaveBeenCalled();
  });
});
