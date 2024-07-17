import { Test, TestingModule } from '@nestjs/testing';
import {
  CommunitiesController,
  CommunityUploadConfirmation,
  SendCommunityEmailsDTO,
} from './communities.controller';
import { CommunitiesService } from './communities.service';
import { CommunityStatus } from './communities.schema';
import { EventService } from '../event/event.service';
import { ModeratorRole } from './communities-moderator.schema';
import {
  createAdmin,
  createCommunity,
  createDeposit,
  createDepositSet,
  createInvite,
  createReview,
  createSession,
  createUser,
} from '../utils/test-data';
import { request, Response } from 'express';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CommunityUpdateDto } from '../dtos/community/community-update.dto';
import { assertIsDefined, CROSSREF_ENDPOINT, generateObjectId } from '../utils/utils';
import { cleanCollections, MongooseTestingModule } from '../utils/mongoose-testing.module';
import { AppFile, CreateImageDTO } from '../dtos/create-file.dto';
import { ReviewKind, ReviewStatus } from '../review/review.schema';
import { CommunityPrivateDTO } from '../dtos/community/community-private.dto';
import { AcceptedFor, DepositStatus } from '../deposit/deposit.schema';
import { InviteStatus, InviteType } from '../invite/invite.schema';
import { DATACITE_ENDPOINT } from '../datacite/datacite.service';

jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/s3-request-presigner');

describe('CommunitiesController', () => {
  let controller: CommunitiesController;
  let eventService: EventService;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      controllers: [CommunitiesController],
      imports: [MongooseTestingModule.forRoot('CommunitiesController')],
      providers: [],
    }).compile();
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    controller = module.get(CommunitiesController);
    eventService = module.get(EventService);

    await cleanCollections(module);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get community with CommunityDTO', async () => {
    const { community } = await createCommunity(module);
    const communityDTO = await controller.getCommunity(
      { user: null } as unknown as typeof request,
      community._id.toHexString()
    );
    expect(communityDTO.moderatorsPopulated.length).toBe(2);
    expect(communityDTO.actions).toStrictEqual(['read']);
    expect(communityDTO instanceof CommunityPrivateDTO).toBe(false);
  });

  it('should get communities', async () => {
    await createCommunity(module);
    await createCommunity(module);
    const result = await controller.getCommunities();
    expect(result.length).toEqual(2);
  });

  it('should getMyCommunities', async () => {
    const { communityOwner } = await createCommunity(module);

    const result = await controller.getMyCommunities({
      user: { sub: communityOwner.userId },
    } as unknown as typeof request);
    expect(result.length).toEqual(1);
  });

  it('should create community', async () => {
    const user = await createUser(module);
    const community = await controller.createCommunity(
      { user: { sub: user.userId } } as unknown as typeof request,
      { name: 'My new community', codename: 'coolcode' }
    );
    expect(community.name).toStrictEqual('My new community');
    expect(community.codename).toStrictEqual('coolcode');
  });

  it('should delete community', async () => {
    const { community } = await createCommunity(module);
    const admin = await createAdmin(module);

    await controller.deleteCommunity(
      { user: { sub: admin.userId } } as unknown as typeof request,
      community._id.toHexString()
    );
    await expect(
      controller.getCommunity(
        { user: { sub: admin.userId } } as unknown as typeof request,
        community._id.toHexString()
      )
    ).rejects.toMatchObject(new NotFoundException('Community not found'));
  });

  it('should raise exception when trying to delete community with deposits', async () => {
    const { community } = await createCommunity(module, {
      community: { status: CommunityStatus.draft },
    });
    await createDeposit(module, { community });
    const admin = await createAdmin(module);
    await expect(
      controller.deleteCommunity(
        { user: { sub: admin.userId } } as unknown as typeof request,
        community._id.toHexString()
      )
    ).rejects.toMatchObject(
      new ForbiddenException('Not allowed to delete communities with publications')
    );
  });

  it('should get community with communityPrivateDTO', async () => {
    const { community, communityOwner } = await createCommunity(module);

    const communityPrivateDTO = await controller.getCommunity(
      { user: { sub: communityOwner.userId } } as unknown as typeof request,
      community._id.toHexString()
    );
    expect('isPrivateDTO' in communityPrivateDTO).toBe(true);
    expect((communityPrivateDTO as CommunityPrivateDTO).isPrivateDTO).toBe(true);
  });

  it('should raise exception when community not exist', async () => {
    const user = await createUser(module);
    await expect(
      controller.getCommunity(
        { user: { sub: user.userId } } as unknown as typeof request,
        generateObjectId()
      )
    ).rejects.toThrow(new NotFoundException('Community not found'));
  });

  it('should update community', async () => {
    const { community, communityOwner } = await createCommunity(module);

    const payload: CommunityUpdateDto = {
      name: 'Test update',
      newTracks: [
        { timestamp: Date.now(), title: 'First Track', description: '' },
        { timestamp: Date.now(), title: 'Second Track', description: '' },
      ],
      datacite: {
        pass: 'mypass',
        prefix: 'prefix',
        server: DATACITE_ENDPOINT.test,
        accountId: 'testaccount',
      },
      iThenticateAPIKey: 'ithenticateKey',
      acknowledgement: 'Hello',
    };

    const communityDTO = await controller.updateCommunity(
      { user: { sub: communityOwner.userId } } as unknown as typeof request,
      payload,
      community._id.toHexString()
    );
    expect(communityDTO.name).toBe('Test update');
  });

  it('should throw error updating community if two doi providers are passed', async () => {
    const { community, communityOwner } = await createCommunity(module);

    const payload: CommunityUpdateDto = {
      name: 'Test update',
      newTracks: [
        { timestamp: Date.now(), title: 'First Track', description: '' },
        { timestamp: Date.now(), title: 'Second Track', description: '' },
      ],
      datacite: {
        pass: 'mypass',
        prefix: 'prefix',
        server: DATACITE_ENDPOINT.test,
        accountId: 'testaccount',
      },
      crossref: {
        pass: 'crossref-pass',
        user: 'crossref-user',
        server: CROSSREF_ENDPOINT.test,
        role: 'crossref-role',
        prefixDOI: 'crossref-prefix',
      },
      iThenticateAPIKey: 'ithenticateKey',
      acknowledgement: 'Hello',
    };

    await expect(
      controller.updateCommunity(
        { user: { sub: communityOwner.userId } } as unknown as typeof request,
        payload,
        community._id.toHexString()
      )
    ).rejects.toThrow(new Error('Only one DOI provider can be active at the same time.'));
  });

  it('should raise and exception when deleting a track used in a deposit', async () => {
    const { community, communityOwner } = await createCommunity(module, {
      community: {
        newTracks: [{ timestamp: Date.now(), title: 'Example track', description: '' }],
      },
    });

    await createDeposit(module, {
      community,
      deposit: {
        status: DepositStatus.published,
        newTrackTimestamp: community.newTracks[0].timestamp,
      },
    });

    await expect(
      controller.updateCommunity(
        { user: { sub: communityOwner.userId } } as unknown as typeof request,
        {
          name: 'Test update',
          newTracks: [],
        },
        community._id.toHexString()
      )
    ).rejects.toMatchObject(
      new UnauthorizedException(
        'Error updating tracks. Track "Example track" cannot be deleted because is used in publications'
      )
    );
  });

  it('should raise and exception when deleting a track used in a session', async () => {
    const { community, communityOwner } = await createCommunity(module, {
      community: {
        newTracks: [{ timestamp: Date.now(), title: 'Example track', description: '' }],
      },
    });

    await createSession(module, community, {
      session: {
        newTrackTimestamp: community.newTracks[0].timestamp,
      },
    });

    await expect(
      controller.updateCommunity(
        { user: { sub: communityOwner.userId } } as unknown as typeof request,
        {
          newTracks: [],
        },
        community._id.toHexString()
      )
    ).rejects.toMatchObject(
      new UnauthorizedException(
        'Error updating tracks. Track "Example track" cannot be deleted because is used in sessions'
      )
    );
  });

  it('should raise exception when updating community does not exist', async () => {
    const user = await createUser(module);
    await expect(
      controller.updateCommunity(
        { user: { sub: user.userId } } as unknown as typeof request,
        { name: 'Test update' },
        generateObjectId()
      )
    ).rejects.toMatchObject(new NotFoundException('Community not found'));
  });

  it('should raise exception when updating community status', async () => {
    const { community, communityOwner } = await createCommunity(module);
    await expect(
      controller.updateCommunityStatus(
        { user: { sub: communityOwner.userId } } as unknown as typeof request,
        { status: CommunityStatus.pendingApproval },
        community._id.toHexString()
      )
    ).rejects.toMatchObject(
      new NotFoundException('You do not have permission to change the status')
    );
  });

  it('should update community status', async () => {
    const user = await createUser(module, { user: { roles: ['admin'] } });
    const { community } = await createCommunity(module);
    const communityUpdated = await controller.updateCommunityStatus(
      { user: { sub: user.userId } } as unknown as typeof request,
      { status: CommunityStatus.draft },
      community._id.toHexString()
    );
    expect(communityUpdated.status).toBe(CommunityStatus.draft);
  });

  it('should raise exception when an user (not owner or moderator) updates a community', async () => {
    const user = await createUser(module);
    const { community } = await createCommunity(module);
    await expect(
      controller.updateCommunity(
        { user: { sub: user.userId } } as unknown as typeof request,
        { name: 'Test update' },
        community._id.toHexString()
      )
    ).rejects.toMatchObject(new UnauthorizedException('Unauthorized action update'));
  });

  it('should get community pending approval deposits', async () => {
    const { community, moderator } = await createCommunity(module);
    const { deposit } = await createDeposit(module, { community });
    deposit.assignee = moderator._id;
    deposit.acceptedFor = AcceptedFor.Poster;
    await deposit.save();

    const deposits = await controller.getModeratorDeposits(
      { user: { sub: moderator.userId } } as unknown as typeof request,
      community._id.toHexString(),
      {
        query: deposit.title,
        status: deposit.status,
        newTrackTimestamp: deposit.newTrackTimestamp,
        sort: 'popular',
        moderator: moderator._id.toHexString(),
        acceptedFor: AcceptedFor.Poster,
      }
    );
    expect(deposits.deposits.length).toBe(1);
  });

  it('should get community deposits by ids', async () => {
    const { community, moderator } = await createCommunity(module);
    const { deposit } = await createDeposit(module, { community });
    await createDeposit(module, { community });

    const deposits = await controller.getModeratorDeposits(
      { user: { sub: moderator.userId } } as unknown as typeof request,
      community._id.toHexString(),
      {
        ids: [deposit._id.toHexString()],
      }
    );
    expect(deposits.deposits.length).toBe(1);
  });

  it('should fail when community visibilities are incorrect', async () => {
    const { community } = await createCommunity(module);

    community.showReviewToEveryone = true;
    community.showReviewToAuthor = false;

    //The pre hook of the schema is activated when save method has been called
    await expect(community.save()).rejects.toMatchObject(
      new Error('Show review to author must be true when show review to everyone is true.')
    );
  });

  it('should fail when community identity are incorrect', async () => {
    const { community } = await createCommunity(module);
    community.showIdentityToEveryone = true;
    community.showIdentityToAuthor = false;

    //The pre hook of the schema is activated when save method has been called
    await expect(community.save()).rejects.toMatchObject(
      new Error(
        'Show review identity to author must be true when show review identity to everyone is true.'
      )
    );
  });

  it('should get community invites with no invitations', async () => {
    const { community, moderator } = await createCommunity(module);

    const invites = await controller.getCommunityInvites(
      { user: { sub: moderator.userId } } as unknown as typeof request,
      community._id.toHexString(),
      {
        page: 0,
        limit: 10,
        status: InviteStatus.pending,
        query: '8',
        dateLimit: new Date(),
        dateStart: new Date(),
        sort: 1,
      }
    );
    expect(invites.invites.length).toBe(0);
  });

  it('should get community invites with 1 invitation', async () => {
    const { community, moderator } = await createCommunity(module);
    const { deposit, author } = await createDeposit(module, { community });
    await createInvite(module, {
      sender: author,
      community,
      deposit,
      invite: {
        addressee: moderator.email,
        inviteType: InviteType.copyEditing,
        status: InviteStatus.pending,
      },
    });
    const invites = await controller.getCommunityInvites(
      { user: { sub: moderator.userId } } as unknown as typeof request,
      community._id.toHexString(),
      { page: 0, limit: 10, status: InviteStatus.pending }
    );
    expect(invites.invites.length).toBe(1);
  });

  it('should get community invites by id', async () => {
    const { community, moderator } = await createCommunity(module);
    const { deposit, author } = await createDeposit(module, { community });
    const { invite } = await createInvite(module, {
      sender: author,
      community,
      deposit,
      invite: {
        addressee: moderator.email,
        inviteType: InviteType.copyEditing,
        status: InviteStatus.pending,
      },
    });
    const invites = await controller.getCommunityInvites(
      { user: { sub: moderator.userId } } as unknown as typeof request,
      community._id.toHexString(),
      { page: 0, limit: 10, inviteIds: [invite._id.toHexString()] }
    );
    expect(invites.invites.length).toBe(1);
  });

  it('should raise exception when user not exist', async () => {
    const { community } = await createCommunity(module);

    await expect(
      controller.getModeratorDeposits(
        { user: { sub: generateObjectId() } } as unknown as typeof request,
        community._id.toHexString(),
        {}
      )
    ).rejects.toMatchObject(new NotFoundException('User not found'));
  });

  it('should raise exception when community not exist - getModeratorDeposits', async () => {
    const user = await createUser(module, { user: { roles: ['admin'] } });
    await expect(
      controller.getModeratorDeposits(
        { user: { sub: user.userId } } as unknown as typeof request,
        generateObjectId(),
        {}
      )
    ).rejects.toMatchObject(new NotFoundException('Community not found'));
  });

  it('should raise exception when an user (not owner or moderator) get community pending approval deposits', async () => {
    const user = await createUser(module);
    const { community } = await createCommunity(module);
    await expect(
      controller.getModeratorDeposits(
        { user: { sub: user.userId } } as unknown as typeof request,
        community._id.toHexString(),
        {}
      )
    ).rejects.toMatchObject(new UnauthorizedException('Unauthorized action moderate'));
  });

  it('should get community pending approval reviews', async () => {
    const { community, moderator } = await createCommunity(module);
    const { deposit } = await createDeposit(module, { community });
    const { review } = await createReview(module, deposit, {
      review: { status: ReviewStatus.pendingApproval },
    });
    await createReview(module, deposit, { review: { status: ReviewStatus.pendingApproval } });

    const reviewsQueryDTO = await controller.getModeratorReviews(
      { user: { sub: moderator.userId } } as unknown as typeof request,
      community._id.toHexString(),
      {
        query: deposit.title,
        reviewKind: ReviewKind.peerReview,
        reviewStatus: ReviewStatus.pendingApproval,
        newTrackTimestamp: deposit.newTrackTimestamp,
      }
    );
    expect(reviewsQueryDTO.reviews.length).toBe(2);

    const reviewsQueryDTO2 = await controller.getModeratorReviews(
      { user: { sub: moderator.userId } } as unknown as typeof request,
      community._id.toHexString(),
      {
        reviewKind: ReviewKind.peerReview,
        reviewStatus: ReviewStatus.pendingApproval,
        newTrackTimestamp: deposit.newTrackTimestamp,
      }
    );
    expect(reviewsQueryDTO2.reviews.length).toBe(2);

    const reviewsQueryDTO3 = await controller.getModeratorReviews(
      { user: { sub: moderator.userId } } as unknown as typeof request,
      community._id.toHexString(),
      {
        ids: [review._id.toHexString()],
      }
    );
    expect(reviewsQueryDTO3.reviews.length).toBe(1);
    expect(reviewsQueryDTO3.reviews.pop()?._id).toBe(review._id.toHexString());
  });

  it('should raise exception when user not exist - getModeratorReviews', async () => {
    const { community } = await createCommunity(module);
    await expect(
      controller.getModeratorReviews(
        { user: { sub: generateObjectId() } } as unknown as typeof request,
        community._id.toHexString(),
        {}
      )
    ).rejects.toMatchObject(new NotFoundException('User not found'));
  });

  it('should raise exception when community not exist - getModeratorReviews', async () => {
    const user = await createUser(module);
    await expect(
      controller.getModeratorReviews(
        { user: { sub: user.userId } } as unknown as typeof request,
        generateObjectId(),
        {}
      )
    ).rejects.toMatchObject(new NotFoundException('Community not found'));
  });

  it('should raise exception when an user (not owner or moderator) get community pending approval reviews', async () => {
    const { community } = await createCommunity(module);
    const user = await createUser(module);

    await expect(
      controller.getModeratorReviews(
        { user: { sub: user.userId } } as unknown as typeof request,
        community._id.toHexString(),
        {}
      )
    ).rejects.toMatchObject(new UnauthorizedException('Unauthorized action moderate'));
  });

  it('should add a moderator', async () => {
    const spy = jest.spyOn(eventService, 'create');
    const { community, communityOwner } = await createCommunity(module);
    const newModerator = await createUser(module);
    assertIsDefined(newModerator.email);
    const communityDTO = await controller.addModerator(
      { user: { sub: communityOwner.userId } } as unknown as typeof request,
      {
        role: ModeratorRole.moderator,
        email: newModerator.email,
      },
      community._id.toHexString()
    );
    expect(communityDTO.moderatorsPopulated.length).toEqual(3);
    expect(
      communityDTO.moderatorsPopulated.some(
        moderatorEntry => moderatorEntry.user._id === newModerator._id.toHexString()
      )
    ).toBe(true);
    expect(spy).toHaveBeenCalled();
  });

  it('should fail addModerator when community not exist', async () => {
    const user = await createUser(module);
    await expect(
      controller.addModerator(
        { user: { sub: user.userId } } as unknown as typeof request,
        {
          role: ModeratorRole.moderator,
          email: 'email@example.com',
        },
        generateObjectId()
      )
    ).rejects.toMatchObject(new NotFoundException('Community not found'));
  });

  it('should raise exception when user can not add moderators to a community', async () => {
    const { community } = await createCommunity(module);
    const user = await createUser(module);
    await expect(
      controller.addModerator(
        { user: { sub: user.userId } } as unknown as typeof request,
        {
          role: ModeratorRole.moderator,
          email: 'newmoderator@example.com',
        },
        community._id.toHexString()
      )
    ).rejects.toMatchObject(new UnauthorizedException('Unauthorized action update'));
  });

  it('should raise exception when moderator user email does not exist', async () => {
    const { community, communityOwner } = await createCommunity(module);

    await expect(
      controller.addModerator(
        { user: { sub: communityOwner.userId } } as unknown as typeof request,
        {
          role: ModeratorRole.moderator,
          email: 'email@example.com',
        },
        community._id.toHexString()
      )
    ).rejects.toMatchObject(new NotFoundException('User not found'));
  });

  it('should raise exception if user is already assigned', async () => {
    const { community, communityOwner, moderator } = await createCommunity(module);
    assertIsDefined(moderator.email);
    await expect(
      controller.addModerator(
        { user: { sub: communityOwner.userId } } as unknown as typeof request,
        {
          role: ModeratorRole.moderator,
          email: moderator.email,
        },
        community._id.toHexString()
      )
    ).rejects.toMatchObject(new UnauthorizedException('User already assigned'));
  });

  it('should delete a moderator', async () => {
    const { community, communityOwner, moderator } = await createCommunity(module);

    const communityDTO = await controller.deleteModerator(
      { user: { sub: communityOwner.userId } } as unknown as typeof request,
      community._id.toHexString(),
      moderator._id.toHexString()
    );
    expect(communityDTO.moderatorsPopulated.length).toEqual(1);
    expect(communityDTO.moderatorsPopulated[0].user._id).toEqual(communityOwner._id.toHexString());
  });

  it('should raise exception when user does not exist', async () => {
    const { community, communityOwner } = await createCommunity(module);
    await expect(
      controller.deleteModerator(
        { user: { sub: communityOwner.userId } } as unknown as typeof request,
        community._id.toHexString(),
        generateObjectId()
      )
    ).rejects.toMatchObject(new NotFoundException('User not found'));
  });

  it('should fail deleteModerator when community not exist', async () => {
    const user = await createUser(module);
    await expect(
      controller.deleteModerator(
        { user: { sub: user.userId } } as unknown as typeof request,
        generateObjectId(),
        user._id.toHexString()
      )
    ).rejects.toMatchObject(new NotFoundException('Community not found'));
  });

  it('should raise exception when user can not delete moderators to a community', async () => {
    const { community, moderator } = await createCommunity(module);
    const user = await createUser(module);

    await expect(
      controller.deleteModerator(
        { user: { sub: user.userId } } as unknown as typeof request,
        community._id.toHexString(),
        moderator._id.toHexString()
      )
    ).rejects.toMatchObject(new UnauthorizedException('Unauthorized action update'));
  });

  it('should update moderator', async () => {
    const { community, communityOwner, moderator } = await createCommunity(module);

    const moderators = await module.get(CommunitiesService).getModerators(community._id);
    const moderatorRow = moderators.find(moderatorRow =>
      moderatorRow.user._id.equals(moderator._id)
    );
    assertIsDefined(moderatorRow);
    const moderatorUpdated = await controller.updateModerator(
      { user: { sub: communityOwner.userId } } as unknown as typeof request,
      { notificationOptions: { tracks: [0] }, moderatorRole: ModeratorRole.owner },
      community._id.toHexString(),
      moderatorRow._id.toHexString()
    );
    expect(moderatorUpdated.notificationOptions?.tracks).toHaveLength(1);
    expect(moderatorUpdated.moderatorRole).toBe(ModeratorRole.owner);
  });

  it('should raise exception when moderator does not exist when updating moderator', async () => {
    const { community, communityOwner } = await createCommunity(module);

    await expect(
      controller.updateModerator(
        { user: { sub: communityOwner.userId } } as unknown as typeof request,
        { notificationOptions: { tracks: [0] } },
        community._id.toHexString(),
        generateObjectId()
      )
    ).rejects.toMatchObject(new NotFoundException('Moderator not found'));
  });

  it('should raise exception when community does not exist when updating moderator', async () => {
    const user = await createUser(module);
    await expect(
      controller.updateModerator(
        { user: { sub: user.userId } } as unknown as typeof request,
        { notificationOptions: { tracks: [0] } },
        generateObjectId(),
        user._id.toHexString()
      )
    ).rejects.toMatchObject(new NotFoundException('Community not found'));
  });

  it('should submit community', async () => {
    const { community, communityOwner } = await createCommunity(module, {
      community: { status: CommunityStatus.draft },
    });

    const communityDTO = await controller.submitCommunity(
      { user: { sub: communityOwner.userId } } as unknown as typeof request,
      community._id.toHexString()
    );

    expect(communityDTO.status).toBe(CommunityStatus.pendingApproval);
  });

  it('should try to submit community and fail', async () => {
    const { community, communityOwner } = await createCommunity(module);
    await expect(
      controller.submitCommunity(
        { user: { sub: communityOwner.userId } } as unknown as typeof request,
        community._id.toHexString()
      )
    ).rejects.toMatchObject(new ForbiddenException('Community is not in Draft status'));
  });

  it('should raise exception when try to upload community file with a not allowed extension file', async () => {
    const file: AppFile = {
      lastModified: 7,
      name: 'file.xxx',
      size: 7,
      type: 'application/xxx',
    };
    const createImageDTO: CreateImageDTO = {
      file: file,
      communityImage: 'logo',
    };
    const { community, communityOwner } = await createCommunity(module);

    await expect(
      controller.uploadImages(
        { user: { sub: communityOwner.userId } } as unknown as typeof request,
        community._id.toHexString(),
        createImageDTO
      )
    ).rejects.toMatchObject(new UnauthorizedException('Invalid extension file'));
  });

  it('should raise exception when try to upload community file with no authorization', async () => {
    const file: AppFile = {
      lastModified: 7,
      name: 'file.xxx',
      size: 7,
      type: 'application/xxx',
    };
    const createImageDTO: CreateImageDTO = {
      file: file,
      communityImage: 'logo',
    };
    const { community } = await createCommunity(module);
    const user = await createUser(module);

    await expect(
      controller.uploadImages(
        { user: { sub: user.userId } } as unknown as typeof request,
        community._id.toHexString(),
        createImageDTO
      )
    ).rejects.toMatchObject(new UnauthorizedException('Unauthorized action update'));
  });

  it('should upload community file logo', async () => {
    const file: AppFile = {
      lastModified: 7,
      name: 'file.png',
      size: 7,
      type: 'application/png',
    };
    const createImageDTO: CreateImageDTO = {
      file: file,
      communityImage: 'logo',
    };
    const { community, communityOwner } = await createCommunity(module);

    const signedURL = await controller.uploadImages(
      { user: { sub: communityOwner.userId } } as unknown as typeof request,
      community._id.toHexString(),
      createImageDTO
    );
    expect(signedURL.fileMetadata.filename).toStrictEqual('logo.png');
  });

  it('should upload community file banner', async () => {
    const file: AppFile = {
      lastModified: 7,
      name: 'file.png',
      size: 7,
      type: 'application/png',
    };
    const createImageDTO: CreateImageDTO = {
      file: file,
      communityImage: 'banner',
    };
    const { community, communityOwner } = await createCommunity(module);
    const signedURL = await controller.uploadImages(
      { user: { sub: communityOwner.userId } } as unknown as typeof request,
      community._id.toHexString(),
      createImageDTO
    );
    expect(signedURL.fileMetadata.filename).toStrictEqual('banner.png');
  });

  it('should upload community file card', async () => {
    const file: AppFile = {
      lastModified: 7,
      name: 'file.png',
      size: 7,
      type: 'application/png',
    };
    const createImageDTO: CreateImageDTO = {
      file: file,
      communityImage: 'card',
    };
    const { community, communityOwner } = await createCommunity(module);
    const signedURL = await controller.uploadImages(
      { user: { sub: communityOwner.userId } } as unknown as typeof request,
      community._id.toHexString(),
      createImageDTO
    );
    expect(signedURL.fileMetadata.filename).toStrictEqual('card.png');
  });

  it('should fail when upload community file with invalid extension or type', async () => {
    const createImageDTO: CommunityUploadConfirmation = {
      imageType: 'logo',
      fileMetadata: {
        filename: 'example.exe',
        description: 'example.exe',
        contentType: 'image/png',
        contentLength: 1,
        tags: ['Community'],
      },
    };
    const { community, communityOwner } = await createCommunity(module);

    await expect(
      controller.uploadImagesConfirmation(
        { user: { sub: communityOwner.userId } } as unknown as typeof request,
        community._id.toHexString(),
        createImageDTO
      )
    ).rejects.toMatchObject(new UnauthorizedException('Invalid extension file'));

    const createImageInvalidType: CommunityUploadConfirmation = {
      imageType: 'invalid',
      fileMetadata: {
        filename: 'example.png',
        description: 'example.png',
        contentType: 'image/png',
        contentLength: 1,
        tags: ['Community'],
      },
    };
    await expect(
      controller.uploadImagesConfirmation(
        { user: { sub: communityOwner.userId } } as unknown as typeof request,
        community._id.toHexString(),
        createImageInvalidType
      )
    ).rejects.toMatchObject(new BadRequestException('Unknown image type'));
  });

  it('should upload community file confirmation logo', async () => {
    const createImageDTO: CommunityUploadConfirmation = {
      imageType: 'logo',
      fileMetadata: {
        filename: 'example.png',
        description: 'example.png',
        contentType: 'image/png',
        contentLength: 1,
        tags: ['Community'],
      },
    };
    const { community, communityOwner } = await createCommunity(module);

    await controller.uploadImagesConfirmation(
      { user: { sub: communityOwner.userId } } as unknown as typeof request,
      community._id.toHexString(),
      createImageDTO
    );
  });

  it('should upload community file confirmation banner', async () => {
    const createImageDTO: CommunityUploadConfirmation = {
      imageType: 'banner',
      fileMetadata: {
        filename: 'example.png',
        description: 'example.png',
        contentType: 'image/png',
        contentLength: 1,
        tags: ['Community'],
      },
    };
    const { community, communityOwner } = await createCommunity(module);
    await controller.uploadImagesConfirmation(
      { user: { sub: communityOwner.userId } } as unknown as typeof request,
      community._id.toHexString(),
      createImageDTO
    );
  });

  it('should upload community file confirmation card', async () => {
    const createImageDTO: CommunityUploadConfirmation = {
      imageType: 'card',
      fileMetadata: {
        filename: 'example.png',
        description: 'example.png',
        contentType: 'image/png',
        contentLength: 1,
        tags: ['Community'],
      },
    };
    const { community, communityOwner } = await createCommunity(module);
    await controller.uploadImagesConfirmation(
      { user: { sub: communityOwner.userId } } as unknown as typeof request,
      community._id.toHexString(),
      createImageDTO
    );
  });

  it('should get communities pending approval and reject', async () => {
    await createCommunity(module, { community: { status: CommunityStatus.pendingApproval } });
    const user = await createUser(module);
    const admin = await createUser(module, { user: { roles: ['admin'] } });

    await expect(
      controller.getCommunitiesPendingApproval({
        user: { sub: user.userId },
      } as unknown as typeof request)
    ).rejects.toMatchObject(new UnauthorizedException('Unauthorized'));

    const result = await controller.getCommunitiesPendingApproval({
      user: { sub: admin.userId },
    } as unknown as typeof request);
    expect(result.length).toEqual(1);
  });

  it('should accept communities pending approval', async () => {
    const { community } = await createCommunity(module, {
      community: { status: CommunityStatus.draft },
    });
    const user = await createUser(module);
    const admin = await createUser(module, { user: { roles: ['admin'] } });

    await expect(
      controller.acceptCommunity(
        {
          user: { sub: user.userId },
        } as unknown as typeof request,
        community._id.toHexString()
      )
    ).rejects.toMatchObject(new ForbiddenException('Only admins can perform this operation'));

    await expect(
      controller.acceptCommunity(
        {
          user: { sub: admin.userId },
        } as unknown as typeof request,
        community._id.toHexString()
      )
    ).rejects.toMatchObject(new ForbiddenException('Community is not in pending approval'));

    community.status = CommunityStatus.pendingApproval;
    await community.save();

    const result = await controller.acceptCommunity(
      {
        user: { sub: admin.userId },
      } as unknown as typeof request,
      community._id.toHexString()
    );
    expect(result.status).toEqual(CommunityStatus.published);
  });

  it('should return deposits without invitations', async () => {
    const { moderator, community } = await createCommunity(module);
    const { deposit, author } = await createDeposit(module, { community });
    await createInvite(module, {
      sender: author,
      community,
      deposit,
      invite: { data: { depositId: deposit._id, depositTitle: deposit.title } },
    });

    const depositsWithoutInvitations = await controller.getCommunityDepositsWithoutInvites(
      {
        user: { sub: moderator.userId },
      } as unknown as typeof request,
      community._id.toHexString()
    );

    expect(depositsWithoutInvitations[0]).toBe(deposit._id.toHexString());
  });

  it('should raise exception accept communities pending approval', async () => {
    const { community } = await createCommunity(module, {
      community: { status: CommunityStatus.draft },
    });
    const user = await createUser(module);
    await expect(
      controller.acceptCommunity(
        {
          user: { sub: user.userId },
        } as unknown as typeof request,
        community._id.toHexString()
      )
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should return community submissions', async () => {
    const { community, moderator } = await createCommunity(module);
    const { deposit } = await createDeposit(module, { community });

    const res = {
      send: jest.fn().mockImplementation(),
      attachment: jest.fn().mockImplementation(),
    } as unknown as Response;

    await controller.exportSubmissions(
      {
        user: { sub: moderator.userId },
      } as unknown as typeof request,
      res,
      community._id.toHexString()
    );

    expect(res.send).toHaveBeenCalledWith(expect.stringContaining(deposit.title));
  });

  it('should not return community submissions', async () => {
    const { community, moderator } = await createCommunity(module);

    const res = {
      send: jest.fn().mockImplementation(),
      attachment: jest.fn().mockImplementation(),
    } as unknown as Response;

    await controller.exportSubmissions(
      {
        user: { sub: moderator.userId },
      } as unknown as typeof request,
      res,
      community._id.toHexString()
    );

    expect(res.send).toHaveBeenCalledWith('');
  });

  it('should raise exception when the user is not moderator try to export submisions', async () => {
    const { community } = await createCommunity(module);
    const user = await createUser(module);
    const res = {
      send: jest.fn().mockImplementation(),
      attachment: jest.fn().mockImplementation(),
    } as unknown as Response;

    await expect(
      controller.exportSubmissions(
        {
          user: { sub: user.userId },
        } as unknown as typeof request,
        res,
        community._id.toHexString()
      )
    ).rejects.toMatchObject(new UnauthorizedException('Unauthorized action moderate'));
  });

  it('should reject send email to users', async () => {
    const { community } = await createCommunity(module);
    const user = await createUser(module);
    const sendEmailToUsersPayload: SendCommunityEmailsDTO = {
      subject: 'Community Invitation',
      message: 'Time to join us',
      emails: ['example@example.com', 'example1@example.com'],
    };

    await expect(
      controller.sendEmailToUsers(
        {
          user: { sub: user.userId },
        } as unknown as typeof request,
        sendEmailToUsersPayload,
        community._id.toHexString()
      )
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should sendEmailToUsers email to users', async () => {
    const { community, moderator } = await createCommunity(module);
    const sendEmailToUsersPayload: SendCommunityEmailsDTO = {
      subject: 'Community Invitation',
      message: 'Time to join us',
      emails: ['example@example.com', 'example1@example.com'],
    };
    const spy = jest.spyOn(eventService, 'create').mockImplementation();

    await controller.sendEmailToUsers(
      {
        user: { sub: moderator.userId },
      } as unknown as typeof request,
      sendEmailToUsersPayload,
      community._id.toHexString()
    );

    expect(spy).toHaveBeenCalled();
  });

  it('should getModeratorDepositsEmails', async () => {
    const { community, moderator } = await createCommunity(module);
    const author = await createUser(module);
    await createDepositSet(module, community, author);
    const { author: author2 } = await createDeposit(module, { community });
    const emailsQuery = await controller.getModeratorDepositsEmails(
      {
        user: { sub: moderator.userId },
      } as unknown as typeof request,
      community._id.toHexString(),
      {}
    );
    expect(emailsQuery.length).toBe(2);
    expect(emailsQuery[0].email).toBe(author.email);
    expect(emailsQuery[1].email).toBe(author2.email);
  });

  it('should getModeratorDepositsEmails using query parameters', async () => {
    const { community, moderator } = await createCommunity(module);
    const author = await createUser(module);
    const { preprint } = await createDepositSet(module, community, author);
    // Assign moderator so we can test the filter
    preprint.assignee = moderator._id;
    await preprint.save();

    const emailsQuery = await controller.getModeratorDepositsEmails(
      {
        user: { sub: moderator.userId },
      } as unknown as typeof request,
      community._id.toHexString(),
      {
        status: DepositStatus.preprint,
        acceptedFor: preprint.acceptedFor,
        query: preprint.title,
        newTrackTimestamp: preprint.newTrackTimestamp,
        moderator: moderator._id.toHexString(),
      }
    );
    expect(emailsQuery.length).toBe(1);
    expect(emailsQuery[0].email).toBe(author.email);
  });

  it('should getModeratorReviewsEmails', async () => {
    const { community, moderator } = await createCommunity(module);
    const { published, preprint } = await createDepositSet(module, community);
    await createReview(module, published);
    const { reviewer } = await createReview(module, preprint);
    const emailsQuery = await controller.getModeratorReviewsEmails(
      {
        user: { sub: moderator.userId },
      } as unknown as typeof request,
      community._id.toHexString(),
      {}
    );
    expect(emailsQuery.length).toBe(2);
    expect(emailsQuery[1].email).toBe(reviewer.email);
  });

  it('should getModeratorReviewsEmails using query parameters', async () => {
    const { community, moderator } = await createCommunity(module);
    const { published } = await createDepositSet(module, community);
    const { review, reviewer } = await createReview(module, published);
    await createReview(module, published, { review: { status: ReviewStatus.pendingApproval } });
    const emails = await controller.getModeratorReviewsEmails(
      {
        user: { sub: moderator.userId },
      } as unknown as typeof request,
      community._id.toHexString(),
      {
        reviewStatus: ReviewStatus.published,
        reviewKind: review.kind,
        query: published.title,
        newTrackTimestamp: published.newTrackTimestamp,
      }
    );
    expect(emails.length).toBe(1);
    expect(emails[0].email).toBe(reviewer.email);
  });

  it('should send email to users', async () => {
    const { community, moderator } = await createCommunity(module);

    const sendEmailToUsersPayload: SendCommunityEmailsDTO = {
      subject: 'Community Invitation',
      message: 'Time to join us',
      emails: ['example@example.com', 'example1@example.com'],
    };
    const spy = jest.spyOn(module.get(EventService), 'create');

    await controller.sendEmailToUsers(
      {
        user: { sub: moderator.userId },
      } as unknown as typeof request,
      sendEmailToUsersPayload,
      community._id.toHexString()
    );

    expect(spy).toHaveBeenCalled();
  });

  it('should get user active communities', async () => {
    const user = await createUser(module);
    const { community, moderator } = await createCommunity(module);
    await moderator.save();
    const { deposit } = await createDeposit(module, {
      community,
      deposit: {
        creator: user._id,
      },
    });
    await createDeposit(module, {
      community,
      deposit: {
        creator: user._id,
        title: 'examples',
      },
    });
    await createReview(module, deposit, {
      reviewer: user,
    });
    const communities = await controller.getMyCommunities({
      user: { sub: user.userId },
    } as unknown as typeof request);
    expect(communities.length).toBe(1);
  });
});
