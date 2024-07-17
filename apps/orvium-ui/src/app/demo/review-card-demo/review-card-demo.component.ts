import { Component } from '@angular/core';
import { ReviewKind } from '@orvium/api';
import { factoryReviewPopulatedDTO } from '../../shared/test-data';
import { ReviewCardComponent } from '../../review/review-card/review-card.component';

@Component({
  selector: 'app-review-card-demo',
  standalone: true,
  templateUrl: './review-card-demo.component.html',
  styleUrls: ['./review-card-demo.component.scss'],
  imports: [ReviewCardComponent],
})
export class ReviewCardDemoComponent {
  public review1 = factoryReviewPopulatedDTO.build();
  public review2 = factoryReviewPopulatedDTO.build({
    extraFiles: [
      {
        filename: 'testfile',
        description: 'testfile',
        contentLength: 1000,
        contentType: 'pdf',
        tags: [],
        url: 'http://localhost',
      },
      {
        filename: 'testfile1',
        description: 'testfile1',
        contentLength: 1000,
        contentType: 'pdf',
        tags: [],
        url: 'http://localhost',
      },
    ],
    kind: ReviewKind.CopyEditing,
    views: 132,
  });
}
