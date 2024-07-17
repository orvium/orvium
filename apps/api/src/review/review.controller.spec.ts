import { Test, TestingModule } from '@nestjs/testing';
import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';
import { AwsStorageService } from '../common/aws-storage-service/aws-storage.service';
import { DepositService } from '../deposit/deposit.service';
import { InviteService } from '../invite/invite.service';
import { EventService } from '../event/event.service';
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
import { ReviewKind, ReviewStatus } from './review.schema';
import {
  createCommunity,
  createDeposit,
  createInvite,
  createReview,
  createUser,
  factoryFileMetadata,
} from '../utils/test-data';
import { request, response } from 'express';
import { CreateReviewDTO } from '../dtos/review/create-review.dto';
import { AppFile, CreateFileDTO } from '../dtos/create-file.dto';
import { assertIsDefined, CROSSREF_ENDPOINT, generateObjectId } from '../utils/utils';
import { cleanCollections, MongooseTestingModule } from '../utils/mongoose-testing.module';
import { DepositStatus } from '../deposit/deposit.schema';
import { InviteType } from '../invite/invite.schema';
import { FileMetadata } from '../dtos/filemetadata.dto';
import { DATACITE_ENDPOINT, DataciteService } from '../datacite/datacite.service';
import { CrossrefService } from '../crossref/crossref.service';

describe('Review Controller', () => {
  let controller: ReviewController;
  let reviewService: ReviewService;
  let depositService: DepositService;
  let inviteService: InviteService;
  let awsStorageService: AwsStorageService;
  let eventService: EventService;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [MongooseTestingModule.forRoot('reviewController')],
      controllers: [ReviewController],
      providers: [],
    }).compile();
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    controller = module.get(ReviewController);
    reviewService = module.get(ReviewService);
    awsStorageService = module.get(AwsStorageService);
    depositService = module.get(DepositService);
    inviteService = module.get(InviteService);
    eventService = module.get(EventService);
    await cleanCollections(module);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get reviews', async () => {
    const { community } = await createCommunity(module);
    const { deposit } = await createDeposit(module, {
      community,
      deposit: { status: DepositStatus.published },
    });
    const { review, reviewer } = await createReview(module, deposit);
    const result = await controller.getReviews(
      { user: { sub: reviewer.userId } } as unknown as typeof request,
      deposit._id.toHexString(),
      reviewer.userId
    );

    expect(result.length).toBe(1);
    expect(result[0].creator).toStrictEqual(reviewer._id.toHexString());
    expect(result[0]._id).toStrictEqual(review._id.toHexString());
  });

  it('should get my reviews', async () => {
    const { community } = await createCommunity(module);
    const { deposit } = await createDeposit(module, {
      community,
      deposit: { status: DepositStatus.published },
    });
    const { review, reviewer } = await createReview(module, deposit);
    const result = await controller.getMyReviews(
      {
        user: { sub: reviewer.userId },
      } as unknown as typeof request,
      {}
    );
    expect(result.reviews.length).toBe(1);
    expect(result.reviews[0].creator).toStrictEqual(reviewer._id.toHexString());
    expect(result.reviews[0]._id).toStrictEqual(review._id.toHexString());
  });

  it('should get review', async () => {
    const { community } = await createCommunity(module);
    const { deposit } = await createDeposit(module, {
      community,
      deposit: { status: DepositStatus.published },
    });
    const { review, reviewer } = await createReview(module, deposit);
    const result = await controller.getReview(
      { user: { sub: reviewer.userId } } as unknown as typeof request,
      review._id.toHexString()
    );
    expect(result.creator).toStrictEqual(reviewer._id.toHexString());
    expect(result._id).toStrictEqual(review._id.toHexString());
  });

  it('should get review with hidden identity reviewer', async () => {
    const { community } = await createCommunity(module);
    const { deposit, author } = await createDeposit(module, {
      community,
      deposit: {
        status: DepositStatus.published,
      },
    });
    const { review } = await createReview(module, deposit, {
      review: {
        showIdentityToEveryone: false,
        showIdentityToAuthor: false,
        showReviewToEveryone: true,
        showReviewToAuthor: true,
      },
    });
    const result = await controller.getReview(
      { user: { sub: author.userId } } as unknown as typeof request,
      review._id.toHexString()
    );
    expect(result.creator).toStrictEqual('fake');
    expect(result._id).toStrictEqual(review._id.toHexString());
    expect(result.ownerProfile.firstName).toBe('Hidden');
  });

  it('should get review in pending approval as moderator', async () => {
    const { community, communityOwner } = await createCommunity(module);
    const { deposit } = await createDeposit(module, {
      community,
      deposit: { status: DepositStatus.published },
    });
    const { review, reviewer } = await createReview(module, deposit, {
      review: { status: ReviewStatus.pendingApproval },
    });

    const result = await controller.getReviews(
      { user: { sub: communityOwner.userId } } as unknown as typeof request,
      deposit._id.toHexString()
    );
    expect(result.length).toBe(1);
    expect(result[0].creator).toStrictEqual(reviewer._id.toHexString());
    expect(result[0]._id).toStrictEqual(review._id.toHexString());
  });

  describe('[showReviewToEveryone: true, showReviewToAuthor: true]', () => {
    it('[getReview] should enforce correct visibility for anonymous users', async () => {
      const { community } = await createCommunity(module);
      const { deposit } = await createDeposit(module, {
        community,
        deposit: {
          status: DepositStatus.published,
        },
      });
      const { review } = await createReview(module, deposit, {
        review: {
          status: ReviewStatus.draft,
          showReviewToEveryone: true,
          showReviewToAuthor: true,
        },
      });

      await expect(
        controller.getReview(
          { user: { sub: undefined } } as unknown as typeof request,
          review._id.toHexString()
        )
      ).rejects.toThrow(UnauthorizedException);

      review.status = ReviewStatus.pendingApproval;
      await review.save();

      await expect(
        controller.getReview(
          { user: { sub: undefined } } as unknown as typeof request,
          review._id.toHexString()
        )
      ).rejects.toThrow(UnauthorizedException);

      review.status = ReviewStatus.published;
      await review.save();

      const result = await controller.getReview(
        { user: { sub: undefined } } as unknown as typeof request,
        review._id.toHexString()
      );
      expect(result._id).toBe(review._id.toHexString());
      expect(result.comments).toBe(review.comments);
    });
    it('[getReviews] should enforce correct visibility for anonymous users', async () => {
      const { community } = await createCommunity(module);
      const { deposit } = await createDeposit(module, {
        community,
        deposit: {
          status: DepositStatus.published,
        },
      });
      const { review } = await createReview(module, deposit, {
        review: {
          status: ReviewStatus.draft,
          showReviewToEveryone: true,
          showReviewToAuthor: true,
        },
      });

      const resultDraft = await controller.getReviews(
        { user: { sub: undefined } } as unknown as typeof request,
        deposit._id.toHexString()
      );
      expect(resultDraft.length).toBe(0);

      review.status = ReviewStatus.pendingApproval;
      await review.save();
      const resultPendingApproval = await controller.getReviews(
        { user: { sub: undefined } } as unknown as typeof request,
        deposit._id.toHexString()
      );
      expect(resultPendingApproval.length).toBe(0);

      review.status = ReviewStatus.published;
      await review.save();
      const resultPublished = await controller.getReviews(
        { user: { sub: undefined } } as unknown as typeof request,
        deposit._id.toHexString()
      );
      expect(resultPublished.length).toBe(1);
    });
  });

  describe('[showReviewToEveryone: false, showReviewToAuthor: true]', () => {
    it('[getReview] should enforce correct visibility for anonymous users', async () => {
      const { community } = await createCommunity(module);
      const { deposit } = await createDeposit(module, {
        community,
        deposit: { status: DepositStatus.published },
      });
      const { review } = await createReview(module, deposit, {
        review: {
          status: ReviewStatus.draft,
          showReviewToEveryone: false,
          showReviewToAuthor: true,
        },
      });

      // Check ReviewStatus.draft
      await expect(
        controller.getReview(
          { user: { sub: undefined } } as unknown as typeof request,
          review._id.toHexString()
        )
      ).rejects.toThrow(UnauthorizedException);

      // Check ReviewStatus.pendingApproval
      review.status = ReviewStatus.pendingApproval;
      await review.save();

      await expect(
        controller.getReview(
          { user: { sub: undefined } } as unknown as typeof request,
          review._id.toHexString()
        )
      ).rejects.toThrow(UnauthorizedException);

      // Check ReviewStatus.published
      review.status = ReviewStatus.published;
      await review.save();
      await expect(
        controller.getReview(
          { user: { sub: undefined } } as unknown as typeof request,
          review._id.toHexString()
        )
      ).rejects.toThrow(UnauthorizedException);
    });

    it('[getReviews] should enforce correct visibility for anonymous users', async () => {
      const { community } = await createCommunity(module);
      const { deposit } = await createDeposit(module, {
        community,
        deposit: { status: DepositStatus.published },
      });
      const { review } = await createReview(module, deposit, {
        review: {
          status: ReviewStatus.draft,
          showReviewToEveryone: false,
          showReviewToAuthor: true,
        },
      });

      const resultDraft = await controller.getReviews(
        { user: { sub: undefined } } as unknown as typeof request,
        deposit._id.toHexString()
      );
      expect(resultDraft.length).toBe(0);

      review.status = ReviewStatus.pendingApproval;
      await review.save();
      const resultPendingApproval = await controller.getReviews(
        { user: { sub: undefined } } as unknown as typeof request,
        deposit._id.toHexString()
      );
      expect(resultPendingApproval.length).toBe(0);

      review.status = ReviewStatus.published;
      await review.save();
      const resultPublished = await controller.getReviews(
        { user: { sub: undefined } } as unknown as typeof request,
        deposit._id.toHexString()
      );
      expect(resultPublished.length).toBe(0);
    });
  });

  it('should raise exception when review not exist', async () => {
    await expect(
      controller.getReview(
        { user: { sub: undefined } } as unknown as typeof request,
        '6087d8f758c481eb3e4a9e10'
      )
    ).rejects.toThrow(NotFoundException);
  });

  it('should create a review', async () => {
    const { community, communityOwner } = await createCommunity(module, {
      community: {
        privateReviews: true,
      },
    });
    const { deposit } = await createDeposit(module, {
      community,
      deposit: { status: DepositStatus.published },
    });
    const reviewer = await createUser(module);
    assertIsDefined(reviewer.email);

    const { invite: invitation } = await createInvite(module, {
      sender: communityOwner,
      community,
      deposit,
      invite: {
        addressee: reviewer.email,
        inviteType: InviteType.copyEditing,
      },
    });

    const createReviewDTO: CreateReviewDTO = {
      deposit: deposit._id.toHexString(),
      invite: invitation._id.toHexString(),
    };

    const review = await controller.createReview(
      { user: { sub: reviewer.userId } } as unknown as typeof request,
      createReviewDTO
    );
    assertIsDefined(review);
    expect(review.creator).toStrictEqual(reviewer._id.toHexString());
    expect(review.depositPopulated._id).toStrictEqual(deposit._id.toHexString());
    expect(review.kind).toBe(ReviewKind.copyEditing);

    // Retrieve the deposit populated with review already saved
    const depositPopulated = await depositService.findById(deposit._id);
    assertIsDefined(depositPopulated);
    expect(depositPopulated.peerReviews.length).toBe(1);

    // Check invitation has been updated as well
    const inviteReloaded = await inviteService.findById(invitation._id);
    assertIsDefined(inviteReloaded);
    expect(inviteReloaded.data.reviewId).toBeDefined();
  });

  it('should raise exception if reviewer has not been invited in a community with private reviews', async () => {
    const { community } = await createCommunity(module, {
      community: {
        privateReviews: true,
      },
    });
    const { deposit } = await createDeposit(module, {
      community,
      deposit: { status: DepositStatus.published },
    });
    const reviewer = await createUser(module);

    const createReviewDTO: CreateReviewDTO = {
      deposit: deposit._id.toHexString(),
    };
    await expect(
      controller.createReview(
        { user: { sub: reviewer.userId } } as unknown as typeof request,
        createReviewDTO
      )
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should raise exception when try to create a review on a draft deposit', async () => {
    const { community } = await createCommunity(module);
    const { deposit } = await createDeposit(module, {
      community,
      deposit: { status: DepositStatus.draft },
    });
    const reviewer = await createUser(module);

    const createReviewDTO: CreateReviewDTO = {
      deposit: deposit._id.toHexString(),
    };
    await expect(
      controller.createReview(
        { user: { sub: reviewer.userId } } as unknown as typeof request,
        createReviewDTO
      )
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should raise exception when try review a deposit that not exist', async () => {
    const reviewer = await createUser(module);
    const createReviewDTO: CreateReviewDTO = {
      deposit: '6087d8f758c481eb3e4a9e10',
    };
    await expect(
      controller.createReview(
        { user: { sub: reviewer.userId } } as unknown as typeof request,
        createReviewDTO
      )
    ).rejects.toThrow(NotFoundException);
  });

  it('should raise exception when try review a user that not exist', async () => {
    const { community } = await createCommunity(module);
    const { deposit } = await createDeposit(module, {
      community,
      deposit: { status: DepositStatus.published },
    });
    const createReviewDTO: CreateReviewDTO = {
      deposit: deposit._id.toHexString(),
    };
    await expect(
      controller.createReview(
        { user: { sub: 'xxx' } } as unknown as typeof request,
        createReviewDTO
      )
    ).rejects.toThrow(NotFoundException);
  });

  it('should raise exception when invite does not exist', async () => {
    const { community } = await createCommunity(module);
    const { deposit } = await createDeposit(module, {
      community,
      deposit: { status: DepositStatus.published },
    });
    const reviewer = await createUser(module);

    const createReviewDTO: CreateReviewDTO = {
      deposit: deposit._id.toHexString(),
      invite: '6087d8f758c481eb3e4a9e10',
    };
    await expect(
      controller.createReview(
        { user: { sub: reviewer.userId } } as unknown as typeof request,
        createReviewDTO
      )
    ).rejects.toThrow(NotFoundException);
  });

  it('should update a review and send to pending approval', async () => {
    const { community } = await createCommunity(module);
    const { deposit } = await createDeposit(module, {
      community,
      deposit: { status: DepositStatus.draft },
    });
    const { review, reviewer } = await createReview(module, deposit, {
      review: {
        status: ReviewStatus.draft,
      },
    });

    const reviewUpdated = await controller.submitReview(
      { user: { sub: reviewer.userId } } as unknown as typeof request,
      review._id.toHexString()
    );
    expect(reviewUpdated.status).toBe(ReviewStatus.pendingApproval);
  });

  it('should draft a review when in pending approval', async () => {
    const { community, communityOwner } = await createCommunity(module);
    const { deposit } = await createDeposit(module, {
      community,
      deposit: { status: DepositStatus.pendingApproval },
    });
    const { review } = await createReview(module, deposit, {
      review: {
        status: ReviewStatus.published,
      },
    });

    await expect(
      controller.draftReview(
        { user: { sub: communityOwner.userId } } as unknown as typeof request,
        { reason: 'My reason to send review to draft' },
        review._id.toHexString()
      )
    ).rejects.toMatchObject(new ForbiddenException('Review is not in pending approval'));

    review.status = ReviewStatus.pendingApproval;
    await review.save();
    const spy = jest.spyOn(eventService, 'create');
    const reviewUpdated = await controller.draftReview(
      { user: { sub: communityOwner.userId } } as unknown as typeof request,
      { reason: 'My reason to send review to draft' },
      review._id.toHexString()
    );
    expect(reviewUpdated.status).toBe(ReviewStatus.draft);
    expect(spy).toHaveBeenCalled();
  });

  it('should update a review and send to publish', async () => {
    const { community, communityOwner } = await createCommunity(module);
    const { deposit } = await createDeposit(module, {
      community,
      deposit: { status: DepositStatus.draft },
    });
    const { review } = await createReview(module, deposit, {
      review: {
        status: ReviewStatus.pendingApproval,
      },
    });

    const spy = jest.spyOn(eventService, 'create');
    const reviewUpdated = await controller.publishedReview(
      { user: { sub: communityOwner.userId } } as unknown as typeof request,
      review._id.toHexString()
    );
    expect(reviewUpdated.status).toBe(ReviewStatus.published);
    expect(spy).toHaveBeenCalled();
  });

  it('should raise exception when try to update review status an not admin user', async () => {
    const { community } = await createCommunity(module);
    const { deposit } = await createDeposit(module, {
      community,
      deposit: { status: DepositStatus.draft },
    });
    const { review, reviewer } = await createReview(module, deposit, {
      review: {
        status: ReviewStatus.pendingApproval,
      },
    });

    await expect(
      controller.publishedReview(
        { user: { sub: reviewer.userId } } as unknown as typeof request,
        review._id.toHexString()
      )
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should allow only moderators to update the review when published', async () => {
    const { community, communityOwner } = await createCommunity(module);
    const { deposit } = await createDeposit(module, {
      community,
      deposit: { status: DepositStatus.published },
    });
    const { review, reviewer } = await createReview(module, deposit, {
      review: {
        status: ReviewStatus.published,
      },
    });
    await expect(
      controller.updateReview(
        { user: { sub: reviewer.userId } } as unknown as typeof request,
        { comments: 'ReviewStatus.draft' },
        review._id.toHexString()
      )
    ).rejects.toThrow(UnauthorizedException);

    await expect(
      controller.updateReview(
        { user: { sub: communityOwner.userId } } as unknown as typeof request,
        { comments: 'ReviewStatus.draft' },
        review._id.toHexString()
      )
    ).resolves.not.toThrow();
  });

  it('should allow only moderators to update showIdentity fields', async () => {
    const { community, moderator } = await createCommunity(module);
    const { deposit } = await createDeposit(module, {
      community,
      deposit: { status: DepositStatus.published },
    });
    const user = await createUser(module);
    const { review } = await createReview(module, deposit, {
      review: {
        status: ReviewStatus.draft,
        creator: user._id,
      },
    });

    let result = await controller.updateReview(
      { user: { sub: moderator.userId } } as unknown as typeof request,
      { showIdentityToEveryone: true, showIdentityToAuthor: true },
      review._id.toHexString()
    );
    expect(result.showIdentityToEveryone).toBe(true);
    expect(result.showIdentityToAuthor).toBe(true);

    result = await controller.updateReview(
      { user: { sub: moderator.userId } } as unknown as typeof request,
      { showIdentityToEveryone: false, showIdentityToAuthor: false },
      review._id.toHexString()
    );
    expect(result.showIdentityToEveryone).toBe(false);
    expect(result.showIdentityToAuthor).toBe(false);

    result = await controller.updateReview(
      { user: { sub: moderator.userId } } as unknown as typeof request,
      { showIdentityToEveryone: false, showIdentityToAuthor: true },
      review._id.toHexString()
    );
    expect(result.showIdentityToEveryone).toBe(false);
    expect(result.showIdentityToAuthor).toBe(true);

    await expect(
      controller.updateReview(
        { user: { sub: moderator.userId } } as unknown as typeof request,
        { showIdentityToEveryone: true, showIdentityToAuthor: false },
        review._id.toHexString()
      )
    ).rejects.toMatchObject(
      new Error(
        'Show review identity to author must be true when show review identity to everyone is true.'
      )
    );
  });

  it('should not allow user to update showIdentity fields', async () => {
    const { community } = await createCommunity(module);
    const { deposit } = await createDeposit(module, {
      community,
      deposit: { status: DepositStatus.published },
    });
    const { review, reviewer } = await createReview(module, deposit, {
      review: {
        status: ReviewStatus.draft,
      },
    });
    await expect(
      controller.updateReview(
        { user: { sub: reviewer.userId } } as unknown as typeof request,
        { showIdentityToEveryone: true },
        review._id.toHexString()
      )
    ).rejects.toMatchObject(new UnauthorizedException('Unauthorized action moderate'));
  });

  it('should delete a review', async () => {
    const { community } = await createCommunity(module);
    const { deposit } = await createDeposit(module, {
      community,
      deposit: { status: DepositStatus.draft },
    });
    const { review, reviewer } = await createReview(module, deposit, {
      review: {
        status: ReviewStatus.draft,
        file: factoryFileMetadata.build(),
        extraFiles: factoryFileMetadata.buildList(2),
      },
    });

    const spyDelete = jest.spyOn(awsStorageService, 'delete').mockImplementation();

    // First fake reference in deposit to ensure deleting fails when there is inconsistent data
    deposit.peerReviews = [];
    await deposit.save();
    await expect(
      controller.deleteReview(
        { user: { sub: reviewer.userId } } as unknown as typeof request,
        review._id.toHexString()
      )
    ).rejects.toMatchObject(new NotFoundException('Review not found in deposit'));

    // Now restore correctly review reference in the deposit and ensure that deletion works
    deposit.peerReviews = [review._id];
    await deposit.save();
    await controller.deleteReview(
      { user: { sub: reviewer.userId } } as unknown as typeof request,
      review._id.toHexString()
    );

    const depositUpdated = await depositService.findById(deposit._id);
    assertIsDefined(depositUpdated);
    expect(depositUpdated.peerReviews.length).toBe(0);
    const myReviews = await controller.getMyReviews(
      {
        user: { sub: reviewer.userId },
      } as unknown as typeof request,
      {}
    );
    expect(myReviews.reviews.length).toBe(0);
    expect(spyDelete).toHaveBeenCalledTimes(3);
  });

  it('should delete a review with invitation', async () => {
    const { community, communityOwner } = await createCommunity(module);
    const { deposit } = await createDeposit(module, {
      community,
      deposit: { status: DepositStatus.draft },
    });
    const { review, reviewer } = await createReview(module, deposit, {
      review: {
        status: ReviewStatus.draft,
        wasInvited: true,
      },
    });
    const { invite: invitation } = await createInvite(module, {
      sender: communityOwner,
      community,
      deposit,
      invite: {
        addressee: reviewer.email,
        data: {
          reviewId: review._id,
        },
      },
    });

    await controller.deleteReview(
      { user: { sub: reviewer.userId } } as unknown as typeof request,
      review._id.toHexString()
    );

    const depositUpdated = await depositService.findById(deposit._id);
    assertIsDefined(depositUpdated);
    expect(depositUpdated.peerReviews.length).toBe(0);
    const myReviews = await controller.getMyReviews(
      {
        user: { sub: reviewer.userId },
      } as unknown as typeof request,
      {}
    );
    expect(myReviews.reviews.length).toBe(0);

    const invitationUpdated = await inviteService.findById(invitation._id);
    assertIsDefined(invitationUpdated);
    expect(invitationUpdated.data.reviewId).toBeUndefined();
  });

  it('should upload review file and return presignedURL', async () => {
    const { community } = await createCommunity(module);
    const { deposit } = await createDeposit(module, {
      community,
      deposit: { status: DepositStatus.draft },
    });
    const { review, reviewer } = await createReview(module, deposit, {
      review: {
        status: ReviewStatus.draft,
        file: factoryFileMetadata.build(),
      },
    });

    const appFile: AppFile = {
      lastModified: 1,
      name: 'test.pdf',
      size: 1,
      type: 'application/pdf',
    };

    // Check uploading a main file
    const spyStorage = jest.spyOn(awsStorageService, 'getSignedUrl').mockResolvedValue('link');
    const result = await controller.uploadReviewFile(
      { user: { sub: reviewer.userId } } as unknown as typeof request,
      review._id.toHexString(),
      { file: appFile },
      true
    );
    expect(spyStorage).toHaveBeenCalledWith(
      'putObject',
      expect.objectContaining({
        Bucket: 'myPrivateBucket',
        ContentType: 'application/pdf',
        Key: `reviews/${review._id.toHexString()}/${result.fileMetadata.filename}`,
      })
    );

    expect(result).toStrictEqual({
      signedUrl: 'link',
      fileMetadata: {
        contentLength: 1,
        contentType: 'application/pdf',
        filename: result.fileMetadata.filename,
        description: appFile.name,
        tags: [],
      } as FileMetadata,
      isMainFile: true,
      replacePDF: false,
    });
    expect(result.fileMetadata.filename).toBe(`review-${review._id.toHexString()}.pdf`);

    // Check that existing file in the review has been reset and is undefined (waiting for file confirmation)
    const reviewUpdated = await reviewService.findById(review._id);
    assertIsDefined(reviewUpdated);
    expect(reviewUpdated.file).toBeUndefined();

    // Check uploading extra file
    spyStorage.mockClear();
    const resultExtraFile = await controller.uploadReviewFile(
      { user: { sub: reviewer.userId } } as unknown as typeof request,
      review._id.toHexString(),
      { file: appFile },
      false
    );
    expect(spyStorage).toHaveBeenCalledWith(
      'putObject',
      expect.objectContaining({
        Bucket: 'myPrivateBucket',
        ContentType: 'application/pdf',
        Key: `reviews/${review._id.toHexString()}/${resultExtraFile.fileMetadata.filename}`,
      })
    );

    expect(resultExtraFile).toStrictEqual({
      signedUrl: 'link',
      fileMetadata: {
        contentLength: 1,
        contentType: 'application/pdf',
        filename: resultExtraFile.fileMetadata.filename,
        description: appFile.name,
        tags: [],
      } as FileMetadata,
      isMainFile: false,
      replacePDF: false,
    });
    expect(resultExtraFile.fileMetadata.filename).toContain(`extra-${review._id.toHexString()}-`);
  });

  it('should raise exception when try to upload review file to a review that is published', async () => {
    const { community } = await createCommunity(module);
    const { deposit } = await createDeposit(module, {
      community,
      deposit: { status: DepositStatus.draft },
    });
    const { review, reviewer } = await createReview(module, deposit, {
      review: {
        status: ReviewStatus.published,
        file: factoryFileMetadata.build(),
      },
    });
    await expect(
      controller.uploadReviewFile(
        { user: { sub: reviewer.userId } } as unknown as typeof request,
        review._id.toHexString(),
        {} as unknown as CreateFileDTO,
        true
      )
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should raise exception when try to upload review file with invalid extension', async () => {
    const { community } = await createCommunity(module);
    const { deposit } = await createDeposit(module, {
      community,
      deposit: { status: DepositStatus.draft },
    });
    const { review, reviewer } = await createReview(module, deposit, {
      review: {
        status: ReviewStatus.draft,
        file: factoryFileMetadata.build(),
      },
    });
    const appFile: AppFile = {
      lastModified: 1,
      name: 'test.xxx',
      size: 1,
      type: 'application/pdf',
    };
    await expect(
      controller.uploadReviewFile(
        { user: { sub: reviewer.userId } } as unknown as typeof request,
        review._id.toHexString(),
        { file: appFile },
        false
      )
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should get review file', async () => {
    const { community } = await createCommunity(module);
    const { deposit } = await createDeposit(module, {
      community,
      deposit: { status: DepositStatus.published },
    });
    const file = factoryFileMetadata.build();
    const { review } = await createReview(module, deposit, {
      review: {
        status: ReviewStatus.published,
        file: file,
      },
    });

    const spyStorage = jest.spyOn(awsStorageService, 'getSignedUrl').mockResolvedValue('link');
    const spyResponse = jest
      .spyOn(response, 'redirect')
      .mockImplementation(() => Logger.debug('redirect'));

    await controller.getReviewFile(review._id.toHexString(), file.filename, response);
    expect(spyStorage).toHaveBeenCalledWith(
      'getObject',
      expect.objectContaining({
        Bucket: 'myPrivateBucket',
        Expires: 3600,
        Key: `reviews/${review._id.toHexString()}/${file.filename}`,
      })
    );
    expect(spyResponse).toHaveBeenCalled();
  });

  it('should raise exception when try to get review file from a review without file', async () => {
    const { community } = await createCommunity(module);
    const { deposit } = await createDeposit(module, {
      community,
      deposit: { status: DepositStatus.published },
    });
    const { review } = await createReview(module, deposit, {
      review: {
        status: ReviewStatus.published,
        file: undefined,
      },
    });

    await expect(
      controller.getReviewFile(review._id.toHexString(), 'test', {} as unknown as typeof response)
    ).rejects.toThrow(NotFoundException);
  });

  it('should do upload file confirmation', async () => {
    const { community } = await createCommunity(module);
    const { deposit } = await createDeposit(module, {
      community,
      deposit: { status: DepositStatus.draft },
    });

    const { review, reviewer } = await createReview(module, deposit, {
      review: {
        status: ReviewStatus.draft,
        file: undefined,
      },
    });

    // Check failing with invalid filename
    const invalidFilename = factoryFileMetadata.build();
    await expect(
      controller.uploadFileConfirmationReview(
        { user: { sub: reviewer.userId } } as unknown as typeof request,
        review._id.toHexString(),
        { fileMetadata: invalidFilename, isMainFile: false, replacePDF: false }
      )
    ).rejects.toMatchObject(new BadRequestException('Invalid filename'));

    // Check it works with main file
    const spyHeadObject = jest.spyOn(awsStorageService, 'headObject').mockImplementation();
    const spyEventCreate = jest.spyOn(eventService, 'create').mockImplementation();

    const file = factoryFileMetadata.build({
      filename: `review-${review._id.toHexString()}.pdf`,
    });
    await expect(
      controller.uploadFileConfirmationReview(
        { user: { sub: reviewer.userId } } as unknown as typeof request,
        review._id.toHexString(),
        { fileMetadata: file, isMainFile: true, replacePDF: false }
      )
    ).resolves.not.toThrow();
    expect(spyHeadObject).toHaveBeenCalled();
    expect(spyEventCreate).toHaveBeenCalled();

    // Check it works with extra files
    spyHeadObject.mockClear();
    spyEventCreate.mockClear();
    await expect(
      controller.uploadFileConfirmationReview(
        { user: { sub: reviewer.userId } } as unknown as typeof request,
        review._id.toHexString(),
        { fileMetadata: file, isMainFile: false, replacePDF: false }
      )
    ).resolves.not.toThrow();
    expect(spyHeadObject).toHaveBeenCalled();
    expect(spyEventCreate).not.toHaveBeenCalled();
  });

  it('should raise exception when try to get review file from a draft review', async () => {
    const { community } = await createCommunity(module);
    const { deposit } = await createDeposit(module, {
      community,
      deposit: { status: DepositStatus.draft },
    });
    const file = factoryFileMetadata.build();
    const { review } = await createReview(module, deposit, {
      review: {
        status: ReviewStatus.draft,
        file: file,
      },
    });
    await expect(
      controller.getReviewFile(review._id.toHexString(), 'test', {} as unknown as typeof response)
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should get review images', async () => {
    const { community } = await createCommunity(module);
    const { deposit } = await createDeposit(module, {
      community,
      deposit: { status: DepositStatus.draft },
    });
    const { review } = await createReview(module, deposit, {
      review: {
        status: ReviewStatus.draft,
        images: ['image1.png'],
      },
    });
    await expect(
      controller.getReviewImages(review._id.toHexString(), 'test', {} as unknown as typeof response)
    ).rejects.toThrow(TypeError);
  });

  it('should delete review file from extraFiles', async () => {
    const { deposit } = await createDeposit(module);
    const { review, reviewer } = await createReview(module, deposit, {
      review: {
        status: ReviewStatus.draft,
        extraFiles: [factoryFileMetadata.build()],
      },
    });

    const spy = jest.spyOn(awsStorageService, 'delete').mockImplementation();
    const reviewDeletedFile = await controller.deleteReviewExtraFile(
      { user: { sub: reviewer.userId } } as unknown as typeof request,
      review._id.toHexString(),
      review.extraFiles[0].filename
    );
    expect(reviewDeletedFile.extraFiles[0]).toBeUndefined();
    expect(spy).toHaveBeenCalled();
  });

  it('should raise exception when try to delete review extraFile that not exist', async () => {
    const { deposit } = await createDeposit(module);
    const { review, reviewer } = await createReview(module, deposit, {
      review: {
        status: ReviewStatus.draft,
        extraFiles: [factoryFileMetadata.build()],
      },
    });
    await expect(
      controller.deleteReviewExtraFile(
        { user: { sub: reviewer.userId } } as unknown as typeof request,
        review._id.toHexString(),
        'unexcitingFile.pdf'
      )
    ).rejects.toMatchObject(new NotFoundException('File not found'));
  });

  it('should raise exception when try to delete review extraFile from a published review', async () => {
    const { deposit } = await createDeposit(module);
    const { review, reviewer } = await createReview(module, deposit, {
      review: {
        status: ReviewStatus.published,
        extraFiles: [factoryFileMetadata.build()],
      },
    });
    await expect(
      controller.deleteReviewExtraFile(
        { user: { sub: reviewer.userId } } as unknown as typeof request,
        review._id.toHexString(),
        review.extraFiles[0].filename
      )
    ).rejects.toMatchObject(new NotFoundException('Unauthorized action update'));
  });

  it('should raise exception when try to delete review extraFile from a review that not exist', async () => {
    const { deposit } = await createDeposit(module);
    const { review, reviewer } = await createReview(module, deposit, {
      review: {
        status: ReviewStatus.published,
        extraFiles: [factoryFileMetadata.build()],
      },
    });
    await expect(
      controller.deleteReviewExtraFile(
        { user: { sub: reviewer.userId } } as unknown as typeof request,
        generateObjectId(),
        review.extraFiles[0].filename
      )
    ).rejects.toMatchObject(new NotFoundException('Review not found'));
  });
  it('should raise exception when try to delete review extraFile with a user that not exist', async () => {
    const { deposit } = await createDeposit(module);
    const { review } = await createReview(module, deposit, {
      review: {
        status: ReviewStatus.published,
        extraFiles: [factoryFileMetadata.build()],
      },
    });

    await expect(
      controller.deleteReviewExtraFile(
        { user: { sub: generateObjectId() } } as unknown as typeof request,
        review._id.toHexString(),
        review.extraFiles[0].filename
      )
    ).rejects.toMatchObject(new NotFoundException('User not found'));
  });

  it('should fail when review visibilities are incorrect', async () => {
    const { community } = await createCommunity(module);
    const { deposit } = await createDeposit(module, { community });
    const { review } = await createReview(module, deposit);

    review.showReviewToAuthor = false;
    review.showReviewToEveryone = true;

    //The pre hook of the schema is activated when save method has been called
    await expect(review.save()).rejects.toMatchObject(
      new Error('Show review to author must be true when show review to everyone is true.')
    );
  });

  it('should fail when review identity are incorrect', async () => {
    const { community } = await createCommunity(module);
    const { deposit } = await createDeposit(module, { community });
    const { review } = await createReview(module, deposit);

    review.showIdentityToAuthor = false;
    review.showIdentityToEveryone = true;

    //The pre hook of the schema is activated when save method has been called
    await expect(review.save()).rejects.toMatchObject(
      new Error(
        'Show review identity to author must be true when show review identity to everyone is true.'
      )
    );
  });

  describe('DOI Registration', () => {
    it('should preview DOI registration', async () => {
      const { community, moderator } = await createCommunity(module);
      const { deposit } = await createDeposit(module, { community });
      const { review } = await createReview(module, deposit);

      await expect(
        controller.previewDOIRegistrationReview(
          { user: { sub: moderator.userId } } as unknown as typeof request,
          review._id.toHexString()
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
        .spyOn(module.get(DataciteService), 'generateDOIMetadataReview')
        .mockImplementation();

      await controller.previewDOIRegistrationReview(
        { user: { sub: moderator.userId } } as unknown as typeof request,
        review._id.toHexString()
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
        .spyOn(module.get(CrossrefService), 'createReviewXML')
        .mockImplementation();

      await controller.previewDOIRegistrationReview(
        { user: { sub: moderator.userId } } as unknown as typeof request,
        review._id.toHexString()
      );
      expect(spyCrossref).toHaveBeenCalled();
    });

    it('should createDoi', async () => {
      const { community, moderator } = await createCommunity(module);
      const { deposit } = await createDeposit(module, { community });
      const { review } = await createReview(module, deposit);

      await expect(
        controller.createDoiReview(
          { user: { sub: moderator.userId } } as unknown as typeof request,
          review._id.toHexString()
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
      const spy = jest.spyOn(dataciteService, 'generateReviewDOI').mockImplementationOnce(() => {
        throw new HttpException({ message: 'error' }, HttpStatus.BAD_REQUEST);
      });
      const errorResponse = await controller.createDoiReview(
        { user: { sub: moderator.userId } } as unknown as typeof request,
        review._id.toHexString()
      );
      expect(errorResponse).toMatchObject({ data: 'error' });
      spy.mockImplementation();
      await controller.createDoiReview(
        { user: { sub: moderator.userId } } as unknown as typeof request,
        review._id.toHexString()
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
        .spyOn(module.get(CrossrefService), 'generateReviewDOI')
        .mockImplementation();

      await controller.createDoiReview(
        { user: { sub: moderator.userId } } as unknown as typeof request,
        review._id.toHexString()
      );
      expect(spyCrossref).toHaveBeenCalled();
    });

    it('should getDOI', async () => {
      const { community, moderator } = await createCommunity(module);
      const { deposit } = await createDeposit(module, { community });
      const { review } = await createReview(module, deposit);

      await expect(
        controller.getDoiReview(
          { user: { sub: moderator.userId } } as unknown as typeof request,
          review._id.toHexString()
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
      const spy = jest.spyOn(dataciteService, 'getReviewDoiMetadata').mockImplementation();
      await controller.getDoiReview(
        { user: { sub: moderator.userId } } as unknown as typeof request,
        review._id.toHexString()
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
        controller.getDoiReview(
          { user: { sub: moderator.userId } } as unknown as typeof request,
          review._id.toHexString()
        )
      ).rejects.toMatchObject(new NotImplementedException('Featured not implemented'));
    });
  });
});
