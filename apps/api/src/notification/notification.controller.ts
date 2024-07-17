import { Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';
import { AppNotificationDTO } from '../dtos/notification.dto';
import { UserService } from '../users/user.service';
import { assertIsDefined } from '../utils/utils';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { plainToClassCustom } from '../transformer/utils';

/**
 * Controller responsible for managing notifications for the app users.
 * This controller provides endpoints to list notifications specific to the logged-in user and mark them as read.
 *
 * @tags notifications
 * @controller notifications
 */
@ApiTags('notifications')
@Controller('notifications')
export class NotificationController {
  /**
   * Instantiates a NotificationController object.
   *
   * @param {NotificationService} notificationService - Service for for managing notifications for the app users.
   * @param {UserService} userService - Service for user data management.
   */
  constructor(
    private readonly notificationService: NotificationService,
    private readonly userService: UserService
  ) {}

  /**
   * GET - Retrieves all unread notifications for the currently logged-in user.
   *
   * @param {Request} req - The request object, providing user authentication data.
   * @returns {Promise<AppNotificationDTO[]>} - A promise that resolves to an array of notification DTOs.
   * @throws {UnauthorizedException} - If the user is not authenticated.
   * @throws {NotFoundException} - If the user is not found.
   */
  @ApiOperation({ summary: 'List notifications' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('myNotifications')
  async getMyNotifications(@Req() req: Request): Promise<AppNotificationDTO[]> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');
    const notifications = await this.notificationService.find({
      userId: user.userId,
      isRead: false,
    });
    return plainToClassCustom(AppNotificationDTO, notifications);
  }

  /**
   * PATCH - Marks a specific notification as read for the logged-in user.
   *
   * @param {Request} req - The request object, providing user authentication data.
   * @param {string} id - The unique identifier of the notification to be marked as read.
   * @returns {Promise<AppNotificationDTO>} - A promise that resolves to the updated notification DTO.
   * @throws {UnauthorizedException} - If the user is not authenticated.
   * @throws {NotFoundException} - If the user or notification is not found.
   */
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id([0-9a-f]{24})/read')
  async markNotificationAsRead(
    @Req() req: Request,
    @Param('id') id: string
  ): Promise<AppNotificationDTO> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');
    const notification = await this.notificationService.findOneAndUpdate(
      { userId: user.userId, _id: id },
      { isRead: true }
    );

    return plainToClassCustom(AppNotificationDTO, notification);
  }
}
