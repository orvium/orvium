import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { environment } from '../environments/environment';
import { ConfigurationService } from '../configuration/configuration.service';
import { ConfirmationEmailEvent } from '../event/events/confirmationEmailEvent';
import { cleanCollections, MongooseTestingModule } from '../utils/mongoose-testing.module';
import { TemplateService } from '../template/template.service';
import { EmailService } from '../email/email.service';
import { DepositSubmittedEvent } from '../event/events/depositSubmittedEvent';
import {
  factoryCommunity,
  factoryDepositDocumentDefinition,
  factoryUser,
} from '../utils/test-data';
import { DepositStatus } from '../deposit/deposit.schema';
import { assertIsDefined } from '../utils/utils';
import { UserService } from '../users/user.service';
import { DepositService } from '../deposit/deposit.service';
import { CommunitiesService } from '../communities/communities.service';
import { AppCommunityEvent } from '../event/event';

describe('NotificationService', () => {
  let service: NotificationService;
  let configurationService: ConfigurationService;
  let templateService: TemplateService;
  let emailService: EmailService;
  let module: TestingModule;
  let userService: UserService;
  let depositService: DepositService;
  let communityService: CommunitiesService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [MongooseTestingModule.forRoot('NotificationService')],
      providers: [],
    }).compile();
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    service = module.get(NotificationService);
    configurationService = module.get(ConfigurationService);
    templateService = module.get(TemplateService);
    emailService = module.get(EmailService);
    userService = module.get(UserService);
    depositService = module.get(DepositService);
    communityService = module.get(CommunitiesService);
    await cleanCollections(module);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should not allow because of the environment', async () => {
    environment.name = 'production';
    expect(await service.isSendingEmailsAllowed('test@gmail.com')).toBe(true);
  });

  it('should send emails to valid address', async () => {
    await configurationService.configurationModel.create({
      allowedEmails: ['test@anotherdomain.example'],
      allowedEmailDomains: [
        'orvium.io',
        'ethereal.email',
        'cwts.example.com',
        'example.com',
      ],
    });
    environment.name = 'development';
    expect(await service.isSendingEmailsAllowed('test@example.com')).toBe(true);
    expect(await service.isSendingEmailsAllowed('test@gmail.com')).toBe(false);
    expect(await service.isSendingEmailsAllowed('orvium.io@gmail.com')).toBe(false);
    expect(await service.isSendingEmailsAllowed('Test@AnotherDomain.example')).toBe(true);
    expect(await service.isSendingEmailsAllowed('test@fakeorvium.io')).toBe(false);
    expect(await service.isSendingEmailsAllowed('test@ethereal.email')).toBe(true);
    expect(await service.isSendingEmailsAllowed('test@ethereal.com')).toBe(false);
    expect(await service.isSendingEmailsAllowed('test@fakeethereal.email')).toBe(false);
    expect(await service.isSendingEmailsAllowed('test@cwts.example.com')).toBe(true);
    expect(await service.isSendingEmailsAllowed('test@cwts.example.email')).toBe(false);
    expect(await service.isSendingEmailsAllowed('example@example.com')).toBe(true);
    expect(await service.isSendingEmailsAllowed('example@example.extra.com')).toBe(false);
  });

  it('should notify', async () => {
    await configurationService.configurationModel.create({
      allowedEmails: ['test@anotherdomain.example'],
    });
    environment.name = 'development';
    const event = new ConfirmationEmailEvent({ email: 'example@example.com', code: '12345' });
    await templateService.templateModel.create({
      name: event.emailTemplateName,
      template: '<p>example</p>',
      description: 'this is my description',
      title: 'Confirmation email',
    });
    const emailSpy = jest.spyOn(emailService, 'sendMail').mockImplementation();
    await service.notify(event, 'example@example.com');
    expect(emailSpy).toHaveBeenCalled();
  });

  it('should notify with community', async () => {
    await configurationService.configurationModel.create({
      allowedEmails: ['test@example.com'],
    });
    environment.name = 'development';
    const user = await userService.userModel.create(
      factoryUser.build({ nickname: 'test', email: 'test@example.com' })
    );
    const community = await communityService.communityModel.create(factoryCommunity.build());
    const depositDocument = await depositService.create(
      factoryDepositDocumentDefinition.build({
        status: DepositStatus.published,
        creator: user._id,
        community: community._id,
      })
    );
    const depositPopulated = await depositService.findById(depositDocument._id);
    assertIsDefined(depositPopulated, 'deposit not defined');
    const event: AppCommunityEvent = new DepositSubmittedEvent({
      deposit: depositPopulated.toJSON(),
      user: user.toJSON(),
      community: community.toJSON(),
    });
    await templateService.templateModel.create({
      name: event.emailTemplateName,
      template: '<p>example with community</p>',
      description: 'this is my description',
      title: 'Confirmation email',
    });
    const emailSpy = jest.spyOn(emailService, 'sendMail').mockImplementation();
    await service.notify(event, 'test@example.com');
    expect(emailSpy).toHaveBeenCalled();
  });
});
