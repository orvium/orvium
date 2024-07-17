import { ReviewIconPipe } from './review-icon.pipe';
import { factoryReviewPopulatedDTO } from '../test-data';
import { ReviewDecision, ReviewStatus } from '@orvium/api';

describe('separator', () => {
  const pipe = new ReviewIconPipe();

  it('should return review icon', () => {
    expect(pipe.transform(factoryReviewPopulatedDTO.build({ status: ReviewStatus.Draft }))).toBe(
      'refresh'
    );
    expect(
      pipe.transform(
        factoryReviewPopulatedDTO.build({
          status: ReviewStatus.Published,
          decision: ReviewDecision.Accepted,
        })
      )
    ).toBe('verified');
    expect(
      pipe.transform(
        factoryReviewPopulatedDTO.build({
          status: ReviewStatus.Published,
          decision: ReviewDecision.MinorRevision,
        })
      )
    ).toBe('published_with_changes');
    expect(
      pipe.transform(
        factoryReviewPopulatedDTO.build({
          status: ReviewStatus.Published,
          decision: ReviewDecision.MajorRevision,
        })
      )
    ).toBe('error');
    expect(
      pipe.transform(
        factoryReviewPopulatedDTO.build({
          status: ReviewStatus.Published,
          // @ts-expect-error
          decision: 'other',
        })
      )
    ).toBe('question_mark');
  });
});
