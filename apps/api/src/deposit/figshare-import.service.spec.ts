import { Test, TestingModule } from '@nestjs/testing';
import { AwsStorageService } from '../common/aws-storage-service/aws-storage.service';
import {
  AcceptedFor,
  AccessRight,
  Deposit,
  DepositStatus,
  PublicationType,
  ReviewType,
} from './deposit.schema';
import { FigshareImportService } from './figshare-import.service';
import { AxiosResponse } from 'axios';
import { firstValueFrom, of } from 'rxjs';
import { TemplateService } from '../template/template.service';
import { TemplateDocument } from '../template/template.schema';
import { v4 as uuidv4 } from 'uuid';
import { HttpModule, HttpService } from '@nestjs/axios';
import { MongooseTestingModule } from '../utils/mongoose-testing.module';
import { AnyKeys } from 'mongoose';

describe('FigshareImportService', () => {
  let service: FigshareImportService;
  let httpService: HttpService;
  let awsStorageService: AwsStorageService;
  let templateService: TemplateService;
  let module: TestingModule;

  const deposit: AnyKeys<Deposit> = {
    canAuthorInviteReviewers: false,
    creator: '6124db0a5a63a2c3ae3ded85',
    nickname: 'nickname',
    gravatar: 'gravatar',
    community: '41224d776a326fb40f000001',
    title: 'Publication with DOI: 10.5281/zenodo.4957929',
    doi: '10.4121/14096067.v1',
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
  const responseSearchByDoi = [
    {
      id: 14096067,
      title: 'Intent communication for automated vehicles',
      doi: '10.4121/14096067.v1',
      handle: '',
      url: 'https://api.figshare.com/v2/articles/14096067',
      published_date: '2021-04-20T11:36:53Z',
      thumb: '',
      defined_type: 3,
      defined_type_name: 'dataset',
      group_id: 28586,
      url_private_api: 'https://api.figshare.com/v2/account/articles/14096067',
      url_public_api: 'https://api.figshare.com/v2/articles/14096067',
      url_private_html: 'https://figshare.com/account/articles/14096067',
      url_public_html:
        'https://data.example.com/articles/dataset/Supplementary_data_for_the_paper_Bio-inspired_intent_communication_for_automated_vehicles_/14096067',
      timeline: {
        posted: '2021-04-20T11:36:53',
        revision: '2021-04-20T11:36:53',
        submission: '2021-04-19T17:38:05',
        firstOnline: '2021-04-20T11:36:53',
      },
      resource_title: 'Bio-inspired intent communication for automated vehicles',
      resource_doi: '10.1016/j.trf.2021.03.021',
    },
  ];
  const resultPost: AxiosResponse = {
    data: responseSearchByDoi,
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
  const responseSearchByFigShareId = {
    files: [],
    custom_fields: [
      {
        name: 'Publisher',
        value: '4TU.ResearchData',
      },
      {
        name: 'Language',
        value: '',
      },
      {
        name: 'Time coverage',
        value: '',
      },
      {
        name: 'Geolocation',
        value: '',
      },
      {
        name: 'Geolocation Longitude',
        value: '',
      },
      {
        name: 'Geolocation Latitude',
        value: '',
      },
      {
        name: 'Format',
        value: '',
      },
      {
        name: 'Data Link',
        value: [],
      },
      {
        name: 'Derived From',
        value: [],
      },
      {
        name: 'Same As',
        value: [],
      },
      {
        name: 'Organizations',
        value:
          'Faculty of Mechanical, Maritime and Materials Engineering, HW University of Technology',
      },
    ],
    authors: [
      {
        id: 10182537,
        full_name: 'Max Oudshoorn',
        is_active: false,
        url_name: '_',
        orcid_id: '',
      },
      {
        id: 9126724,
        full_name: 'Pavlo Bazilinskyy',
        is_active: true,
        url_name: 'Pavlo_Bazilinskyy',
        orcid_id: '0000-0001-9565-8240',
      },
    ],
    figshare_url:
      'https://data.example.com/articles/dataset/Supplementary_data_for_the_paper_Bio-inspired_intent_communication_for_automated_vehicles_/14096067',
    description: 'Various external human-machine interfaces',
    funding:
      'This research is supported by grant 016.Vidi.178.047 (“How should automated vehicles communicate with other road users?”), which is financed by the Atlantis Organisation for Scientific Research (NWO).',
    funding_list: [
      {
        id: 19685199,
        title:
          'This research is supported by grant 016.Vidi.178.047 (“How should automated vehicles communicate with other road users?”), which is financed by the Atlantis Organisation for Scientific Research (NWO).',
        grant_code: '',
        funder_name: null,
        is_user_defined: 1,
      },
    ],
    version: 1,
    status: 'public',
    size: 231462586,
    created_date: '2021-04-20T11:36:53Z',
    modified_date: '2021-04-20T11:36:56Z',
    is_public: true,
    is_confidential: false,
    is_metadata_record: false,
    confidential_reason: '',
    metadata_reason: '',
    license: {
      value: 2,
      name: 'CCO',
      url: 'https://creativecommons.org/publicdomain/zero/1.0/',
    },
    tags: ['Automated Vehicles', 'External Human-Machine Interface'],
    categories: [
      {
        id: 13632,
        title: 'Automotive Engineering',
        parent_id: 13630,
      },
      {
        id: 13455,
        title: 'Cognitive Sciences',
        parent_id: 13453,
      },
    ],
    references: [],
    has_linked_file: false,
    citation:
      'Oudshoorn, Max; de Winter, Joost; Bazilinskyy, Pavlo; Dodou, Dimitra (2021): Intent communication for automated vehicles. 4TU.ResearchData. Dataset. https://doi.org/10.4121/14096067.v1',
    is_embargoed: false,
    embargo_date: null,
    embargo_type: 'file',
    embargo_title: '',
    embargo_reason: '',
    embargo_options: [],
    id: 14096067,
    title: 'Intent communication for automated vehicles',
    doi: '10.4121/14096067.v1',
    handle: '',
    url: 'https://api.figshare.com/v2/articles/14096067',
    published_date: '2021-04-20T11:36:53Z',
    thumb: '',
    defined_type: 3,
    defined_type_name: 'dataset',
    group_id: 28586,
    url_private_api: 'https://api.figshare.com/v2/account/articles/14096067',
    url_public_api: 'https://api.figshare.com/v2/articles/14096067',
    url_private_html: 'https://figshare.com/account/articles/14096067',
    url_public_html:
      'https://data.example.com/articles/dataset/Supplementary_data_for_the_paper_Bio-inspired_intent_communication_for_automated_vehicles_/14096067',
    timeline: {
      posted: '2021-04-20T11:36:53',
      revision: '2021-04-20T11:36:53',
      submission: '2021-04-19T17:38:05',
      firstOnline: '2021-04-20T11:36:53',
    },
    resource_title: 'Bio-inspired intent communication for automated vehicles',
    resource_doi: '10.1016/j.trf.2021.03.021',
  };
  const resultGet: AxiosResponse = {
    data: responseSearchByFigShareId,
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

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [MongooseTestingModule.forRoot('FigshareImportService'), HttpModule],
      providers: [FigshareImportService],
    }).compile();
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    service = module.get(FigshareImportService);
    httpService = module.get(HttpService);
    awsStorageService = module.get(AwsStorageService);
    templateService = module.get(TemplateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should import deposit metadata from figshare', async () => {
    const spyStorage = jest.spyOn(awsStorageService, 'save').mockImplementation(undefined);
    jest.spyOn(templateService, 'findOne').mockReturnValue(
      firstValueFrom(
        of({
          name: 'test',
          template: '<p>test</p>',
        } as TemplateDocument)
      )
    );
    jest.spyOn(httpService, 'get').mockImplementation(() => of(resultGet));
    jest.spyOn(httpService, 'post').mockImplementation(() => of(resultPost));
    const importedDeposit = await service.importDeposit(deposit);
    expect(importedDeposit.title).toBe('Intent communication for automated vehicles');
    expect(importedDeposit.abstract).toBe('Various external human-machine interfaces');
    expect(importedDeposit.keywords).toContain('Automated Vehicles');
    expect(importedDeposit.keywords).toContain('External Human-Machine Interface');
    expect(importedDeposit.doi).toBe('10.4121/14096067.v1');
    expect(importedDeposit.publicationType).toBe(PublicationType.dataset);
    expect(importedDeposit.accessRight).toBe(AccessRight.CC0);
    expect(importedDeposit.authors.length).toBe(2);
    const arrayExpected = [
      { credit: [], institutions: [], firstName: 'Max', lastName: 'Oudshoorn' },
      {
        credit: [],
        institutions: [],
        firstName: 'Pavlo',
        lastName: 'Bazilinskyy',
        orcid: 'https://orcid.org/0000-0001-9565-8240',
      },
    ];
    expect(importedDeposit.authors).toContainEqual(expect.objectContaining(arrayExpected[0]));
    expect(importedDeposit.authors).toContainEqual(expect.objectContaining(arrayExpected[1]));

    expect(spyStorage).not.toHaveBeenCalled();
  });

  it('should generate license', async () => {
    let res = service.generateLicenseFromLicenseField({
      name: 'CCBYND',
      url: 'https://test.test',
      value: 2,
    });
    expect(res).toBe(AccessRight.CCBYND);

    res = service.generateLicenseFromLicenseField({
      name: 'cc',
      url: 'https://test.test',
      value: 2,
    });
    expect(res).toBe(AccessRight.CC0);
  });

  it('should generate type from metadata', async () => {
    let res = service.generateTypeFromMetaData('book');
    expect(res).toBe(PublicationType.book);
    res = service.generateTypeFromMetaData('test-article');
    expect(res).toBe(PublicationType.article);
  });
});
