import { Test, TestingModule } from '@nestjs/testing';
import { IthenticateService } from './ithenticate.service';
import { AxiosResponse } from 'axios';
import { HttpModule } from '@nestjs/axios';
import {
  factoryCommunity,
  factoryDepositDocumentDefinition,
  factoryUser,
} from '../utils/test-data';
import { assertIsDefined, encryptJson, generateObjectId } from '../utils/utils';
import { AwsStorageService } from '../common/aws-storage-service/aws-storage.service';
import { EulaAcceptListItem, SimpleSubmissionResponseStatusEnum } from '@orvium/ithenticate-client';
import { DepositService, PopulatedDepositDocument } from '../deposit/deposit.service';
import { MongooseTestingModule } from '../utils/mongoose-testing.module';
import { UserService } from '../users/user.service';

describe('IthenticateService', () => {
  let service: IthenticateService;
  let awsStorageService: AwsStorageService;
  let depositService: DepositService;
  let userService: UserService;

  const community = factoryCommunity.build({ iThenticateAPIKey: encryptJson('test') });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule, MongooseTestingModule.forRoot('ithenticateService')],
      providers: [IthenticateService],
    }).compile();

    service = module.get(IthenticateService);
    awsStorageService = module.get(AwsStorageService);

    depositService = module.get(DepositService);
    await depositService.depositModel.deleteMany();
    userService = module.get(UserService);
    await userService.userModel.deleteMany();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should get EULA', async () => {
    const response: AxiosResponse = {
      data: {
        url: 'https://static.turnitin.com/eula/v1beta/en-us/eula.html',
        valid_from: '2018-04-30T17:00:00Z',
        valid_until: null,
        version: 'v1beta',
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    } as AxiosResponse;
    jest
      .spyOn(service.eulaApi, 'eulaVersionIdGet')
      .mockImplementation(async () => Promise.resolve(response));

    assertIsDefined(community.iThenticateAPIKey);
    const EULA = await service.getEULA(community.iThenticateAPIKey);
    expect(EULA).toEqual({
      url: 'https://static.turnitin.com/eula/v1beta/en-us/eula.html',
      valid_from: '2018-04-30T17:00:00Z',
      valid_until: null,
      version: 'v1beta',
    });
  });

  it('should accept EULA', async () => {
    const userObjectId = generateObjectId();
    const date = Date.now().toString();
    const response: AxiosResponse<EulaAcceptListItem> = {
      data: {
        user_id: userObjectId,
        accepted_timestamp: date,
        version: '1',
        language: 'en-US',
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    } as AxiosResponse;
    jest
      .spyOn(service.eulaApi, 'eulaVersionIdAcceptPost')
      .mockImplementation(async () => Promise.resolve(response));
    assertIsDefined(community.iThenticateAPIKey);
    const acceptance = await service.acceptEULA(
      userObjectId,
      community.iThenticateAPIKey,
      'v1beta'
    );
    expect(acceptance).toEqual({
      user_id: userObjectId,
      accepted_timestamp: date,
      version: '1',
      language: 'en-US',
    });
  });

  it('should get EULA acceptance', async () => {
    const response: AxiosResponse = {
      data: {
        accepted_timestamp: '2018-05-05T04:11:11-07:00',
        version: 'v1beta',
        user_id: 'userid1',
        language: 'en-US',
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    } as AxiosResponse;
    jest
      .spyOn(service.eulaApi, 'eulaVersionIdAcceptUserIdGet')
      .mockImplementation(async () => Promise.resolve(response));
    assertIsDefined(community.iThenticateAPIKey);
    const acceptance = await service.getEULAAcceptance('id', community.iThenticateAPIKey);
    expect(acceptance).toEqual({
      accepted_timestamp: '2018-05-05T04:11:11-07:00',
      version: 'v1beta',
      user_id: 'userid1',
      language: 'en-US',
    });
  });

  it('should create submission', async () => {
    const user = await userService.userModel.create(factoryUser.build());
    const deposit = factoryDepositDocumentDefinition.build();
    const response: AxiosResponse = {
      data: {
        id: 'id',
        title: 'title',
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    } as AxiosResponse;
    const responseEULA: AxiosResponse = {
      data: [
        {
          accepted_timestamp: '2018-05-05T04:11:11-07:00',
          version: 'v1beta',
          user_id: 'userid1',
          language: 'en-US',
        },
      ],
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    } as AxiosResponse;
    jest
      .spyOn(service.submissionApi, 'createSubmission')
      .mockImplementation(async () => Promise.resolve(response));
    jest
      .spyOn(service.eulaApi, 'eulaVersionIdAcceptUserIdGet')
      .mockImplementation(async () => Promise.resolve(responseEULA));

    const depositNotPopulated = await depositService.depositModel.create(deposit);
    const depositDocument = (await depositService.findById(
      depositNotPopulated._id
    )) as PopulatedDepositDocument;

    assertIsDefined(community.iThenticateAPIKey);
    const id = await service.createSubmission(depositDocument, community.iThenticateAPIKey, user);
    expect(id).toEqual({
      id: 'id',
      title: 'title',
    });
  });

  it('should upload file to submission', async () => {
    const deposit = factoryDepositDocumentDefinition.build({
      iThenticate: {
        submissionId: 'id',
        submissionStatus: SimpleSubmissionResponseStatusEnum.Complete,
        similarityReportStatus: 'COMPLETE',
      },
      publicationFile: {
        filename: 'filename',
      },
    });
    const response: AxiosResponse = {
      data: {
        message: 'success',
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    } as AxiosResponse;

    const depositNotPopulated = await depositService.depositModel.create(deposit);
    const depositDocument = await depositService.findById(depositNotPopulated._id);
    assertIsDefined(depositDocument);

    jest
      .spyOn(service.submissionApi, 'uploadSubmittedFile')
      .mockImplementation(async () => Promise.resolve(response));
    jest.spyOn(awsStorageService, 'get').mockResolvedValue({} as never);
    let result;
    assertIsDefined(community.iThenticateAPIKey);
    if (deposit.publicationFile?.filename) {
      result = await service.uploadFileToSubmission(
        'id',
        {
          id: depositDocument._id.toHexString(),
          publication: { filename: deposit.publicationFile?.filename },
        },
        community.iThenticateAPIKey
      );
    }
    expect(result).toEqual({ message: 'success' });
  });

  it('should generate similarity report', async () => {
    const response: AxiosResponse = {
      data: {
        message: 'success',
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    } as AxiosResponse;
    jest
      .spyOn(service.similarityApi, 'requestSimilarityReport')
      .mockImplementation(async () => Promise.resolve(response));
    assertIsDefined(community.iThenticateAPIKey);
    const result = await service.generateSimilarityReport('id', community.iThenticateAPIKey);
    expect(result).toEqual({ message: 'success' });
  });

  it('should get similarity report', async () => {
    const response: AxiosResponse = {
      data: {
        submission_id: 'e884f478-9757-41c7-80da-37b94ebb2838',
        overall_match_percentage: 15,
        internet_match_percentage: 12,
        publication_match_percentage: 10,
        time_requested: '2017-11-06T19:14:31.828Z',
        time_generated: '2017-11-06T19:14:45.993Z',
        top_source_largest_matched_word_count: 193,
        top_matches: [
          {
            percentage: 100.0,
            submission_id: '883fbb3a-2825-4a2a-8d24-d52e40673772',
            source_type: 'SUBMITTED_WORK',
            matched_word_count_total: 598,
            submitted_date: '2021-05-05',
            institution_name: 'Tii Auto TCA Platinum Test Tenant',
            name: 'Tii Auto TCA Platinum Test Tenant on 2021-05-05',
          },
        ],
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    } as AxiosResponse;

    jest
      .spyOn(service.similarityApi, 'getSimilarityReportResults')
      .mockImplementation(async () => Promise.resolve(response));
    assertIsDefined(community.iThenticateAPIKey);
    const result = await service.getSimilarityReport('id', community.iThenticateAPIKey);
    expect(result).toEqual({
      submission_id: 'e884f478-9757-41c7-80da-37b94ebb2838',
      overall_match_percentage: 15,
      internet_match_percentage: 12,
      publication_match_percentage: 10,
      time_requested: '2017-11-06T19:14:31.828Z',
      time_generated: '2017-11-06T19:14:45.993Z',
      top_source_largest_matched_word_count: 193,
      top_matches: [
        {
          percentage: 100.0,
          submission_id: '883fbb3a-2825-4a2a-8d24-d52e40673772',
          source_type: 'SUBMITTED_WORK',
          matched_word_count_total: 598,
          submitted_date: '2021-05-05',
          institution_name: 'Tii Auto TCA Platinum Test Tenant',
          name: 'Tii Auto TCA Platinum Test Tenant on 2021-05-05',
        },
      ],
    });
  });

  it('should get similarity report URL', async () => {
    const response: AxiosResponse = {
      data: {
        submission_id: 'e884f478-9757-41c7-80da-37b94ebb2838',
        overall_match_percentage: 15,
        internet_match_percentage: 12,
        publication_match_percentage: 10,
        time_requested: '2017-11-06T19:14:31.828Z',
        time_generated: '2017-11-06T19:14:45.993Z',
        top_source_largest_matched_word_count: 193,
        top_matches: [
          {
            percentage: 100.0,
            submission_id: '883fbb3a-2825-4a2a-8d24-d52e40673772',
            source_type: 'SUBMITTED_WORK',
            matched_word_count_total: 598,
            submitted_date: '2021-05-05',
            institution_name: 'Tii Auto TCA Platinum Test Tenant',
            name: 'Tii Auto TCA Platinum Test Tenant on 2021-05-05',
          },
        ],
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    } as AxiosResponse;

    jest
      .spyOn(service.similarityApi, 'getSimilarityReportUrl')
      .mockImplementation(async () => Promise.resolve(response));
    assertIsDefined(community.iThenticateAPIKey);
    const result = await service.getSimilarityReportUrl('id', community.iThenticateAPIKey, 'id');
    expect(result).toEqual({
      submission_id: 'e884f478-9757-41c7-80da-37b94ebb2838',
      overall_match_percentage: 15,
      internet_match_percentage: 12,
      publication_match_percentage: 10,
      time_requested: '2017-11-06T19:14:31.828Z',
      time_generated: '2017-11-06T19:14:45.993Z',
      top_source_largest_matched_word_count: 193,
      top_matches: [
        {
          percentage: 100.0,
          submission_id: '883fbb3a-2825-4a2a-8d24-d52e40673772',
          source_type: 'SUBMITTED_WORK',
          matched_word_count_total: 598,
          submitted_date: '2021-05-05',
          institution_name: 'Tii Auto TCA Platinum Test Tenant',
          name: 'Tii Auto TCA Platinum Test Tenant on 2021-05-05',
        },
      ],
    });
  });

  it('should get features enabled', async () => {
    const response: AxiosResponse = {
      data: {
        message: 'success',
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    } as AxiosResponse;

    jest
      .spyOn(service.featuresApi, 'featuresEnabledGet')
      .mockImplementation(async () => Promise.resolve(response));
    assertIsDefined(community.iThenticateAPIKey);
    const result = await service.getFeaturesEnabled(community.iThenticateAPIKey);
    expect(result).toEqual({ message: 'success' });
  });

  it('should get EULA HTML', async () => {
    const response: AxiosResponse = {
      data: {
        message: 'success',
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    } as AxiosResponse;

    jest
      .spyOn(service.eulaApi, 'eulaVersionIdViewGet')
      .mockImplementation(async () => Promise.resolve(response));
    assertIsDefined(community.iThenticateAPIKey);
    const result = await service.getEULAHTML(community.iThenticateAPIKey);
    expect(result).toEqual({ message: 'success' });
  });

  it('should get submission info', async () => {
    const response: AxiosResponse = {
      data: {
        message: 'success',
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    } as AxiosResponse;

    jest
      .spyOn(service.submissionApi, 'getSubmiddionDetails')
      .mockImplementation(async () => Promise.resolve(response));
    assertIsDefined(community.iThenticateAPIKey);
    const result = await service.infoSubmission('submissionId', community.iThenticateAPIKey);
    expect(result).toEqual({ message: 'success' });
  });

  it('should create webhook', async () => {
    const response: AxiosResponse = {
      data: {
        message: 'success',
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    } as AxiosResponse;

    jest
      .spyOn(service.webhookApi, 'webhooksPost')
      .mockImplementation(async () => Promise.resolve(response));
    assertIsDefined(community.iThenticateAPIKey);
    const result = await service.createWebhook(community.iThenticateAPIKey);
    expect(result).toEqual({ message: 'success' });
  });

  it('should delete webhook', async () => {
    const response: AxiosResponse = {
      data: {
        message: 'success',
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    } as AxiosResponse;

    jest
      .spyOn(service.webhookApi, 'deleteWebhook')
      .mockImplementation(async () => Promise.resolve(response));
    assertIsDefined(community.iThenticateAPIKey);
    const result = await service.deleteWebhook('id', community.iThenticateAPIKey);
    //should not return anything
    expect(result).not.toEqual({ message: 'success' });
  });

  it('should list webhooks', async () => {
    const response: AxiosResponse = {
      data: {
        message: 'success',
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    } as AxiosResponse;

    jest
      .spyOn(service.webhookApi, 'webhooksGet')
      .mockImplementation(async () => Promise.resolve(response));
    assertIsDefined(community.iThenticateAPIKey);
    const result = await service.listWebhooks(community.iThenticateAPIKey);
    expect(result).toEqual({ message: 'success' });
  });
});
