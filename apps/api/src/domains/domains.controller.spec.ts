import { Test, TestingModule } from '@nestjs/testing';
import { DomainsController } from './domains.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { environment } from '../environments/environment';
import { DomainsModule } from './domains.module';
import { DomainsService } from './domains.service';
import { Domain, DomainSchema } from './domains.schema';

describe('Domains Controller', () => {
  let controller: DomainsController;
  let domainsService: DomainsService;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(environment.test.mongoUri),
        MongooseModule.forFeature([
          { name: Domain.name, schema: DomainSchema, collection: 'domains-domains' },
        ]),
        DomainsModule,
      ],
      controllers: [DomainsController],
      providers: [DomainsService],
    }).compile();

    controller = module.get(DomainsController);
    domainsService = module.get(DomainsService);

    await domainsService.domainModel.deleteMany();

    await domainsService.domainModel.insertMany([
      {
        emailDomain: 'example.com',
      },
    ]);
  });

  afterEach(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get blocked domain', async () => {
    const domain = await controller.isDomainBlocked('example.com');
    expect(domain).toBe(true);
  });

  it('should get allowed domain', async () => {
    const domain = await controller.isDomainBlocked('orvium.io');
    expect(domain).toBe(false);
  });
});
