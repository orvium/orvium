import { NotificationsPanelComponent } from './notifications-panel.component';
import { MockProvider, MockRender, ngMocks } from 'ng-mocks';
import { NotificationService } from '../notification.service';
import { of } from 'rxjs';
import { AppNotificationDTO } from '@orvium/api';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { RouterTestingModule } from '@angular/router/testing';
import { SidenavService } from '../../services/sidenav.service';

describe('NotificationsPanelComponent', () => {
  const notification1: AppNotificationDTO = {
    _id: 'notification1Id',
    userId: 'myUserId',
    title: 'You have a new message',
    body: 'New notification',
    isRead: false,
    createdOn: new Date(),
    icon: 'web',
    action: 'some url',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [NotificationsPanelComponent, RouterTestingModule],
      providers: [
        MockProvider(NotificationService, {
          getNotifications: jest.fn().mockReturnValue(of([notification1])),
        }),
        MockProvider(SidenavService, {
          closeRight: jest.fn().mockImplementation(),
        }),
      ],
    });
  });

  it('should create', () => {
    const fixture = MockRender(NotificationsPanelComponent);
    const component = fixture.point.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should close when the app navigates to another location', fakeAsync(() => {
    const fixture = MockRender(NotificationsPanelComponent);
    const router = ngMocks.get(Router);
    const location = ngMocks.get(Location);

    location.go('');
    if (fixture.ngZone) {
      fixture.ngZone.run(() => router.initialNavigation());
      tick();
    }
  }));

  it('should mark notification as read', () => {
    const fixture = MockRender(NotificationsPanelComponent);
    const router = fixture.point.injector.get(Router);
    const spyRouter = jest.spyOn(router, 'navigateByUrl').mockImplementation();
    const service = TestBed.inject(NotificationService);
    const readButton = ngMocks.find('[data-test="list-item"]');
    const readNotification = jest
      .spyOn(service, 'readNotification')
      .mockReturnValue(of({ ...notification1, isRead: true }));
    ngMocks.click(readButton);
    expect(readNotification).toHaveBeenCalled();
    expect(spyRouter).toHaveBeenCalledWith(notification1.action);
  });
});
