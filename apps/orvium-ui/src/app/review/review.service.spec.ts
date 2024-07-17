import { TestBed } from '@angular/core/testing';
import { ReviewService } from './review.service';
import { factoryReviewPopulatedDTO } from '../shared/test-data';

describe('ReviewService', () => {
  let service: ReviewService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReviewService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return actions available', () => {
    const review = factoryReviewPopulatedDTO.build();
    const resultWithNoActions = service.getReviewActions(review);
    expect(resultWithNoActions).toStrictEqual({
      read: false,
      update: false,
      delete: false,
      edit: false,
      moderate: false,
      createComment: false,
    });

    review.actions.push('read');
    review.actions.push('moderate');
    review.actions.push('update');
    review.actions.push('delete');
    review.actions.push('edit');

    const result = service.getReviewActions(review);
    expect(result).toStrictEqual({
      read: true,
      update: true,
      delete: true,
      edit: true,
      moderate: true,
      createComment: false,
    });
  });

  it('should return false for missing actions', () => {
    const review = factoryReviewPopulatedDTO.build();
    review.actions.push('read');
    review.actions.push('update');

    const result = service.getReviewActions(review);
    expect(result).toStrictEqual({
      read: true,
      update: true,
      delete: false,
      edit: false,
      moderate: false,
      createComment: false,
    });
  });
});
