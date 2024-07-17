import { ClassConstructor } from 'class-transformer';
import { Injectable } from '@nestjs/common';
import {
  AuthorizationService,
  REVIEW_ACTIONS,
  SubjectList,
} from '../authorization/authorization.service';
import { UserDocument } from '../users/user.schema';
import { PopulatedDepositDocument } from '../deposit/deposit.service';
import { DepositPopulatedDTO } from '../dtos/deposit/deposit-populated.dto';
import { ReviewDocumentPopulated, ReviewService } from '../review/review.service';
import { ReviewPopulatedDTO } from '../dtos/review/review-populated.dto';
import { ReviewDocument } from '../review/review.schema';
import { DepositDocument } from '../deposit/deposit.schema';
import { ReviewSummaryDTO } from '../dtos/review/review-summary.dto';
import { plainToClassCustom } from './utils';
import Stripe from 'stripe';
import { StripeCheckoutDTO } from '../dtos/payment/stripe-checkout.dto';
import { StripeWebhookHistoryDocument } from '../payment/stripe-webhook-history.schema';
import { StripeWebhookHistoryDTO } from '../dtos/payment/stripe-wehbook-history.dto';
import { StripeProductDTO } from '../dtos/payment/stripe-product.dto';
import { PaymentDocument } from '../payment/payment.schema';
import { PaymentDTO } from '../dtos/payment/payment.dto';
import { TemplateDTO } from '../dtos/template/template.dto';
import { TemplateDocument } from '../template/template.schema';
import { Readable } from 'stream';
import { AttachmentLike } from 'nodemailer/lib/mailer';
import { SessionDocument } from '../session/session.schema';
import { SessionDTO } from '../dtos/session/session.dto';
import { UserPrivateDTO } from '../dtos/user/user-private.dto';
import { InviteDocument } from '../invite/invite.schema';
import { InviteDTO } from '../dtos/invite/invite.dto';
import { ConversationDocument } from '../conversations/conversations.schema';
import { VideoDTO } from '../dtos/video.dto';
import { CommunityDocument } from '../communities/communities.schema';
import { CommunityDTO } from '../dtos/community/community.dto';
import { CommunityPrivateDTO } from '../dtos/community/community-private.dto';
import { CommunityDocumentPopulated } from '../communities/communities.service';
import { CommunityPopulatedDTO } from '../dtos/community/community-populated.dto';
import { CommunityModeratorDocument } from '../communities/communities-moderator.schema';
import { CommunityModeratorDTO } from '../dtos/community/community-moderator.dto';
import { DepositsQueryDTO } from '../dtos/deposit/deposit-query.dto';
import { ReviewsPopulatedQueryDTO } from '../dtos/review/review-query.dto';
import { CommentDTO } from '../dtos/comment/comment.dto';
import { CallDocument } from '../call/call.schema';
import { CallDTO } from '../dtos/call/call.dto';
import { ConversationPopulatedDTO } from '../dtos/conversation/conversation-populated.dto';
import { MessageDocument } from '../messages/messages.schema';
import { MessageDTO } from '../dtos/message.dto';
import { PopulatedCommentaryDocument } from '../comments/comments.service';
import { CommentaryDocument } from '../comments/comments.schema';
import { InviteQueryDTO } from '../dtos/invite/invite-query.dto';
import { InvitePopulatedDocument } from '../invite/invite.service';
import { InvitePopulatedDTO } from '../dtos/invite/invite-populated.dto';
import { CheckoutSessionPaymentsDto } from '../dtos/payment/checkout-session-payments.dto';
import { PaymentQueryDTO } from '../dtos/payment/payment-query.dto';
import { EmailUsersDTO } from '../dtos/community/email-users.dto';
import { DoiLogDocument } from '../doi/doi-log.schema';
import { DoiLogDTO } from '../dtos/doiLog.dto';
import { assertIsDefined } from '../utils/utils';

/**
 * Service for handling TransformerService.
 */
@Injectable()
export class TransformerService {
  /**
   * Constructs an instance of TransformerService with required services.
   *
   * @param {AuthorizationService} authorizationService - Service for authorization.
   * @param {ReviewService} reviewService - Service for interacting with reviews.
   */
  constructor(
    private readonly authorizationService: AuthorizationService,
    private readonly reviewService: ReviewService
  ) {}

  /**
   * Converts plain JavaScript data to a class instance, with optional action-based transformation groups.
   *
   * @param {ClassConstructor<TypeDTO>} transformTo - The class to which the data should be transformed.
   * @param {unknown} data - The plain data to transform.
   * @param {string[]} actions - Optional actions to determine transformation groups.
   * @returns {TypeDTO} The transformed class instance.
   */
  plainToClass<TypeDTO>(
    transformTo: ClassConstructor<TypeDTO>,
    data: unknown,
    actions: string[] = []
  ): TypeDTO {
    const groups: string[] = [];
    if (actions.includes('edit')) {
      groups.push('owner');
    }
    if (actions.includes('moderate')) {
      groups.push('moderate');
    }
    if (actions.includes('readMessage')) {
      groups.push('readMessage');
    }

    return plainToClassCustom(transformTo, data, { groups: groups });
  }

  /**
   * Filters out elements from a data transfer object array that are not marked as readable.
   *
   * @param {T[]} dataDTO - The array of data transfer objects to filter.
   * @returns {T[]} The filtered array of data transfer objects.
   */
  removeUnreadableElements<T extends { actions?: string[] }>(dataDTO: T[]): T[] {
    return dataDTO.filter(element => element.actions?.includes('read'));
  }

  /**
   * Transforms data into the specified data transfer object (DTO) based on user permissions and the specified class.
   * This method is overloaded to handle different types of data inputs.
   *
   * @param {unknown} data - The data to transform.
   * @param {ClassConstructor<TypeDTO>} transformTo - The DTO class constructor.
   * @param {UserDocument | null} user - The user based on whose permissions the transformation is to be made.
   * @param {string[]} groups - Optional transformation groups to apply.
   * @returns {Promise<TypeDTO | TypeDTO[]>} A promise resolving to the transformed DTO or an array of DTOs.
   */
  async transformToDto(
    data: PopulatedCommentaryDocument[] | CommentaryDocument[],
    transformTo: ClassConstructor<CommentDTO>,
    user: UserDocument | null
  ): Promise<CommentDTO[]>;
  async transformToDto(
    data: PopulatedCommentaryDocument | CommentaryDocument,
    transformTo: ClassConstructor<CommentDTO>,
    user: UserDocument | null
  ): Promise<CommentDTO>;
  async transformToDto(
    data: CommunityDocumentPopulated[] | CommunityDocument[],
    transformTo: ClassConstructor<CommunityPrivateDTO>,
    user: UserDocument | null
  ): Promise<CommunityPrivateDTO[]>;
  async transformToDto(
    data: CommunityDocumentPopulated | CommunityDocument,
    transformTo: ClassConstructor<CommunityPrivateDTO>,
    user: UserDocument | null
  ): Promise<CommunityPrivateDTO>;
  async transformToDto(
    data: CommunityDocumentPopulated[],
    transformTo: ClassConstructor<CommunityPopulatedDTO>,
    user: UserDocument | null
  ): Promise<CommunityPopulatedDTO[]>;
  async transformToDto(
    data: CommunityDocumentPopulated,
    transformTo: ClassConstructor<CommunityPopulatedDTO>,
    user: UserDocument | null
  ): Promise<CommunityPopulatedDTO>;
  async transformToDto(
    data: CommunityDocument,
    transformTo: ClassConstructor<CommunityDTO>,
    user: UserDocument | null
  ): Promise<CommunityDTO>;
  async transformToDto(
    data: ConversationDocument[],
    transformTo: ClassConstructor<ConversationPopulatedDTO>,
    user: UserDocument | null
  ): Promise<ConversationPopulatedDTO[]>;
  async transformToDto(
    data: ConversationDocument,
    transformTo: ClassConstructor<ConversationPopulatedDTO>,
    user: UserDocument | null
  ): Promise<ConversationPopulatedDTO>;
  async transformToDto(
    data: InvitePopulatedDocument[],
    transformTo: ClassConstructor<InvitePopulatedDTO>,
    user: UserDocument | null,
    groups?: string[]
  ): Promise<InvitePopulatedDTO[]>;
  async transformToDto(
    data: InvitePopulatedDocument,
    transformTo: ClassConstructor<InvitePopulatedDTO>,
    user: UserDocument | null
  ): Promise<InvitePopulatedDTO>;
  async transformToDto(
    data: InviteDocument[],
    transformTo: ClassConstructor<InviteDTO>,
    user: UserDocument | null
  ): Promise<InviteDTO[]>;
  async transformToDto(
    data: InviteDocument,
    transformTo: ClassConstructor<InviteDTO>,
    user: UserDocument | null
  ): Promise<InviteDTO>;
  async transformToDto(
    data: UserDocument[],
    transformTo: ClassConstructor<UserPrivateDTO>,
    user: UserDocument | null
  ): Promise<UserPrivateDTO[]>;
  async transformToDto(
    data: UserDocument,
    transformTo: ClassConstructor<UserPrivateDTO>,
    user: UserDocument | null
  ): Promise<UserPrivateDTO>;
  async transformToDto(
    data: SessionDocument[],
    transformTo: ClassConstructor<SessionDTO>,
    user: UserDocument | null
  ): Promise<SessionDTO[]>;
  async transformToDto(
    data: SessionDocument,
    transformTo: ClassConstructor<SessionDTO>,
    user: UserDocument | null
  ): Promise<SessionDTO>;
  async transformToDto<TypeDTO extends { actions?: string[] }>(
    data: SubjectList | SubjectList[],
    transformTo: ClassConstructor<TypeDTO>,
    user: UserDocument | null,
    groups: string[] = []
  ): Promise<TypeDTO | TypeDTO[]> {
    if (Array.isArray(data)) {
      let arrayOfDtos: TypeDTO[] = [];
      for (const elem of data) {
        const actions = await this.authorizationService.getSubjectActions(user, elem);
        const objectDTO = this.plainToClass(transformTo, elem, actions.concat(groups));

        objectDTO.actions = actions;

        arrayOfDtos.push(objectDTO);
      }
      arrayOfDtos = this.removeUnreadableElements(arrayOfDtos);
      return arrayOfDtos;
    } else {
      const actions = await this.authorizationService.getSubjectActions(user, data);
      const objectDTO = this.plainToClass(transformTo, data, actions);
      objectDTO.actions = actions;

      return objectDTO;
    }
  }

  /**
   * Converts data to various types of DTOs, handling multiple data and DTO types, particularly focusing on community moderation and user information.
   * This method is overloaded to handle different types of data inputs.
   *
   * @param {unknown} data - The data to transform.
   * @param {ClassConstructor<TypeDTO>} transformTo - The DTO class constructor.
   * @returns {Promise<TypeDTO | TypeDTO[]>} A promise resolving to the transformed DTO or an array of DTOs.
   */
  async toDTO(
    data: CommunityModeratorDocument[],
    transformTo: ClassConstructor<CommunityModeratorDTO>
  ): Promise<CommunityModeratorDTO[]>;
  async toDTO(
    data: EmailUsersDTO[],
    transformTo: ClassConstructor<EmailUsersDTO>
  ): Promise<EmailUsersDTO[]>;
  async toDTO(
    data: UserDocument,
    transformTo: ClassConstructor<UserPrivateDTO>
  ): Promise<UserPrivateDTO>;
  async toDTO(data: DoiLogDocument, transformTo: ClassConstructor<DoiLogDTO>): Promise<DoiLogDTO>;
  async toDTO(
    data: CommunityModeratorDocument,
    transformTo: ClassConstructor<CommunityModeratorDTO>
  ): Promise<CommunityModeratorDTO>;
  async toDTO(
    data: { deposits: PopulatedDepositDocument[]; count: number },
    transformTo: ClassConstructor<DepositsQueryDTO>
  ): Promise<DepositsQueryDTO>;
  async toDTO(
    data: { invites: InvitePopulatedDocument[]; count: number },
    transformTo: ClassConstructor<InviteQueryDTO>
  ): Promise<InviteQueryDTO>;
  async toDTO(
    data: { payments: PaymentDocument[]; count: number },
    transformTo: ClassConstructor<PaymentQueryDTO>
  ): Promise<PaymentQueryDTO>;
  async toDTO(
    data: { reviews: ReviewDocumentPopulated[]; count: number },
    transformTo: ClassConstructor<ReviewsPopulatedQueryDTO>
  ): Promise<ReviewsPopulatedQueryDTO>;
  async toDTO(data: CallDocument[], transformTo: ClassConstructor<CallDTO>): Promise<CallDTO[]>;
  async toDTO(data: CallDocument, transformTo: ClassConstructor<CallDTO>): Promise<CallDTO>;
  async toDTO(data: VideoDTO[], transformTo: ClassConstructor<VideoDTO>): Promise<VideoDTO[]>;
  async toDTO(
    data: Stripe.Checkout.Session,
    transformTo: ClassConstructor<StripeCheckoutDTO>
  ): Promise<StripeCheckoutDTO>;
  async toDTO(
    data: StripeWebhookHistoryDocument,
    transformTo: ClassConstructor<StripeWebhookHistoryDTO>
  ): Promise<StripeCheckoutDTO>;
  async toDTO(
    data: Stripe.Product[],
    transformTo: ClassConstructor<StripeProductDTO>
  ): Promise<StripeProductDTO[]>;
  async toDTO(
    data: PaymentDocument[],
    transformTo: ClassConstructor<PaymentDTO>
  ): Promise<PaymentDTO[]>;
  async toDTO(
    data: { _id: string; payments: PaymentDocument[] }[],
    transformTo: ClassConstructor<CheckoutSessionPaymentsDto>
  ): Promise<CheckoutSessionPaymentsDto[]>;
  async toDTO(
    data: PaymentDocument,
    transformTo: ClassConstructor<PaymentDTO>
  ): Promise<PaymentDTO>;
  async toDTO(
    data: MessageDocument[],
    transformTo: ClassConstructor<MessageDTO>
  ): Promise<MessageDTO[]>;
  async toDTO(
    data: MessageDocument,
    transformTo: ClassConstructor<MessageDTO>
  ): Promise<MessageDTO>;
  async toDTO(
    data: (TemplateDocument & {
      compiledTemplate?: string | Readable | Buffer | AttachmentLike | undefined;
    })[],
    transformTo: ClassConstructor<TemplateDTO>
  ): Promise<TemplateDTO[]>;
  async toDTO(
    data: TemplateDocument & {
      compiledTemplate?: string | Readable | Buffer | AttachmentLike | undefined;
    },
    transformTo: ClassConstructor<TemplateDTO>
  ): Promise<TemplateDTO>;
  async toDTO<Type, TypeDTO extends { actions?: string[] }>(
    data: Type | Type[],
    transformTo: ClassConstructor<TypeDTO>
  ): Promise<TypeDTO | TypeDTO[]> {
    if (Array.isArray(data)) {
      const arrayOfDTOs: TypeDTO[] = [];
      for (const elem of data) {
        arrayOfDTOs.push(this.plainToClass(transformTo, elem));
      }
      return arrayOfDTOs;
    } else {
      return this.plainToClass(transformTo, data);
    }
  }

  /**
   * Converts detailed populated deposit documents into their corresponding DTOs considering user roles and permissions.
   *
   * @param {PopulatedDepositDocument} data - The populated deposit document to convert.
   * @param {UserDocument | null} user - The user based on whose perspective the data is converted.
   * @returns {Promise<DepositPopulatedDTO>} A promise resolving to the transformed deposit populated DTO.
   */
  async depositPopulatedToDto(
    data: PopulatedDepositDocument,
    user: UserDocument | null
  ): Promise<DepositPopulatedDTO> {
    const abilities = await this.authorizationService.defineAbilityFor(user);
    const actions = await this.authorizationService.getSubjectActions(user, data);
    data.peerReviewsPopulated = data.peerReviewsPopulated.filter(review =>
      abilities.can(REVIEW_ACTIONS.read, review)
    );
    data.peerReviews = data.peerReviewsPopulated.map(review => review._id);

    const reviewsSanitized: (ReviewDocument & { ownerProfile: UserDocument })[] = [];
    for (const review of data.peerReviewsPopulated) {
      // @ts-expect-error
      reviewsSanitized.push(await this.reviewToDto(review, user, data));
    }
    data.peerReviewsPopulated = reviewsSanitized;
    const dto = this.plainToClass(DepositPopulatedDTO, data, actions);
    dto.actions = actions;

    return dto;
  }

  /**
   * Converts an array of populated deposit documents into their corresponding DTOs considering user roles and permissions.
   *
   * @param {PopulatedDepositDocument[]} data - The array of populated deposit documents to convert.
   * @param {UserDocument | null} user - The user based on whose perspective the data is converted.
   * @returns {Promise<DepositPopulatedDTO[]>} A promise resolving to the array of transformed deposit populated DTOs.
   */
  async depositPopulatedToDtoArray(
    data: PopulatedDepositDocument[],
    user: UserDocument | null
  ): Promise<DepositPopulatedDTO[]> {
    const dtos: DepositPopulatedDTO[] = [];
    for (const deposit of data) {
      dtos.push(await this.depositPopulatedToDto(deposit, user));
    }
    return this.removeUnreadableElements(dtos);
  }

  /**
   * Converts review documents into summary DTOs considering user roles and visibility permissions.
   *
   * @param {ReviewDocument} data - The review document to convert.
   * @param {UserDocument | null} user - The user based on whose permissions the transformation is made.
   * @param {DepositDocument} deposit - The deposit document associated with the review.
   * @returns {Promise<ReviewSummaryDTO>} A promise resolving to the transformed review summary DTO.
   */
  async reviewToDto(
    data: ReviewDocument,
    user: UserDocument | null,
    deposit: DepositDocument
  ): Promise<ReviewSummaryDTO> {
    const actions = await this.authorizationService.getSubjectActions(user, data);
    let dto = this.plainToClass(ReviewSummaryDTO, data, actions);
    const roles = await this.reviewService.getUserRolesForReview({
      review: data,
      user: user,
      deposit: deposit,
    });
    dto = this.reviewService.setReviewerIdentityVisibility(dto, roles);
    return dto;
  }

  /**
   * Converts populated review documents into populated DTOs considering user roles and visibility permissions.
   *
   * @param {ReviewDocumentPopulated} data - The populated review document to convert.
   * @param {UserDocument | null} user - The user based on whose permissions the transformation is made.
   * @returns {Promise<ReviewPopulatedDTO>} A promise resolving to the transformed review populated DTO.
   */
  async reviewPopulatedToDto(
    data: ReviewDocumentPopulated,
    user: UserDocument | null
  ): Promise<ReviewPopulatedDTO> {
    const actions = await this.authorizationService.getSubjectActions(user, data);

    let dto = this.plainToClass(ReviewPopulatedDTO, data, actions);

    const roles = await this.reviewService.getUserRolesForReview({ review: data, user: user });
    dto = this.reviewService.setReviewerIdentityVisibility(dto, roles);

    dto.actions = actions;

    return dto;
  }

  /**
   * Transforms an array of CommentaryDocument objects into an array of CommentDTO objects.
   *
   * @param {CommentaryDocument[]} data - The array of CommentaryDocument objects to transform.
   * @param {UserDocument | null} user - The user document or null if no user is authenticated.
   * @returns {Promise<CommentDTO[]>} The array of transformed CommentDTO objects.
   */
  async commentaryToDtoArray(
    data: CommentaryDocument[],
    user: UserDocument | null
  ): Promise<CommentDTO[]> {
    const commentsFromReview = data.filter(
      comment =>
        comment.resourceModel === 'Review' &&
        comment.user_id.toHexString() !== user?._id.toHexString()
    );

    const dtos = await this.transformToDto(data, CommentDTO, user);

    if (commentsFromReview.length > 0) {
      const resource = commentsFromReview.pop()?.resource;
      assertIsDefined(resource, 'Resource not found');
      const review = await this.reviewService.findById(resource);
      assertIsDefined(review, 'Review associated to comment not found');

      const reviewAnnon = await this.reviewPopulatedToDto(review, user);

      for (const comment of dtos) {
        if (comment.user_id === review.ownerProfile._id.toHexString()) {
          comment.user = reviewAnnon.ownerProfile;
          comment.user_id = reviewAnnon.author;
        }
      }
    }

    return this.removeUnreadableElements(dtos);
  }

  /**
   * Transforms an array of ReviewDocumentPopulated objects into an array of ReviewPopulatedDTO objects.
   *
   * @param {ReviewDocumentPopulated[]} data - The array of ReviewDocumentPopulated objects to transform.
   * @param {UserDocument | null} user - The user document or null if no user is authenticated.
   * @returns {Promise<ReviewPopulatedDTO[]>} The array of transformed ReviewPopulatedDTO objects.
   */
  async reviewPopulatedToDtoArray(
    data: ReviewDocumentPopulated[],
    user: UserDocument | null
  ): Promise<ReviewPopulatedDTO[]> {
    const dtos: ReviewPopulatedDTO[] = [];
    for (const review of data) {
      dtos.push(await this.reviewPopulatedToDto(review, user));
    }
    return this.removeUnreadableElements(dtos);
  }
}
