import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { environment } from '../environments/environment';
import { Configuration, ConfigurationSchema } from './configuration.schema';
import { ConfigurationService } from './configuration.service';

describe('ConfigurationService', () => {
  let service: ConfigurationService;
  let module: TestingModule;

  const configuration = {
    allowedEmails: [],
    googleAnalytics: {
      credentials: 'credentials',
      property: 'property',
    },
    smtp: {
      host: 'host',
      port: 1,
      secure: true,
      auth: {
        user: 'user',
        pass: 'pass',
      },
    },
    senderEmail: 'senderEmail',
    adminEmail: 'adminEmail',
    publicUrl: 'publicUrl',
    sentryDSN: 'sentryDSN',
    videos: [],
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [ConfigurationService],
      imports: [
        MongooseModule.forRoot(environment.test.mongoUri),
        MongooseModule.forFeature([
          {
            name: Configuration.name,
            schema: ConfigurationSchema,
            collection: 'config-configuration',
          },
        ]),
      ],
    }).compile();

    service = module.get(ConfigurationService);
    await service.configurationModel.deleteMany();
    await service.configurationModel.insertMany([configuration]);
  });

  afterEach(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find one', async () => {
    const value = await service.configurationModel.findOne({ sentryDSN: 'sentryDSN' });
    expect(value?.sentryDSN).toBe(configuration.sentryDSN);
  });

  it('should find one by id', async () => {
    const value = await service.configurationModel.findOne({ sentryDSN: 'sentryDSN' });
    const c = await service.configurationModel.findById(value?._id);
    expect(c?.sentryDSN).toBe(configuration.sentryDSN);
  });

  it('should create', async () => {
    await service.configurationModel.create(configuration);
    const values = await service.configurationModel.find({});
    expect(values.length).toBe(2);
  });
});
