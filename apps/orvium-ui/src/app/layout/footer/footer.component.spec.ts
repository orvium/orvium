import { FooterComponent } from './footer.component';
import { MockProvider, MockRender, ngMocks } from 'ng-mocks';
import { ProfileService } from '../../profile/profile.service';
import { BehaviorSubject, of } from 'rxjs';
import { DefaultService, UserPrivateDTO } from '@orvium/api';
import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AppSnackBarService } from '../../services/app-snack-bar.service';
import { DialogService } from '../../dialogs/dialog.service';
import { HttpEvent } from '@angular/common/http';
import { FeedbackDirective } from '../../shared/feedback/feedback.directive';

describe('FooterComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [FooterComponent, HttpClientTestingModule],
      providers: [
        MockProvider(ProfileService, {
          profile: new BehaviorSubject<UserPrivateDTO | undefined>(undefined),
        }),
        MockProvider(DefaultService, {
          createFeedback: jest.fn().mockReturnValue(of({})),
        }),
        MockProvider(DialogService),
        MockProvider(AppSnackBarService, {
          info: jest.fn().mockReturnValue(of({})),
        }),
        MockProvider(PLATFORM_ID, 'browser'),
      ],
    });
  });

  it('should create', () => {
    const fixture = MockRender(FooterComponent);
    expect(fixture.point.componentInstance).toBeDefined();
  });

  it('should send feedback', () => {
    MockRender(FooterComponent);
    const service = TestBed.inject(DefaultService);
    const feedbackButton = ngMocks.find('[appFeedback]');
    const createFeedback = jest
      .spyOn(service, 'createFeedback')
      .mockReturnValue(of({} as HttpEvent<unknown>));
    ngMocks.trigger(feedbackButton, 'send', {});
    expect(createFeedback).toHaveBeenCalled();
  });
});

describe('FooterComponent SSR', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [FooterComponent, HttpClientTestingModule],
      providers: [
        MockProvider(ProfileService, {
          profile: new BehaviorSubject<UserPrivateDTO | undefined>(undefined),
        }),
        MockProvider(AppSnackBarService),
        MockProvider(DialogService),
        MockProvider(FeedbackDirective),
        MockProvider(PLATFORM_ID, 'server'),
      ],
    });
  });

  it('should create', () => {
    const fixture = MockRender(FooterComponent);
    expect(fixture.point.componentInstance).toBeDefined();
  });
});
