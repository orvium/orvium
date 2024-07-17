import { Test, TestingModule } from '@nestjs/testing';
import { DepositService } from '../deposit/deposit.service';
import { UserService } from '../users/user.service';
import { UserDocument } from '../users/user.schema';
import {
  factoryCommunity,
  factoryDepositDocumentDefinition,
  factoryUser,
} from '../utils/test-data';
import { request } from 'express';
import { IthenticateService } from './ithenticate.service';
import { HttpModule } from '@nestjs/axios';
import { IthenticateController } from './ithenticate.controller';
import { CommunitiesService, CommunityDocumentPopulated } from '../communities/communities.service';
import { ModeratorRole } from '../communities/communities-moderator.schema';
import { assertIsDefined } from '../utils/utils';
import {
  SimpleSubmissionResponseStatusEnum,
  WebhookEventTypesEnum,
} from '@orvium/ithenticate-client';
import { cleanCollections, MongooseTestingModule } from '../utils/mongoose-testing.module';

describe('iThenticate Controller', () => {
  let controller: IthenticateController;
  let ithenticateService: IthenticateService;
  let communitiesService: CommunitiesService;
  let depositService: DepositService;
  let userService: UserService;
  let communityDocument: CommunityDocumentPopulated;
  let userDocument1: UserDocument;

  const community = factoryCommunity.build({
    iThenticateAPIKey: 'key',
    iThenticateEULANeeded: true,
    iThenticateWebhook: 'id',
  });

  const depositDefinition = factoryDepositDocumentDefinition.build({
    publicationFile: { filename: 'filename' },
    iThenticate: {
      submissionId: 'submissionId',
    },
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IthenticateController],
      imports: [MongooseTestingModule.forRoot('ithenticateController'), HttpModule],
      providers: [IthenticateService],
    }).compile();

    controller = module.get(IthenticateController);
    communitiesService = module.get(CommunitiesService);
    depositService = module.get(DepositService);
    userService = module.get(UserService);
    ithenticateService = module.get(IthenticateService);
    await cleanCollections(module);

    await communitiesService.communityModel.insertMany([community]);
    communityDocument = (await communitiesService.findOneByFilter({
      name: community.name,
    })) as CommunityDocumentPopulated;

    userDocument1 = await userService.userModel.create(factoryUser.build());

    await depositService.depositModel.insertMany([depositDefinition]);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get iThenticate EULA', async () => {
    await communitiesService.addModerator(
      communityDocument,
      userDocument1,
      ModeratorRole.moderator
    );
    jest.spyOn(ithenticateService, 'getEULA').mockResolvedValue({
      version: 'v1beta',
      url: '',
    });
    expect(
      await controller.getIThenticateEULA(
        { user: { sub: userDocument1.userId } } as unknown as typeof request,
        communityDocument._id.toHexString()
      )
    ).toEqual({
      version: 'v1beta',
      url: '',
    });
  });

  it('should get iThenticate EULA HTML', async () => {
    await communitiesService.addModerator(
      communityDocument,
      userDocument1,
      ModeratorRole.moderator
    );
    jest.spyOn(ithenticateService, 'getEULAHTML').mockResolvedValue('<test>');
    expect(
      await controller.getIThenticateEULAHTML(
        { user: { sub: userDocument1.userId } } as unknown as typeof request,
        communityDocument._id.toHexString()
      )
    ).toEqual({ html: '<test>' });
  });

  it('should accept iThenticate EULA', async () => {
    await communitiesService.addModerator(
      communityDocument,
      userDocument1,
      ModeratorRole.moderator
    );

    jest.spyOn(ithenticateService, 'acceptEULA').mockResolvedValue({
      user_id: 'id',
      accepted_timestamp: '0',
      version: 'v1beta',
    });
    expect(
      await controller.acceptIThenticateEULA(
        { user: { sub: userDocument1.userId } } as unknown as typeof request,
        communityDocument._id.toHexString(),
        'v1beta'
      )
    ).toEqual({
      user_id: 'id',
      accepted_timestamp: '0',
      version: 'v1beta',
    });
  });

  it('should get iThenticate EULA acceptance', async () => {
    jest.spyOn(ithenticateService, 'getEULAAcceptance').mockResolvedValue([
      {
        user_id: 'id',
        accepted_timestamp: '0',
        version: 'v1beta',
      },
    ]);
    await communitiesService.addModerator(
      communityDocument,
      userDocument1,
      ModeratorRole.moderator
    );

    expect(
      await controller.getIThenticateEULAAcceptance(
        { user: { sub: userDocument1.userId } } as unknown as typeof request,
        communityDocument._id.toHexString()
      )
    ).toEqual([
      {
        user_id: 'id',
        accepted_timestamp: '0',
        version: 'v1beta',
      },
    ]);
  });

  it('should create iThenticate submission', async () => {
    await communitiesService.addModerator(
      communityDocument,
      userDocument1,
      ModeratorRole.moderator
    );

    jest.spyOn(ithenticateService, 'createSubmission').mockResolvedValue({
      id: 'id',
      title: 'title',
    });

    const deposit = await depositService.findOne({
      title: depositDefinition.title,
      abstract: depositDefinition.abstract,
    });
    assertIsDefined(deposit);

    expect(
      await controller.createIThenticateSubmission(
        { user: { sub: userDocument1.userId } } as unknown as typeof request,
        { depositId: deposit._id.toHexString() },
        communityDocument._id.toHexString()
      )
    ).toEqual({
      id: 'id',
      title: 'title',
    });
  });

  it('should get iThenticate submission info', async () => {
    await communitiesService.addModerator(
      communityDocument,
      userDocument1,
      ModeratorRole.moderator
    );
    const deposit = await depositService.create(
      factoryDepositDocumentDefinition.build({
        iThenticate: {
          submissionId: 'test',
        },
      })
    );

    jest.spyOn(ithenticateService, 'infoSubmission').mockResolvedValue({
      owner: 'test',
      title: 'test',
    });

    expect(
      await controller.getIThenticateSubmissionInfo(
        { user: { sub: userDocument1.userId } } as unknown as typeof request,
        communityDocument._id.toHexString(),
        deposit._id.toHexString()
      )
    ).toEqual({
      owner: 'test',
      title: 'test',
    });
  });

  it('should get iThenticate status', async () => {
    await communitiesService.addModerator(
      communityDocument,
      userDocument1,
      ModeratorRole.moderator
    );

    jest.spyOn(ithenticateService, 'webhookInfo').mockResolvedValue({
      id: 'test',
      url: 'test',
      event_types: [WebhookEventTypesEnum.PdfStatus],
    });

    expect(
      await controller.getIThenticateStatus(
        { user: { sub: userDocument1.userId } } as unknown as typeof request,
        communityDocument._id.toHexString()
      )
    ).toEqual({
      active: true,
    });
  });

  it('should setup iThenticate', async () => {
    const community2 = factoryCommunity.build({
      name: 'testName',
      iThenticateEULANeeded: true,
    });
    await communitiesService.communityModel.insertMany([community2]);

    const communityDocument2 = (await communitiesService.findOneByFilter({
      name: community2.name,
    })) as CommunityDocumentPopulated;
    await communitiesService.addModerator(
      communityDocument2,
      userDocument1,
      ModeratorRole.moderator
    );

    jest.spyOn(ithenticateService, 'webhookInfo').mockResolvedValue({
      id: 'test',
      url: 'test',
      event_types: [WebhookEventTypesEnum.PdfStatus],
    });

    jest.spyOn(ithenticateService, 'getFeaturesEnabled').mockResolvedValue({
      tenant: {
        require_eula: true,
      },
    });

    jest.spyOn(ithenticateService, 'listWebhooks').mockResolvedValue([
      {
        id: 'test',
        url: 'test',
        event_types: [WebhookEventTypesEnum.PdfStatus],
      },
    ]);

    expect(
      await controller.setupIThenticate(
        { user: { sub: userDocument1.userId } } as unknown as typeof request,
        {
          key: 'test',
          communityId: communityDocument2._id.toHexString(),
        }
      )
    ).toBeInstanceOf(Object);
  });

  it('should upload file to submission', async () => {
    await communitiesService.addModerator(
      communityDocument,
      userDocument1,
      ModeratorRole.moderator
    );

    jest.spyOn(ithenticateService, 'uploadFileToSubmission').mockResolvedValue({
      message: 'test',
    });

    const deposit = await depositService.findOne({
      title: depositDefinition.title,
      abstract: depositDefinition.abstract,
    });
    assertIsDefined(deposit);

    expect(
      await controller.uploadFileToSubmission(
        { user: { sub: userDocument1.userId } } as unknown as typeof request,
        communityDocument._id.toHexString(),
        'submissionId',
        { depositId: deposit._id.toHexString() }
      )
    ).toEqual({
      message: 'test',
    });
  });

  it('should generate similarity report', async () => {
    await communitiesService.addModerator(
      communityDocument,
      userDocument1,
      ModeratorRole.moderator
    );

    jest.spyOn(ithenticateService, 'generateSimilarityReport').mockResolvedValue({
      message: 'test',
    });

    expect(
      await controller.generateSimilarityReport(
        { user: { sub: userDocument1.userId } } as unknown as typeof request,
        communityDocument._id.toHexString(),
        'submissionId'
      )
    ).toEqual({
      message: 'test',
    });
  });

  it('should get similarity report results', async () => {
    await communitiesService.addModerator(
      communityDocument,
      userDocument1,
      ModeratorRole.moderator
    );

    jest.spyOn(ithenticateService, 'getSimilarityReport').mockResolvedValue({
      overall_match_percentage: 0,
      submission_id: 'id',
      time_generated: '0',
      top_matches: [],
      top_source_largest_matched_word_count: 0,
      time_requested: '0',
      status: '',
    });

    const deposit = await depositService.findOne({
      title: depositDefinition.title,
      abstract: depositDefinition.abstract,
    });
    assertIsDefined(deposit);

    expect(
      await controller.getIThenticateReport(
        { user: { sub: userDocument1.userId } } as unknown as typeof request,
        communityDocument._id.toHexString(),
        deposit._id.toHexString()
      )
    ).toEqual({
      overall_match_percentage: 0,
      submission_id: 'id',
      time_generated: '0',
      top_matches: [],
      top_source_largest_matched_word_count: 0,
      time_requested: '0',
      status: '',
    });
  });

  it('should get similarity report results URL', async () => {
    await communitiesService.addModerator(
      communityDocument,
      userDocument1,
      ModeratorRole.moderator
    );

    jest.spyOn(ithenticateService, 'getSimilarityReportUrl').mockResolvedValue({
      viewer_url: '',
    });
    expect(
      await controller.getSimilarityReportURL(
        { user: { sub: userDocument1.userId } } as unknown as typeof request,
        communityDocument._id.toHexString(),
        'submissionId'
      )
    ).toEqual({
      viewer_url: '',
    });
  });

  it('should test webhook', async () => {
    await controller.webhookEvent(JSON.stringify({ test: 'test' }));

    let deposit = await depositService.findOne({
      title: depositDefinition.title,
      abstract: depositDefinition.abstract,
    });
    assertIsDefined(deposit);

    expect(deposit.iThenticate?.submissionStatus).not.toEqual(
      SimpleSubmissionResponseStatusEnum.Complete
    );

    await controller.webhookEvent(JSON.stringify({ id: 'submissionId' }));

    deposit = await depositService.findOne({
      title: deposit.title,
      abstract: deposit.abstract,
    });
    assertIsDefined(deposit);

    expect(deposit.iThenticate?.submissionStatus).toEqual(
      SimpleSubmissionResponseStatusEnum.Complete
    );
  });
});
