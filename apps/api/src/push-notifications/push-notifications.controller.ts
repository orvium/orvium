import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { PushNotificationsService } from './push-notifications.service';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PushSubscriptionDTO } from '../dtos/push-subscription.dto';
import { AppPushSubscription } from './push-notification.schema';
import { PushSubscriptionCreateDTO } from '../dtos/push-subscription-create.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { plainToClassCustom } from '../transformer/utils';
import { AnyKeys } from 'mongoose';
import { AuthPayload } from '../auth/jwt.strategy';
import { assertIsDefined } from '../utils/utils';

/**
 * Controller responsible for pushing notification within the platform
 *
 * @tags Push Notifications
 * @controller push-notifications
 */
@ApiTags('Push Notifications')
@Controller('push-notifications')
export class PushNotificationsController {
  /**
   * Instantiates a PushNotificationsController object.
   *
   * @param {PushNotificationsService} pushNotificationsService - Service for handling notifications data.
   */
  constructor(private readonly pushNotificationsService: PushNotificationsService) {}

  /**
   * POST - Registers a new push notification subscription for the current user.
   * This allows the application to send notifications to the user's device.
   *
   * @param req - The HTTP request object containing the user's authentication data.
   * @param newSub - Data transfer object containing the details necessary to create a push notification subscription.
   * @throws {UnauthorizedException} If the user is not authenticated.
   * @returns {Promise<PushSubscriptionDTO>} A promise that resolves to the registered push notification subscription details.
   */
  @ApiOperation({ summary: 'Create subscription' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('')
  async createPushNotificationsSubscription(
    @Req() req: Request,
    @Body() newSub: PushSubscriptionCreateDTO
  ): Promise<PushSubscriptionDTO> {
    const authPayload = req.user as AuthPayload | undefined;
    assertIsDefined(authPayload, 'User not found');
    // Generate query
    const query: AnyKeys<AppPushSubscription> = {
      endpoint: newSub.endpoint,
      expirationTime: newSub.expirationTime,
      keys: {
        p256dh: newSub.keys.p256dh,
        auth: newSub.keys.auth,
      },
      userId: authPayload.sub,
    };
    const savedSubscription = await this.pushNotificationsService.create(query);
    return plainToClassCustom(PushSubscriptionDTO, savedSubscription);
  }

  /**
   * GET - Checks if the current user has an active push notification subscription.
   *
   * @param req - The HTTP request object containing the user's authentication data.
   * @throws {UnauthorizedException} If the user is not authenticated.
   * @returns {Promise<boolean>} A promise that resolves to a boolean indicating whether the user has an active subscription.
   */
  @ApiOperation({ summary: 'Verify subscription' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('')
  async checkPushNotificationsSubscription(@Req() req: Request): Promise<boolean> {
    const authPayload = req.user as AuthPayload | undefined;
    assertIsDefined(authPayload, 'User not found');
    const subscription = await this.pushNotificationsService.exists({ userId: authPayload.sub });
    return !!subscription;
  }
}
