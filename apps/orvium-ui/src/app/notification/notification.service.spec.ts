import { discardPeriodicTasks, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { environment } from '../../environments/environment';
import { AppNotificationDTO } from '@orvium/api';
import { MockProvider, MockRender } from 'ng-mocks';
import { NotificationService } from './notification.service';
import { ProfileService } from '../profile/profile.service';
import { of } from 'rxjs';
import { factoryUserPrivateDTO } from '../shared/test-data';
import { PLATFORM_ID } from '@angular/core';

describe('NotificationService', () => {
  const notification1: AppNotificationDTO = {
    _id: 'notification1Id',
    userId: 'myUserId',
    title: 'You have a new message',
    body: 'New notification',
    isRead: false,
    createdOn: new Date(),
    icon: 'web',
  };
  const notification2: AppNotificationDTO = {
    _id: 'notification2Id',
    userId: 'myUserId',
    title: 'Complete your profile',
    body: 'New notification to complete your profile',
    isRead: false,
    createdOn: new Date(),
    icon: 'user',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        MockProvider(ProfileService, {
          getProfile: jest.fn().mockReturnValue(of(factoryUserPrivateDTO.build())),
        }),
      ],
    });
  });

  it('should be created', () => {
    const fixture = MockRender(NotificationService);
    expect(fixture).toBeDefined();
  });

  it('should mark notifications as read', () => {
    const fixture = MockRender(NotificationService);
    const service = fixture.point.componentInstance;
    const httpMock = TestBed.inject(HttpTestingController);

    service.readNotification(notification1._id).subscribe(notification => {
      expect(notification.isRead).toBe(true);
      expect(notification.title).toEqual(notification1.title);
    });
    const request = httpMock.expectOne(
      `${environment.apiEndpoint}/notifications/${notification1._id}/read`
    );
    request.flush({ ...notification1, isRead: true });
    httpMock.verify();
  });

  it('should get notifications', fakeAsync(() => {
    const fixture = MockRender(NotificationService);
    const service = fixture.point.componentInstance;

    service.initAppNotificationsPolling();
    tick(2000);
    const httpMock = TestBed.inject(HttpTestingController);
    const request = httpMock.expectOne(`${environment.apiEndpoint}/notifications/myNotifications`);
    request.flush([notification1, notification2]);
    httpMock.verify();

    const myNotifications = service.getNotifications().value;
    expect(myNotifications.length).toEqual(2);

    discardPeriodicTasks();
  }));

  it('should work when no new notifications', fakeAsync(() => {
    const fixture = MockRender(NotificationService);
    const service = fixture.point.componentInstance;

    service.initAppNotificationsPolling();
    tick(2000);
    const httpMock = TestBed.inject(HttpTestingController);
    const request = httpMock.expectOne(`${environment.apiEndpoint}/notifications/myNotifications`);
    request.flush([]);
    httpMock.verify();

    const myNotifications = service.getNotifications().value;
    expect(myNotifications.length).toEqual(0);

    discardPeriodicTasks();
  }));
});

describe('NotificationService on SSR', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        MockProvider(ProfileService, {
          getProfile: jest.fn().mockReturnValue(of(factoryUserPrivateDTO.build())),
        }),
        MockProvider(PLATFORM_ID, 'server'),
      ],
    });
  });

  it('should be created', () => {
    const fixture = MockRender(NotificationService);
    expect(fixture).toBeDefined();
  });

  it('should activate polling only in the browser', fakeAsync(() => {
    const fixture = MockRender(NotificationService);
    const service = fixture.point.componentInstance;

    service.initAppNotificationsPolling();
    tick(2000);
    const httpMock = TestBed.inject(HttpTestingController);
    httpMock.expectNone(`${environment.apiEndpoint}/notifications/myNotifications`);
    httpMock.verify();

    const myNotifications = service.getNotifications().value;
    expect(myNotifications.length).toEqual(0);

    discardPeriodicTasks();
  }));
});
