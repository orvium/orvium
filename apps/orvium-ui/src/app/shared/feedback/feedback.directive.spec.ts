import { FeedbackDirective } from './feedback.directive';
import { MockBuilder, MockRender, ngMocks } from 'ng-mocks';
import { FeedbackService } from './feedback.service';
import { of } from 'rxjs';
import { DialogService } from '../../dialogs/dialog.service';
import { MatDialogRef } from '@angular/material/dialog';

describe('Directive: FeedbackDirective', () => {
  beforeEach(() => MockBuilder(FeedbackDirective).provide(FeedbackService).mock(DialogService));

  it('should open feedback dialog', () => {
    const fixture = MockRender(`<button appFeedback></button>`);
    const dialogService = fixture.point.injector.get(DialogService);
    const button = ngMocks.find(fixture, 'button');
    const spy = jest.spyOn(dialogService, 'open').mockReturnValue({
      afterClosed: () => of(true),
    } as MatDialogRef<unknown>);
    ngMocks.click(button);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should emit send event', () => {
    const fixture = MockRender(`<button appFeedback></button>`);
    const feedbackService = fixture.point.injector.get(FeedbackService);
    const directive = fixture.point.injector.get(FeedbackDirective);
    jest.spyOn(directive.send, 'emit');
    feedbackService.setFeedback({ description: 'feedback example' });
    expect(directive.send.emit).toHaveBeenCalledWith({ description: 'feedback example' });
  });
});
