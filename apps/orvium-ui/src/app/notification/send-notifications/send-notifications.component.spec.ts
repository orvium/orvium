import { TestBed } from '@angular/core/testing';

import { SendNotificationsComponent, UserInfo } from './send-notifications.component';
import { MockRender } from 'ng-mocks';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('SendNotificationsComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SendNotificationsComponent, BrowserAnimationsModule],
      providers: [],
    });
  });

  it('should create', () => {
    const fixture = MockRender(SendNotificationsComponent);
    fixture.detectChanges();
    expect(fixture.point.componentInstance).toBeTruthy();
  });

  it('should send Email', () => {
    const fixture = MockRender(SendNotificationsComponent, {
      subject: 'Subject example',
      body: 'Body example',
      recipients: [
        { email: 'example1@example.com', firstName: 'john', lastName: 'doe', gravatar: '' },
        { email: 'example2@example.com', firstName: 'Mary', lastName: 'Jane', gravatar: '' },
      ],
    });
    const spy = jest.spyOn(fixture.point.componentInstance.sendEmails, 'emit');
    fixture.point.componentInstance.sendEmail();
    expect(spy).toHaveBeenCalled();
  });

  it('should remove recipients', () => {
    const userInfo: UserInfo = {
      email: 'example1@example.com',
      firstName: 'john',
      lastName: 'doe',
      gravatar: '',
    };
    const fixture = MockRender(SendNotificationsComponent, {
      subject: 'Subject example',
      body: 'Body example',
      recipients: [
        userInfo,
        { email: 'example2@example.com', firstName: 'Mary', lastName: 'Jane', gravatar: '' },
      ],
    });
    expect(fixture.point.componentInstance.recipients.length).toBe(2);
    fixture.point.componentInstance.remove(userInfo);
    expect(fixture.point.componentInstance.recipients.length).toBe(1);
  });
});
