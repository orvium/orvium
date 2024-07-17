import { Test, TestingModule } from '@nestjs/testing';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { request } from 'express';
import { CreateCommentDTO } from '../dtos/comment/create-comment.dto';
import { EventService } from '../event/event.service';
import { DepositCLASSNAME, generateObjectId, ReviewCLASSNAME } from '../utils/utils';
import { cleanCollections, MongooseTestingModule } from '../utils/mongoose-testing.module';
import {
  createComment,
  createCommunity,
  createDeposit,
  createDepositSet,
  createReview,
  createUser,
} from '../utils/test-data';
import { ReviewStatus } from '../review/review.schema';

describe('CommentsController', () => {
  let controller: CommentsController;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      controllers: [CommentsController],
      imports: [MongooseTestingModule.forRoot('CommentsController')],
      providers: [],
    }).compile();
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    controller = module.get(CommentsController);
    await cleanCollections(module);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get main comments', async () => {
    const { deposit } = await createDeposit(module);
    const { comment, user } = await createComment(module, deposit);
    const result = await controller.getComments(
      { user: { sub: user.userId } } as unknown as typeof request,
      deposit._id.toHexString()
    );
    expect(result.length).toBe(1);
    expect(result[0]._id).toStrictEqual(comment._id.toHexString());
    expect(result[0].hasReplies).toBe(false);
  });

  it('should get comment replies', async () => {
    const { deposit } = await createDeposit(module);
    const { comment, user } = await createComment(module, deposit);
    const { comment: reply } = await createComment(module, deposit, comment);

    const result = await controller.getComments(
      { user: { sub: user.userId } } as unknown as typeof request,
      deposit._id.toHexString(),
      comment._id.toHexString()
    );
    expect(result.length).toBe(1);
    expect(result[0]._id).toStrictEqual(reply._id.toHexString());
    expect(result[0].hasReplies).toBeFalsy();
  });

  it('should raise exception when resource is not a valid ObjectId', async () => {
    const user = await createUser(module);
    await expect(
      controller.getComments(
        { user: { sub: user.userId } } as unknown as typeof request,
        'xxx',
        generateObjectId()
      )
    ).rejects.toMatchObject(new BadRequestException('Resource not valid ObjectId'));
  });

  it('should raise exception when parent is not a valid ObjectId', async () => {
    const user = await createUser(module);
    await expect(
      controller.getComments(
        { user: { sub: user.userId } } as unknown as typeof request,
        generateObjectId(),
        'xxx'
      )
    ).rejects.toMatchObject(new BadRequestException('Parent not valid ObjectId'));
  });

  it('should create comment', async () => {
    const spy = jest.spyOn(module.get(EventService), 'create');
    const { deposit, author } = await createDeposit(module);
    const { review } = await createReview(module, deposit);

    const createCommentDTO: CreateCommentDTO = {
      content: 'New comment',
      resource: deposit._id.toHexString(),
      resourceModel: DepositCLASSNAME,
    };
    const commentDeposit = await controller.createComment(
      { user: { sub: author.userId } } as unknown as typeof request,
      createCommentDTO
    );
    expect(commentDeposit.content).toBe('New comment');
    expect(spy).toHaveBeenCalled();

    const commentReview = await controller.createComment(
      { user: { sub: author.userId } } as unknown as typeof request,
      {
        content: 'New comment on review',
        resource: review._id.toHexString(),
        resourceModel: ReviewCLASSNAME,
      }
    );
    expect(commentReview.content).toBe('New comment on review');
  });

  it('should create reply comment', async () => {
    const spy = jest.spyOn(module.get(EventService), 'create');
    const { deposit, author } = await createDeposit(module);
    const { comment } = await createComment(module, deposit);
    const { review } = await createReview(module, deposit);
    const { comment: commentReview } = await createComment(module, review);

    const createCommentDTO: CreateCommentDTO = {
      content: 'New comment',
      resource: deposit._id.toHexString(),
      resourceModel: DepositCLASSNAME,
      parent: comment._id.toHexString(),
    };
    const result = await controller.createComment(
      { user: { sub: author.userId } } as unknown as typeof request,
      createCommentDTO
    );
    expect(result.content).toBe('New comment');
    expect(spy).toHaveBeenCalled();

    const commentReviewReply = await controller.createComment(
      { user: { sub: author.userId } } as unknown as typeof request,
      {
        content: 'New comment on review',
        resource: review._id.toHexString(),
        resourceModel: ReviewCLASSNAME,
        parent: commentReview._id.toHexString(),
      }
    );
    expect(commentReviewReply.content).toBe('New comment on review');
  });

  it('should raise exception when can not reply comment', async () => {
    const user = await createUser(module);
    const { community } = await createCommunity(module);
    const { preprint } = await createDepositSet(module, community);
    const { comment } = await createComment(module, preprint);
    const { comment: reply } = await createComment(module, preprint, comment);

    const createCommentDTO: CreateCommentDTO = {
      content: 'New comment',
      resource: preprint._id.toHexString(),
      resourceModel: DepositCLASSNAME,
      parent: reply._id.toHexString(),
    };

    await expect(
      controller.createComment(
        { user: { sub: user.userId } } as unknown as typeof request,
        createCommentDTO
      )
    ).rejects.toMatchObject(new UnauthorizedException('You can not reply to this comment'));

    const invalidComment: CreateCommentDTO = {
      content: 'New comment',
      resource: preprint._id.toHexString(),
      resourceModel: DepositCLASSNAME,
      parent: generateObjectId(),
    };

    await expect(
      controller.createComment(
        { user: { sub: user.userId } } as unknown as typeof request,
        invalidComment
      )
    ).rejects.toMatchObject(new NotFoundException('Parent comment not found'));

    const { review } = await createReview(module, preprint, {
      review: { status: ReviewStatus.draft },
    });

    const validComment: CreateCommentDTO = {
      content: 'New comment',
      resource: review._id.toHexString(),
      resourceModel: ReviewCLASSNAME,
    };
    await expect(
      controller.createComment(
        { user: { sub: user.userId } } as unknown as typeof request,
        validComment
      )
    ).rejects.toMatchObject(new NotFoundException('You can not comment on this resource'));
  });

  it('should raise exception when can not find user', async () => {
    const { deposit } = await createDeposit(module);
    const createCommentDTO: CreateCommentDTO = {
      content: 'New comment',
      resource: deposit._id.toHexString(),
      resourceModel: DepositCLASSNAME,
    };
    await expect(
      controller.createComment(
        { user: { sub: generateObjectId() } } as unknown as typeof request,
        createCommentDTO
      )
    ).rejects.toMatchObject(new NotFoundException('User not found'));
  });

  it('should remove comment and replies', async () => {
    const { deposit } = await createDeposit(module);
    const { comment, user } = await createComment(module, deposit);
    await createComment(module, deposit, comment);

    const result = await controller.deleteComment(
      { user: { sub: user.userId } } as unknown as typeof request,
      comment._id.toHexString()
    );
    expect(result._id).toStrictEqual(comment._id.toHexString());
    const commentDocuments = await module.get(CommentsService).commentModel.find({});
    expect(commentDocuments.length).toBe(0);
  });

  it('should remove comment', async () => {
    const { deposit } = await createDeposit(module);
    const { comment, user } = await createComment(module, deposit);

    await controller.deleteComment(
      { user: { sub: user.userId } } as unknown as typeof request,
      comment._id.toHexString()
    );
    const commentDocuments = await module.get(CommentsService).commentModel.find({});
    expect(commentDocuments.length).toBe(0);
  });

  it('should allow anonymous users to get comments', async () => {
    const { deposit } = await createDeposit(module);
    await createComment(module, deposit);

    const result = await controller.getComments(
      { user: null } as unknown as typeof request,
      deposit._id.toHexString()
    );

    expect(result.length).toBe(1);
  });

  it('should fail deleteComment when can not find user', async () => {
    const { deposit } = await createDeposit(module);
    const { comment } = await createComment(module, deposit);
    await expect(
      controller.deleteComment(
        { user: { sub: generateObjectId() } } as unknown as typeof request,
        comment._id.toHexString()
      )
    ).rejects.toMatchObject(new NotFoundException('User not found'));
  });

  it('should raise exception when can not find comment', async () => {
    const user = await createUser(module);
    await expect(
      controller.deleteComment(
        { user: { sub: user.userId } } as unknown as typeof request,
        generateObjectId()
      )
    ).rejects.toThrow(NotFoundException);
  });

  it('should create comment for review with proper permissions', async () => {
    const { deposit, author: depositAuthor } = await createDeposit(module);
    const { review, reviewer } = await createReview(module, deposit, {
      review: { status: ReviewStatus.published },
    });

    const reviewerComment = await controller.createComment(
      { user: { sub: reviewer.userId } } as unknown as typeof request,
      {
        content: 'New comment on review by reviewer',
        resource: review._id.toHexString(),
        resourceModel: 'Review',
      }
    );
    expect(reviewerComment.content).toBe('New comment on review by reviewer');

    const commentReview = await controller.createComment(
      { user: { sub: depositAuthor.userId } } as unknown as typeof request,
      {
        content: 'New comment on review by deposit author',
        resource: review._id.toHexString(),
        resourceModel: ReviewCLASSNAME,
      }
    );
    expect(commentReview.content).toBe('New comment on review by deposit author');
  });

  it('should not create comment for review if the commenter is not he author or reviewer', async () => {
    const { deposit } = await createDeposit(module);
    const { review } = await createReview(module, deposit, {
      review: { status: ReviewStatus.published },
    });

    const user = await createUser(module);

    const reviewerComment = controller.createComment(
      { user: { sub: user.userId } } as unknown as typeof request,
      {
        content: 'New comment on review by reviewer',
        resource: review._id.toHexString(),
        resourceModel: 'Review',
      }
    );
    await expect(reviewerComment).rejects.toThrow(UnauthorizedException);
  });

  it('should show anonymous comments if the review is set to hidde identity to everyone', async () => {
    const { deposit, author } = await createDeposit(module, {});
    const { review, reviewer } = await createReview(module, deposit, {
      review: {
        status: ReviewStatus.published,
        showIdentityToEveryone: false,
        showIdentityToAuthor: false,
      },
    });

    await createComment(module, review, undefined, { user: reviewer });

    const result = await controller.getComments(
      { user: { sub: author.userId } } as unknown as typeof request,
      review._id.toHexString()
    );

    expect(result.length).toBe(1);
    expect(result[0].user.nickname).toBe('anonymous-reviewer');
  });

  it('should show anonymous comments if the review is set to hidde identity to everyone except author', async () => {
    const user = await createUser(module, { user: { nickname: 'manolin' } });
    const { deposit, author } = await createDeposit(module, {
      author: user,
    });

    const { review, reviewer } = await createReview(module, deposit, {
      review: {
        status: ReviewStatus.published,
        showIdentityToEveryone: false,
        showIdentityToAuthor: true,
      },
    });

    await createComment(module, review, undefined, { user: reviewer });

    const result = await controller.getComments(
      { user: { sub: author.userId } } as unknown as typeof request,
      review._id.toHexString()
    );

    expect(result.length).toBe(1);
    expect(result[0].user.nickname).toBe(reviewer.nickname);

    const radomUser = await createUser(module, { user: { nickname: 'random' } });
    const result2 = await controller.getComments(
      { user: { sub: radomUser.userId } } as unknown as typeof request,
      review._id.toHexString()
    );

    expect(result2[0].user.nickname).toBe('anonymous-reviewer');
  });
});
