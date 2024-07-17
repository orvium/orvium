import { Test, TestingModule } from '@nestjs/testing';
import { PushNotificationsController } from './push-notifications.controller';
import { PushNotificationsService } from './push-notifications.service';
import { request } from 'express';
import { assertIsDefined } from '../utils/utils';
import { MongooseTestingModule } from '../utils/mongoose-testing.module';
import webPush from 'web-push';
import { environment } from '../environments/environment';

environment.push_notifications_private_key = 'fake';
environment.push_notifications_public_key = 'fake';

describe('PushNotificationsController', () => {
  let controller: PushNotificationsController;
  let pushService: PushNotificationsService;
  let module: TestingModule;

  beforeAll(async () => {
    jest.spyOn(webPush, 'setVapidDetails').mockImplementation();
    jest.spyOn(webPush, 'sendNotification').mockImplementation();
    module = await Test.createTestingModule({
      imports: [MongooseTestingModule.forRoot('PushNotificationsController')],
      controllers: [PushNotificationsController],
    }).compile();
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    controller = module.get(PushNotificationsController);
    pushService = module.get(PushNotificationsService);
    await pushService.pushNotificationModel.deleteMany({});
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create and check subscription', async () => {
    const requestHeaders = { user: { sub: 'requestUserId' } } as unknown as typeof request;

    let subscriptionCheck = await controller.checkPushNotificationsSubscription(requestHeaders);
    expect(subscriptionCheck).toBeFalsy();

    const subscription = await controller.createPushNotificationsSubscription(requestHeaders, {
      endpoint: 'pushEndpoint',
      expirationTime: new Date(),
      keys: { p256dh: 'p256dhKey', auth: 'authKey' },
    });
    expect(subscription.userId).toEqual('requestUserId');
    expect(subscription.keys.p256dh).toEqual('p256dhKey');

    subscriptionCheck = await controller.checkPushNotificationsSubscription(requestHeaders);
    expect(subscriptionCheck).toBeTruthy();
  });

  it('should send push notification', async () => {
    const requestHeader = { user: { sub: 'requestUserId-1' } };
    const pushNotification = {
      notification: {
        title: 'Orvium notification',
        body: 'You review invitation has been accepted',
        icon: 'assets/icon-96x96.png',
        vibrate: [100, 50, 100],
        data: {
          dateOfArrival: Date.now(),
          primaryKey: 1,
        },
        actions: [],
      },
    };

    await controller.createPushNotificationsSubscription(
      requestHeader as unknown as typeof request,
      {
        endpoint: 'pushEndpoint',
        expirationTime: new Date(),
        keys: { p256dh: 'p256dhKey', auth: 'authKey' },
      }
    );

    await pushService.sendPushNotification(requestHeader.user.sub, pushNotification);

    expect(webPush.sendNotification).toHaveBeenCalledTimes(1);
  });

  it('should find subscriptions using the service', async () => {
    const requestHeader = { user: { sub: 'requestUserId-1' } };

    await controller.createPushNotificationsSubscription(
      requestHeader as unknown as typeof request,
      {
        endpoint: 'pushEndpoint',
        expirationTime: new Date(),
        keys: { p256dh: 'p256dhKey', auth: 'authKey' },
      }
    );

    const subscription1 = await pushService.findOne({ userId: requestHeader.user.sub });
    assertIsDefined(subscription1);
    expect(subscription1).toBeDefined();

    const subscription2 = await pushService.findById(subscription1._id);
    expect(subscription2).toBeDefined();
  });
});
