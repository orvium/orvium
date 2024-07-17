import { Test, TestingModule } from '@nestjs/testing';
import { ProfileUploadConfirmation, UserController } from './user.controller';
import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { ConfirmEmailCode } from './user.schema';
import {
  createAdmin,
  createCommunity,
  createDeposit,
  createReview,
  createUser,
  factoryUser,
} from '../utils/test-data';
import { request } from 'express';
import { ConfirmationEmailEvent } from '../event/events/confirmationEmailEvent';
import { of } from 'rxjs';
import { AxiosResponse } from 'axios';
import { EventService } from '../event/event.service';
import { InstitutionService } from '../institution/institution.service';
import { HttpModule, HttpService } from '@nestjs/axios';
import { assertIsDefined, generateObjectId, getMd5Hash } from '../utils/utils';
import { MongooseTestingModule } from '../utils/mongoose-testing.module';
import { AppFile, CreateProfileImageDTO } from '../dtos/create-file.dto';
import { UpdateUserDTO } from '../dtos/user/update-user.dto';
import { validate } from 'class-validator';
import { Factory } from 'fishery';
import { Auth0UserProfile } from 'auth0-js';

jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/s3-request-presigner');

const factoryInfoUserResponse = Factory.define<AxiosResponse<Auth0UserProfile | undefined>>(() => {
  return {
    data: {
      email: 'newuser@example.com',
      email_verified: true,
      given_name: 'John',
      family_name: 'Doe',
    },
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {},
  } as AxiosResponse<Auth0UserProfile | undefined>;
});

describe('User Controller', () => {
  let controller: UserController;
  let userService: UserService;
  let institutionService: InstitutionService;
  let httpService: HttpService;
  let eventService: EventService;
  const confirmEmailCode: ConfirmEmailCode = {
    codeEmail: 'pruebas@pruebas.pruebas',
    attemptsLeft: 5,
  };
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      controllers: [UserController],
      imports: [MongooseTestingModule.forRoot('userController'), HttpModule],
      providers: [],
    }).compile();
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    controller = module.get(UserController);
    userService = module.get(UserService);
    institutionService = module.get(InstitutionService);
    httpService = module.get(HttpService);
    eventService = module.get(EventService);

    await userService.userModel.deleteMany();

    await institutionService.institutionModel.create({
      name: 'Example Institution',
      domain: 'example.com',
    });
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get profile', async () => {
    const user = await createUser(module);
    const profile = await controller.getMyProfile(
      { user: { sub: user.userId } } as unknown as typeof request,
      'Bearer YWxhZGRpbjpvcGVuc2VzYW1l',
      'xxxyyyzzz'
    );
    expect(profile.userId).toBe(user.userId);
  });

  it('should create an user', async () => {
    jest.spyOn(httpService, 'get').mockImplementation(() => of(factoryInfoUserResponse.build()));
    const spyEvent = jest.spyOn(eventService, 'create');
    const profile = await controller.getMyProfile(
      {
        user: { sub: 'oauth2|ORCID|https://orcid.org/0000-0000-0000-0000' },
      } as unknown as typeof request,
      'Bearer YWxhZGRpbjpvcGVuc2VzYW1l'
    );
    expect(spyEvent).toHaveBeenCalled();
    const newUserDocument = await userService.findOne({ userId: profile.userId });
    assertIsDefined(newUserDocument);
    expect(profile.userId).toBe('oauth2|ORCID|https://orcid.org/0000-0000-0000-0000');
    expect(newUserDocument.userId).toBe('oauth2|ORCID|https://orcid.org/0000-0000-0000-0000');
    expect(newUserDocument.orcid).toBe('https://orcid.org/0000-0000-0000-0000');
    expect(newUserDocument.email).toBe('newuser@example.com');
    expect(newUserDocument.emailPendingConfirmation).toBeUndefined();
  });

  it('should create user with invite token', async () => {
    const inviter = await createUser(module);
    jest.spyOn(httpService, 'get').mockImplementation(() =>
      of(
        factoryInfoUserResponse.build({
          data: {
            given_name: undefined,
            family_name: undefined,
            email: undefined,
          },
        })
      )
    );
    jest.spyOn(userService, 'exists');
    const profile = await controller.getMyProfile(
      {
        user: { sub: 'oauth2|ORCID|https://invalid.org/0000-0000-0000-0000' },
      } as unknown as typeof request,
      'Bearer YWxhZGRpbjpvcGVuc2VzYW1l',
      inviter.inviteToken
    );
    expect(profile.orcid).toBe('Error processing ORCID');
    expect(profile.email).toBe(undefined);
    expect(profile.firstName).toBe('');
    expect(profile.lastName).toBe('');
    expect(profile.gravatar).toBe(getMd5Hash(profile.nickname));
    expect(userService.exists).toHaveBeenCalledWith({ inviteToken: inviter.inviteToken });
  });

  it('should link providerId when email is confirmed by provider', async () => {
    const existingUser = await createUser(module, {
      user: { email: 'existinguser@example.com', providerIds: ['google|1234'] },
    });
    jest
      .spyOn(httpService, 'get')
      .mockImplementation(() =>
        of(factoryInfoUserResponse.build({ data: { email: 'existinguser@example.com' } }))
      );
    const profile = await controller.getMyProfile(
      {
        user: { sub: 'facebook|12341234' },
      } as unknown as typeof request,
      'Bearer'
    );
    expect(httpService.get).toHaveBeenCalled();
    expect(profile._id).toBe(existingUser._id.toHexString());
    expect(profile.providerIds).toStrictEqual(['google|1234', 'facebook|12341234']);

    expect(profile.email).toBe('existinguser@example.com');
    expect(profile.emailPendingConfirmation).toBeUndefined();
  });

  it('should create an user with an existing email in pending confirmation', async () => {
    await createUser(module, {
      user: { emailPendingConfirmation: 'myemail@example.com' },
    });

    jest
      .spyOn(httpService, 'get')
      .mockImplementation(() =>
        of(factoryInfoUserResponse.build({ data: { email: 'myemail@example.com' } }))
      );
    await expect(
      controller.getMyProfile(
        {
          user: { sub: 'oauth2|ORCID|https://orcid.org/0000-0000-0000-0000' },
        } as unknown as typeof request,
        'Bearer YWxhZGRpbjpvcGVuc2VzYW1l',
        'user.inviteToken'
      )
    ).resolves.toMatchObject({
      email: 'myemail@example.com',
      isOnboarded: false,
    });
  });

  it('should create user with emailPendingConfirmation when provider does not verify the email', async () => {
    jest.spyOn(httpService, 'get').mockImplementation(() =>
      of(
        factoryInfoUserResponse.build({
          data: { email: 'nonverified@example.com', email_verified: false },
        })
      )
    );
    await expect(
      controller.getMyProfile(
        {
          user: { sub: 'oauth2|ORCID|https://orcid.org/0000-0000-0000-0000' },
        } as unknown as typeof request,
        'Bearer YWxhZGRpbjpvcGVuc2VzYW1l'
      )
    ).resolves.toMatchObject({
      email: undefined,
      isOnboarded: false,
      emailPendingConfirmation: 'nonverified@example.com',
    });
  });

  it('should get user logged public profile', async () => {
    const user = await createUser(module);

    const publicProfile = await controller.getPublicProfile(
      { user: { sub: user.userId } } as unknown as typeof request,
      user.nickname
    );
    expect(publicProfile._id).toEqual(String(user._id));
    expect(publicProfile.actions).toContain('read');
    expect(publicProfile.actions).toContain('update');
  });

  it('should get user public profile', async () => {
    const user = await createUser(module);
    const userPublicProfile = await createUser(module);

    const publicProfile = await controller.getPublicProfile(
      { user: { sub: user.userId } } as unknown as typeof request,
      userPublicProfile.nickname
    );
    expect(publicProfile._id).toEqual(String(userPublicProfile._id));
    expect(publicProfile.actions).toContain('read');
    expect(publicProfile.actions).not.toContain('update');
  });

  it('should raise exception when user does not exist', async () => {
    await expect(
      controller.getPublicProfile(
        { user: { sub: generateObjectId() } } as unknown as typeof request,
        'xxx'
      )
    ).rejects.toMatchObject(new NotFoundException('User not found'));
  });

  describe('updateProfile', () => {
    it('should update user names', async () => {
      const user = await createUser(module);
      const privateProfile = await controller.updateProfile(
        { user: { sub: user.userId } } as unknown as typeof request,
        {
          firstName: 'NewFirstName',
          lastName: 'NewLastName',
        }
      );
      expect(privateProfile.firstName).toBe('NewFirstName');
      expect(privateProfile.lastName).toBe('NewLastName');
    });

    it('should validate UpdateUserDTO', async () => {
      const updateUserDTO = new UpdateUserDTO();
      updateUserDTO.orcid = '';
      updateUserDTO.blog = '';
      updateUserDTO.linkedin = '';
      const validate1 = await validate(updateUserDTO);
      expect(validate1.length).toBe(0);

      updateUserDTO.orcid = 'asdfasdf';
      updateUserDTO.emailPendingConfirmation = 'asdfasdf';
      const validate2 = await validate(updateUserDTO);
      expect(validate2.length).toBe(2);
    });

    it('should update user email', async () => {
      const user = await createUser(module);
      const privateProfile = await controller.updateProfile(
        { user: { sub: user.userId } } as unknown as typeof request,
        {
          emailPendingConfirmation: 'newemail@example.com',
        }
      );
      expect(privateProfile.emailPendingConfirmation).toBe('newemail@example.com');
      const userDocument = await userService.findOne({ userId: user.userId });
      assertIsDefined(userDocument);
      expect(userDocument.emailChangedOn).not.toBe(user.emailChangedOn);
    });

    it('should raise exception if email is change with less than one minute diff', async () => {
      const user = await createUser(module, { user: { email: undefined } });
      const privateProfile = await controller.updateProfile(
        { user: { sub: user.userId } } as unknown as typeof request,
        {
          emailPendingConfirmation: 'newemail@example.com',
        }
      );
      expect(privateProfile.emailPendingConfirmation).toBe('newemail@example.com');
      expect(privateProfile.email).toBeUndefined();
      const userDocument = await userService.findById(user._id);
      assertIsDefined(userDocument);
      expect(userDocument.emailChangedOn).not.toBe(user.emailChangedOn);

      await expect(
        controller.updateProfile({ user: { sub: user.userId } } as unknown as typeof request, {
          emailPendingConfirmation: 'newemail2@example.com',
        })
      ).rejects.toMatchObject(
        new UnauthorizedException('Please wait 20 seconds before changing your email')
      );
    });

    it('should update user nickname with number if the nickname alredy exists', async () => {
      await createUser(module, {
        user: {
          firstName: 'Ada',
          lastName: 'Lovelace',
          nickname: 'ada-lovelace',
        },
      });
      const user = await createUser(module, {
        user: {
          nickname: 'user-12983',
          firstName: 'Ada',
          lastName: 'Lovelaceee',
        },
      });
      const profile = await controller.updateProfile(
        { user: { sub: user.userId } } as unknown as typeof request,
        {
          firstName: 'Ada',
          lastName: 'Lovelace',
        }
      );
      expect(profile.nickname).toStrictEqual(expect.stringContaining('ada-lovelace-'));
    });
  });

  it('should not update to an existing user email', async () => {
    const existingUser = await createUser(module);
    const user = await createUser(module);

    await expect(
      controller.updateProfile({ user: { sub: user.userId } } as unknown as typeof request, {
        emailPendingConfirmation: existingUser.email,
      })
    ).rejects.toMatchObject(
      new ConflictException(
        'This email address is already registered with another account. If you want to link both accounts, please enter the verification code we sent to your email'
      )
    );
  });

  it('should raise exception when user to update does not exist', async () => {
    await expect(
      controller.updateProfile({ user: { sub: generateObjectId() } } as unknown as typeof request, {
        emailPendingConfirmation: 'nickname',
      })
    ).rejects.toMatchObject(new NotFoundException('User not found'));
  });

  it('should send confirmation email', async () => {
    const spy = jest.spyOn(eventService, 'create');
    const newUser = await new userService.userModel(
      factoryUser.build({
        emailPendingConfirmation: 'newemail@example.com',
        confirmEmailCode: confirmEmailCode,
      })
    ).save();
    await controller.sendConfirmationEmail({
      user: { sub: newUser.userId },
    } as unknown as typeof request);
    assertIsDefined(newUser.emailPendingConfirmation);
    new ConfirmationEmailEvent({ code: '123456', email: newUser.emailPendingConfirmation });
    expect(spy).toHaveBeenCalled();
  });

  it('should not send confirmation email if email is already confirmed', async () => {
    const user = await createUser(module);
    await expect(
      controller.sendConfirmationEmail({
        user: { sub: user.userId },
      } as unknown as typeof request)
    ).rejects.toMatchObject(new UnauthorizedException('Email already confirmed'));
  });

  it('should raise exception when user does not exist and wants to send confirmation email', async () => {
    await expect(
      controller.sendConfirmationEmail({
        user: { sub: generateObjectId() },
      } as unknown as typeof request)
    ).rejects.toMatchObject(new NotFoundException('User not found'));
  });

  it('should send invitations to Orvium', async () => {
    const user = await createUser(module);

    const emails: string[] = ['email@email.com', 'email2@email.com'];
    const spy = jest.spyOn(eventService, 'create');
    await controller.sendInvitations({ user: { sub: user.userId } } as unknown as typeof request, {
      emails: emails,
    });
    const userDocument = await userService.findOne({ userId: user.userId });
    expect(spy).toHaveBeenCalled();
    expect(userDocument?.invitationsAvailable).toBe(3);
  });

  it('should not send more than 5 invitations to Orvium', async () => {
    const user = await createUser(module);
    const emails: string[] = [
      'email@email.com',
      'email2@email.com',
      'email3@email.com',
      'email4@email.com',
      'email5@email.com',
      'email6@email.com',
    ];
    await expect(
      controller.sendInvitations({ user: { sub: user.userId } } as unknown as typeof request, {
        emails: emails,
      })
    ).rejects.toMatchObject(
      new HttpException('You can only invite 5 users', HttpStatus.BAD_REQUEST)
    );
  });

  describe('getProfiles', () => {
    it('should get users', async () => {
      const admin = await createAdmin(module);
      await createUser(module);

      const users = await controller.getProfiles({
        user: { sub: admin.userId },
      } as unknown as typeof request);
      expect(users.length).toBe(2);
    });

    it('should apply filters', async () => {
      const admin = await createAdmin(module);
      await createUser(module, {
        user: {
          firstName: 'Ana',
        },
      });

      const users = await controller.getProfiles(
        {
          user: { sub: admin.userId },
        } as unknown as typeof request,
        'ana'
      );
      expect(users.length).toBe(1);
      expect(users.pop()?.firstName).toBe('Ana');
    });

    it('should raise exception', async () => {
      const user = await createUser(module);
      await createUser(module);

      await expect(
        controller.getProfiles({
          user: { sub: user.userId },
        } as unknown as typeof request)
      ).rejects.toThrow(new UnauthorizedException());
    });
  });

  it('should raise exception when user does not exist and try to send invitations to Orvium', async () => {
    const emails: string[] = ['email@email.com', 'email2@email.com'];
    await expect(
      controller.sendInvitations(
        { user: { sub: generateObjectId() } } as unknown as typeof request,
        {
          emails: emails,
        }
      )
    ).rejects.toMatchObject(new NotFoundException('User not found'));
  });

  it('should confirm user email', async () => {
    const user = await createUser(module, {
      user: {
        emailPendingConfirmation: 'newemail@example.com',
        confirmEmailCode: {
          codeEmail: '123456',
          attemptsLeft: 5,
        },
      },
    });
    assertIsDefined(user.confirmEmailCode);
    const result = await controller.confirmEmail({ code: user.confirmEmailCode.codeEmail }, {
      user: { sub: user.userId },
    } as unknown as typeof request);
    expect(result.message).toBe('Thank you for confirming your email address!');
    const userDocument = await userService.userModel.findOne({ userId: user.userId });
    assertIsDefined(userDocument);
    expect(userDocument.emailConfirmedOn).toBeTruthy();
  });

  it('should confirm email and link accounts', async () => {
    const existingUser = await createUser(module, { user: { email: 'existing@example.com' } });
    const user = await createUser(module, {
      user: {
        emailPendingConfirmation: existingUser.email,
        confirmEmailCode: {
          codeEmail: '123456',
          attemptsLeft: 5,
        },
      },
    });
    assertIsDefined(user.confirmEmailCode);
    const result = await controller.confirmEmail({ code: user.confirmEmailCode.codeEmail }, {
      user: { sub: user.userId },
    } as unknown as typeof request);
    expect(result).toMatchObject({
      message: 'You have linked your account',
      success: true,
      linkedAccount: true,
    });
    const userDocument = await userService.userModel.findById(existingUser._id);
    assertIsDefined(userDocument);
    expect(userDocument.providerIds).toStrictEqual([
      ...existingUser.providerIds,
      ...user.providerIds,
    ]);
  });

  it('should update attempts left when user input code is not correct', async () => {
    const user = await createUser(module, {
      user: {
        emailPendingConfirmation: 'newemail@example.com',
        confirmEmailCode: {
          codeEmail: '123456',
          attemptsLeft: 5,
        },
      },
    });
    const result1 = await controller.confirmEmail({ code: '123' }, {
      user: { sub: user.userId },
    } as unknown as typeof request);
    expect(result1.message).toBe(
      'The code entered does not match the one sent, you have 4 attempts left.'
    );

    const result2 = await controller.confirmEmail({ code: '123' }, {
      user: { sub: user.userId },
    } as unknown as typeof request);
    expect(result2.message).toBe(
      'The code entered does not match the one sent, you have 3 attempts left.'
    );
  });

  it('should raise exception when user has less than one attempt to confirm email', async () => {
    const user = await createUser(module, {
      user: {
        emailPendingConfirmation: 'newemail@example.com',
        confirmEmailCode: { codeEmail: '123456', attemptsLeft: 0 },
      },
    });
    const result = await controller.confirmEmail({ code: '123456' }, {
      user: { sub: user.userId },
    } as unknown as typeof request);
    expect(result.message).toBe('You have run out of confirmation attempts.');
  });

  it('should raise exception when user has no pending email to confirm', async () => {
    const user = await createUser(module);
    await expect(
      controller.confirmEmail({ code: '123456' }, {
        user: { sub: user.userId },
      } as unknown as typeof request)
    ).rejects.toThrow(new NotFoundException('No pending email confirmation'));
  });

  it('should not stop impersonation', async () => {
    const user = await createUser(module);
    const admin = await createAdmin(module, { impersonatedUser: user.userId });
    const impertonationResponse = await controller.stopImpersonation({
      user: { sub: admin.userId },
    } as unknown as typeof request);
    expect(impertonationResponse.impersonatedUser).toBe('');
  });

  it('should not stop impersonating if not admin', async () => {
    const user = await createUser(module);
    await expect(
      controller.stopImpersonation({ user: { sub: user.userId } } as unknown as typeof request)
    ).rejects.toThrow();
  });

  describe('uploadUserImagesConfirmation', () => {
    it('should upload profile file confirmation avatar', async () => {
      const createImageDTO: ProfileUploadConfirmation = {
        imageType: 'avatar',
        fileMetadata: {
          filename: 'example.png',
          description: 'example.png',
          contentType: 'image/png',
          contentLength: 1,
          tags: ['Profile'],
        },
      };
      const user = await createUser(module);
      await controller.uploadUserImagesConfirmation(
        { user: { sub: user.userId } } as unknown as typeof request,
        createImageDTO
      );
    });

    it('should upload profile file confirmation banner', async () => {
      const createImageDTO: ProfileUploadConfirmation = {
        imageType: 'banner',
        fileMetadata: {
          filename: 'example.png',
          description: 'example.png',
          contentType: 'image/png',
          contentLength: 1,
          tags: ['Profile'],
        },
      };
      const user = await createUser(module);

      await controller.uploadUserImagesConfirmation(
        { user: { sub: user.userId } } as unknown as typeof request,
        createImageDTO
      );
    });

    it('should raise exception if the file extension is invalid', async () => {
      const createImageDTO: ProfileUploadConfirmation = {
        imageType: 'banner',
        fileMetadata: {
          filename: 'example.xxx',
          description: 'example.png',
          contentType: 'image/png',
          contentLength: 1,
          tags: ['Profile'],
        },
      };
      const user = await createUser(module);
      await expect(
        controller.uploadUserImagesConfirmation(
          { user: { sub: user.userId } } as unknown as typeof request,
          createImageDTO
        )
      ).rejects.toThrow(new UnauthorizedException('Invalid extension file'));
    });

    it('should raise exception if imageType is invalid', async () => {
      const createImageDTO: ProfileUploadConfirmation = {
        imageType: 'landscape',
        fileMetadata: {
          filename: 'example.png',
          description: 'example.png',
          contentType: 'image/png',
          contentLength: 1,
          tags: ['Profile'],
        },
      };
      const user = await createUser(module);
      await expect(
        controller.uploadUserImagesConfirmation(
          { user: { sub: user.userId } } as unknown as typeof request,
          createImageDTO
        )
      ).rejects.toThrow(new BadRequestException('Unknown image type'));
    });
  });

  it('should raise exception when try to upload profile file with a not allowed extension file', async () => {
    const file: AppFile = {
      lastModified: 7,
      name: 'file.xxx',
      size: 7,
      type: 'application/xxx',
    };
    const createImageDTO: CreateProfileImageDTO = {
      file: file,
      profileImage: 'avatar',
    };
    const user = await createUser(module);

    await expect(
      controller.uploadProfileImages(
        { user: { sub: user.userId } } as unknown as typeof request,
        createImageDTO
      )
    ).rejects.toMatchObject(new UnauthorizedException('Invalid extension file'));
  });

  it('should upload profile file', async () => {
    const file: AppFile = {
      lastModified: 7,
      name: 'file.png',
      size: 7,
      type: 'application/png',
    };
    const createImageDTO: CreateProfileImageDTO = {
      file: file,
      profileImage: 'avatar',
    };
    const user = await createUser(module);

    const signedURL = await controller.uploadProfileImages(
      { user: { sub: user.userId } } as unknown as typeof request,
      createImageDTO
    );
    expect(signedURL.fileMetadata.filename).toStrictEqual('avatar.png');
  });

  it('should raise an exception when trying to upload an avatar that exceeds the maximum allowed size', async () => {
    const file: AppFile = {
      lastModified: 7,
      name: 'file.jpg',
      size: 77777777777,
      type: 'application/jpg',
    };
    const createImageDTO: CreateProfileImageDTO = {
      file: file,
      profileImage: 'avatar',
    };
    const user = await createUser(module);
    await expect(
      controller.uploadProfileImages(
        { user: { sub: user.userId } } as unknown as typeof request,
        createImageDTO
      )
    ).rejects.toMatchObject(
      new UnauthorizedException('Image exceeds the maximum allowed size 51200')
    );
  });

  it('should raise an exception when trying to upload an banner that exceeds the maximum allowed size', async () => {
    const file: AppFile = {
      lastModified: 7,
      name: 'file.jpg',
      size: 77777777777,
      type: 'application/jpg',
    };
    const createImageDTO: CreateProfileImageDTO = {
      file: file,
      profileImage: 'banner',
    };
    const user = await createUser(module);

    await expect(
      controller.uploadProfileImages(
        { user: { sub: user.userId } } as unknown as typeof request,
        createImageDTO
      )
    ).rejects.toMatchObject(
      new UnauthorizedException('Image exceeds the maximum allowed size 512000')
    );
  });

  it('should request personal data', async () => {
    const { community } = await createCommunity(module);
    const { author } = await createDeposit(module, { community });
    const { deposit: deposit2 } = await createDeposit(module, { community });
    await createReview(module, deposit2, { reviewer: author });
    const result = await controller.requestData({
      user: { sub: author.userId },
    } as unknown as typeof request);
    expect(result.data).toBeDefined();
  });
});
