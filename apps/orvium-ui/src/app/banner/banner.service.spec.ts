import { fakeAsync, flushMicrotasks, TestBed } from '@angular/core/testing';

import { BannerService } from './banner.service';

describe('BannerService', () => {
  let service: BannerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BannerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should dismiss banner', fakeAsync(() => {
    let action: boolean;
    service
      .showBanner('This is a banner', 'Action Button')
      .subscribe(actionResult => (action = actionResult));
    service.dismissBanner();
    flushMicrotasks();
    // @ts-expect-error
    expect(action).toBe(false);
  }));

  it('should action banner', fakeAsync(() => {
    let action: boolean;
    service
      .showBanner('This is a banner', 'Action Button')
      .subscribe(actionResult => (action = actionResult));
    service.onAction();
    flushMicrotasks();
    // @ts-expect-error
    expect(action).toBe(true);
  }));
});
