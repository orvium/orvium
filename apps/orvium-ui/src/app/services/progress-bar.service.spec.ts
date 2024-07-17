import { TestBed } from '@angular/core/testing';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
  RouterEvent,
} from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { MockedComponentFixture, MockRender } from 'ng-mocks';
import { ReplaySubject } from 'rxjs';

import { ProgressBarService } from './progress-bar.service';

describe('ProgressBarService', () => {
  let service: ProgressBarService;
  let fixture: MockedComponentFixture<ProgressBarService, ProgressBarService>;
  const eventSubject = new ReplaySubject<RouterEvent>(1);
  const routerMock = {
    navigate: jest.fn(),
    events: eventSubject.asObservable(),
    url: 'test/url',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [{ provide: Router, useValue: routerMock }],
    });

    fixture = MockRender(ProgressBarService);
    service = fixture.point.componentInstance;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should change isShow if NavigationStart', () => {
    service.isShown = false;
    eventSubject.next(new NavigationStart(1, 'regular'));
    expect(service.isShown).toBe(true);
  });

  it('should change isShow if NavigationEnd', () => {
    service.isShown = true;
    eventSubject.next(new NavigationEnd(1, '', 'regular'));
    expect(service.isShown).toBe(false);
  });

  it('should change isShow if NavigationCancel', () => {
    service.isShown = true;
    eventSubject.next(new NavigationCancel(1, '', 'regular'));
    expect(service.isShown).toBe(false);
  });

  it('should change isShow if NavigationError', () => {
    service.isShown = true;
    eventSubject.next(new NavigationError(1, '', 'regular'));
    expect(service.isShown).toBe(false);
  });
});
