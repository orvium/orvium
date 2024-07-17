import { TestBed } from '@angular/core/testing';
import { UnauthorizedPageComponent } from './unauthorized-page.component';
import { MockDirective, MockProvider, MockRender, ngMocks } from 'ng-mocks';
import { DefaultService } from '@orvium/api';
import { of } from 'rxjs';
import { HttpEvent } from '@angular/common/http';
import { AppSnackBarService } from '../services/app-snack-bar.service';
import { RouterTestingModule } from '@angular/router/testing';
import { FeedbackDirective } from '../shared/feedback/feedback.directive';

describe('UnauthorizedPageComponent', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [UnauthorizedPageComponent, RouterTestingModule, MockDirective(FeedbackDirective)],
      providers: [
        MockProvider(DefaultService, {
          createFeedback: jest.fn().mockReturnValue({}),
        }),
        MockProvider(AppSnackBarService),
      ],
    })
  );

  it('should create', () => {
    const fixture = MockRender(UnauthorizedPageComponent);
    expect(fixture).toBeDefined();
  });

  it('should send feedback', () => {
    MockRender(UnauthorizedPageComponent);
    const service = TestBed.inject(DefaultService);
    const element1 = ngMocks.find('[appFeedback]');
    const createFeedback = jest
      .spyOn(service, 'createFeedback')
      .mockReturnValue(of({} as HttpEvent<unknown>));
    ngMocks.trigger(element1, 'send', {});
    expect(createFeedback).toHaveBeenCalled();
  });
});
