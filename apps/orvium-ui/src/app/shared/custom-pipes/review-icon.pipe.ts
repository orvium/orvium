import { Pipe, PipeTransform } from '@angular/core';
import { ReviewDecision, ReviewStatus, ReviewSummaryDTO } from '@orvium/api';

@Pipe({ name: 'reviewIcon', standalone: true, pure: true })
export class ReviewIconPipe implements PipeTransform {
  transform(review: ReviewSummaryDTO): string {
    if (review.status === ReviewStatus.Draft) {
      return 'refresh';
    }
    if (review.decision === ReviewDecision.MajorRevision) {
      return 'error';
    }
    if (review.decision === ReviewDecision.MinorRevision) {
      return 'published_with_changes';
    }
    if (review.decision === ReviewDecision.Accepted) {
      return 'verified';
    }

    return 'question_mark';
  }
}
