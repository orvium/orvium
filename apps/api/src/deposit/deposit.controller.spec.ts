import { Test, TestingModule } from '@nestjs/testing';
import { DepositController } from './deposit.controller';
import { AwsStorageService } from '../common/aws-storage-service/aws-storage.service';
import { DepositService } from './deposit.service';
import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Logger,
  NotFoundException,
  NotImplementedException,
  UnauthorizedException,
} from '@nestjs/common';
import { DepositImportService } from './deposit-import.service';
import { AcceptedFor, DepositStatus, PublicationType } from './deposit.schema';
import { EventService } from '../event/event.service';
import {
  createAdmin,
  createCommunity,
  createDeposit,
  createDepositSet,
  createReview,
  createUser,
  factoryAuthor,
  factoryFileMetadata,
} from '../utils/test-data';
import { request, response } from 'express';
import { FileMetadata } from '../dtos/filemetadata.dto';
import { HttpModule } from '@nestjs/axios';
import { cleanCollections, MongooseTestingModule } from '../utils/mongoose-testing.module';
import { CreateDepositDTO } from '../dtos/deposit/create-deposit.dto';
import { assertIsDefined, CROSSREF_ENDPOINT, generateObjectId, getMd5Hash } from '../utils/utils';
import { extname } from 'path';
import { AppFile, CreateFileDTO } from '../dtos/create-file.dto';
import { UpdateDepositDTO } from '../dtos/deposit/update-deposit.dto';
import { Citation } from '../dtos/citation.dto';
import { CreateDepositWithDoiDTO } from '../dtos/deposit/create-deposit-with-doi.dto';
import { CommunityType } from '../communities/communities.schema';
import { DATACITE_ENDPOINT, DataciteService } from '../datacite/datacite.service';
import { CrossrefService } from '../crossref/crossref.service';
import { AuthorDTO } from '../dtos/author.dto';
import { plainToClass } from 'class-transformer';
import { GetDepositsQueryParams } from '../dtos/deposit/get-deposits-queryparams.dto';

jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/s3-request-presigner');

describe('DepositController', () => {
  let controller: DepositController;
  let depositService: DepositService;
  let depositImportService: DepositImportService;
  let awsStorageService: AwsStorageService;
  let eventService: EventService;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [MongooseTestingModule.forRoot('DepositController'), HttpModule],
      providers: [],
      controllers: [DepositController],
    }).compile();

    controller = module.get(DepositController);
    depositService = module.get(DepositService);
    depositImportService = module.get(DepositImportService);
    awsStorageService = module.get(AwsStorageService);
    eventService = module.get(EventService);
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    await cleanCollections(module);
  });

  describe('General Tests', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    it('should create a deposit', async () => {
      const { community } = await createCommunity(module);
      const { community: journal } = await createCommunity(module, {
        community: { type: CommunityType.journal },
      });
      const { community: conference } = await createCommunity(module, {
        community: { type: CommunityType.conference, issn: undefined },
      });

      const author = await createUser(module);

      const deposit = await controller.createDeposit(
        { user: { sub: author.userId } } as unknown as typeof request,
        {
          title: 'My new deposit',
          community: community._id.toHexString(),
        }
      );
      expect(deposit.creator).toStrictEqual(author._id.toHexString());
      expect(deposit.title).toBe('My new deposit');
      const exist = await depositService.exists({ title: 'My new deposit' });
      expect(exist).toBeTruthy();

      const depositJournal = await controller.createDeposit(
        { user: { sub: author.userId } } as unknown as typeof request,
        {
          title: 'My journal paper',
          community: journal._id.toHexString(),
        }
      );
      expect(depositJournal.extraMetadata.journalTitle).toBe(journal.name);

      const depositConference = await controller.createDeposit(
        { user: { sub: author.userId } } as unknown as typeof request,
        {
          title: 'My conference paper',
          community: conference._id.toHexString(),
        }
      );
      expect(depositConference.extraMetadata.conferenceTitle).toBe(conference.name);
      expect(depositConference.extraMetadata.issn).toBe(undefined);
    });

    it('should raise exception when user not exist', async () => {
      const createDepositDTO: CreateDepositDTO = {
        title: 'My new deposit',
        community: '41224d776a326fb40f000001',
      };
      await expect(
        controller.createDeposit(
          { user: { sub: 'xxx' } } as unknown as typeof request,
          createDepositDTO
        )
      ).rejects.toThrow(NotFoundException);
    });

    it('should raise exception when user can not create deposits', async () => {
      const { community } = await createCommunity(module);
      const incompleteUser = await createUser(module, { user: { isOnboarded: false } });

      const createDepositDTO: CreateDepositDTO = {
        title: 'My new deposit',
        community: community._id.toHexString(),
      };
      await expect(
        controller.createDeposit(
          { user: { sub: incompleteUser.userId } } as unknown as typeof request,
          createDepositDTO
        )
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should create a deposit with DOI', async () => {
      const author = await createUser(module);
      const { community } = await createCommunity(module);
      const { deposit } = await createDeposit(module, { community });

      const spy = jest.spyOn(depositImportService, 'importDeposit').mockResolvedValue(deposit);
      const createDepositWithDoiDTO: CreateDepositWithDoiDTO = {
        doi: '10.1093/ajae/aaq063',
        community: community._id.toHexString(),
      };
      await controller.createWithDOI(
        { user: { sub: author.userId } } as unknown as typeof request,
        createDepositWithDoiDTO
      );
      assertIsDefined(createDepositWithDoiDTO.doi, 'doi is not defined');
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          title: `Publication with DOI: ${createDepositWithDoiDTO.doi}`,
          doi: createDepositWithDoiDTO.doi,
        })
      );
    });

    it('should raise exception when doi it is not provide it', async () => {
      const author = await createUser(module);
      const { community } = await createCommunity(module);
      const createDepositWithDoiDTO: CreateDepositWithDoiDTO = {
        community: community._id.toHexString(),
        doi: '',
      };
      await expect(
        controller.createWithDOI(
          { user: { sub: author.userId } } as unknown as typeof request,
          createDepositWithDoiDTO
        )
      ).rejects.toThrow(NotFoundException);
    });

    it('should fail createWithDOI when user not exist', async () => {
      const { community } = await createCommunity(module);
      const createDepositWithDoiDTO: CreateDepositWithDoiDTO = {
        doi: '10.1093/ajae/aaq063',
        community: community._id.toHexString(),
      };
      await expect(
        controller.createWithDOI(
          { user: { sub: 'xxx' } } as unknown as typeof request,
          createDepositWithDoiDTO
        )
      ).rejects.toThrow(NotFoundException);
    });

    it('should fail createWithDOI when user can not create deposits', async () => {
      const { community } = await createCommunity(module);
      const incompleteUser = await createUser(module, { user: { isOnboarded: false } });

      const createDepositWithDoiDTO: CreateDepositWithDoiDTO = {
        doi: '10.1093/ajae/aaq063',
        community: community._id.toHexString(),
      };
      await expect(
        controller.createWithDOI(
          { user: { sub: incompleteUser.userId } } as unknown as typeof request,
          createDepositWithDoiDTO
        )
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should create a revision', async () => {
      jest.spyOn(awsStorageService, 'copyRecursiveS3').mockImplementation();
      const { community } = await createCommunity(module);
      const { deposit: published, author } = await createDeposit(module, {
        community,
        deposit: {
          status: DepositStatus.published,
        },
      });
      const deposit = await controller.createDepositRevision(
        { user: { sub: author.userId } } as unknown as typeof request,
        published._id.toHexString()
      );
      expect(deposit.creator).toStrictEqual(author._id.toHexString());
      expect(deposit.title).toBe(published.title);
      expect(deposit.version).toBe(2);
      const exist = await depositService.exists({
        title: published.title,
        version: 2,
      });
      expect(exist).toBeTruthy();
    });

    it('should merge deposits', async () => {
      const { community, moderator } = await createCommunity(module);
      const { deposit: depositV1, author } = await createDeposit(module, {
        community,
        deposit: {
          status: DepositStatus.published,
        },
      });
      const { deposit: depositV2 } = await createDeposit(module, {
        community,
        deposit: {
          status: DepositStatus.published,
          parent: depositV1.parent,
          version: 2,
          pdfUrl: 'revised.pdf',
        },
        author: author,
      });

      const spycopyRecursiveS3 = jest
        .spyOn(awsStorageService, 'copyRecursiveS3')
        .mockImplementation();
      const depositMerged = await controller.mergeRevisions(
        { user: { sub: moderator.userId } } as unknown as typeof request,
        depositV2._id.toHexString()
      );
      expect(spycopyRecursiveS3).toHaveBeenCalled();
      const depositv1Populated = await depositService.findOne({ _id: depositV1._id });
      assertIsDefined(depositv1Populated);
      expect(depositv1Populated.pdfUrl).toBe('revised.pdf');
      expect(depositMerged.status).toBe(DepositStatus.merged);
    });

    it('should raise exception when already exists a new version', async () => {
      jest.spyOn(awsStorageService, 'copyRecursiveS3').mockImplementation();
      const { community } = await createCommunity(module);
      const { deposit, author } = await createDeposit(module, {
        community,
        deposit: {
          status: DepositStatus.published,
        },
      });
      const depositV2 = await controller.createDepositRevision(
        { user: { sub: author.userId } } as unknown as typeof request,
        deposit._id.toHexString()
      );
      assertIsDefined(depositV2);
      await expect(
        controller.createDepositRevision(
          { user: { sub: author.userId } } as unknown as typeof request,
          deposit._id.toHexString()
        )
      ).rejects.toMatchObject(
        new UnauthorizedException('There is already a new version created for this publication')
      );
    });

    it('should get top disciplines', async () => {
      const { community } = await createCommunity(module);
      await createDeposit(module, {
        community,
        deposit: { disciplines: ['blockchain', 'angular'] },
      });
      await createDeposit(module, { community, deposit: { disciplines: ['angular', 'nest'] } });

      const disciplines = await controller.getTopDisciplines();
      expect(disciplines.length).toBe(3);
      expect(disciplines[0]).toStrictEqual({ _id: 'angular', count: 2 });
    });

    it('should get user deposits', async () => {
      const { community, moderator } = await createCommunity(module);
      const { author } = await createDeposit(module, { community });
      await createDeposit(module, { community, author: author });
      await createDeposit(module, {
        community,
        author: moderator,
        deposit: {
          authors: [factoryAuthor.build({ userId: author.userId })],
        },
      });

      const result = await controller.getMyDeposits({
        user: { sub: author.userId },
      } as unknown as typeof request);

      // 2 own publications + 1 coauthor publication
      expect(result.length).toBe(3);
      expect(result[0].creator).toStrictEqual(moderator._id.toHexString());
      expect(result[0].authors[0].userId).toStrictEqual(author.userId);
      expect(result[1].creator).toStrictEqual(author._id.toHexString());
      expect(result[2].creator).toStrictEqual(author._id.toHexString());
    });

    it('should get user starred deposits', async () => {
      const { community } = await createCommunity(module);
      const { deposit } = await createDeposit(module, { community });
      const user = await createUser(module);
      user.starredDeposits = [deposit._id.toHexString()];
      await user.save();

      const result = await controller.getMyStarredDeposits({
        user: { sub: user.userId },
      } as unknown as typeof request);
      expect(result.length).toBe(1);
      expect(result[0].title).toBe(deposit.title);
    });

    it('should get deposit', async () => {
      const user = await createUser(module);
      const { community } = await createCommunity(module);
      const { deposit: published } = await createDeposit(module, {
        community,
        deposit: {
          status: DepositStatus.published,
        },
      });

      const result = await controller.getDeposit(
        { user: { sub: user.userId } } as unknown as typeof request,
        published._id.toHexString()
      );
      expect(result.title).toBe(published.title);
      expect(result._id).toStrictEqual(published._id.toHexString());
    });

    it('should raise exception when deposit not exist', async () => {
      const user = await createUser(module);
      await expect(
        controller.getDeposit(
          { user: { sub: user.userId } } as unknown as typeof request,
          generateObjectId()
        )
      ).rejects.toThrow(NotFoundException);
    });

    it('should get deposit versions', async () => {
      const spy = jest.spyOn(awsStorageService, 'copyRecursiveS3').mockImplementation();
      const { community } = await createCommunity(module);
      const { deposit: published, author } = await createDeposit(module, {
        community,
        deposit: {
          status: DepositStatus.published,
        },
      });
      await controller.createDepositRevision(
        { user: { sub: author.userId } } as unknown as typeof request,
        published._id.toHexString()
      );
      expect(spy).toHaveBeenCalled();

      const resultAuthor = await controller.getDepositVersions(
        { user: { sub: author.userId } } as unknown as typeof request,
        published._id.toHexString()
      );

      const resultAnonymous = await controller.getDepositVersions(
        { user: { sub: undefined } } as unknown as typeof request,
        published._id.toHexString()
      );
      expect(resultAuthor.length).toBe(2);
      expect(resultAnonymous.length).toBe(1);
    });

    it('should fail getDepositVersions when deposit not exist', async () => {
      const user = await createUser(module);
      await expect(
        controller.getDepositVersions(
          { user: { sub: user.userId } } as unknown as typeof request,
          generateObjectId()
        )
      ).rejects.toThrow(NotFoundException);
    });

    it('should get deposits', async () => {
      const { community } = await createCommunity(module);
      const { author } = await createDeposit(module, {
        community,
        deposit: {
          status: DepositStatus.published,
          keywords: ['analytics'],
        },
      });

      const result = await controller.getDeposits(
        { user: { sub: author.userId } } as unknown as typeof request,
        {
          query: 'analytics',
          creator: author._id.toHexString(),
          community: community._id.toHexString(),
        }
      );
      expect(result.deposits.length).toBe(1);
    });

    it('should transform queryparams', () => {
      const dto = plainToClass(GetDepositsQueryParams, {
        communityChildren: [generateObjectId(), generateObjectId()],
      });
      expect(dto.communityChildren?.length).toBe(2);
    });

    it('should get only articles from conferences', async () => {
      const { community: conference } = await createCommunity(module);
      const { community } = await createCommunity(module, {
        community: {
          conferenceProceedings: [conference._id],
        },
      });

      await createDeposit(module, { community });
      await createDeposit(module, {
        community,
        deposit: { publicationType: PublicationType.poster },
      });
      const { author: authorArticle, deposit: paper } = await createDeposit(module, {
        community: conference,
      });
      const { author: authorPoster, deposit: poster } = await createDeposit(module, {
        community: conference,
        deposit: { publicationType: PublicationType.poster },
      });

      // Return all papers from main community + articles from children
      const result1 = await controller.getDeposits(
        { user: { sub: undefined } } as unknown as typeof request,
        {
          community: community._id.toHexString(),
          communityChildren: [conference._id.toHexString()],
        }
      );
      expect(result1.deposits.length).toBe(3);

      // Return all papers with reviews (NOTE: Posters are not included!!)
      await createReview(module, paper);
      await createReview(module, poster);

      const papersWithReviews = await controller.getDeposits(
        { user: { sub: undefined } } as unknown as typeof request,
        {
          community: community._id.toHexString(),
          communityChildren: [conference._id.toHexString()],
          hasReviews: true,
        }
      );
      expect(papersWithReviews.deposits.length).toBe(1);

      // Return only papers with author
      const result2 = await controller.getDeposits(
        { user: { sub: undefined } } as unknown as typeof request,
        {
          creator: authorArticle._id.toHexString(),
          community: community._id.toHexString(),
          communityChildren: [conference._id.toHexString()],
        }
      );
      expect(result2.deposits.length).toBe(1);

      // Should return none because children communities do not show posters
      const result3 = await controller.getDeposits(
        { user: { sub: undefined } } as unknown as typeof request,
        {
          creator: authorPoster._id.toHexString(),
          community: community._id.toHexString(),
          communityChildren: [conference._id.toHexString()],
        }
      );
      expect(result3.deposits.length).toBe(0);

      // Should everything from main community
      const result4 = await controller.getDeposits(
        { user: { sub: undefined } } as unknown as typeof request,
        {
          community: community._id.toHexString(),
        }
      );
      expect(result4.deposits.length).toBe(2);

      // Should everything from conference
      const result5 = await controller.getDeposits(
        { user: { sub: undefined } } as unknown as typeof request,
        {
          community: conference._id.toHexString(),
        }
      );
      expect(result5.deposits.length).toBe(2);
    });

    it('should remove authors emails when get deposits', async () => {
      const { community } = await createCommunity(module);
      await createDeposit(module, {
        community,
        deposit: {
          status: DepositStatus.published,
          keywords: ['analytics'],
        },
      });
      const spy = jest.spyOn(depositService, 'deleteAuthorsEmail');
      const result = await controller.getDeposits({} as unknown as typeof request, {
        query: 'analytics',
      });
      expect(result.deposits.length).toBe(1);
      expect(result.deposits[0].authors[0].email).toBeUndefined();
      expect(spy).toHaveBeenCalled();
    });

    it('should delete deposit', async () => {
      const { community } = await createCommunity(module);
      const { deposit: draft, author } = await createDeposit(module, {
        community,
        deposit: {
          status: DepositStatus.draft,
        },
      });

      const publicationFile: FileMetadata = {
        filename: `publication-${draft._id.toHexString()}.pdf`,
        description: '',
        contentType: 'application/pdf',
        contentLength: 5,
        tags: ['publication'],
      };
      const extraFile: FileMetadata = {
        filename: `extra-${draft._id.toHexString()}.pdf`,
        description: '',
        contentType: 'application/pdf',
        contentLength: 7,
        tags: [],
      };

      draft.publicationFile = publicationFile;
      draft.files = [extraFile];
      await draft.save();

      const spy = jest.spyOn(awsStorageService, 'delete').mockImplementation();
      await controller.deleteDeposit(
        { user: { sub: author.userId } } as unknown as typeof request,
        draft._id.toHexString()
      );
      const exist = await depositService.depositModel.exists({ _id: draft._id });
      expect(exist).toBeFalsy();
      expect(spy).toHaveBeenCalled();
    });

    it('should raise exception when deposit does not exist', async () => {
      const user = await createUser(module);
      await expect(
        controller.deleteDeposit(
          { user: { sub: user.userId } } as unknown as typeof request,
          generateObjectId()
        )
      ).rejects.toThrow(NotFoundException);
    });

    it('should update deposit authors', async () => {
      const { community } = await createCommunity(module);
      const { deposit, author } = await createDeposit(module, {
        community,
        deposit: { status: DepositStatus.draft },
      });
      const updateDepositDTO: UpdateDepositDTO = {
        title: 'New title',
        authors: [
          {
            email: author.email,
            credit: [],
            firstName: author.firstName,
            lastName: author.lastName,
            institutions: [],
          },
          {
            firstName: 'Steve',
            lastName: 'Doe',
            email: 'example@example.com',
            credit: [],
            institutions: [],
          },
        ],
      };
      const result = await controller.updateDeposit(
        { user: { sub: author.userId } } as unknown as typeof request,
        updateDepositDTO,
        deposit._id.toHexString()
      );
      expect(result.title).toBe('New title');
      expect(result.authors[0]).toEqual({
        userId: author.userId,
        userObjectId: author._id.toHexString(),
        nickname: author.nickname,
        gravatar: getMd5Hash(author.email ?? ''),
        avatar: author.avatar,
        email: author.email,
        credit: [],
        firstName: author.firstName,
        lastName: author.lastName,
        institutions: [],
        orcid: undefined,
      } as AuthorDTO);
      expect(result.authors[1].firstName).toBe('Steve');
      expect(result.authors[1].email).toBe('example@example.com');
      expect(result.track).toEqual(community.newTracks[0]);
    });

    it('should submit a deposit', async () => {
      const { community } = await createCommunity(module);
      const author = await createUser(module);
      const { draft, preprint } = await createDepositSet(module, community, author);
      const spy = jest.spyOn(eventService, 'create');
      const result = await controller.submitDeposit(
        { user: { sub: author.userId } } as unknown as typeof request,
        draft._id.toHexString()
      );
      expect(result.status).toBe(DepositStatus.pendingApproval);
      expect(spy).toHaveBeenCalled();

      await expect(
        controller.submitDeposit(
          { user: { sub: author.userId } } as unknown as typeof request,
          preprint._id.toHexString()
        )
      ).rejects.toMatchObject(new BadRequestException('Deposit must be in Draft status'));
    });

    it('should reject deposit when correct status', async () => {
      const { community, moderator } = await createCommunity(module);
      const { preprint, pendingApproval } = await createDepositSet(module, community);
      const anyUser = await createUser(module);

      await expect(
        controller.rejectDeposit(
          { user: { sub: anyUser.userId } } as unknown as typeof request,
          pendingApproval._id.toHexString(),
          { reason: 'testing reason message' }
        )
      ).rejects.toThrow(UnauthorizedException);

      // moderator
      await expect(
        controller.rejectDeposit(
          { user: { sub: moderator.userId } } as unknown as typeof request,
          preprint._id.toHexString(),
          { reason: 'testing reason message' }
        )
      ).rejects.toMatchObject(new ForbiddenException('Deposit is not in pending approval'));

      const spy = jest.spyOn(eventService, 'create');
      const result = await controller.rejectDeposit(
        { user: { sub: moderator.userId } } as unknown as typeof request,
        pendingApproval._id.toHexString(),
        { reason: 'testing reason message' }
      );
      expect(result.status).toBe(DepositStatus.rejected);
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ reason: 'testing reason message' }),
        })
      );
    });

    it('should draft deposit when it is in correct status', async () => {
      const { community, moderator } = await createCommunity(module);
      const { preprint, pendingApproval } = await createDepositSet(module, community);
      const spy = jest.spyOn(eventService, 'create');

      await expect(
        controller.draftDeposit(
          { user: { sub: moderator.userId } } as unknown as typeof request,
          { reason: 'testing reason message' },
          preprint._id.toHexString()
        )
      ).rejects.toMatchObject(new ForbiddenException('Deposit is not in pending approval'));

      const result = await controller.draftDeposit(
        { user: { sub: moderator.userId } } as unknown as typeof request,
        { reason: 'testing reason message' },
        pendingApproval._id.toHexString()
      );
      expect(result.status).toBe(DepositStatus.draft);
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ reason: 'testing reason message' }),
        })
      );
    });

    it('should accept a deposit', async () => {
      const { community, moderator } = await createCommunity(module);
      const { preprint, pendingApproval } = await createDepositSet(module, community);
      const result = await controller.acceptDeposit(
        { user: { sub: moderator.userId } } as unknown as typeof request,
        pendingApproval._id.toHexString()
      );
      expect(result.status).toBe(DepositStatus.preprint);

      await expect(
        controller.acceptDeposit(
          { user: { sub: moderator.userId } } as unknown as typeof request,
          preprint._id.toHexString(),
          { reason: 'testing reason message' }
        )
      ).rejects.toMatchObject(new ForbiddenException('Deposit is not in pending approval'));
    });

    it('should publish a deposit', async () => {
      const { community, moderator } = await createCommunity(module);
      const { preprint, pendingApproval } = await createDepositSet(module, community);
      const result = await controller.publishDeposit(
        { user: { sub: moderator.userId } } as unknown as typeof request,
        preprint._id.toHexString()
      );
      expect(result.status).toBe(DepositStatus.published);

      await expect(
        controller.publishDeposit(
          { user: { sub: moderator.userId } } as unknown as typeof request,
          pendingApproval._id.toHexString()
        )
      ).rejects.toMatchObject(new ForbiddenException('Deposit is not in preprint'));
    });

    it('should return a deposit to pending approval', async () => {
      const { community, moderator } = await createCommunity(module);
      const { preprint, pendingApproval } = await createDepositSet(module, community);
      const result = await controller.depositToPendingApproval(
        { user: { sub: moderator.userId } } as unknown as typeof request,
        preprint._id.toHexString()
      );
      expect(result.status).toBe(DepositStatus.pendingApproval);

      await expect(
        controller.depositToPendingApproval(
          { user: { sub: moderator.userId } } as unknown as typeof request,
          pendingApproval._id.toHexString()
        )
      ).rejects.toMatchObject(new ForbiddenException('Deposit is not in preprint or published'));
    });

    it('should update a deposit and send to published', async () => {
      const { community, moderator } = await createCommunity(module);
      const { deposit: preprint } = await createDeposit(module, { community });
      const spyUpdateToLastVersion = jest.spyOn(depositService, 'updateToLastVersion');

      const result = await controller.updateDeposit(
        { user: { sub: moderator.userId } } as unknown as typeof request,
        { status: DepositStatus.published },
        preprint._id.toHexString()
      );
      expect(result.status).toBe(DepositStatus.published);
      expect(spyUpdateToLastVersion).toHaveBeenCalled();
    });

    it('should assign/unassign an editor', async () => {
      const { community, moderator } = await createCommunity(module);
      const { deposit: pendingApproval } = await createDeposit(module, {
        community,
        deposit: {
          status: DepositStatus.pendingApproval,
        },
      });

      const result = await controller.assignEditor(
        { user: { sub: moderator.userId } } as unknown as typeof request,
        { assignee: moderator._id.toHexString() },
        pendingApproval._id.toHexString()
      );
      expect(result.assignee).toEqual(moderator._id.toHexString());

      // unassigned editor now
      const unassigned = await controller.assignEditor(
        { user: { sub: moderator.userId } } as unknown as typeof request,
        { assignee: '' },
        pendingApproval._id.toHexString()
      );
      expect(unassigned.assignee).toEqual(undefined);
    });

    it('should assign an editoral decision', async () => {
      const { community, moderator } = await createCommunity(module);
      const { deposit: pendingApproval } = await createDeposit(module, {
        community,
        deposit: {
          status: DepositStatus.pendingApproval,
        },
      });
      const result = await controller.assignEditorialDecision(
        { user: { sub: moderator.userId } } as unknown as typeof request,
        { acceptedFor: AcceptedFor.Poster },
        pendingApproval._id.toHexString()
      );
      expect(result.acceptedFor).toEqual(AcceptedFor.Poster);
    });

    it('should fail updateDeposit when deposit not exist', async () => {
      const { moderator } = await createCommunity(module);

      await expect(
        controller.updateDeposit(
          { user: { sub: moderator.userId } } as unknown as typeof request,
          { title: 'New title' },
          generateObjectId()
        )
      ).rejects.toMatchObject(new NotFoundException('Deposit not found'));
    });

    it('should fail updateDeposit when user not exist', async () => {
      const { community } = await createCommunity(module);
      const { deposit } = await createDeposit(module, {
        community,
        deposit: {
          html: 'example',
        },
      });
      await expect(
        controller.updateDeposit(
          { user: { sub: generateObjectId() } } as unknown as typeof request,
          { title: 'New title', html: 'not an example' },
          deposit._id.toHexString()
        )
      ).rejects.toMatchObject(new NotFoundException('User not found'));
    });

    it('should update the deposit moderator with html', async () => {
      const { community, moderator } = await createCommunity(module);
      const { deposit } = await createDeposit(module, {
        community,
        deposit: {
          html: 'example',
        },
      });
      const updatedDeposit = await controller.updateDeposit(
        { user: { sub: moderator.userId } } as unknown as typeof request,
        { title: 'New title', html: 'not an example' },
        deposit._id.toHexString()
      );
      expect(updatedDeposit.html).toBe('not an example');
    });

    it('should update the deposit author with html', async () => {
      const { community } = await createCommunity(module);
      const { deposit, author } = await createDeposit(module, {
        community,
        deposit: { status: DepositStatus.draft },
      });
      const updatedDeposit = await controller.updateDeposit(
        { user: { sub: author.userId } } as unknown as typeof request,
        { title: 'New title', html: 'not an example' },
        deposit._id.toHexString()
      );
      expect(updatedDeposit.html).toBe(undefined);
    });

    it('should get citations', async () => {
      const { community } = await createCommunity(module);
      const { deposit: published } = await createDeposit(module, {
        community,
        deposit: {
          status: DepositStatus.published,
        },
      });
      const citation: Citation = {
        apa: 'Doe, J. (2024). Big data analytics as a service infrastructure: challenges, desired properties and solutions. Orvium Community. https://doi.org/doiexample',
      };
      const result = await controller.getCitation(published._id.toHexString());
      expect(result.apa).toBe(citation.apa);

      // bibtex
      const spy = jest.spyOn(depositService, 'getBibtexCitation');
      await controller.getBibtex(published._id.toHexString());
      expect(spy).toHaveBeenCalledWith(published._id.toHexString());
    });

    it('should raise exception when try to get deposit citation form a deposit that not exist', async () => {
      await expect(controller.getCitation(generateObjectId())).rejects.toThrow(NotFoundException);
    });
  });

  describe('File tests', () => {
    it('should upload deposit main file and return presignedURL', async () => {
      const { community } = await createCommunity(module);
      const { deposit: draft, author } = await createDeposit(module, {
        community,
        deposit: {
          status: DepositStatus.draft,
        },
      });
      const previousMainFile: FileMetadata = {
        filename: 'previousMainFile.pdf',
        description: '',
        contentType: 'application/pdf',
        contentLength: 12,
        tags: ['Publication'],
      };
      const file: AppFile = {
        lastModified: 7,
        name: `publication-${draft._id.toHexString()}.pdf`,
        size: 7,
        type: 'application/pdf',
      };
      const createFileDTO: CreateFileDTO = {
        file: file,
      };
      const fileMetadata: FileMetadata = {
        filename: file.name,
        description: file.name,
        contentType: file.type,
        contentLength: file.size,
        tags: ['Publication'],
      };
      draft.publicationFile = previousMainFile;
      draft.files = [fileMetadata];
      await draft.save();

      const spyStorage = jest.spyOn(awsStorageService, 'getSignedUrl').mockResolvedValue('link');
      const result = await controller.uploadFile(
        { user: { sub: author.userId } } as unknown as typeof request,
        draft._id.toHexString(),
        createFileDTO,
        true
      );
      const extension = extname(file.name);
      expect(spyStorage).toHaveBeenCalledWith(
        'putObject',
        expect.objectContaining({
          Key: `${draft._id.toHexString()}/publication-${draft._id.toHexString()}${extension}`,
        })
      );
      expect(result).toStrictEqual({
        signedUrl: 'link',
        fileMetadata: {
          contentLength: 7,
          contentType: 'application/pdf',
          filename: `publication-${draft._id.toHexString()}.pdf`,
          description: `publication-${draft._id.toHexString()}.pdf`,
          tags: ['Publication'],
        },
        isMainFile: true,
        replacePDF: false,
      });
      const depositService = module.get(DepositService);
      const depositWithMainFile = await depositService.depositModel.findById(draft._id);
      assertIsDefined(depositWithMainFile);
      expect(depositWithMainFile.publicationFile).toBeUndefined();
      expect(depositWithMainFile.pdfUrl).toBeUndefined();
    });

    it('should upload extra file and return presignedURL', async () => {
      const { community } = await createCommunity(module);
      const { deposit: draft, author } = await createDeposit(module, {
        community,
        deposit: {
          status: DepositStatus.draft,
        },
      });
      const file: AppFile = {
        lastModified: 7,
        name: 'file.pdf',
        size: 7,
        type: 'application/pdf',
      };
      const createFileDTO: CreateFileDTO = {
        file: file,
      };
      await controller.uploadFile(
        { user: { sub: author.userId } } as unknown as typeof request,
        draft._id.toHexString(),
        createFileDTO,
        false
      );
      const depositService = module.get(DepositService);
      const depositUpdated = await depositService.depositModel.findById(draft._id);
      assertIsDefined(depositUpdated);
      expect(depositUpdated.files.length).toBe(0);
    });

    it('should upload pdf, then epub and delete pdfUrl', async () => {
      const { community } = await createCommunity(module);
      const { deposit: draft, author } = await createDeposit(module, {
        community,
        deposit: {
          status: DepositStatus.draft,
        },
      });
      const filePDF: AppFile = {
        lastModified: 7,
        name: 'publication-61de4f2009a43aa5bcacda4c.pdf',
        size: 7,
        type: 'application/pdf',
      };
      const createFileDTO: CreateFileDTO = {
        file: filePDF,
      };
      const fileEPUB: AppFile = {
        lastModified: 7,
        name: 'publication-61de4f2009a43aa5bcacda4c.epub',
        size: 7,
        type: 'application/epub',
      };
      const createFileDTO2: CreateFileDTO = {
        file: fileEPUB,
      };

      await controller.uploadFile(
        { user: { sub: author.userId } } as unknown as typeof request,
        draft._id.toHexString(),
        createFileDTO,
        true
      );
      const depositWithMainFile = await depositService.depositModel.findById(draft._id);
      assertIsDefined(depositWithMainFile);
      expect(depositWithMainFile.pdfUrl).toBeUndefined();

      const signedURL = await controller.uploadFile(
        { user: { sub: author.userId } } as unknown as typeof request,
        draft._id.toHexString(),
        createFileDTO2,
        true
      );
      expect(signedURL.fileMetadata.filename).toStrictEqual(
        `publication-${draft._id.toHexString()}.epub`
      );
    });

    it('should raise exception when try to upload deposit file to a deposit that not exist', async () => {
      const file: AppFile = {
        lastModified: 7,
        name: 'file.pdf',
        size: 7,
        type: 'application/pdf',
      };
      const createFileDTO: CreateFileDTO = {
        file: file,
      };
      const user = await createUser(module);

      await expect(
        controller.uploadFile(
          { user: { sub: user.userId } } as unknown as typeof request,
          generateObjectId(),
          createFileDTO,
          true
        )
      ).rejects.toMatchObject(new NotFoundException('Deposit not found'));
    });

    it('should raise exception when try to upload deposit file to a deposit that is published', async () => {
      const { community } = await createCommunity(module);
      const { deposit: published, author } = await createDeposit(module, {
        community,
        deposit: {
          status: DepositStatus.published,
        },
      });
      const file: AppFile = {
        lastModified: 7,
        name: 'file.pdf',
        size: 7,
        type: 'application/pdf',
      };
      const createFileDTO: CreateFileDTO = {
        file: file,
      };
      await expect(
        controller.uploadFile(
          { user: { sub: author.userId } } as unknown as typeof request,
          published._id.toHexString(),
          createFileDTO,
          true
        )
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should raise exception when try to upload deposit file a user that not exist', async () => {
      const { community } = await createCommunity(module);
      const { deposit: draft } = await createDeposit(module, {
        community,
        deposit: {
          status: DepositStatus.draft,
        },
      });
      const file: AppFile = {
        lastModified: 7,
        name: 'file.pdf',
        size: 7,
        type: 'application/pdf',
      };
      const createFileDTO: CreateFileDTO = {
        file: file,
      };
      await expect(
        controller.uploadFile(
          { user: { sub: generateObjectId() } } as unknown as typeof request,
          draft._id.toHexString(),
          createFileDTO,
          true
        )
      ).rejects.toMatchObject(new NotFoundException('User not found'));
    });

    it('should raise exception when try to upload deposit file with a not allowed extension file', async () => {
      const { community } = await createCommunity(module);
      const { deposit: draft, author } = await createDeposit(module, {
        community,
        deposit: {
          status: DepositStatus.draft,
        },
      });
      const file: AppFile = {
        lastModified: 7,
        name: 'file.xxx',
        size: 7,
        type: 'application/xxx',
      };
      await expect(
        controller.uploadFile(
          { user: { sub: author.userId } } as unknown as typeof request,
          draft._id.toHexString(),
          { file: file },
          true
        )
      ).rejects.toMatchObject(new UnauthorizedException('Invalid extension file'));
    });

    it('should get deposit file pdf', async () => {
      const { community } = await createCommunity(module);
      const { deposit: published } = await createDeposit(module, {
        community,
        deposit: {
          status: DepositStatus.published,
          pdfUrl: 'myfile.pdf',
        },
      });
      const spyStorage = jest.spyOn(awsStorageService, 'getSignedUrl').mockResolvedValue('link');
      const spyResponse = jest
        .spyOn(response, 'redirect')
        .mockImplementation(() => Logger.debug('redirect'));
      await controller.getDepositFilePDF(published._id.toHexString(), response);
      expect(spyStorage).toHaveBeenCalledWith(
        'getObject',
        expect.objectContaining({ Key: `${published._id.toHexString()}/myfile.pdf` })
      );
      expect(spyResponse).toHaveBeenCalled();
    });

    it('should raise exception when try to get deposit pdf file from a deposit that not exist', async () => {
      await expect(controller.getDepositFilePDF(generateObjectId(), response)).rejects.toThrow(
        new NotFoundException('Deposit not found')
      );
    });

    it('should raise exception when try to get deposit pdf file from a draft deposit', async () => {
      const { community } = await createCommunity(module);
      const { deposit: draft } = await createDeposit(module, {
        community,
        deposit: {
          status: DepositStatus.draft,
          pdfUrl: 'myfile.pdf',
        },
      });
      await expect(
        controller.getDepositFilePDF(draft._id.toHexString(), response)
      ).rejects.toMatchObject(new UnauthorizedException('Deposit should not be draft'));
    });

    it('should get deposit publication file and return presignedURL', async () => {
      const mainFile: FileMetadata = {
        filename: 'mainFile.pdf',
        description: 'mainFile.pdf',
        contentType: 'application/pdf',
        contentLength: 12,
        tags: ['Publication'],
      };
      const fileMetadata: FileMetadata = {
        filename: 'file.pdf',
        description: 'file.pdf',
        contentType: 'application/pdf',
        contentLength: 7,
        tags: ['Publication'],
      };
      const { community } = await createCommunity(module);
      const { deposit: published } = await createDeposit(module, {
        community,
        deposit: {
          status: DepositStatus.published,
        },
      });
      published.publicationFile = mainFile;
      published.files = [fileMetadata];
      await published.save();

      const spyStorage = jest.spyOn(awsStorageService, 'getSignedUrl').mockImplementation();
      const spyResponse = jest
        .spyOn(response, 'redirect')
        .mockImplementation(() => Logger.debug('redirect'));
      await controller.getDepositFile(published._id.toHexString(), mainFile.filename, response);
      expect(spyStorage).toHaveBeenCalledWith(
        'getObject',
        expect.objectContaining({
          Key: `${published._id.toHexString()}/${mainFile.filename}`,
        })
      );
      expect(spyResponse).toHaveBeenCalled();
    });

    it('should get deposit extra file and return presignedURL', async () => {
      const mainFile: FileMetadata = {
        filename: 'mainFile.pdf',
        description: 'mainFile.pdf',
        contentType: 'application/pdf',
        contentLength: 12,
        tags: ['Publication'],
      };
      const fileMetadata: FileMetadata = {
        filename: 'file.pdf',
        description: 'file.pdf',
        contentType: 'application/pdf',
        contentLength: 7,
        tags: ['Publication'],
      };
      const { community } = await createCommunity(module);
      const { deposit: published } = await createDeposit(module, {
        community,
        deposit: {
          status: DepositStatus.published,
        },
      });
      published.publicationFile = mainFile;
      published.files = [fileMetadata];
      await published.save();

      const spyStorage = jest.spyOn(awsStorageService, 'getSignedUrl').mockResolvedValue('link');
      const spyResponse = jest
        .spyOn(response, 'redirect')
        .mockImplementation(() => Logger.debug('redirect'));
      await controller.getDepositFile(published._id.toHexString(), fileMetadata.filename, response);
      expect(spyStorage).toHaveBeenCalledWith(
        'getObject',
        expect.objectContaining({
          Key: `${published._id.toHexString()}/${fileMetadata.filename}`,
        })
      );
      expect(spyResponse).toHaveBeenCalled();
    });

    it('should raise exception when try to get deposit file from a deposit that not exist', async () => {
      await expect(
        controller.getDepositFile(generateObjectId(), 'file.pdf', response)
      ).rejects.toMatchObject(new NotFoundException('Deposit not found'));
    });

    it('should raise exception when try to get deposit file from a draft deposit', async () => {
      const { community } = await createCommunity(module);
      const { deposit: draft } = await createDeposit(module, {
        community,
        deposit: {
          status: DepositStatus.draft,
        },
      });
      await expect(
        controller.getDepositFile(draft._id.toHexString(), 'file.pdf', response)
      ).rejects.toMatchObject(new UnauthorizedException('Deposit should not be draft'));
    });

    it('should raise exception when try to get deposit file that not exist', async () => {
      const { community } = await createCommunity(module);
      const { deposit: published } = await createDeposit(module, {
        community,
        deposit: {
          status: DepositStatus.published,
        },
      });
      await expect(
        controller.getDepositFile(published._id.toHexString(), 'xxx.xxx', response)
      ).rejects.toMatchObject(new NotFoundException('File not found'));
    });

    it('should raise exception when try to delete deposit file from a deposit that not exist', async () => {
      const user = await createUser(module);
      await expect(
        controller.deleteDepositFile(
          { user: { sub: user.userId } } as unknown as typeof request,
          generateObjectId(),
          'file.pdf'
        )
      ).rejects.toMatchObject(new NotFoundException('Deposit not found'));
    });

    it('should raise exception when try to delete deposit file a user that not exist', async () => {
      const { community } = await createCommunity(module);
      const { deposit: draft } = await createDeposit(module, {
        community,
        deposit: {
          status: DepositStatus.draft,
        },
      });
      await expect(
        controller.deleteDepositFile(
          { user: { sub: generateObjectId() } } as unknown as typeof request,
          draft._id.toHexString(),
          'file.pdf'
        )
      ).rejects.toMatchObject(new NotFoundException('User not found'));
    });

    it('should raise exception when try to delete deposit file from a published deposit', async () => {
      const { community } = await createCommunity(module);
      const { deposit: published, author } = await createDeposit(module, {
        community,
        deposit: {
          status: DepositStatus.published,
        },
      });
      await expect(
        controller.deleteDepositFile(
          { user: { sub: author.userId } } as unknown as typeof request,
          published._id.toHexString(),
          'file.pdf'
        )
      ).rejects.toMatchObject(new UnauthorizedException('Unauthorized action update'));
    });

    it('should raise exception when try to delete deposit file that not exist', async () => {
      const { community } = await createCommunity(module);
      const { deposit: draft, author } = await createDeposit(module, {
        community,
        deposit: {
          status: DepositStatus.draft,
        },
      });
      await expect(
        controller.deleteDepositFile(
          { user: { sub: author.userId } } as unknown as typeof request,
          draft._id.toHexString(),
          'file.pdf'
        )
      ).rejects.toMatchObject(new NotFoundException('File not found'));
    });

    it('should delete deposit file', async () => {
      const { community } = await createCommunity(module);
      const { deposit: draft, author } = await createDeposit(module, {
        community,
        deposit: {
          status: DepositStatus.draft,
          files: [factoryFileMetadata.build()],
        },
      });
      assertIsDefined(draft.files[0]);
      const spy = jest.spyOn(awsStorageService, 'delete').mockImplementation();
      const depositDeletedFile = await controller.deleteDepositFile(
        { user: { sub: author.userId } } as unknown as typeof request,
        draft._id.toHexString(),
        draft.files[0].filename
      );
      expect(depositDeletedFile.files[0]).toBeUndefined();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('DOI Registration', () => {
    it('should preview DOI registration', async () => {
      const { community, moderator } = await createCommunity(module);
      const { deposit } = await createDeposit(module, { community });

      await expect(
        controller.previewDOIRegistration(
          { user: { sub: moderator.userId } } as unknown as typeof request,
          deposit._id.toHexString()
        )
      ).rejects.toMatchObject(new NotFoundException('DOI provider is not configured!'));

      // Test Datacite
      community.datacite = {
        accountId: 'fake',
        pass: 'fake',
        prefix: 'prefix',
        server: DATACITE_ENDPOINT.test,
      };
      await community.save();
      const spyDatacite = jest
        .spyOn(module.get(DataciteService), 'generateDOIMetadata')
        .mockImplementation();

      await controller.previewDOIRegistration(
        { user: { sub: moderator.userId } } as unknown as typeof request,
        deposit._id.toHexString()
      );
      expect(spyDatacite).toHaveBeenCalled();

      // Test crossref
      community.datacite = undefined;
      community.crossref = {
        user: 'fake',
        pass: 'fake',
        role: 'fake',
        prefixDOI: 'fake',
        server: CROSSREF_ENDPOINT.test,
      };
      await community.save();
      const spyCrossref = jest
        .spyOn(module.get(CrossrefService), 'createDepositXML')
        .mockImplementation();

      await controller.previewDOIRegistration(
        { user: { sub: moderator.userId } } as unknown as typeof request,
        deposit._id.toHexString()
      );
      expect(spyCrossref).toHaveBeenCalled();
    });

    it('should createDoi', async () => {
      const { community, moderator } = await createCommunity(module);
      const { deposit } = await createDeposit(module, { community });

      await expect(
        controller.createDoi(
          { user: { sub: moderator.userId } } as unknown as typeof request,
          deposit._id.toHexString()
        )
      ).rejects.toMatchObject(new NotFoundException('DOI provider is not configured!'));

      community.datacite = {
        accountId: 'fake',
        pass: 'fake',
        prefix: 'prefix',
        server: DATACITE_ENDPOINT.test,
      };
      await community.save();

      const dataciteService = module.get(DataciteService);
      const spy = jest.spyOn(dataciteService, 'generateDOI').mockImplementationOnce(() => {
        throw new HttpException({ message: 'error' }, HttpStatus.BAD_REQUEST);
      });

      const errorResponse = await controller.createDoi(
        { user: { sub: moderator.userId } } as unknown as typeof request,
        deposit._id.toHexString()
      );
      expect(errorResponse).toMatchObject({ data: 'error' });
      spy.mockImplementation();

      await controller.createDoi(
        { user: { sub: moderator.userId } } as unknown as typeof request,
        deposit._id.toHexString()
      );
      expect(spy).toHaveBeenCalledTimes(2);

      // Test crossref
      community.datacite = undefined;
      community.crossref = {
        user: 'fake',
        pass: 'fake',
        role: 'fake',
        prefixDOI: 'fake',
        server: CROSSREF_ENDPOINT.test,
      };
      await community.save();
      const spyCrossref = jest
        .spyOn(module.get(CrossrefService), 'generateDepositDOI')
        .mockImplementation();

      await controller.createDoi(
        { user: { sub: moderator.userId } } as unknown as typeof request,
        deposit._id.toHexString()
      );
      expect(spyCrossref).toHaveBeenCalled();
    });

    it('should getDOI', async () => {
      const { community, moderator } = await createCommunity(module);
      const { deposit } = await createDeposit(module, { community });

      await expect(
        controller.getDoi(
          { user: { sub: moderator.userId } } as unknown as typeof request,
          deposit._id.toHexString()
        )
      ).rejects.toMatchObject(new NotFoundException('DOI provider is not configured!'));

      community.datacite = {
        accountId: 'fake',
        pass: 'fake',
        prefix: 'prefix',
        server: DATACITE_ENDPOINT.test,
      };
      await community.save();

      const dataciteService = module.get(DataciteService);
      const spy = jest.spyOn(dataciteService, 'getDoiMetadata').mockImplementation();
      await controller.getDoi(
        { user: { sub: moderator.userId } } as unknown as typeof request,
        deposit._id.toHexString()
      );
      expect(spy).toHaveBeenCalled();

      // Test crossref
      community.datacite = undefined;
      community.crossref = {
        user: 'fake',
        pass: 'fake',
        role: 'fake',
        prefixDOI: 'fake',
        server: CROSSREF_ENDPOINT.test,
      };
      await community.save();

      await expect(
        controller.getDoi(
          { user: { sub: moderator.userId } } as unknown as typeof request,
          deposit._id.toHexString()
        )
      ).rejects.toMatchObject(new NotImplementedException('Featured not implemented'));
    });
  });

  describe('Community tests', () => {
    it('should ensure deposit track exists in community', async () => {
      const { community } = await createCommunity(module, {
        community: {
          newTracks: [{ title: 'example', timestamp: 15 }],
        },
      });
      const { deposit: draft, author } = await createDeposit(module, {
        community,
        deposit: {
          status: DepositStatus.draft,
          newTrackTimestamp: 15,
        },
      });
      const updatedDepositPublished = await controller.updateDeposit(
        { user: { sub: author.userId } } as unknown as typeof request,
        { newTrackTimestamp: 15 },
        draft._id.toHexString()
      );
      expect(updatedDepositPublished.newTrackTimestamp).toBe(15);
      await expect(
        controller.updateDeposit(
          { user: { sub: author.userId } } as unknown as typeof request,
          {
            newTrackTimestamp: 155,
          },
          draft._id.toHexString()
        )
      ).rejects.toMatchObject(new NotFoundException('Please select a valid track'));

      draft.newTrackTimestamp = undefined;
      await draft.save();
      await expect(
        controller.updateDeposit(
          { user: { sub: author.userId } } as unknown as typeof request,
          { abstract: 'testing undefined track' },
          draft._id.toHexString()
        )
      ).rejects.toMatchObject(new NotFoundException('You need to choose a valid community track'));
    });

    it('should raise exception when trying to delete deposit with reviews', async () => {
      const { community } = await createCommunity(module);
      const { deposit: draft, author } = await createDeposit(module, {
        community,
        deposit: {
          status: DepositStatus.draft,
        },
      });
      await createReview(module, draft);

      await expect(
        controller.deleteDeposit(
          { user: { sub: author.userId } } as unknown as typeof request,
          draft._id.toHexString()
        )
      ).rejects.toMatchObject(
        new UnauthorizedException('Publications with reviews cannot be deleted')
      );
    });

    it('should get deposits pending approval', async () => {
      const { community } = await createCommunity(module);
      await createDeposit(module, {
        community,
        deposit: {
          status: DepositStatus.pendingApproval,
        },
      });
      await createDepositSet(module, community);
      const user = await createUser(module);
      const admin = await createUser(module, { user: { roles: ['admin'] } });

      await expect(
        controller.getDepositsPendingApproval({
          user: { sub: user.userId },
        } as unknown as typeof request)
      ).rejects.toMatchObject(new UnauthorizedException('Unauthorized'));

      const result = await controller.getDepositsPendingApproval({
        user: { sub: admin.userId },
      } as unknown as typeof request);
      expect(result.length).toEqual(2);
    });
  });

  describe('Visibility Tests', () => {
    it('should hide private peer reviews for users that are not moderator', async () => {
      const { community, moderator } = await createCommunity(module, {
        community: {
          privateReviews: true,
        },
      });
      const { deposit: published } = await createDeposit(module, {
        community,
        deposit: {
          status: DepositStatus.published,
        },
      });
      await createReview(module, published, {
        review: {
          showReviewToEveryone: false,
          showReviewToAuthor: false,
        },
      });

      const depositDTOAnonymousView = await controller.getDeposit(
        { user: 'anonymous' } as unknown as typeof request,
        published._id.toHexString()
      );
      expect(depositDTOAnonymousView.peerReviews.length).toBe(0);

      const depositDTOModeratorView = await controller.getDeposit(
        { user: { sub: moderator.userId } } as unknown as typeof request,
        published._id.toHexString()
      );
      expect(depositDTOModeratorView.peerReviews.length).toBe(1);
    });

    it('should show public peer reviews', async () => {
      const { community } = await createCommunity(module, {
        community: {
          privateReviews: true, // This should not affect because visibility is set in the review, this is only a default value
        },
      });
      const { deposit: published } = await createDeposit(module, {
        community,
        deposit: {
          status: DepositStatus.published,
        },
      });
      await createReview(module, published, {
        review: {
          showReviewToAuthor: true,
          showReviewToEveryone: true,
        },
      });

      const depositDTOAnonymousView = await controller.getDeposit(
        { user: 'anonymous' } as unknown as typeof request,
        published._id.toHexString()
      );
      expect(depositDTOAnonymousView.peerReviews.length).toBe(1);
    });
  });

  describe('uploadFileConfirmationDeposit', () => {
    it('should raise exception', async () => {
      const { author, deposit } = await createDeposit(module);
      const payload = {
        fileMetadata: {
          filename: 'test.dfadfadspdf',
          contentLength: 21131,
          contentType: 'pdf',
          url: 'test.es/test',
          description: 'pdf file',
          tags: [],
        },
        isMainFile: true,
        replacePDF: false,
      };
      await expect(
        controller.uploadFileConfirmationDeposit(
          { user: { sub: author.userId } } as unknown as typeof request,
          generateObjectId(),
          payload
        )
      ).rejects.toThrow(new NotFoundException('Deposit not found'));

      await expect(
        controller.uploadFileConfirmationDeposit(
          { user: { sub: generateObjectId() } } as unknown as typeof request,
          deposit._id.toHexString(),
          payload
        )
      ).rejects.toThrow(new NotFoundException('User not found'));

      await expect(
        controller.uploadFileConfirmationDeposit(
          { user: { sub: author.userId } } as unknown as typeof request,
          deposit._id.toHexString(),
          payload
        )
      ).rejects.toThrow(new UnauthorizedException('Unauthorized action update'));

      const admin = await createAdmin(module);
      await expect(
        controller.uploadFileConfirmationDeposit(
          { user: { sub: admin.userId } } as unknown as typeof request,
          deposit._id.toHexString(),
          payload
        )
      ).rejects.toThrow(new BadRequestException('Invalid filename'));
    });
  });
});
