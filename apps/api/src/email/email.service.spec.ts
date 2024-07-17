import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from './email.service';
import { environment } from '../environments/environment';

describe('EmailService', () => {
  let service: EmailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailService],
    }).compile();

    service = module.get(EmailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should send email', async () => {
    const spyTransporter = jest.spyOn(service.transporter, 'sendMail').mockImplementation();
    await service.sendMail({ to: 'example@example.com' });

    expect(spyTransporter).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: { 'X-SES-CONFIGURATION-SET': 'SESConfigurationSet' },
        from: 'noreply@example.com',
        to: 'example@example.com',
      })
    );
  });
});

describe('EmailService with Production env', () => {
  let service: EmailService;

  beforeEach(async () => {
    jest.replaceProperty(environment, 'name', 'production');
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailService],
    }).compile();

    service = module.get(EmailService);
  });

  it('should set subjectPrefix empty if production', () => {
    expect(service).toBeDefined();
    expect(service.subjectPrefix).toBe('');
  });
});
