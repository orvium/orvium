import { Test, TestingModule } from '@nestjs/testing';
import { AwsStorageService } from '../common/aws-storage-service/aws-storage.service';
import { DepositImportService } from './deposit-import.service';
import {
  AcceptedFor,
  AccessRight,
  Deposit,
  DepositDocument,
  DepositStatus,
  PublicationType,
  ReviewType,
} from './deposit.schema';
import { FigshareImportService } from './figshare-import.service';
import { AxiosResponse } from 'axios';
import { firstValueFrom, of } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { HttpModule, HttpService } from '@nestjs/axios';
import { FileMetadata } from '../dtos/filemetadata.dto';
import { MongooseTestingModule } from '../utils/mongoose-testing.module';
import { AnyKeys } from 'mongoose';

describe('DepositImportService', () => {
  let service: DepositImportService;
  let httpService: HttpService;
  let awsStorageService: AwsStorageService;
  let figshareImportService: FigshareImportService;
  let module: TestingModule;

  const deposit: AnyKeys<Deposit> = {
    canAuthorInviteReviewers: false,
    creator: '6124e35e399717c9e3fc0607',
    nickname: 'nickname',
    gravatar: 'gravatar',
    community: '41224d776a326fb40f000001',
    title: 'Publication with DOI: 10.5281/zenodo.4957929',
    doi: '10.5281/zenodo.4957929',
    authors: [],
    references: [],
    bibtexReferences: [],
    accessRight: AccessRight.CC0,
    publicationType: PublicationType.article,
    disciplines: [],
    status: DepositStatus.draft,
    peerReviews: [],
    reviewType: ReviewType.openReview,
    files: [],
    keywords: [],
    createdOn: new Date(),
    isLatestVersion: true,
    version: 1,
    parent: uuidv4(),
    canBeReviewed: true,
    views: 0,
    history: [],
    images: [],
    acceptedFor: AcceptedFor.None,
    extraMetadata: {},
  };

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [MongooseTestingModule.forRoot('DepositImportService'), HttpModule],
      providers: [],
    }).compile();
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    service = module.get(DepositImportService);
    httpService = module.get(HttpService);
    awsStorageService = module.get(AwsStorageService);
    figshareImportService = module.get(FigshareImportService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should import deposit with url', async () => {
    expect(service).toBeDefined();
    const spy = jest.spyOn(service, 'getHtmlFromUrl').mockResolvedValue('<html></html>');
    await service.importDepositWithUrl('https://zenodo.org/record/5894799#.Y-ok5NLMKV4');
    expect(spy).toHaveBeenCalled();
    spy.mockReset();
  });

  it.skip('should import deposit metadata', async () => {
    const responseHTML =
      '<!DOCTYPE html>' +
      '<html lang="en" dir="ltr">' +
      '<head>' +
      '<meta charset="utf-8">' +
      '<meta name="description" content="Abstract" />' +
      '<meta name="citation_title" content="My title" />' +
      '<meta name="citation_keywords" content="Fatigue,Age groups"/>' +
      '<meta name="citation_author" content="Sarai Varona" />' +
      '<meta name="citation_author" content="Monzón, Sara" />' +
      '<meta name="citation_publication_date" content="2021/06/15" />' +
      '<meta name="dc.type" content="patent" />' +
      '<meta name="citation_doi" content="10.5281/zenodo.4957929" />' +
      '<meta name="citation_reference" content="citation_title=The energetics of endurance running;citation_author=P Di Prampero;citation_author=G Atchou;citation_author=JC Brückner;citation_author=C Moia;citation_journal_title=European journal of applied physiology and occupational physiology;citation_volume=55;citation_number=55;citation_issue=3;citation_first_page=259;citation_last_page=266;citation_publication_date=1986;" />' +
      '<meta name="citation_abstract_html_url" content="https://zenodo.org/record/4957929" />' +
      '<meta name="citation_pdf_url" content="www.prueba.com" />' +
      '</head>' +
      '<body itemscope itemtype="http://schema.org/WebPage" data-spy="scroll" data-target=".scrollspy-target">' +
      '<p>Test</p>' +
      '</body>' +
      '</html>';

    const result: AxiosResponse = {
      data: responseHTML,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
      request: {
        res: {
          headers: {},
        },
      },
    } as AxiosResponse;

    jest.spyOn(httpService, 'get').mockImplementation(() => of(result));
    jest.spyOn(httpService, 'axiosRef').mockImplementation(async () => firstValueFrom(of(result)));
    const spyStorage = jest.spyOn(awsStorageService, 'save').mockImplementation(undefined);

    const importedDeposit = await service.importDeposit(deposit);
    expect(importedDeposit.title).toBe('My title');
    expect(importedDeposit.abstract).toBe('Abstract');
    expect(importedDeposit.keywords).toContain('Fatigue');
    expect(importedDeposit.keywords).toContain('Age groups');
    expect(importedDeposit.doi).toBe('10.5281/zenodo.4957929');
    const expectedArray = [
      { credit: [], institutions: [], firstName: 'Sarai', lastName: 'Varona' },
      { credit: [], institutions: [], firstName: 'Sara', lastName: 'Monzón' },
    ];
    expect(importedDeposit.authors.length).toBe(2);
    expect(importedDeposit.authors).toContainEqual(expect.objectContaining(expectedArray[0]));
    expect(importedDeposit.authors).toContainEqual(expect.objectContaining(expectedArray[1]));
    expect(importedDeposit.publicationType).toBe(PublicationType.patent);
    expect(importedDeposit.references).toContainEqual({
      reference:
        'P Di Prampero,G Atchou,JC Brückner,C Moia (1986) The energetics of endurance running',
    });
    expect(spyStorage).toHaveBeenCalled();
    expect(importedDeposit.pdfUrl).toBe('Mytitle.pdf');
    const fileMetadata: FileMetadata = {
      filename: 'Mytitle.pdf',
      description: 'Mytitle.pdf',
      contentType: 'application/pdf',
      contentLength: 0,
      tags: ['Publication'],
    };
    expect(importedDeposit.publicationFile).toStrictEqual(fileMetadata);
  });

  it.skip('should detect a figshare deposit', async () => {
    const responseHTML: string =
      '<!DOCTYPE html>' +
      '<html lang="en" dir="ltr">' +
      '<head>' +
      '<meta charset="utf-8">' +
      '<meta name="description" content="Abstract" />' +
      '<meta data-rh="true" content="figshare" name="application-name">' +
      '<meta name="citation_title" content="My title" />' +
      '<meta name="citation_keywords" content="Fatigue,Age groups"/>' +
      '<meta name="citation_author" content="Sarai Varona" />' +
      '<meta name="citation_author" content="Monzón, Sara" />' +
      '<meta name="citation_publication_date" content="2021/06/15" />' +
      '<meta name="dc.type" content="patent" />' +
      '<meta name="citation_doi" content="10.5281/zenodo.4957929" />' +
      '<meta name="citation_reference" content="citation_title=The energetics of endurance running;citation_author=P Di Prampero;citation_author=G Atchou;citation_author=JC Brückner;citation_author=C Moia;citation_journal_title=European journal of applied physiology and occupational physiology;citation_volume=55;citation_number=55;citation_issue=3;citation_first_page=259;citation_last_page=266;citation_publication_date=1986;" />' +
      '<meta name="citation_abstract_html_url" content="https://zenodo.org/record/4957929" />' +
      '</head>' +
      '<body ng-csp  itemscope itemtype="http://schema.org/WebPage" data-spy="scroll" data-target=".scrollspy-target">' +
      '<p>Test</p>' +
      '</body>' +
      '</html>';

    const result: AxiosResponse = {
      data: responseHTML,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
      request: {
        res: {
          headers: {},
        },
      },
    } as AxiosResponse;

    jest.spyOn(httpService, 'get').mockImplementation(() => of(result));
    const spy = jest
      .spyOn(figshareImportService, 'importDeposit')
      .mockImplementation(async () => firstValueFrom(of(deposit as DepositDocument)));
    await service.importDeposit(deposit);
    expect(spy).toHaveBeenCalledWith(deposit);
  });
});
