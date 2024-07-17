import { Test, TestingModule } from '@nestjs/testing';
import { cleanCollections, MongooseTestingModule } from '../utils/mongoose-testing.module';
import { DoiLogService } from './doi-log.service';
import {
  assertIsDefined,
  CROSSREF_ENDPOINT,
  DepositCLASSNAME,
  encryptJson,
  generateObjectId,
} from '../utils/utils';
import { createCommunity, createDeposit, createDoiLog, createReview } from '../utils/test-data';
import { AxiosResponse } from 'axios';
import { of } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { DoiStatus } from './doi-log.schema';
import { ReviewService } from '../review/review.service';

describe('DoiLogService', () => {
  let doiLogService: DoiLogService;
  let module: TestingModule;
  let httpService: HttpService;
  const successResponse: AxiosResponse = {
    data: '<doi_batch_diagnostic status="completed"><success_count>1</success_count>',
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {},
  } as AxiosResponse;

  const errorResponse: AxiosResponse = {
    data: '<doi_batch_diagnostic status="completed"><success_count>0</success_count>',
    status: 400,
    statusText: 'ERROR',
    headers: {},
    config: {},
  } as AxiosResponse;

  const crossrefConfig = {
    prefixDOI: '10.51875',
    role: 'orvi',
    user: 'user',
    pass: encryptJson('pass'),
    server: CROSSREF_ENDPOINT.test,
  };
  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [MongooseTestingModule.forRoot('DoiLogService')],
      providers: [],
    }).compile();

    doiLogService = module.get(DoiLogService);
    httpService = module.get(HttpService);
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    await cleanCollections(module);
  });

  it('should be defined', () => {
    expect(doiLogService).toBeDefined();
  });

  it('should create a doi log', async () => {
    const doiLog = await doiLogService.create({
      doi: '10.5072/1234',
      community: generateObjectId(),
      status: 'processing',
      file: 'test.xml',
      submissionId: '123432121321',
      resourceModel: DepositCLASSNAME,
      resource: generateObjectId(),
    });

    expect(doiLog).toBeDefined();
  });

  it('should update processing dois', async () => {
    const { community } = await createCommunity(module, {
      community: {
        crossref: crossrefConfig,
      },
    });
    const { community: communityProd } = await createCommunity(module, {
      community: {
        crossref: {
          ...crossrefConfig,
          server: CROSSREF_ENDPOINT.production,
        },
      },
    });
    const doiLog1 = await createDoiLog(module, {
      doiLog: {
        community: community._id,
      },
    });
    const doiLog2 = await createDoiLog(module, {
      doiLog: {
        community: community._id,
      },
    });

    const doiLogFailed = await createDoiLog(module, {
      doiLog: {
        doi: '10.5072/1224',
        community: communityProd._id,
        submissionId: 213121321,
      },
    });

    jest
      .spyOn(httpService, 'get')
      .mockImplementationOnce(() => of(successResponse))
      .mockImplementationOnce(() => of(successResponse))
      .mockImplementationOnce(() => of(errorResponse));

    await doiLogService.updateDOIstatus();

    const updatedDoi1 = await doiLogService.findByResourceId(doiLog1.resource);
    assertIsDefined(updatedDoi1);
    expect(updatedDoi1.status).toBe(DoiStatus.published);

    const updatedDoi2 = await doiLogService.findByResourceId(doiLog2.resource);
    assertIsDefined(updatedDoi2);
    expect(updatedDoi2.status).toBe(DoiStatus.published);

    const updatedDoiFailed = await doiLogService.findByResourceId(doiLogFailed.resource);
    assertIsDefined(updatedDoiFailed);
    expect(updatedDoiFailed.status).toBe(DoiStatus.failed);
  });

  it('should update review doistaus', async () => {
    const { community } = await createCommunity(module, {
      community: {
        crossref: crossrefConfig,
      },
    });
    const { deposit } = await createDeposit(module, { community });
    const { review } = await createReview(module, deposit);
    await createDoiLog(module, {
      doiLog: {
        community: community._id.toHexString(),
        status: DoiStatus.processing,
      },
      resource: review,
    });

    jest.spyOn(httpService, 'get').mockImplementationOnce(() => of(successResponse));

    await doiLogService.updateDOIstatus();
    const reviewService = module.get(ReviewService);
    const updatedReview = await reviewService.findOne({ _id: review._id });
    assertIsDefined(updatedReview);
    expect(updatedReview.doiStatus).toBe(DoiStatus.published);
  });
});
