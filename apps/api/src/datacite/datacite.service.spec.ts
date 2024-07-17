import { Test, TestingModule } from '@nestjs/testing';
import { DATACITE_ENDPOINT, DataciteService } from './datacite.service';
import { AxiosResponse } from 'axios';
import { assertIsDefined, encryptJson } from '../utils/utils';
import { CommunityDocument } from '../communities/communities.schema';
import { HttpModule, HttpService } from '@nestjs/axios';
import { createCommunity, createDeposit, createReview } from '../utils/test-data';
import { DepositService, PopulatedDepositDocument } from '../deposit/deposit.service';
import { cleanCollections, MongooseTestingModule } from '../utils/mongoose-testing.module';
import { ReviewService } from '../review/review.service';
import { lastValueFrom, of } from 'rxjs';
import { NotFoundException } from '@nestjs/common';
import { TransformerService } from '../transformer/transformer.service';

describe('DataciteService', () => {
  let service: DataciteService;
  let httpService: HttpService;
  let depositService: DepositService;
  let transformerService: TransformerService;
  let reviewService: ReviewService;
  const dataciteConfig = {
    pass: encryptJson('the pass'),
    prefix: '10.1093',
    accountId: 'the id',
    server: DATACITE_ENDPOINT.test,
  };

  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [HttpModule, MongooseTestingModule.forRoot('dataciteService')],
      providers: [DataciteService],
    }).compile();

    service = module.get(DataciteService);
    httpService = module.get(HttpService);

    depositService = module.get(DepositService);
    reviewService = module.get(ReviewService);
    transformerService = module.get(TransformerService);
    await cleanCollections(module);
  });

  afterEach(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should generate DOI', async () => {
    const { community } = await createCommunity(module, {
      community: {
        datacite: dataciteConfig,
      },
    });

    const { deposit } = await createDeposit(module, { community });

    const result: AxiosResponse = {
      data: {
        data: {
          id: '10.1093/6124d3870873a803c65ec483',
        },
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    } as AxiosResponse;

    jest
      .spyOn(httpService.axiosRef, 'request')
      .mockImplementation(async () => lastValueFrom(of(result)));

    const depositNotPopulated = await depositService.depositModel.create(deposit);
    const depositDocument = (await depositService.findById(
      depositNotPopulated._id
    )) as PopulatedDepositDocument;

    const doi = await service.generateDOI(depositDocument);
    expect(doi).toBe(`10.1093/${depositDocument._id.toHexString()}`);
  });

  it('should generate DOI for review', async () => {
    const { community } = await createCommunity(module, {
      community: {
        datacite: dataciteConfig,
      },
    });
    const { deposit } = await createDeposit(module, {
      community,
      deposit: {
        doi: '10.1000/182',
      },
    });
    const { review } = await createReview(module, deposit);
    const reviewPopulated = await reviewService.findById(review._id.toHexString());
    assertIsDefined(reviewPopulated);

    const result: AxiosResponse = {
      data: {
        data: {
          id: '10.1093/6124d3870873a803c65ec483',
        },
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    } as AxiosResponse;

    jest
      .spyOn(httpService.axiosRef, 'request')
      .mockImplementation(async () => lastValueFrom(of(result)));
    const transformedReview = await transformerService.reviewPopulatedToDto(reviewPopulated, null);
    const doi = await service.generateReviewDOI(transformedReview, community, deposit, 3);

    expect(doi).toBe(`10.1093/${reviewPopulated._id.toHexString()}`);
  });

  it('should get DOI metadata datacite', async () => {
    const { community } = await createCommunity(module, {
      community: {
        datacite: dataciteConfig,
      },
    });
    const { deposit } = await createDeposit(module, {
      community,
      deposit: {
        doi: '10.1093/6124d3870873a803c65ec483',
      },
    });

    const depositDocument = (await depositService.findById(
      deposit._id
    )) as PopulatedDepositDocument;

    const result: AxiosResponse = {
      data: {
        data: {
          id: '10.1093/6124d3870873a803c65ec483',
        },
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    } as AxiosResponse;

    jest
      .spyOn(httpService.axiosRef, 'request')
      .mockImplementation(async () => lastValueFrom(of(result)));

    depositDocument.communityPopulated = {
      datacite: dataciteConfig,
    } as CommunityDocument;

    const doi = await service.getDoiMetadata(depositDocument);
    expect(doi.data?.id).toBe('10.1093/6124d3870873a803c65ec483');
  });

  it('should get DOI metadata datacite for review', async () => {
    const { community } = await createCommunity(module, {
      community: {
        datacite: dataciteConfig,
      },
    });
    const { deposit } = await createDeposit(module, {
      community,
      deposit: {
        doi: '10.1093/6124d3870873a803c65ec483',
      },
    });
    const { review } = await createReview(module, deposit, {
      review: {
        doi: '10.1093/6124d3870873a803c65ec431',
      },
    });
    const reviewPopulated = await reviewService.findById(review._id.toHexString());

    assertIsDefined(reviewPopulated);

    const result: AxiosResponse = {
      data: {
        data: {
          id: '10.1093/6124d3870873a803c65ec486',
        },
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    } as AxiosResponse;
    jest
      .spyOn(httpService.axiosRef, 'request')
      .mockImplementation(async () => lastValueFrom(of(result)));
    const transformedReview = await transformerService.reviewPopulatedToDto(reviewPopulated, null);
    const doi = await service.getReviewDoiMetadata(transformedReview, community);

    expect(doi.data?.id).toBe('10.1093/6124d3870873a803c65ec486');
  });

  it('should throw exception if datacite is not configured', async () => {
    const { community } = await createCommunity(module);

    const { deposit } = await createDeposit(module, {
      community,
      deposit: {
        doi: '10.1093/6124d3870873a803c65ec483',
      },
    });

    const { review } = await createReview(module, deposit, {
      review: {
        doi: '10.1093/6124d3870873a803c65ec431',
      },
    });
    const reviewPopulated = await reviewService.findById(review._id.toHexString());
    const depositPopulated = await depositService.findById(deposit._id);
    assertIsDefined(reviewPopulated);
    assertIsDefined(depositPopulated);

    const result: AxiosResponse = {
      data: {
        data: {
          id: '10.1093/6124d3870873a803c65ec486',
        },
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    } as AxiosResponse;
    jest
      .spyOn(httpService.axiosRef, 'request')
      .mockImplementation(async () => lastValueFrom(of(result)));

    const transformedReview = await transformerService.reviewPopulatedToDto(reviewPopulated, null);

    await expect(
      service.generateReviewDOI(transformedReview, community, deposit, 3)
    ).rejects.toThrow(new NotFoundException('DataCite is not configured correctly'));

    await expect(service.getReviewDoiMetadata(transformedReview, community)).rejects.toThrow(
      new NotFoundException('DataCite is not configured correctly')
    );

    await expect(service.generateDOI(depositPopulated)).rejects.toThrow(
      new NotFoundException('DataCite is not configured correctly')
    );
    await expect(service.getDoiMetadata(depositPopulated)).rejects.toThrow(
      new NotFoundException('DataCite is not configured correctly')
    );
  });
});
