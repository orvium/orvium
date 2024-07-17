import { Test, TestingModule } from '@nestjs/testing';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { UserService } from '../users/user.service';
import { request } from 'express';
import { UserDocument } from '../users/user.schema';
import { assertIsDefined } from '../utils/utils';
import { MongooseTestingModule } from '../utils/mongoose-testing.module';

describe('NotificationController', () => {
  let controller: NotificationController;
  let notificationService: NotificationService;
  let userService: UserService;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [MongooseTestingModule.forRoot('NotificationController')],
      providers: [],
      controllers: [NotificationController],
    }).compile();
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    controller = module.get(NotificationController);
    notificationService = module.get(NotificationService);
    userService = module.get(UserService);

    await notificationService.notificationModel.deleteMany();

    await notificationService.create({
      userId: 'myUserId',
      isRead: false,
      title: 'New notification',
      body: 'This is a new notification',
      icon: '',
      createdOn: new Date(),
    });
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get my notifications', async () => {
    jest
      .spyOn(userService, 'getLoggedUser')
      .mockResolvedValue({ userId: 'myUserId' } as UserDocument);
    const notifications = await controller.getMyNotifications({
      user: { sub: 'myUserId' },
    } as unknown as typeof request);
    expect(notifications.length).toEqual(1);
  });

  it('should mark notification as read', async () => {
    const notification = await notificationService.find({ userId: 'myUserId' });
    jest
      .spyOn(userService, 'getLoggedUser')
      .mockResolvedValue({ userId: 'myUserId' } as UserDocument);
    const notificationRead = await controller.markNotificationAsRead(
      { user: { sub: 'myUserId' } } as unknown as typeof request,
      notification[0]._id.toHexString()
    );
    // by default, will return the object before the update was applied
    expect(notificationRead.isRead).toEqual(false);
    const notificationUpdated = await notificationService.notificationModel.findById(
      notification[0]._id
    );
    assertIsDefined(notificationUpdated);
    expect(notificationUpdated.isRead).toEqual(true);
  });
});
