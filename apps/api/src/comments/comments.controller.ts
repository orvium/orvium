import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentDTO } from '../dtos/comment/comment.dto';
import { Commentary, CommentaryDocument } from './comments.schema';
import { Request } from 'express';
import { UserService } from '../users/user.service';
import { AuthorizationService, COMMENT_ACTIONS } from '../authorization/authorization.service';
import { CreateCommentDTO } from '../dtos/comment/create-comment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AnyKeys, isValidObjectId, Types } from 'mongoose';
import { CommentCreatedEvent } from '../event/events/commentCreatedEvent';
import { EventService } from '../event/event.service';
import { ReplyCommentCreatedEvent } from '../event/events/replyCommentCreatedEvent';
import { assertIsDefined, hasProperty } from '../utils/utils';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { TransformerService } from '../transformer/transformer.service';
import { DepositDocument } from '../deposit/deposit.schema';
import { ReviewDocument } from '../review/review.schema';
import { StrictFilterQuery } from '../utils/types';
import { JwtOrAnonymousGuard } from '../auth/jwt-or-anonymous-guard.service';
import { DepositService } from '../deposit/deposit.service';
import { ReviewService } from '../review/review.service';

/**
 * Controller for managing comments within the application. It handles operations such as
 * listing, creating, and deleting comments related to various resources like deposits and reviews.
 *
 * @controler comments
 * @tags comments
 */
@ApiTags('comments')
@Controller('comments')
export class CommentsController {
  /**
   * Instantiates a CommentsController object.
   * @param {CommentsService} commentsService - Service for comment data management.
   * @param {UserService} userService - Service for user data management.
   * @param {AuthorizationService} authorizationService - Service for handling authorization tasks.
   * @param {EventService} eventService - Service for managing events.
   * @param {TransformerService} transformerService - Service for data transformation tasks.
   * @param {DepositService} depositService - Service for managing deposits.
   * @param {ReviewService} reviewService - Service for managing reviews.
   */
  constructor(
    private readonly commentsService: CommentsService,
    private readonly userService: UserService,
    private readonly authorizationService: AuthorizationService,
    private readonly eventService: EventService,
    private readonly transformerService: TransformerService,
    private readonly depositService: DepositService,
    private readonly reviewService: ReviewService
  ) {}

  /**
   * GET - Retrieves all comments associated with a specific resource. Filters by parent comment if specified.
   *
   * @param {Request} req - The request object, containing user authentication details.
   * @param {string} resource - The ID of the resource (deposit or review).
   * @param {string} [parent] - Optional ID of the parent comment to filter replies.
   * @return {Promise<CommentDTO[]>} A promise resolved with an array of comment DTOs.
   */
  @ApiOperation({ summary: 'List all comments' })
  @UseGuards(JwtOrAnonymousGuard)
  @Get('')
  @ApiQuery({
    name: 'parent',
    required: false,
    description: 'Optional filter by parent comment ID to retrieve comment replies.',
  })
  async getComments(
    @Req() req: Request,
    @Query('resource') resource: string,
    @Query('parent') parent?: string
  ): Promise<CommentDTO[]> {
    const user = await this.userService.getLoggedUser(req);
    const filter: StrictFilterQuery<CommentaryDocument> = {
      parent: undefined,
    };
    if (resource) {
      if (isValidObjectId(resource)) {
        filter.resource = resource;
      } else {
        throw new BadRequestException('Resource not valid ObjectId');
      }
    }
    if (parent) {
      if (isValidObjectId(parent)) {
        filter.parent = parent;
      } else {
        throw new BadRequestException('Parent not valid ObjectId');
      }
    }

    const comments = await this.commentsService.find(filter);

    // Check if main comments have replies
    for (const comment of comments) {
      comment.hasReplies = !comment.parent
        ? !!(await this.commentsService.exists({ parent: comment._id }))
        : false;
    }

    return this.transformerService.commentaryToDtoArray(comments, user);
  }

  /**
   * POST - Creates a new comment based on the provided payload. Validates user permissions before proceeding.
   *
   * @param {Request} req - The request object, containing user authentication details.
   * @param {CreateCommentDTO} payload - Data Transfer Object containing comment details.
   * @return {Promise<CommentDTO>} A promise resolved with the newly created comment DTO.
   */
  @ApiOperation({ summary: 'Create a comment' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('')
  async createComment(@Req() req: Request, @Body() payload: CreateCommentDTO): Promise<CommentDTO> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');
    let resource: ReviewDocument | DepositDocument | null = null;
    if (payload.resourceModel === 'Deposit') {
      resource = await this.depositService.findById(payload.resource);
    } else {
      resource = await this.reviewService.findById(payload.resource);
    }
    assertIsDefined(resource, 'Resource not found');

    const query: AnyKeys<Commentary> = {
      content: payload.content,
      resource: new Types.ObjectId(payload.resource),
      resourceModel: payload.resourceModel,
      user_id: user._id,
      tags: [],
      community: resource.community,
    };

    if (payload.parent) {
      query.parent = payload.parent;
    }

    const comment = new this.commentsService.commentModel(query);
    const commentPopulated = await comment.populate<{
      resource: DepositDocument | ReviewDocument;
      parentPopulated?: CommentaryDocument;
    }>(['resource', 'parentPopulated']);
    // Check if the user can comment the resource
    const ability = await this.authorizationService.defineAbilityFor(user);
    if (!ability.can('createComment', resource)) {
      throw new UnauthorizedException('You can not comment on this resource');
    }
    // Check if the user can reply to the parent comment
    if (query.parent) {
      if (!commentPopulated.parentPopulated) {
        throw new NotFoundException('Parent comment not found');
      }

      if (!ability.can('reply', commentPopulated.parentPopulated)) {
        throw new UnauthorizedException('You can not reply to this comment');
      }
    }

    // Set comment tags
    commentPopulated.tags = await this.commentsService.getCommentTags(commentPopulated);
    const commentPopulatedSaved = await commentPopulated.save();

    comment.hasReplies = false;

    const commentWithResource = await comment.populate<{
      resource: DepositDocument | ReviewDocument;
    }>('resource');
    if (commentWithResource.resource.creator != user._id) {
      // Generate events
      const creator = await this.userService.findOne({ _id: commentWithResource.resource.creator });
      assertIsDefined(creator, 'Resource creator not found');
      const event = new CommentCreatedEvent({
        user: creator.toJSON(),
        comment: comment.toJSON(),
      });
      await this.eventService.create(event.getEventDTO());
    }

    // If we check here that comment.parent DOES NOT have the status property (available in DepositDocument and ReviewDocument)
    // then typescript detects that the field is not populated
    if (comment.parent && !hasProperty(comment.parent, 'status')) {
      const replyComment = await this.commentsService.findOneByIdPopulated(
        comment.parent._id.toString()
      );
      const userParent = await this.userService.findOne({ _id: replyComment?.user_id });
      if (userParent && replyComment && !replyComment.user_id.equals(user._id)) {
        const eventReply = new ReplyCommentCreatedEvent({
          userId: userParent.userId,
          comment: comment.toJSON(),
        });
        await this.eventService.create(eventReply.getEventDTO());
      }
    }

    const savedComment = await this.commentsService.findOneByIdPopulated(commentPopulatedSaved._id);
    assertIsDefined(savedComment);

    return this.transformerService.transformToDto(savedComment, CommentDTO, user);
  }

  /**
   * DELETE - Deletes a comment and its replies, if any. Validates user permissions before proceeding.
   *
   * @param {Request} req - The request object, containing user authentication details.
   * @param {string} id - The unique identifier of the comment to be deleted.
   * @return {Promise<CommentDTO>} A promise resolved with the DTO of the deleted comment.
   */
  @ApiOperation({ summary: 'Delete a comment' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id([0-9a-f]{24})')
  async deleteComment(@Req() req: Request, @Param('id') id: string): Promise<CommentDTO> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');
    const commentPopulated = await this.commentsService.findOneByIdPopulated(id);
    if (!commentPopulated || !hasProperty(commentPopulated.resource, '_id')) {
      throw new NotFoundException('Comment not found');
    }
    const ability = await this.authorizationService.defineAbilityFor(user);
    this.authorizationService.canDo(ability, COMMENT_ACTIONS.delete, commentPopulated);

    // Delete comment replies recursively
    const repliesComment = await this.commentsService.find({
      resource: commentPopulated.resource._id,
      parent: commentPopulated._id,
    });
    for (const reply of repliesComment) {
      await reply.deleteOne();
    }
    await commentPopulated.deleteOne();

    return this.transformerService.transformToDto(commentPopulated, CommentDTO, user);
  }
}
