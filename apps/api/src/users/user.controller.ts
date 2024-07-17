import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  Headers,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { environment } from '../environments/environment';
import { User, UserDocument } from './user.schema';
import { randomBytes, randomInt } from 'crypto';
import { EventService } from '../event/event.service';
import { assertIsDefined } from '../utils/utils';
import { Request } from 'express';
import { Auth0UserProfile } from 'auth0-js';
import { AnyKeys } from 'mongoose';
import { UpdateUserDTO } from '../dtos/user/update-user.dto';
import { UserPrivateDTO } from '../dtos/user/user-private.dto';
import { PermissionsDTO } from '../dtos/permissions.dto';
import { SendInviteBody } from '../dtos/invite/invite-send.dto';
import { UserPublicDTO } from '../dtos/user/user-public.dto';
import { AuthorizationService, USER_ACTIONS } from '../authorization/authorization.service';
import { UserCreatedEvent } from '../event/events/userCreatedEvent';
import { ConfirmationEmailEvent } from '../event/events/confirmationEmailEvent';
import { InvitationEvent } from '../event/events/invitationCreatedEvent';
import { HttpService } from '@nestjs/axios';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiQuery, ApiTags } from '@nestjs/swagger';
import { TransformerService } from '../transformer/transformer.service';
import { CreateProfileImageDTO } from '../dtos/create-file.dto';
import { SignedUrlDTO } from '../dtos/signedUrl.dto';
import { extname } from 'path';
import { FileMetadata } from '../dtos/filemetadata.dto';
import { PutObjectCommandInput } from '@aws-sdk/client-s3';
import { AwsStorageService } from '../common/aws-storage-service/aws-storage.service';
import { IsDefined, IsString } from 'class-validator';
import { firstValueFrom } from 'rxjs';
import { plainToClassCustom } from '../transformer/utils';
import { RequestDataDTO } from '../dtos/request-data.dto';
import { StrictFilterQuery } from '../utils/types';
import { JwtOrAnonymousGuard } from '../auth/jwt-or-anonymous-guard.service';
import { AuthPayload } from '../auth/jwt.strategy';
import { CommunityCLASSNAME } from '../utils/utils';

const USER_ALLOWED_FILE_EXTENSIONS = ['.jpeg', '.jpg', '.png', '.webp'];
const USER_ALLOWED_MAX_AVATAR_SIZE = 51200; // 50kB
const USER_ALLOWED_MAX_BANNER_SIZE = 512000; // 500kB

export class ProfileUploadConfirmation {
  @IsDefined() @IsString() @ApiProperty() imageType!: string;
  @IsDefined() @ApiProperty() fileMetadata!: FileMetadata;
}

/**
 * The UserController is responsible managing users interactions and activities within the application
 *
 * @tags users
 * @controller users
 */
@ApiTags('users')
@Controller('users')
export class UserController {
  /**
   * Instantiates a UserController object.
   * @param {UserService} userService - Service for user data management.
   * @param {HttpService} httpService - Service for HTTP data management.
   * @param {EventService} eventService - Service for managing events.
   * @param {AuthorizationService} authorizationService - Service for handling authorization tasks.
   * @param {TransformerService} transformerService - Service for data transformation tasks.
   * @param {AwsStorageService} storageService - Service for storage events.
   */
  constructor(
    private readonly userService: UserService,
    private httpService: HttpService,
    private eventService: EventService,
    private authorizationService: AuthorizationService,
    private readonly transformerService: TransformerService,
    private readonly storageService: AwsStorageService
  ) {}

  /**
   * GET - Retrieves the profile of the currently logged-in user. If the user does not exist in the database,
   * the method attempts to create a new user based on the information retrieved from the identity provider,
   * such as Auth0. This method is designed to handle users logging in for the first time or users who are
   * already registered. It also supports additional functionality such as handling invite tokens and linking
   * ORCID accounts if provided.
   *
   * @param {Request} req - The request object, which holds user information and headers.
   * @param {string} authorizationHeader - The 'Authorization' header containing the bearer token used.
   * @param {string} [inviteToken] - Optional invite token, for linking invitations to user creation.
   * @returns {Promise<UserPrivateDTO>} - A promise that resolves to the user profile data transfer object.
   * @throws {AssertionError} - If the authentication payload is undefined.
   */
  @ApiOperation({ summary: 'Retrieve profile' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getMyProfile(
    @Req() req: Request,
    @Headers('Authorization') authorizationHeader: string,
    @Query('inviteToken') inviteToken?: string
  ): Promise<UserPrivateDTO> {
    const authPayload = req.user as AuthPayload | undefined;
    assertIsDefined(authPayload);
    let user = await this.userService.getLoggedUser(req);

    if (!user) {
      // Create a new user when not found, this happens first time the users login
      const userInfo = await firstValueFrom(
        this.httpService.get<Auth0UserProfile | undefined>(
          `https://${environment.auth.CLIENT_DOMAIN}/userinfo`,
          {
            headers: { Authorization: authorizationHeader },
          }
        )
      );

      const newUser = new this.userService.userModel({
        userId: authPayload.sub,
        providerIds: [authPayload.sub],
        firstName: userInfo.data?.given_name ?? '',
        lastName: userInfo.data?.family_name ?? '',
        nickname: `user-${randomInt(10000, 99999)}`,
        inviteToken: randomBytes(16).toString('hex'),
      } as AnyKeys<User>);

      // Identity provider give us the user email
      if (userInfo.data?.email) {
        // Email verified means that the email is confirmed by the identity provider
        if (userInfo.data.email_verified) {
          const existingUser = await this.userService.findOne({ email: userInfo.data.email });

          // If there is another user with the email in the platform, then automatically link the provider with that user
          if (existingUser) {
            existingUser.providerIds.push(authPayload.sub);
            await existingUser.save();
            return this.transformerService.transformToDto(
              existingUser,
              UserPrivateDTO,
              existingUser
            );
          } else {
            // We can create the new user and set the email as confirmed directly
            newUser.email = userInfo.data.email;
            newUser.emailPendingConfirmation = undefined;
          }
        } else {
          // Email is not verified by the provider, we have to confirm by email+code
          newUser.emailPendingConfirmation = userInfo.data.email;
        }
      }

      if (newUser.userId.includes('ORCID')) {
        const regex = /oauth2\|ORCID\|(https:\/\/orcid\.org\/[\w,-]*)/;
        const orcid = regex.exec(newUser.userId);
        newUser.orcid = orcid?.[1] ?? 'Error processing ORCID';
      }

      if (inviteToken && (await this.userService.exists({ inviteToken: inviteToken }))) {
        newUser.invitedBy = inviteToken;
      }
      user = await newUser.save();

      const event = new UserCreatedEvent({
        user: user.toJSON(),
      });

      await this.eventService.create(event.getEventDTO());
    }
    return this.transformerService.transformToDto(user, UserPrivateDTO, user);
  }

  /**
   * GET  - Retrieves the public information of a user based on their nickname. This method is designed to
   * fetch publicly accessible details such as display name, biography, and associated content that
   * can be shown to any visitor or other users of the platform without requiring authentication.
   *
   * @param {Request} req - The request object, which contains the current session or authentication state.
   * @param {string} nickname - The unique nickname of the user whose public profile is to be retrieved.
   * @returns {Promise<UserPublicDTO>} - A promise that resolves to the public profile data transfer object..
   * @throws {AssertionError} - If no public profile is not found for the given nickname.
   */
  @ApiOperation({ summary: 'Retrieve public profile' })
  @UseGuards(JwtOrAnonymousGuard)
  @Get('profile/:nickname')
  async getPublicProfile(
    @Req() req: Request,
    @Param('nickname') nickname: string
  ): Promise<UserPublicDTO> {
    const user = await this.userService.getLoggedUser(req);
    const publicProfile = await this.userService.findOne({ nickname: nickname });
    assertIsDefined(publicProfile, 'User not found');
    const userPublicDTO = plainToClassCustom(UserPublicDTO, publicProfile);
    userPublicDTO.actions = await this.authorizationService.getSubjectActions(user, publicProfile);
    return userPublicDTO;
  }

  /**
   * GET - Retrieves the permissions associated with the currently authenticated user for interacting
   * with community resources. This method fetches the user's permissions, such as the ability to
   * create, edit, or delete community-related content, and returns them as a permissions data
   * transfer object (DTO).
   *
   * @param {Request} req - The request object, which contains the current session or authentication state.
   * @returns {Promise<PermissionsDTO>} - A promise that resolves to a permissions data transfer object.
   */
  @ApiOperation({ summary: 'Retrieve public profile' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('permissions')
  async getPermissions(@Req() req: Request): Promise<PermissionsDTO> {
    const user = await this.userService.getLoggedUser(req);
    const permissions = await this.authorizationService.getSubjectActions(user, CommunityCLASSNAME);
    return { community: permissions };
  }

  /**
   * GET - Retrieves a list of user profiles based on the provided query string.
   * Only users with administrative privileges can access this endpoint.
   *
   * @param {Request} req - The request object, which contains the current session or authentication state.
   * @param {string} [query] - Optional. A search query string used to filter user profiles.
   * @returns {Promise<UserPrivateDTO[]>} - A promise that resolves to an array of profiles.
   * @throws {UnauthorizedException} - Thrown if the requesting user does not have administrative privileges.
   */
  @ApiOperation({ summary: 'List profiles' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('profiles')
  @ApiQuery({ name: 'query', required: false })
  async getProfiles(
    @Req() req: Request,
    @Query('query') query?: string
  ): Promise<UserPrivateDTO[]> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');

    if (!user.roles.includes('admin')) {
      throw new UnauthorizedException();
    }

    const filter: StrictFilterQuery<UserDocument> = {};
    if (query) {
      filter.$text = { $search: query };
    }

    const profiles = await this.userService.find(filter);
    const profilesDTO = [];
    for (const profile of profiles) {
      profilesDTO.push(plainToClassCustom(UserPrivateDTO, profile));
    }
    return profilesDTO;
  }

  /**
   * PATCH - Updates the current user profile by setting the values of the request payload.
   * Any parameters not provided will be left unchanged.
   *
   * @param {Request} req - The request object, which contains the current session or authentication state.
   * @param {UpdateUserDTO} payload - An object containing the updated profile information.
   * @returns {Promise<UserPrivateDTO>} - A promise that resolves to the updated user profile.
   * @throws {ConflictException} - Thrown if the provided email is already registered with another account.
   * @throws {UnauthorizedException} - Thrown if the user attempts to change their email address too frequently.
   */
  @ApiOperation({ summary: 'Update a profile' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(
    @Req() req: Request,
    @Body() payload: UpdateUserDTO
  ): Promise<UserPrivateDTO> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');

    const ability = await this.authorizationService.defineAbilityFor(user);
    this.authorizationService.canDo(ability, USER_ACTIONS.update, user);

    // Set nickname
    if (payload.firstName && payload.lastName && user.nickname.startsWith('user-')) {
      let isAvailable = false;
      let user_nickname = (payload.firstName + '-' + payload.lastName).replace(/\s+/g, '-');
      while (!isAvailable) {
        const exists = await this.userService.exists({
          nickname: user_nickname,
          userId: { $ne: user.userId },
        });
        if (!exists) {
          isAvailable = true;
          user.nickname = user_nickname;
        } else {
          user_nickname = `${payload.firstName}-${payload.lastName}-${randomInt(1000, 9999)}`;
          user_nickname = user_nickname.toLowerCase().replace(' ', '-');
        }
      }
      user.nickname = user_nickname.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    if (payload.emailPendingConfirmation) {
      if (payload.emailPendingConfirmation !== user.email) {
        const existingUser = await this.userService.findOne({
          email: payload.emailPendingConfirmation,
        });
        if (existingUser) {
          user.emailPendingConfirmation = payload.emailPendingConfirmation;
          await user.save();
          throw new ConflictException(
            'This email address is already registered with another account. If you want to link both accounts, please enter the verification code we sent to your email'
          );
        }
        if (user.emailChangedOn) {
          const difference = new Date().getTime() - user.emailChangedOn.getTime();
          const seconds = 20;
          const differenceInMinutes = difference / (seconds * 1000);

          if (differenceInMinutes < 1) {
            throw new UnauthorizedException(
              `Please wait ${seconds} seconds before changing your email`
            );
          }
        }

        user.emailChangedOn = new Date();
      } else {
        // reset emailPendingConfirmation because it is already in the email
        payload.emailPendingConfirmation = undefined;
      }
    }

    Object.assign(user, payload);

    const userUpdated = await user.save();
    return this.transformerService.transformToDto(userUpdated, UserPrivateDTO, user);
  }

  /**
   * POST - Sends a confirmation email to the user. This method is used during onboarding to verify the user's email address.
   *
   * @param {Request} req - The request object, which contains the current session or authentication state.
   * @returns {Promise<void>} - A promise that resolves once the confirmation email is successfully sent.
   * @throws {UnauthorizedException} - Thrown if the user's email is already confirmed.
   */
  @ApiOperation({ summary: 'Send confirmation email' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('sendConfirmationEmail')
  async sendConfirmationEmail(@Req() req: Request): Promise<void> {
    const user = await this.userService.getLoggedUser(req);

    assertIsDefined(user, 'User not found');

    if (!user.emailPendingConfirmation) {
      throw new UnauthorizedException('Email already confirmed');
    }

    user.confirmEmailCode = { codeEmail: this.randomCodeEmail(), attemptsLeft: 5 };

    await user.save();

    const event = new ConfirmationEmailEvent({
      code: user.confirmEmailCode.codeEmail,
      email: user.emailPendingConfirmation,
    });
    await this.eventService.create(event.getEventDTO());
  }

  /**
   * POST - Sends invitations emails to the specified list of emails to sign up into the platform.
   * Maximum number of emails provided is 5.
   * Maximum number of invitations that a user can send is 10.
   *
   * @param {Request} req - The request object containing the current user's session or authentication state.
   * @param {SendInviteBody} body - The body of the request containing the list of email addresses to send invitations to.
   * @returns {Promise<void>} - A promise that resolves once the invitations are successfully sent.
   * @throws {HttpException} - Thrown if the number of invitations exceeds the user's available invitation quota.
   */
  @ApiOperation({ summary: 'Send invitation email' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('sendInvitations')
  async sendInvitations(@Req() req: Request, @Body() body: SendInviteBody): Promise<void> {
    const user = await this.userService.getLoggedUser(req);
    body.emails = Array.from(new Set(body.emails)); // Remove duplicates
    assertIsDefined(user, 'User not found');

    const event = new InvitationEvent({
      sender: user.toJSON(),
      emails: body.emails,
    });

    if (user.invitationsAvailable < body.emails.length) {
      throw new HttpException(
        `You can only invite ${user.invitationsAvailable} users`,
        HttpStatus.BAD_REQUEST
      );
    }

    user.invitationsAvailable = user.invitationsAvailable - body.emails.length;
    await user.save();
    await this.eventService.create(event.getEventDTO());
  }

  /**
   * PATCH - Confirms an email address using a numeric code. This method is used during onboarding to verify the user's email adress.
   *
   * @param {{ code: string }} body - The request body containing the verification code.
   * @param {Request} req - The request object containing the current user's session or authentication state.
   * @returns {Promise<{ message: string; success: boolean; linkedAccount: boolean }>} - A promise that resolves with an object containing a message indicating the result of the confirmation, a flag indicating success, and a flag indicating whether the account was linked to another account during the confirmation process.
   * @throws {Error} - Thrown if the user is not found, has no pending email confirmation, or if the confirmation code is invalid.
   */
  @ApiOperation({ summary: 'Confirm email' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('confirmEmail')
  async confirmEmail(
    @Body() body: { code: string },
    @Req() req: Request
  ): Promise<{ message: string; success: boolean; linkedAccount: boolean }> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');
    assertIsDefined(user.emailPendingConfirmation, 'No pending email confirmation');
    assertIsDefined(user.confirmEmailCode, 'User email code not found');

    if (user.confirmEmailCode.attemptsLeft <= 0) {
      return {
        message: 'You have run out of confirmation attempts.',
        success: false,
        linkedAccount: false,
      };
    }

    if (user.confirmEmailCode.codeEmail === body.code) {
      const existingUser = await this.userService.findOne({ email: user.emailPendingConfirmation });
      if (existingUser) {
        existingUser.providerIds.push(user.userId);
        user.userId = `merged-${user.userId}`;
        user.providerIds = [user.userId];
        user.email = '';
        user.emailPendingConfirmation = '';

        // We have to save at the end to avoid duplicated providerId in the db
        await user.save();
        await existingUser.save();

        return { message: 'You have linked your account', success: true, linkedAccount: true };
      } else {
        user.emailConfirmedOn = new Date();
        user.email = user.emailPendingConfirmation;
        user.emailPendingConfirmation = undefined;
        await user.save();
        return {
          message: 'Thank you for confirming your email address!',
          success: true,
          linkedAccount: false,
        };
      }
    } else {
      user.confirmEmailCode.attemptsLeft--;
      user.markModified('confirmEmailCode');
      await user.save();
      return {
        message: `The code entered does not match the one sent, you have ${user.confirmEmailCode.attemptsLeft} attempts left.`,
        success: false,
        linkedAccount: false,
      };
    }
  }

  /**
   * PATCH - Stops impersonating another user and returns to the original user's session.
   *
   * @param {Request} req - The request object containing the current user's session or authentication state.
   * @returns {Promise<UserPrivateDTO>} - A promise that resolves with the profile of the original user after stopping impersonation.
   * @throws {UnauthorizedException} - Thrown if the current user is not authorized to stop impersonation.
   * @throws {Error} - Thrown if the user is not found.
   */
  @ApiOperation({ summary: 'Stop impersonation' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('stopImpersonation')
  async stopImpersonation(@Req() req: Request): Promise<UserPrivateDTO> {
    const user = await this.userService.getLoggedUser(req, true);
    assertIsDefined(user, 'User not found');

    if (!user.roles.includes('admin')) {
      throw new UnauthorizedException();
    }

    user.impersonatedUser = '';
    return this.transformerService.transformToDto(await user.save(), UserPrivateDTO, user);
  }

  /**
   * HELPER - Generates a random string of digits to be used as a confirmation code for email verification.
   *
   * @returns {string} - A random string of digits.
   */
  randomCodeEmail(): string {
    return Math.random().toString().slice(2, 8);
  }

  /**
   * POST - Uploads an image file for the user profile.
   *
   * @param {Request} req - The request object.
   * @param {CreateProfileImageDTO} payload - The payload containing the file to be uploaded and profile image information.
   * @returns {Promise<SignedUrlDTO>} A promise that resolves to a SignedUrlDTO object containing the signed URL.
   */
  @ApiOperation({ summary: 'Upload image file' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('profile/images')
  async uploadProfileImages(
    @Req() req: Request,
    @Body() payload: CreateProfileImageDTO
  ): Promise<SignedUrlDTO> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');

    const file = payload.file;

    const fileExtension = extname(file.name).toLowerCase();

    if (!USER_ALLOWED_FILE_EXTENSIONS.includes(fileExtension)) {
      throw new UnauthorizedException('Invalid extension file');
    }

    const fileSize = file.size;

    switch (payload.profileImage) {
      case 'avatar':
        if (USER_ALLOWED_MAX_AVATAR_SIZE < fileSize)
          throw new UnauthorizedException(
            `Image exceeds the maximum allowed size ${USER_ALLOWED_MAX_AVATAR_SIZE}`
          );
        break;
      case 'banner':
        if (USER_ALLOWED_MAX_BANNER_SIZE < fileSize)
          throw new UnauthorizedException(
            `Image exceeds the maximum allowed size ${USER_ALLOWED_MAX_BANNER_SIZE}`
          );
    }

    const tags: string[] = [];
    tags.push('Profile');

    const fileMetadata: FileMetadata = {
      filename: `${payload.profileImage}${fileExtension}`,
      description: file.name,
      contentType: file.type,
      contentLength: file.size,
      tags: tags,
    };

    const objectKey = `profile/${user._id.toHexString()}/media/${fileMetadata.filename}`;

    const params: PutObjectCommandInput = {
      Key: objectKey,
      ContentType: fileMetadata.contentType,
      ContentLength: fileMetadata.contentLength,
      Bucket: this.storageService.publicBucket,
    };

    const signedUrl = await this.storageService.getSignedUrl('putObject', params);

    await user.save();

    return { signedUrl, fileMetadata, isMainFile: false, replacePDF: false };
  }

  /**
   * PATCH - Confirms the upload of a user image.
   *
   * @param {Request} req - The request object.
   * @param {ProfileUploadConfirmation} payload - The payload containing the metadata of the uploaded image.
   * @returns {Promise<UserPrivateDTO>} A promise that resolves to a UserPrivateDTO object representing the updated user profile.
   */
  @ApiOperation({ summary: 'Confirm image upload' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('confirm/profile/images')
  async uploadUserImagesConfirmation(
    @Req() req: Request,
    @Body() payload: ProfileUploadConfirmation
  ): Promise<UserPrivateDTO> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');

    const fileExtension = extname(payload.fileMetadata.filename).toLowerCase();

    if (!USER_ALLOWED_FILE_EXTENSIONS.includes(fileExtension)) {
      throw new UnauthorizedException('Invalid extension file');
    }

    const objectKey = `profile/${user._id.toHexString()}/media/${
      payload.imageType
    }${fileExtension}`;
    await this.storageService.headObject({
      objectKey: objectKey,
      bucket: this.storageService.publicBucket,
    });
    const imageUrl = `${environment.aws.endpoint}/${this.storageService.publicBucket}/${objectKey}`;

    switch (payload.imageType) {
      case 'avatar':
        user.avatar = imageUrl;
        user.markModified('avatar');
        break;
      case 'banner':
        user.bannerURL = imageUrl;
        user.markModified('bannerURL');
        break;
      default:
        throw new BadRequestException('Unknown image type');
    }

    await user.save();

    return this.transformerService.transformToDto(user, UserPrivateDTO, user);
  }

  /**
   * GET - Retrieves a JSON object containing personal data of the logged-in user.
   *
   * @param {Request} req - The request object.
   * @returns {Promise<RequestDataDTO>} A promise that resolves to a RequestDataDTO object containing the personal data.
   */
  @ApiOperation({ summary: 'Get a JSON of the personal data' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('request-data')
  async requestData(@Req() req: Request): Promise<RequestDataDTO> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');
    const userData = await this.userService.requestData(user);
    return { data: userData };
  }
}
