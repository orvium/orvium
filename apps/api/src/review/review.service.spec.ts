import { Test, TestingModule } from '@nestjs/testing';
import { ReviewRoles, ReviewService } from './review.service';
import { cleanCollections, MongooseTestingModule } from '../utils/mongoose-testing.module';
import {
  createCommunity,
  createDeposit,
  createReview,
  createUser,
  factoryFileMetadata,
  factoryReview,
} from '../utils/test-data';
import { AwsStorageService } from '../common/aws-storage-service/aws-storage.service';
import { ReviewStatus } from './review.schema';
import { assertIsDefined } from '../utils/utils';
import { TransformerService } from '../transformer/transformer.service';

describe('ReviewService', () => {
  let reviewService: ReviewService;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [MongooseTestingModule.forRoot('ReviewService')],
      providers: [],
    }).compile();

    reviewService = module.get(ReviewService);
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    await cleanCollections(module);
  });

  it('should be defined', () => {
    expect(reviewService).toBeDefined();
  });

  it('should keep url when review is published', async () => {
    const reviewDocument = await reviewService.create(
      factoryReview.build({
        file: factoryFileMetadata.build({ filename: 'myfile' }),
        extraFiles: factoryFileMetadata.buildList(2),
      })
    );
    await reviewService.setPresignedURLs(reviewDocument);
    expect(reviewDocument.file?.url).toBe(
      `http://localhost:4200/api/v1/reviews/${reviewDocument._id.toHexString()}/files/myfile`
    );
  });

  it('should keep url when review is draft', async () => {
    const reviewDocument = await reviewService.create(
      factoryReview.build({
        status: ReviewStatus.draft,
        file: factoryFileMetadata.build({ filename: 'myfile' }),
        extraFiles: factoryFileMetadata.buildList(2),
      })
    );

    const awsService = module.get(AwsStorageService);
    jest.spyOn(awsService, 'getSignedUrl').mockResolvedValue('https://s3mock');
    await reviewService.setPresignedURLs(reviewDocument);
    expect(reviewDocument.file?.url).toBe('https://s3mock');
  });

  it('should get roles for review', async () => {
    const { communityOwner: moderator, community } = await createCommunity(module);
    const { author: author, deposit } = await createDeposit(module, { community });
    const { reviewer, review } = await createReview(module, deposit);
    const reviewDocumentPopulated = await reviewService.findOne({ _id: review._id });
    assertIsDefined(reviewDocumentPopulated);
    expect(
      await reviewService.getUserRolesForReview({ review: reviewDocumentPopulated, user: null })
    ).toStrictEqual(['public']);

    const anyUser = await createUser(module);
    expect(
      await reviewService.getUserRolesForReview({ review: reviewDocumentPopulated, user: anyUser })
    ).toStrictEqual(['public']);

    expect(
      await reviewService.getUserRolesForReview({
        review: reviewDocumentPopulated,
        user: reviewer,
      })
    ).toStrictEqual(['public', 'creator']);
    expect(
      await reviewService.getUserRolesForReview({ review: reviewDocumentPopulated, user: author })
    ).toStrictEqual(['public', 'author']);
    expect(
      await reviewService.getUserRolesForReview({
        review: reviewDocumentPopulated,
        user: moderator,
      })
    ).toStrictEqual(['public', 'moderator']);
  });

  it('should anonymize review when necessary', async () => {
    const { community } = await createCommunity(module);
    const { deposit } = await createDeposit(module, { community });
    const { reviewer, review } = await createReview(module, deposit);
    const reviewDocumentPopulated = await reviewService.findOne({ _id: review._id });
    assertIsDefined(reviewDocumentPopulated);
    const transformerService = module.get(TransformerService);
    const dto = await transformerService.reviewPopulatedToDto(reviewDocumentPopulated, reviewer);

    dto.showIdentityToEveryone = true;
    dto.showIdentityToAuthor = true;
    const openReview = reviewService.setReviewerIdentityVisibility(dto, [ReviewRoles.Public]);
    expect(openReview.ownerProfile.firstName).toBe(reviewer.firstName);

    dto.showIdentityToEveryone = false;
    dto.showIdentityToAuthor = true;

    const anonymized = {
      ownerProfile: {
        _id: 'fake',
        userId: 'fake',
        firstName: 'Hidden',
        lastName: 'Identity',
        nickname: 'anonymous-reviewer',
        gravatar: 'abe0509a6539276354ba2e283317688a',
        institutions: [],
        bannerURL: undefined,
        avatar: undefined,
      },
      author: 'Hidden Identity',
      creator: 'fake',
      avatar: undefined,
      gravatar: 'abe0509a6539276354ba2e283317688a',
    };

    expect(reviewService.setReviewerIdentityVisibility(dto, [ReviewRoles.Public])).toMatchObject(
      anonymized
    );
    expect(
      reviewService.setReviewerIdentityVisibility(dto, [ReviewRoles.Author]).ownerProfile.firstName
    ).toBe(reviewer.firstName);
    expect(
      reviewService.setReviewerIdentityVisibility(dto, [ReviewRoles.Moderator]).ownerProfile
        .firstName
    ).toBe(reviewer.firstName);
    expect(
      reviewService.setReviewerIdentityVisibility(dto, [ReviewRoles.Creator]).ownerProfile.firstName
    ).toBe(reviewer.firstName);

    dto.showIdentityToEveryone = false;
    dto.showIdentityToAuthor = false;
    expect(reviewService.setReviewerIdentityVisibility(dto, [ReviewRoles.Public])).toMatchObject(
      anonymized
    );
    expect(reviewService.setReviewerIdentityVisibility(dto, [ReviewRoles.Author])).toMatchObject(
      anonymized
    );
    expect(
      reviewService.setReviewerIdentityVisibility(dto, [ReviewRoles.Moderator]).ownerProfile
        .firstName
    ).toBe(reviewer.firstName);
    expect(
      reviewService.setReviewerIdentityVisibility(dto, [ReviewRoles.Creator]).ownerProfile.firstName
    ).toBe(reviewer.firstName);
  });

  it('should finWithLimit', async () => {
    const result = await reviewService.findWithLimit({});
    expect(result.length).toBe(0);
  });
});
