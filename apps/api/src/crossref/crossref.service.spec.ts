import { HttpModule, HttpService } from '@nestjs/axios';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CommunityType } from '../communities/communities.schema';
import { createCommunity, createDeposit, createReview } from '../utils/test-data';
import { CrossrefService } from './crossref.service';
import { cleanCollections, MongooseTestingModule } from '../utils/mongoose-testing.module';
import { DepositService } from '../deposit/deposit.service';
import { AxiosResponse } from 'axios';
import { of } from 'rxjs';
import { assertIsDefined, CROSSREF_ENDPOINT, encryptJson } from '../utils/utils';
import { ReviewDecision } from '../review/review.schema';
import { TransformerService } from '../transformer/transformer.service';
import { ReviewService } from '../review/review.service';
import { readFileSync } from 'fs';
import formatXml from 'xml-formatter';
import path from 'path';
import { Types } from 'mongoose';
import { DoiLogService } from '../doi/doi-log.service';

describe('CrossrefService', () => {
  let service: CrossrefService;
  let module: TestingModule;
  let httpService: HttpService;
  let depositService: DepositService;
  let doiLogService: DoiLogService;

  const validXML =
    '<html>\n' +
    '<head><title>SUCCESS</title>\n' +
    '</head>\n' +
    '<body>\n' +
    '<h2>SUCCESS</h2>\n' +
    '<p>Your batch submission was successfully received.</p>\n' +
    '</body>\n' +
    '</html>\n';

  const invalidXML = '<head><title>not SUCCESS</title>';

  const response: AxiosResponse = {
    data: validXML,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {},
  } as AxiosResponse;

  const responseNotSucess: AxiosResponse = {
    data: invalidXML,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {},
  } as AxiosResponse;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [HttpModule, MongooseTestingModule.forRoot('CrossrefService')],
      providers: [],
    }).compile();
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    httpService = module.get(HttpService);
    service = module.get(CrossrefService);
    depositService = module.get(DepositService);
    doiLogService = module.get(DoiLogService);
    await cleanCollections(module);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw exception if a required value is missing', async () => {
    const { community } = await createCommunity(module);
    const { deposit } = await createDeposit(module, { community });
    const depositDocument = await depositService.findById(deposit._id);
    assertIsDefined(depositDocument, 'Deposit not found');
    expect(() => service.createDepositXML(depositDocument)).toThrow(NotFoundException);
  });

  it('should throw exception if a required value is missing in journal', async () => {
    const { community } = await createCommunity(module, {
      community: {
        type: CommunityType.journal,
        crossref: {
          prefixDOI: '10.51875',
          role: 'orvi',
          user: 'user',
          pass: encryptJson('pass'),
          server: CROSSREF_ENDPOINT.test,
        },
      },
    });
    const { deposit } = await createDeposit(module, { community });

    const depositDocument = await depositService.findById(deposit._id);
    assertIsDefined(depositDocument, 'Deposit not found');
    expect(() => service.createDepositXML(depositDocument)).toThrow(
      new NotFoundException('ISSN is mandatory for Journal publications')
    );
  });

  it('should return xml of deposit (Conference)', async () => {
    const { community } = await createCommunity(module, {
      community: {
        type: CommunityType.conference,
        crossref: {
          prefixDOI: '10.51875',
          role: 'orvi',
          user: 'user',
          pass: encryptJson('pass'),
          server: CROSSREF_ENDPOINT.test,
        },
      },
    });
    const { deposit } = await createDeposit(module, {
      community,
      deposit: {
        _id: new Types.ObjectId('645e1f14fed384d667fec6cf'),
        publicationDate: new Date('2023-05-12'),
        extraMetadata: {
          publisher: 'Test',
        },
      },
    });
    const depositPopulated = await depositService.findById(deposit._id.toHexString());
    assertIsDefined(depositPopulated, 'Cannot find deposit');

    const fixture = readFileSync(
      path.resolve(__dirname, './fixtures/crossref-deposit-conference-1.xml')
    ).toString();

    expect(formatXml(service.createDepositXML(depositPopulated, 1683889940309))).toBe(fixture);

    depositPopulated.publicationDate = undefined;
    const currentDateXML = `
                 <publication_date>
                    <month>${String(new Date().getMonth() + 1)}</month>
                    <day>
                        ${new Date().getDate().toString()}
                    </day>
                    <year>
                        ${new Date().getFullYear().toString()}
                    </year>
                </publication_date>`.replace(/\s+/g, '');

    expect(service.createDepositXML(depositPopulated, 1683889940309).replace(/\s+/g, '')).toContain(
      currentDateXML
    );
  });

  it('should return xml of deposit (Journal)', async () => {
    const { community } = await createCommunity(module, {
      community: {
        type: CommunityType.journal,
        crossref: {
          prefixDOI: '10.51875',
          role: 'orvi',
          user: 'user',
          pass: encryptJson('pass'),
          server: CROSSREF_ENDPOINT.test,
        },
      },
    });
    const { deposit } = await createDeposit(module, {
      community,
      deposit: {
        _id: new Types.ObjectId('645e1f14fed384d667fec6cf'),
        publicationDate: new Date('2023-05-12'),
        extraMetadata: {
          publisher: 'Test',
          issn: '1234-5678',
          journalTitle: 'Test journal',
        },
      },
    });

    const depositPopulated = await depositService.findById(deposit._id.toHexString());

    assertIsDefined(depositPopulated, 'Cannot find deposit');

    const fixture = readFileSync(
      path.resolve(__dirname, './fixtures/crossref-deposit-journal-1.xml')
    ).toString();

    expect(formatXml(service.createDepositXML(depositPopulated, 1683889940309))).toBe(
      formatXml(fixture)
    );

    depositPopulated.publicationDate = undefined;
    const currentDateXML = `
                 <publication_date>
                    <month>${String(new Date().getMonth() + 1)}</month>
                    <day>
                        ${new Date().getDate().toString()}
                    </day>
                    <year>
                        ${new Date().getFullYear().toString()}
                    </year>
                </publication_date>`.replace(/\s+/g, '');

    expect(service.createDepositXML(depositPopulated, 1683889940309).replace(/\s+/g, '')).toContain(
      currentDateXML
    );
  });

  it('should throw exception if crossref is no configured in the community', async () => {
    const { community } = await createCommunity(module, {
      community: {
        type: CommunityType.journal,
        crossref: {
          user: '',
          prefixDOI: '',
          server: CROSSREF_ENDPOINT.test,
          pass: '',
          role: '',
        },
      },
    });
    const { deposit } = await createDeposit(module, { community });

    const depositPopulated = await depositService.findById(deposit._id.toHexString());
    assertIsDefined(depositPopulated, 'Cannot find deposit');

    await expect(service.generateDepositDOI(depositPopulated)).rejects.toThrow(NotFoundException);
  });

  it('should generate DOI for a deposit', async () => {
    const { community } = await createCommunity(module, {
      community: {
        type: CommunityType.conference,
        crossref: {
          prefixDOI: '10.51875',
          role: 'orvi',
          user: 'user',
          pass: encryptJson('pass'),
          server: CROSSREF_ENDPOINT.test,
        },
      },
    });
    const { deposit } = await createDeposit(module, { community });
    const depositPopulated = await depositService.findById(deposit._id.toHexString());
    assertIsDefined(depositPopulated, 'Cannot find deposit');

    jest.spyOn(httpService, 'post').mockImplementationOnce(() => of(response));
    const res = await service.generateDepositDOI(depositPopulated);
    expect(res).toBe(`10.51875/${deposit._id.toHexString()}`);
    const spyDoiLog = jest.spyOn(doiLogService, 'create');

    jest.spyOn(httpService, 'post').mockImplementation(() => of(responseNotSucess));
    const res2 = await service.generateDepositDOI(depositPopulated);
    expect(res2).toBe(`10.51875/${deposit._id.toHexString()}`);
    // if the doiLog is not failed or published, it should remain processing
    expect(spyDoiLog).not.toHaveBeenCalled();
  });

  it('should return review xml', async () => {
    const { community } = await createCommunity(module, {
      community: {
        crossref: {
          prefixDOI: '10.51875',
          role: 'orvi',
          user: 'user',
          pass: encryptJson('pass'),
          server: CROSSREF_ENDPOINT.test,
        },
      },
    });
    const { deposit } = await createDeposit(module, { community });
    const { review } = await createReview(module, deposit, {
      review: { _id: '645e253e47d02c737a1fd425', publicationDate: new Date('2023-05-14') },
    });
    assertIsDefined(community.crossref);
    const reviewPopulated = await module.get(ReviewService).findById(review._id);
    assertIsDefined(reviewPopulated);
    const reviewTransformed = await module
      .get(TransformerService)
      .reviewPopulatedToDto(reviewPopulated, null);
    const xml = await service.createReviewXML(reviewTransformed, community.crossref, 1683891518993);
    const fixture = readFileSync(
      path.resolve(__dirname, './fixtures/crossref-review-1.xml')
    ).toString();
    expect(formatXml(xml)).toBe(fixture);
  });

  it('should create XML with anonymous author', async () => {
    const { community } = await createCommunity(module, {
      community: {
        type: CommunityType.journal,
        crossref: {
          prefixDOI: '10.51875',
          role: 'orvi',
          user: 'user',
          pass: encryptJson('pass'),
          server: CROSSREF_ENDPOINT.test,
        },
      },
    });
    const { deposit } = await createDeposit(module, { community });
    const { review } = await createReview(module, deposit, {
      review: {
        _id: '645e253f47d02c737a1fd452',
        creationDate: new Date('2023-05-14'),
        decision: ReviewDecision.majorRevision,
        showIdentityToEveryone: false,
      },
    });

    const reviewPopulated = await module.get(ReviewService).findById(review._id);
    assertIsDefined(reviewPopulated);
    const reviewTransformed = await module
      .get(TransformerService)
      .reviewPopulatedToDto(reviewPopulated, null);
    assertIsDefined(community.crossref);
    const xml = await service.createReviewXML(reviewTransformed, community.crossref, 1683891519085);
    const fixture = readFileSync(
      path.resolve(__dirname, './fixtures/crossref-review-2.xml')
    ).toString();
    expect(formatXml(xml)).toBe(formatXml(fixture));
  });

  it('should generate DOI for a review', async () => {
    const { community } = await createCommunity(module, {
      community: {
        type: CommunityType.journal,
        crossref: {
          prefixDOI: '10.51875',
          role: 'orvi',
          user: 'user',
          pass: encryptJson('pass'),
          server: CROSSREF_ENDPOINT.test,
        },
      },
    });
    const { deposit } = await createDeposit(module, { community });
    const { review } = await createReview(module, deposit, {
      review: {
        decision: ReviewDecision.majorRevision,
      },
    });

    const reviewPopulated = await module.get(ReviewService).findById(review._id);
    assertIsDefined(reviewPopulated);
    const reviewTransformed = await module
      .get(TransformerService)
      .reviewPopulatedToDto(reviewPopulated, null);

    jest.spyOn(httpService, 'post').mockImplementationOnce(() => of(response));

    const res = await service.generateReviewDOI(
      reviewTransformed,
      reviewPopulated.communityPopulated
    );
    expect(res).toBe(`10.51875/${review._id.toHexString()}`);
    const spyDoiLog = jest.spyOn(doiLogService, 'create');

    jest.spyOn(httpService, 'post').mockImplementationOnce(() => of(responseNotSucess));
    const res2 = await service.generateReviewDOI(
      reviewTransformed,
      reviewPopulated.communityPopulated
    );

    expect(res2).toBe(`10.51875/${review._id.toHexString()}`);
    expect(spyDoiLog).toHaveBeenCalledWith(expect.objectContaining({ status: 'processing' }));
  });

  it('should generate DOI for a review with RC2', async () => {
    const { community } = await createCommunity(module, {
      community: {
        type: CommunityType.journal,
        crossref: {
          prefixDOI: '10.51875',
          role: 'orvi',
          user: 'user',
          pass: encryptJson('pass'),
          server: CROSSREF_ENDPOINT.test,
        },
      },
    });
    const { deposit } = await createDeposit(module, { community });
    await createReview(module, deposit, {
      review: {
        doi: '10.454321/21332',
      },
    });

    const { review } = await createReview(module, deposit, {
      review: {
        _id: '645e253f47d02c737a1fd4b1',
        decision: ReviewDecision.majorRevision,
        showIdentityToEveryone: false,
        publicationDate: new Date('2023-05-14'),
      },
    });

    const reviewPopulated = await module.get(ReviewService).findById(review._id);
    assertIsDefined(reviewPopulated);
    const reviewTransformed = await module
      .get(TransformerService)
      .reviewPopulatedToDto(reviewPopulated, null);
    assertIsDefined(community.crossref);
    const xml = await service.createReviewXML(reviewTransformed, community.crossref, 1683891519276);
    const fixture = readFileSync(
      path.resolve(__dirname, './fixtures/crossref-review-3.xml')
    ).toString();

    expect(formatXml(xml)).toBe(fixture);
  });

  it('should mark as failed if cannot send metadata to crossref', async () => {
    const { community } = await createCommunity(module, {
      community: {
        type: CommunityType.journal,
        crossref: {
          prefixDOI: '10.51875',
          role: 'orvi',
          user: 'user',
          pass: encryptJson('pass'),
          server: CROSSREF_ENDPOINT.test,
        },
      },
    });

    const { deposit } = await createDeposit(module, {
      community,
      deposit: {
        extraMetadata: {
          publisher: 'Test',
          issn: '1234-5678',
          journalTitle: 'Test journal',
        },
      },
    });

    const depositPopulated = await depositService.findById(deposit._id);
    assertIsDefined(depositPopulated, 'deposit not found');
    const spyDoiLog = jest.spyOn(doiLogService, 'create');
    jest.spyOn(httpService, 'post').mockImplementation(() => of(responseNotSucess));
    await service.generateDepositDOI(depositPopulated);
    expect(spyDoiLog).toHaveBeenCalledWith(expect.objectContaining({ status: 'failed' }));

    jest.spyOn(httpService, 'post').mockImplementation(() => of(response));
    // retry failed submission
    await service.generateDepositDOI(depositPopulated);
    expect(spyDoiLog).toHaveBeenCalledWith(expect.objectContaining({ status: 'processing' }));
  });
});
