import { Test, TestingModule } from '@nestjs/testing';
import { TemplateService } from './template.service';
import { createCommunity, createDeposit, createInvite, factoryTemplate } from '../utils/test-data';
import { ReviewInvitationEmailEvent } from '../event/events/reviewInvitationEmailEvent';
import { MongooseTestingModule } from '../utils/mongoose-testing.module';
import { DepositPopulatedDTO } from '../dtos/deposit/deposit-populated.dto';

describe('TemplateService', () => {
  let service: TemplateService;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [MongooseTestingModule.forRoot('TemplateService')],
    }).compile();

    service = module.get(TemplateService);
  });

  beforeEach(async () => {
    await service.templateModel.deleteMany({});
  });

  afterAll(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create', async () => {
    const template = await service.create(factoryTemplate.build());
    expect(template).toBeDefined();
  });

  it('should findOne', async () => {
    await service.create(factoryTemplate.build());
    const template = await service.findOne({});
    expect(template).toBeDefined();
  });

  it('should find', async () => {
    await service.create(factoryTemplate.build());
    const templates = await service.find({});
    expect(templates.length).toBe(1);
  });

  it('should getHTMLFromEvent', async () => {
    const { community } = await createCommunity(module);
    const { deposit, author } = await createDeposit(module, { community });
    const { invite } = await createInvite(module, { sender: author, community, deposit });
    await service.create(factoryTemplate.build());
    const html = await service.getHTMLFromEvent(
      new ReviewInvitationEmailEvent({
        deposit: deposit as unknown as DepositPopulatedDTO,
        community: community.toJSON(),
        sender: author.toJSON(),
        invite: invite,
        destinationEmail: '',
        destinationName: '',
      })
    );
    expect(html).toBeDefined();
  });
});
