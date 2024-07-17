import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { FeedbackDTO, UserPrivateDTO } from '@orvium/api';

@Injectable({
  providedIn: 'root',
})
export class FeedbackService {
  public initialVariables: { user?: UserPrivateDTO } = {};
  private feedbackSource = new Subject<FeedbackDTO>();
  public feedback$: Observable<FeedbackDTO> = this.feedbackSource.asObservable();

  public setFeedback(feedback: FeedbackDTO): void {
    this.feedbackSource.next(feedback);
  }
}
