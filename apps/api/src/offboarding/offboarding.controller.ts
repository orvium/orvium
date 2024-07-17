import { Controller, Delete, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';
import { UserPrivateDTO } from '../dtos/user/user-private.dto';
import { assertIsDefined } from '../utils/utils';
import { UserService } from '../users/user.service';
import { TransformerService } from '../transformer/transformer.service';
import { DepositService } from '../deposit/deposit.service';
import { ReviewService } from '../review/review.service';
import { ConversationsService } from '../conversations/conversations.service';
import { MessagesService } from '../messages/messages.service';
import { NotificationService } from '../notification/notification.service';
import { InviteService } from '../invite/invite.service';
import { PaymentService } from '../payment/payment.service';
import { CommunitiesService } from '../communities/communities.service';

/**
 * Controller responsible for managing the offboarding of users in the platform.
 *
 * @controller offboarding
 */
@Controller('offboarding')
export class OffboardingController {
  /**
   * Instantiates a OffboardingController object.
   *
   * @param {UserService} userService - Service for user data management.
   * @param {TransformerService} transformerService - Service for data transformation tasks.
   * @param {DepositService} depositService - Service for deposits data management.
   * @param {ReviewService} reviewService - Service for manage review.
   * @param {ConversationService} conversationService - Service for sessions data management.
   * @param {MessageService} messageService - Service for messageService handling in the platform.
   * @param {NotificationService} notificationService - Service for for managing notifications for the app users.
   * @param {CommunitiesService} communitiesService - Service for community data management.
   * @param {InviteService} inviteService - Service for invitations data management.
   * @param {PaymentService} paymentService - Service for payments handling with stripe.
   */
  constructor(
    private readonly userService: UserService,
    private transformerService: TransformerService,
    private depositService: DepositService,
    private reviewService: ReviewService,
    private conversationService: ConversationsService,
    private messageService: MessagesService,
    private notificationsService: NotificationService,
    private communitiesService: CommunitiesService,
    private inviteService: InviteService,
    private paymentService: PaymentService
  ) {}

  /**
   * DETELE - Deletes the user account, ensuring no active resources like deposits, reviews, or payments are associated with the account.
   * Resources such as conversations and messages related to the user are also cleaned up.
   *
   * @param {Request} req - The HTTP request containing user authentication.
   * @returns {Promise<UserPrivateDTO>} A DTO representing the deleted user's private data.
   * @throws {UnauthorizedException} If the user has active resources preventing deletion.
   */
  @ApiOperation({ summary: 'Delete a profile' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete('delete')
  async deleteProfile(@Req() req: Request): Promise<UserPrivateDTO> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');
    const deposits = await this.depositService.find({ creator: user._id });

    this.assertIsNotEmpty(deposits, 'User cannot be deleted because it has publications created');

    const reviews = await this.reviewService.find({ creator: user._id });
    this.assertIsNotEmpty(reviews, 'User cannot be deleted because it has reviews created');

    const communities = await this.communitiesService.find({ creator: user._id });
    this.assertIsNotEmpty(communities, 'User cannot be deleted because it has communities created');

    const payments = await this.paymentService.findPayment({ customerEmail: user.email });
    this.assertIsNotEmpty(payments, 'User cannot be deleted because it has payments created');

    const conversations = await this.conversationService.conversationModel
      .find({ participants: user._id })
      .exec();

    if (conversations.length > 0) {
      const conversationsId = conversations.map(conversation => conversation._id);
      await this.messageService.messageModel
        .deleteMany({ conversation: { $in: conversationsId } })
        .exec();

      await this.conversationService.conversationModel
        .deleteMany({ _id: { $in: conversationsId } })
        .exec();
    }

    await this.notificationsService.notificationModel.deleteMany({ userId: user.userId }).exec();

    await this.inviteService.inviteModel.deleteMany({ sender: user._id }).exec();

    await user.deleteOne();

    return this.transformerService.transformToDto(user, UserPrivateDTO, user);
  }

  /**
   * HELPER method to check if a resource list is not empty and throws an exception if it is not.
   *
   * @param {unknown[]} arr - Array of resources to check.
   * @param {string} message - Error message to throw if the array is not empty.
   * @throws {UnauthorizedException} If the array is not empty.
   */
  assertIsNotEmpty(arr: unknown[], message: string): void {
    if (arr.length !== 0) {
      throw new UnauthorizedException(message);
    }
  }
}
