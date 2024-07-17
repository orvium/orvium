import { Component } from '@angular/core';

import {
  SendNotificationsComponent,
  UserInfo,
} from '../../notification/send-notifications/send-notifications.component';

@Component({
  selector: 'app-send-notifications-demo',
  standalone: true,
  imports: [SendNotificationsComponent],
  templateUrl: './send-notifications-demo.component.html',
  styleUrls: ['./send-notifications-demo.component.scss'],
})
export class SendNotificationsDemoComponent {
  recipients: UserInfo[] = [
    { email: 'example1@example.com', firstName: 'john', lastName: 'doe', gravatar: '' },
    { email: 'example2@example.com', firstName: 'Mary', lastName: 'Jane', gravatar: '' },
  ];
}
