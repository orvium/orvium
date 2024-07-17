import { TestBed } from '@angular/core/testing';

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MockedComponentFixture, MockRender } from 'ng-mocks';
import { SentryErrorHandler } from './error-handler.service';
import { AppSnackBarService } from './app-snack-bar.service';
import { MatSnackBarModule } from '@angular/material/snack-bar';

describe('SentryErrorHandler', () => {
  let fixture: MockedComponentFixture<SentryErrorHandler, SentryErrorHandler>;
  let service: SentryErrorHandler;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, MatSnackBarModule],
      providers: [SentryErrorHandler, AppSnackBarService],
    });
    fixture = MockRender(SentryErrorHandler);
    service = fixture.point.componentInstance;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should handle error', () => {
    jest.spyOn(console, 'error');
    service.handleError({});
  });
});
