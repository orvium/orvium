import { PageNotFoundComponent } from './page-not-found.component';
import { MockProvider, MockRender, ngMocks } from 'ng-mocks';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { DefaultService } from '@orvium/api';
import { HttpEvent } from '@angular/common/http';
import { AppSnackBarService } from '../services/app-snack-bar.service';
import { RouterTestingModule } from '@angular/router/testing';
import { FeedbackDirective } from '../shared/feedback/feedback.directive';
import { DialogService } from '../dialogs/dialog.service';

describe('PageNotFoundComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PageNotFoundComponent, RouterTestingModule],
      providers: [
        MockProvider(DefaultService, {
          createFeedback: jest.fn().mockReturnValue(of({})),
        }),
        MockProvider(AppSnackBarService, {
          info: jest.fn().mockImplementation(),
        }),
        MockProvider(DialogService),
        MockProvider(FeedbackDirective),
      ],
    });
  });

  it('should create', () => {
    const fixture = MockRender(PageNotFoundComponent);
    expect(fixture).toBeDefined();
  });

  it('should send feedback', () => {
    MockRender(PageNotFoundComponent);
    const service = TestBed.inject(DefaultService);
    const element1 = ngMocks.find('[appFeedback]');
    const createFeedback = jest
      .spyOn(service, 'createFeedback')
      .mockReturnValue(of({} as HttpEvent<unknown>));
    ngMocks.trigger(element1, 'send', {});
    expect(createFeedback).toHaveBeenCalled();
  });
});
