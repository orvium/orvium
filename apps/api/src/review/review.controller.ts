import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpException,
  NotFoundException,
  NotImplementedException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ReviewDocumentPopulated, ReviewService } from './review.service';
import { Request, Response } from 'express';
import { ReviewDocument, ReviewKind, ReviewStatus } from './review.schema';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { extname } from 'path';
import { DepositService } from '../deposit/deposit.service';
import { UserService } from '../users/user.service';
import { EventService } from '../event/event.service';
import { InviteService } from '../invite/invite.service';
import {
  AwsStorageService,
  EXPIRATION_TIME,
} from '../common/aws-storage-service/aws-storage.service';
import { CreateReviewDTO } from '../dtos/review/create-review.dto';
import { UpdateReviewDTO } from '../dtos/review/update-review.dto';
import { ReviewPopulatedDTO } from '../dtos/review/review-populated.dto';
import {
  AuthorizationService,
  DEPOSIT_ACTIONS,
  REVIEW_ACTIONS,
} from '../authorization/authorization.service';
import { ReviewPublishedConfirmationToAuthorEvent } from '../event/events/reviewPublishedConfirmationToAuthorEvent';
import { ReviewChangedToPendingApprovalEvent } from '../event/events/reviewChangedToPendingApprovalEvent';
import { ReviewSubmittedConfirmationEvent } from '../event/events/reviewSubmittedConfirmationEvent';
import { ReviewPublishedConfirmationToReviewerEvent } from '../event/events/reviewPublishedConfirmationToReviewerEvent';
import { assertIsDefined } from '../utils/utils';
import { SignedUrlDTO } from '../dtos/signedUrl.dto';
import { InviteDocument, InviteType } from '../invite/invite.schema';
import { FileMetadata } from '../dtos/filemetadata.dto';
import { PutObjectCommandInput } from '@aws-sdk/client-s3';
import { CreateFileDTO } from '../dtos/create-file.dto';
import { StringDataPayload, UploadFilePayload } from '../deposit/deposit.controller';
import { TransformerService } from '../transformer/transformer.service';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { ReviewChangedToDraftEvent } from '../event/events/reviewChangedToDraftEvent';
import { FileUploadedEvent } from '../event/events/fileUploadedEvent';
import { ReviewsPopulatedQueryDTO } from '../dtos/review/review-query.dto';
import { StrictFilterQuery } from '../utils/types';
import { Doi } from '@orvium/datacite-client';
import { DataciteService } from '../datacite/datacite.service';
import { CrossrefService } from '../crossref/crossref.service';
import { JwtOrAnonymousGuard } from '../auth/jwt-or-anonymous-guard.service';
import { PaginationParamsDTO } from '../dtos/pagination-params.dto';

/**
 * Allowed files for review content submission
 */
const ALLOWED_FILE_EXTENSIONS = [
  '.pdf',
  '.doc',
  '.docx',
  '.txt',
  '.jpeg',
  '.jpg',
  '.png',
  '.gif',
  '.md',
  '.csv',
  '.tex',
  '.rtf',
  '.odt',
];

export class ModerateReviewPayload {
  @IsString() @ApiProperty() reason!: string;
}

/**
 * The ReviewController is responsible managing reviews content and life-cycles within the application
 *
 * @tags reviews
 * @controller reviews
 */
@ApiTags('reviews')
@Controller('reviews')
export class ReviewController {
  //used to identify review files
  filesPrefix = 'reviews';

  /**
   * Instantiates a ReviewController object.
   *
   * @param {ReviewService} reviewService - Service for manage review.
   * @param {DepositService} depositService - Service for deposits data management.
   * @param {UserService} userService - Service for user data management.
   * @param {EventService} eventService - Service for managing events.
   * @param {InviteService} inviteService - Service for invitations data management.
   * @param {AwsStorageService} storageService - Service for storage events.
   * @param {AuthorizationService} authorizationService - Service for handling authorization tasks.
   * @param {TransformerService} transformerService - Service for data transformation tasks.
   * @param {DataciteService} dataciteService - Service for datacite citations.
   * @param {CrossrefService} crossrefService - Service for crossref references.
   */
  constructor(
    private readonly reviewService: ReviewService,
    private readonly depositService: DepositService,
    private readonly userService: UserService,
    private readonly eventService: EventService,
    private readonly inviteService: InviteService,
    private readonly storageService: AwsStorageService,
    private readonly authorizationService: AuthorizationService,
    private readonly transformerService: TransformerService,
    private readonly dataciteService: DataciteService,
    private readonly crossrefService: CrossrefService
  ) {}

  /**
   * GET - Retrieves a list of reviews that are either associated with a specific deposit or created by a specified user.
   * It filters reviews based on the published status for general access and includes pending approval reviews for authorized users.
   *
   * @param req The HTTP request object, which includes the user's authorization information.
   * @param depositId (optional) The ID of the deposit to filter reviews. If provided, it may return reviews pending approval if the user is moderator.
   * @param creator (optional) The ID of the creator to filter reviews. When used, it will only return reviews with public creators.
   * @returns An array of populated review DTOs, which include detailed review data formatted for client-side use.
   * @throws {NotFoundException} Throws an exception if the specified deposit is not found, ensuring reviews are only fetched for existing deposits.
   */
  @ApiOperation({ summary: 'Get a list of reviews' })
  @UseGuards(JwtOrAnonymousGuard)
  @Get('')
  async getReviews(
    @Req() req: Request,
    @Query('depositId') depositId: string,
    @Query('creator') creator?: string
  ): Promise<ReviewPopulatedDTO[]> {
    const user = await this.userService.getLoggedUser(req);
    let query: StrictFilterQuery<ReviewDocument> = {
      status: ReviewStatus.published,
    };

    if (creator) {
      query.creator = creator;
      query.showIdentityToEveryone = true;
    }

    if (depositId) {
      query.deposit = depositId;
      if (user) {
        const deposit = await this.depositService.findById(depositId);
        assertIsDefined(deposit, 'Deposit not found');
        const ability = await this.authorizationService.defineAbilityFor(user);
        const canModerate = ability.can('moderate', deposit);
        if (canModerate) {
          query = {
            $or: [
              { deposit: depositId, status: ReviewStatus.published },
              { deposit: depositId, status: ReviewStatus.pendingApproval },
            ],
          };
        } else {
          query = {
            $or: [
              { deposit: depositId, status: ReviewStatus.published },
              { deposit: depositId, creator: user._id },
            ],
          };
        }
      }
    }

    const reviews = await this.reviewService.find(query);
    for (let review of reviews) {
      review = await this.reviewService.setPresignedURLs(review);
    }

    return await this.transformerService.reviewPopulatedToDtoArray(reviews, user);
  }

  /**
   * GET - Retrieves the logged-in user's reviews using pagination.
   * This method only returns reviews created by the logged-in user.
   *
   * @param req The request object containing user authentication.
   * @param {PaginationParamsDTO} paginationParams - Object containing pagination parameters including the current page and limit per page.
   * @returns A populated DTO that includes an array of reviews and the total count of reviews.
   * @throws {NotFoundException} Thrown if the user is not found, ensuring that only valid, logged-in users can access their reviews.
   */
  @ApiOperation({ summary: "Get the logged in user's reviews" })
  @UseGuards(JwtAuthGuard)
  @Get('myReviews')
  async getMyReviews(
    @Req() req: Request,
    @Query() { page, limit }: PaginationParamsDTO
  ): Promise<ReviewsPopulatedQueryDTO> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');

    const reviews = await this.reviewService.findWithLimit(
      {
        creator: user._id,
      },
      undefined,
      limit,
      page
    );

    const reviewsDTO = await this.transformerService.reviewPopulatedToDtoArray(reviews, user);
    const count = await this.reviewService.reviewModel.countDocuments({ creator: user._id });
    const resultQuery: ReviewsPopulatedQueryDTO = {
      reviews: reviewsDTO,
      count: count,
    };

    return resultQuery;
  }

  /**
   * GET - Retrieves a specific review by its ID. Access is controlled by the user's permissions.
   *
   * @param req The HTTP request object containing user context.
   * @param id The ID of the review to retrieve.
   * @returns The requested review in a populated DTO format.
   * @throws {NotFoundException} Thrown if the review or user is not found.
   * @throws {UnauthorizedException} Thrown if the user lacks permission to view the review.
   */
  @ApiOperation({ summary: 'Get a review by ID' })
  @UseGuards(JwtOrAnonymousGuard)
  @Get(':id([0-9a-f]{24})')
  async getReview(@Req() req: Request, @Param('id') id: string): Promise<ReviewPopulatedDTO> {
    const user = await this.userService.getLoggedUser(req);
    let review = await this.reviewService.findById(id);
    assertIsDefined(review, 'Review not found');

    const ability = await this.authorizationService.defineAbilityFor(user);
    this.authorizationService.canDo(ability, REVIEW_ACTIONS.read, review);

    review = await this.reviewService.setPresignedURLs(review);

    return await this.transformerService.reviewPopulatedToDto(review, user);
  }

  /**
   * POST - Creates a new review associated with a deposit. This method checks if the user was invited to review the deposit.
   *
   * @param req The HTTP request object containing user context.
   * @param newReview Data transfer object containing the new review details.
   * @returns The created review in a populated DTO format.
   * @throws {NotFoundException} Thrown if the deposit, user, or invite (if specified) is not found.
   * @throws {UnauthorizedException} Thrown if the user lacks permission to create a review for the deposit.
   */
  @ApiOperation({ summary: 'Create a new review' })
  @UseGuards(JwtAuthGuard)
  @Post('')
  async createReview(
    @Req() req: Request,
    @Body() newReview: CreateReviewDTO
  ): Promise<ReviewPopulatedDTO> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');

    const deposit = await this.depositService.findById(newReview.deposit);
    assertIsDefined(deposit, 'Deposit not found');

    const ability = await this.authorizationService.defineAbilityFor(user);
    this.authorizationService.canDo(ability, DEPOSIT_ACTIONS.review, deposit);

    // Check if reviewer was invited by the owner to review the publication
    const wasInvited = await this.inviteService.exists({
      'data.depositId': deposit._id,
      addressee: user.email,
    });

    // Create review model
    const review = new this.reviewService.reviewModel({
      creator: user._id,
      gravatar: user.gravatar,
      avatar: user.avatar,
      deposit: deposit._id.toHexString(),
      community: deposit.community._id.toHexString(),
      author: `${user.firstName} ${user.lastName}`,
      wasInvited: !!wasInvited,
      showIdentityToAuthor: deposit.communityPopulated.showIdentityToAuthor,
      showIdentityToEveryone: deposit.communityPopulated.showIdentityToEveryone,
      showReviewToAuthor: deposit.communityPopulated.showReviewToAuthor,
      showReviewToEveryone: deposit.communityPopulated.showReviewToEveryone,
    });

    // Set the right kind of review (peer review/copy editing)
    let invite: InviteDocument | null | undefined;
    if (newReview.invite) {
      invite = await this.inviteService.findById(newReview.invite);
      if (!invite) {
        throw new NotFoundException('Invite not found');
      }
      if (invite.inviteType === InviteType.copyEditing) {
        review.kind = ReviewKind.copyEditing;
      }
    }

    const createdReview = await review.save();
    deposit.peerReviews.push(createdReview._id);
    await deposit.save();

    if (invite?.data) {
      invite.data.reviewId = createdReview._id;
      invite.markModified('data');
      await invite.save();
    }

    const createdReviewPopulated = await this.reviewService.findById(createdReview._id);
    assertIsDefined(createdReviewPopulated);

    return this.transformerService.reviewPopulatedToDto(createdReviewPopulated, user);
  }

  /**
   * PATCH - Updates an existing review based on provided details.
   * This function ensures that only authorized updates are made based on user permissions.
   *
   * @param req The HTTP request object containing user context.
   * @param payload Data transfer object containing update details.
   * @param id The ID of the review to be updated.
   * @returns The updated review in a populated DTO format.
   * @throws {NotFoundException} If the review or user is not found.
   * @throws {UnauthorizedException} If the user lacks permission to update the review.
   */
  @ApiOperation({ summary: 'Update a review' })
  @UseGuards(JwtAuthGuard)
  @Patch(':id([0-9a-f]{24})')
  async updateReview(
    @Req() req: Request,
    @Body() payload: UpdateReviewDTO,
    @Param('id') id: string
  ): Promise<ReviewPopulatedDTO> {
    const user = await this.userService.getLoggedUser(req);
    const review = await this.reviewService.findOne({
      _id: id,
    });

    assertIsDefined(review, 'Review not found');
    assertIsDefined(user, 'User not found');

    const ability = await this.authorizationService.defineAbilityFor(user);
    this.authorizationService.canDo(ability, REVIEW_ACTIONS.update, review);

    if (
      payload.hasOwnProperty('showIdentityToAuthor') ||
      payload.hasOwnProperty('showIdentityToEveryone')
    ) {
      const abilityModerator = await this.authorizationService.defineAbilityFor(user);
      this.authorizationService.canDo(abilityModerator, REVIEW_ACTIONS.moderate, review);
    }

    Object.assign(review, payload);
    const reviewUpdated = (await review.save()) as ReviewDocumentPopulated;
    const reviewWithPresigned = await this.reviewService.setPresignedURLs(reviewUpdated);
    assertIsDefined(reviewWithPresigned);
    return this.transformerService.reviewPopulatedToDto(reviewWithPresigned, user);
  }

  /**
   * PATCH - Submits a review, changing its status to pending approval, note this only change the status of the review.
   * This action triggers events and updates the associated deposit.
   *
   * @param req The HTTP request object containing user context.
   * @param id The ID of the review to be submitted.
   * @returns The review with updated status in a populated DTO format.
   * @throws {NotFoundException} If the review, user, or deposit is not found.
   * @throws {UnauthorizedException} If the user lacks permission to submit the review.
   */
  @ApiOperation({ summary: 'Submit a review' })
  @UseGuards(JwtAuthGuard)
  @Patch(':id([0-9a-f]{24})/submit')
  async submitReview(@Req() req: Request, @Param('id') id: string): Promise<ReviewPopulatedDTO> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');

    const review = await this.reviewService.findById(id);
    assertIsDefined(review, 'Review not found');

    const ability = await this.authorizationService.defineAbilityFor(user);
    this.authorizationService.canDo(ability, REVIEW_ACTIONS.update, review);
    const deposit = await this.depositService.findOne({ _id: review.deposit._id });
    assertIsDefined(deposit, 'Deposit not found');

    review.status = ReviewStatus.pendingApproval;

    const eventReviewSubmitted = new ReviewSubmittedConfirmationEvent({
      deposit: deposit.toJSON(),
      review: review.toJSON(),
      user: user.toJSON(),
      community: review.communityPopulated.toJSON(),
    });

    await this.eventService.create(eventReviewSubmitted.getEventDTO());
    const eventReviewChangedToPendingApproval = new ReviewChangedToPendingApprovalEvent({
      deposit: deposit.toJSON(),
      review: review.toJSON(),
      community: review.communityPopulated.toJSON(),
    });
    await this.eventService.create(eventReviewChangedToPendingApproval.getEventDTO());

    deposit.history.push(eventReviewSubmitted.getHistoryTemplate());
    deposit.markModified('history');
    await deposit.save();

    review.history.push(eventReviewSubmitted.getHistoryTemplate());
    review.markModified('history');

    const reviewUpdated = (await review.save()) as ReviewDocumentPopulated;
    const reviewWithPresigned = await this.reviewService.setPresignedURLs(reviewUpdated);
    assertIsDefined(reviewWithPresigned);
    return this.transformerService.reviewPopulatedToDto(reviewWithPresigned, user);
  }

  /**
   * PATCH - Publishes a review, changing its status to published.
   * This method performs checks to ensure the user is authorized to publish the review.
   *
   * @param req The HTTP request object containing user context.
   * @param id The ID of the review to be published.
   * @param payload Optional payload that may include a reason for the publication status change.
   * @returns The review with updated status in a populated DTO format.
   * @throws {NotFoundException} If the review, user, or deposit is not found.
   * @throws {UnauthorizedException} If the user lacks permission to publish the review.
   */
  @ApiOperation({ summary: 'Publish a review' })
  @UseGuards(JwtAuthGuard)
  @Patch(':id([0-9a-f]{24})/published')
  async publishedReview(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() payload?: ModerateReviewPayload
  ): Promise<ReviewPopulatedDTO> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');

    const review = await this.reviewService.findById(id);
    assertIsDefined(review, 'Review not found');

    const ability = await this.authorizationService.defineAbilityFor(user);
    this.authorizationService.canDo(ability, REVIEW_ACTIONS.update, review);
    this.authorizationService.canDo(ability, REVIEW_ACTIONS.moderate, review);

    const deposit = await this.depositService.findOne({ _id: review.deposit._id });
    assertIsDefined(deposit, 'Deposit not found');

    review.status = ReviewStatus.published;

    const eventReviewAccepted = new ReviewPublishedConfirmationToReviewerEvent({
      deposit: deposit.toJSON(),
      review: review.toJSON(),
      user: user.toJSON(),
      community: deposit.communityPopulated.toJSON(),
      reason: payload?.reason,
    });

    await this.eventService.create(eventReviewAccepted.getEventDTO());

    const publicOrHiddenReview = await this.transformerService.reviewPopulatedToDto(
      review,
      deposit.ownerProfile
    );

    const eventReviewCreated = new ReviewPublishedConfirmationToAuthorEvent({
      deposit: deposit.toJSON(),
      review: publicOrHiddenReview,
      community: review.communityPopulated.toJSON(),
    });
    await this.eventService.create(eventReviewCreated.getEventDTO());

    deposit.history.push(eventReviewAccepted.getHistoryTemplate());
    deposit.markModified('history');
    await deposit.save();

    review.history.push(eventReviewAccepted.getHistoryTemplate());
    review.markModified('history');

    review.status = ReviewStatus.published;
    const reviewUpdated = (await review.save()) as ReviewDocumentPopulated;
    const reviewWithPresigned = await this.reviewService.setPresignedURLs(reviewUpdated);
    assertIsDefined(reviewWithPresigned);
    return this.transformerService.reviewPopulatedToDto(reviewWithPresigned, user);
  }

  /**
   * PATCH - Changes the status of a review back to draft.
   * This action is only allowed if the review is currently in a pending approval status.
   *
   * @param req The HTTP request object containing user context.
   * @param payload Data transfer object containing details necessary for the action, such as the reason for the status change.
   * @param id The ID of the review to revert to draft status.
   * @returns The review with its status updated to draft in a populated DTO format.
   * @throws {ForbiddenException} If the review is not in pending approval status.
   * @throws {NotFoundException} If the review, user, or deposit is not found.
   * @throws {UnauthorizedException} If the user lacks permission to change the review status.
   */
  @ApiOperation({ summary: "Set review's status to draft" })
  @UseGuards(JwtAuthGuard)
  @Patch(':id/draft')
  async draftReview(
    @Req() req: Request,
    @Body() payload: ModerateReviewPayload,
    @Param('id') id: string
  ): Promise<ReviewPopulatedDTO> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');

    const review = await this.reviewService.findOne({ _id: id });
    assertIsDefined(review, 'Review not found');

    const deposit = await this.depositService.findOne({ _id: review.deposit });
    assertIsDefined(deposit, 'Deposit not found');

    const ability = await this.authorizationService.defineAbilityFor(user);
    this.authorizationService.canDo(ability, REVIEW_ACTIONS.update, review);

    if (review.status !== ReviewStatus.pendingApproval) {
      throw new ForbiddenException('Review is not in pending approval');
    }

    assertIsDefined(deposit.community, 'Community not found');

    const event = new ReviewChangedToDraftEvent({
      review: review.toJSON(),
      deposit: deposit.toJSON(),
      community: deposit.communityPopulated.toJSON(),
      reason: payload.reason,
      user: user.toJSON(),
    });
    await this.eventService.create(event.getEventDTO());
    review.history.push(event.getHistoryTemplate());
    review.markModified('history');
    review.status = ReviewStatus.draft;
    await review.save();

    deposit.history.push(event.getHistoryTemplate());
    deposit.markModified('history');
    await deposit.save();

    let reviewUpdated = (await review.save()) as ReviewDocumentPopulated;
    reviewUpdated = await this.reviewService.setPresignedURLs(reviewUpdated);
    return this.transformerService.reviewPopulatedToDto(reviewUpdated, user);
  }

  /**
   * DETELE - Deletes a review by its ID, ensuring the user has appropriate permissions and
   * there are no dependent resources blocking deletion.
   *
   * @param req - The HTTP request object, which includes user context.
   * @param id - The unique identifier of the review to delete.
   * @returns A DTO of the deleted review confirming the action.
   * @throws {NotFoundException} - If the review, user, or deposit related to the review is not found.
   * @throws {UnauthorizedException} - If the user does not have permission to delete the review.
   */
  @ApiOperation({ summary: 'Delete a review' })
  @UseGuards(JwtAuthGuard)
  @Delete(':id([0-9a-f]{24})')
  async deleteReview(@Req() req: Request, @Param('id') id: string): Promise<ReviewPopulatedDTO> {
    const user = await this.userService.getLoggedUser(req);
    const review = await this.reviewService.findOne({ _id: id });

    assertIsDefined(review, 'Review not found');
    assertIsDefined(user, 'User not found');

    const ability = await this.authorizationService.defineAbilityFor(user);
    this.authorizationService.canDo(ability, REVIEW_ACTIONS.delete, review);

    assertIsDefined(review.deposit, 'Deposit not found');
    const deposit = await this.depositService.findById(review.deposit._id);
    assertIsDefined(deposit, 'Deposit not found');

    const index = deposit.peerReviews.findIndex(peerReview => peerReview._id.equals(review._id));
    if (index === -1) {
      throw new NotFoundException('Review not found in deposit');
    }

    deposit.peerReviews.splice(index, 1);
    deposit.markModified('peerReviews');

    const invitation = await this.inviteService.findOne({
      'data.reviewId': review._id,
    });

    // Modify Invitation if it has one
    if (invitation?.data) {
      invitation.data.reviewId = undefined;
      invitation.markModified('data');
      await invitation.save();
    }

    // Delete review files
    if (review.file) {
      const objectKey = `${this.filesPrefix}/${review._id.toHexString()}/${review.file.filename}`;
      await this.storageService.delete(objectKey);
    }

    // Delete review files
    for (const file of review.extraFiles) {
      const objectKey = `${this.filesPrefix}/${review._id.toHexString()}/${file.filename}`;
      await this.storageService.delete(objectKey);
    }

    await review.deleteOne();
    await deposit.save();
    return this.transformerService.reviewPopulatedToDto(review, user);
  }

  /**
   * POST - Uploads a file to a review, handling permissions and validation of the file type.
   *
   * @param req - The HTTP request object containing user authentication.
   * @param id - The ID of the review to which the file is being uploaded.
   * @param payload - Contains file details to be uploaded.
   * @param isMainFile - Boolean flag to indicate if the file is the main document of the review.
   * @returns A signed URL for uploading the file and file metadata.
   * @throws {UnauthorizedException} - If the file extension is not allowed or user is unauthorized.
   * @throws {NotFoundException} - If the review or user is not found.
   */
  @ApiOperation({ summary: 'Upload a file into a review' })
  @UseGuards(JwtAuthGuard)
  @Post(':id([0-9a-f]{24})/file')
  async uploadReviewFile(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() payload: CreateFileDTO,
    @Query('isMainFile') isMainFile: boolean
  ): Promise<SignedUrlDTO> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');

    const review = await this.reviewService.findById(id);
    assertIsDefined(review, 'Review not found');

    const ability = await this.authorizationService.defineAbilityFor(user);
    this.authorizationService.canDo(ability, REVIEW_ACTIONS.update, review);

    const file = payload.file;

    // File extension to lower case
    const fileExtension = extname(file.name).toLowerCase();

    if (!ALLOWED_FILE_EXTENSIONS.includes(fileExtension)) {
      throw new UnauthorizedException('Invalid extension file');
    }

    // Set filename depending on file type
    let generatedFilename = '';
    const tags: string[] = [];
    if (isMainFile) {
      generatedFilename = `review-${review._id.toHexString()}${fileExtension}`;
      tags.push('Review');
      // If we are uploading a new main file, delete old metadata
      review.file = undefined;
    } else {
      const time = Date.now();
      generatedFilename = `extra-${review._id.toHexString()}-${time}${fileExtension}`;
    }

    const fileMetadata: FileMetadata = {
      filename: generatedFilename,
      description: file.name,
      contentType: file.type,
      contentLength: file.size,
      tags: [],
    };

    const objectKey = `${this.filesPrefix}/${review._id.toHexString()}/${fileMetadata.filename}`;
    const params: PutObjectCommandInput = {
      Key: objectKey,
      ContentType: fileMetadata.contentType,
      Bucket: this.storageService.privateBucket,
    };

    const signedUrl = await this.storageService.getSignedUrl('putObject', params);

    await review.save();
    return { signedUrl, fileMetadata, isMainFile: isMainFile, replacePDF: false };
  }

  /**
   * PATCH - Confirms the upload of a file to a review, ensuring it matches the expected format and updating the review record.
   * @param req - The HTTP request object containing user context.
   * @param id - The review ID to which the file is being confirmed.
   * @param payload - Contains metadata about the file being confirmed.
   * @returns A populated DTO of the review with the confirmed file included.
   * @throws {BadRequestException} - If the file name format is invalid.
   * @throws {NotFoundException} - If the review or user is not found.
   */
  @ApiOperation({ summary: 'Confirm the file upload for a review' })
  @UseGuards(JwtAuthGuard)
  @Patch(':id([0-9a-f]{24})/files/confirm')
  async uploadFileConfirmationReview(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() payload: UploadFilePayload
  ): Promise<ReviewPopulatedDTO> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');

    const review = await this.reviewService.findOne({ _id: id });
    assertIsDefined(review, 'Review not found');

    const ability = await this.authorizationService.defineAbilityFor(user);
    this.authorizationService.canDo(ability, REVIEW_ACTIONS.update, review);

    //Check filename correct like extra-{ObjectId}-{timestamp}.{extension}
    const checkFilename = new RegExp(
      '^(review|extra)-([0-9a-f]{24})(-([0-9]{13}))?\\.([0-9a-z]{2,4})$'
    );
    if (!checkFilename.test(payload.fileMetadata.filename)) {
      throw new BadRequestException('Invalid filename');
    }
    const objectKey = `${this.filesPrefix}/${review._id.toHexString()}/${
      payload.fileMetadata.filename
    }`;
    await this.storageService.headObject({ objectKey });

    if (payload.isMainFile) {
      review.file = payload.fileMetadata;
      review.markModified('file');
      const event = new FileUploadedEvent({
        depositOrReview: review.toJSON(),
        filename: payload.fileMetadata.filename,
      });

      await this.eventService.create(event.getEventDTO());
    } else {
      review.extraFiles.push(payload.fileMetadata);
      review.markModified('extraFiles');
    }

    review.depopulate('deposit');
    await review.save();
    const reviewPopulated = await this.reviewService.findById(review._id.toHexString());
    assertIsDefined(reviewPopulated, 'depositPopulated not found');

    const reviewWithPresigned = await this.reviewService.setPresignedURLs(reviewPopulated);
    return this.transformerService.reviewPopulatedToDto(reviewWithPresigned, user);
  }

  /**
   * GET - Retrieves a file associated with a review, checking the review's status and ensuring the file exists.
   *
   * @param id - The ID of the review from which the file is being retrieved.
   * @param filename - The filename to retrieve.
   * @param response - HTTP response to facilitate file download via redirection to a signed URL.
   * @throws UnauthorizedException if the review is in draft status.
   * @throws NotFoundException if the review or the specified file is not found.
   */
  // TODO filename parameter is unnecessary but file-list component (UI) uses it like when it is a publication file.
  @ApiOperation({ summary: 'Get the file of a review' })
  @Get(':id([0-9a-f]{24})/files/:filename')
  async getReviewFile(
    @Param('id') id: string,
    @Param('filename') filename: string,
    @Res() response: Response
  ): Promise<void> {
    const review = await this.reviewService.findById(id);
    assertIsDefined(review, 'Review not found');

    if (review.status === ReviewStatus.draft) {
      throw new UnauthorizedException('Review should not be draft');
    }

    const allReviewFiles = review.extraFiles.concat(review.file || []);
    const storedFile = allReviewFiles.find(file => file.filename === filename);
    assertIsDefined(storedFile, 'File not found');

    const objectKey = `${this.filesPrefix}/${review._id.toHexString()}/${storedFile.filename}`;
    const params = {
      Key: objectKey,
      Expires: EXPIRATION_TIME.ONE_HOUR,
      Bucket: this.storageService.privateBucket,
    };
    const signedUrl = await this.storageService.getSignedUrl('getObject', params);
    response.redirect(signedUrl);
  }

  /**
   * GET - Retrieves media (images) associated with a review.
   *
   * @param id - The ID of the review.
   * @param image - The specific image filename.
   * @param response - HTTP response to facilitate file access via redirection to a signed URL.
   * @throws NotFoundException if the review or image is not found.
   */
  @ApiOperation({ summary: 'Get review images' })
  @Get(':id([0-9a-f]{24})/media/:image/')
  async getReviewImages(
    @Param('id') id: string,
    @Param('image') image: string,
    @Res() response: Response
  ): Promise<void> {
    // TODO fix this visibility check for binary files
    const review = await this.reviewService.findById(id);
    assertIsDefined(review, 'Review not found');

    const objectKey = `${this.filesPrefix}/${review._id.toHexString()}/media/${image}`;
    const signedUrl = await this.storageService.getSignedUrl('getObject', {
      Key: objectKey,
      Bucket: this.storageService.privateBucket,
    });
    response.redirect(signedUrl);
  }

  /**
   * GET - Previews DOI metadata for a review, to be registered with DataCite or Crossref.
   *
   * @param req - HTTP request containing user context.
   * @param id - Review ID for which metadata is generated.
   * @throws NotFoundException if the review, community, or deposit is not found or if the DOI provider is not configured.
   */
  @ApiOperation({ summary: 'Preview DOI Metadata registration for DataCite/Crossref provider' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id([0-9a-f]{24})/doi-preview')
  async previewDOIRegistrationReview(
    @Req() req: Request,
    @Param('id') id: string
  ): Promise<StringDataPayload> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');
    const review = await this.reviewService.findById(id);
    assertIsDefined(review, 'Review not found');
    const community = review.communityPopulated;
    assertIsDefined(community, 'Community not found');
    const deposit = review.depositPopulated;
    assertIsDefined(deposit, 'Deposit not found');

    const ability = await this.authorizationService.defineAbilityFor(user);
    this.authorizationService.canDo(ability, REVIEW_ACTIONS.moderate, review);

    const transformedReview = await this.transformerService.reviewPopulatedToDto(review, null);
    const reviewNumber = await this.reviewService.reviewModel
      .countDocuments({ deposit: review.deposit, doi: { $exists: true, $ne: '' } })
      .exec();

    if (review.communityPopulated.datacite) {
      const json = this.dataciteService.generateDOIMetadataReview(
        transformedReview,
        community,
        deposit,
        reviewNumber + 1
      );
      return { data: JSON.stringify(json) };
    } else if (review.communityPopulated.crossref) {
      return {
        data: await this.crossrefService.createReviewXML(
          transformedReview,
          review.communityPopulated.crossref
        ),
      };
    } else {
      throw new NotFoundException('DOI provider is not configured!');
    }
  }

  /**
   * Creates a DOI for a review through DataCite/Crossref, handling errors and configuration checks.
   *
   * @param req - HTTP request containing user context.
   * @param id - Review ID for which DOI is being created.
   * @throws NotFoundException if the review, community, or deposit is not found or if the DOI provider is not configured.
   */
  @ApiOperation({ summary: 'Create a DOI for a review using DataCite/Crossref provider' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id([0-9a-f]{24})/doi')
  async createDoiReview(@Req() req: Request, @Param('id') id: string): Promise<StringDataPayload> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');
    const review = await this.reviewService.findById(id);
    assertIsDefined(review, 'Review not found');
    const community = review.communityPopulated;
    assertIsDefined(community, 'Community not found');
    const deposit = review.depositPopulated;
    assertIsDefined(deposit, 'Deposit not found');

    const ability = await this.authorizationService.defineAbilityFor(user);
    this.authorizationService.canDo(ability, REVIEW_ACTIONS.moderate, review);

    const transformedReview = await this.transformerService.reviewPopulatedToDto(review, null);
    const reviewNumber = await this.reviewService.reviewModel
      .countDocuments({ deposit: review.deposit, doi: { $exists: true, $ne: '' } })
      .exec();

    if (review.communityPopulated.datacite) {
      const result = { data: '' };
      try {
        result.data = await this.dataciteService.generateReviewDOI(
          transformedReview,
          community,
          deposit,
          reviewNumber
        );
      } catch (error: unknown) {
        console.log(error);
        result.data = (error as HttpException).message;
      }
      return result;
    } else if (review.communityPopulated.crossref) {
      return { data: await this.crossrefService.generateReviewDOI(transformedReview, community) };
    } else {
      throw new NotFoundException('DOI provider is not configured!');
    }
  }

  /**
   * GET - Retrieves DOI metadata associated with a review.
   *
   * @param req - HTTP request containing user context.
   * @param id - Review ID for which DOI metadata is retrieved.
   * @throws NotFoundException if the review, community, or deposit is not found, or if the DOI provider is not configured.
   */
  @ApiOperation({ summary: 'Get the metadata for a DOI associated with a review' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id([0-9a-f]{24})/doi')
  async getDoiReview(@Req() req: Request, @Param('id') id: string): Promise<Doi> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');
    const review = await this.reviewService.findById(id);
    assertIsDefined(review, 'Review not found');
    const community = review.communityPopulated;
    assertIsDefined(community, 'Community not found');
    const deposit = review.depositPopulated;
    assertIsDefined(deposit, 'Deposit not found');
    const transformedReview = await this.transformerService.reviewPopulatedToDto(review, null);

    if (review.communityPopulated.datacite) {
      return await this.dataciteService.getReviewDoiMetadata(transformedReview, community);
    } else if (review.communityPopulated.crossref) {
      // TODO Not implemented
      throw new NotImplementedException('Featured not implemented');
    } else {
      throw new NotFoundException('DOI provider is not configured!');
    }
  }

  /**
   * DETELE - Deletes a file associated with a review, validating file existence and permissions.
   *
   * @param req - HTTP request containing user context.
   * @param id - Review ID from which the file is being deleted.
   * @param filename - The filename of the file to be deleted.
   * @throws NotFoundException if the file is not found.
   */
  @ApiOperation({ summary: 'Delete review file' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id([0-9a-f]{24})/files/:filename')
  async deleteReviewExtraFile(
    @Req() req: Request,
    @Param('id') id: string,
    @Param('filename') filename: string
  ): Promise<ReviewPopulatedDTO> {
    const user = await this.userService.getLoggedUser(req);
    const review = await this.reviewService.findOne({ _id: id });
    assertIsDefined(review, 'Review not found');
    assertIsDefined(user, 'User not found');
    const ability = await this.authorizationService.defineAbilityFor(user);
    this.authorizationService.canDo(ability, REVIEW_ACTIONS.update, review);
    const index = review.extraFiles.findIndex(file => file.filename === filename);
    if (index === -1) {
      throw new NotFoundException('File not found');
    }
    const storedFile = review.extraFiles[index];
    const objectKey = `${review._id.toHexString()}/${storedFile.filename}`;
    await this.storageService.delete(objectKey);
    review.extraFiles.splice(index, 1); // Removes item from files
    review.markModified('extraFiles');
    const reviewSaved = await review.save();
    let reviewPopulated = await this.reviewService.findById(reviewSaved._id.toHexString());
    assertIsDefined(reviewPopulated, 'reviewPopulated not found');
    reviewPopulated = await this.reviewService.setPresignedURLs(reviewPopulated);
    return this.transformerService.reviewPopulatedToDto(reviewPopulated, user);
  }
}
