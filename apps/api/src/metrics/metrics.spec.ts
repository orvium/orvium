import { Test, TestingModule } from '@nestjs/testing';
import { gaRequestCommunityViews, MetricsService } from './metrics.service';
import { cleanCollections, MongooseTestingModule } from '../utils/mongoose-testing.module';

describe('MetricsService', () => {
  let service: MetricsService;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [MongooseTestingModule.forRoot('MetricsService')],
      providers: [],
    }).compile();
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    service = module.get<MetricsService>(MetricsService);
    await cleanCollections(module);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should get default date range', () => {
    const metrics = gaRequestCommunityViews();
    expect(metrics).toMatchObject(
      expect.objectContaining({
        dateRanges: [
          {
            startDate: 'yesterday',
            endDate: 'yesterday',
          },
        ],
      })
    );
  });
});
