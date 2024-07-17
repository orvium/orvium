import { Test, TestingModule } from '@nestjs/testing';

import { AdminController, PlatformUploadConfirmation } from './admin.controller';
import { cleanCollections, MongooseTestingModule } from '../utils/mongoose-testing.module';
import { ProfileUploadConfirmation } from '../users/user.controller';
import { request } from 'express';
import { AppFile, CreatePlatformImageDTO } from '../dtos/create-file.dto';
import { UnauthorizedException } from '@nestjs/common';
import { createAdmin, createUser } from '../utils/test-data';

jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/s3-request-presigner');
describe('Admin Controller', () => {
  let controller: AdminController;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [MongooseTestingModule.forRoot('AdminController')],
      controllers: [AdminController],
      providers: [],
    }).compile();
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    controller = module.get(AdminController);
    await cleanCollections(module);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should upload platform logo file confirmation', async () => {
    const createImageDTO: PlatformUploadConfirmation = {
      imageType: 'logo',
      fileMetadata: {
        filename: 'example.png',
        contentType: 'image/png',
        contentLength: 1,
        tags: ['Admin'],
        description: '',
      },
    };
    const admin = await createAdmin(module);
    await controller.uploadLogoImageConfirmation(
      { user: { sub: admin.userId } } as unknown as typeof request,
      createImageDTO
    );
  });

  it('should raise exception while upload platform logo file confirmation', async () => {
    const createImageDTO: PlatformUploadConfirmation = {
      imageType: 'logo',
      fileMetadata: {
        filename: 'example.png',
        contentType: 'image/png',
        contentLength: 1,
        tags: ['Admin'],
        description: '',
      },
    };
    const user = await createUser(module);
    await expect(
      controller.uploadLogoImageConfirmation(
        { user: { sub: user.userId } } as unknown as typeof request,
        createImageDTO
      )
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should upload platform logo-icon file confirmation', async () => {
    const createImageDTO: ProfileUploadConfirmation = {
      imageType: 'logo-icon',
      fileMetadata: {
        filename: 'example.png',
        contentType: 'image/png',
        contentLength: 1,
        tags: ['Admin'],
        description: '',
      },
    };
    const admin = await createAdmin(module);

    await controller.uploadLogoImageConfirmation(
      { user: { sub: admin.userId } } as unknown as typeof request,
      createImageDTO
    );
  });

  it('should raise exception when try to upload platform file with a not allowed extension file', async () => {
    const file: AppFile = {
      lastModified: 7,
      name: 'file.xxx',
      size: 7,
      type: 'application/xxx',
    };
    const createImageDTO: CreatePlatformImageDTO = {
      file: file,
      platformImage: 'logo',
    };
    const admin = await createAdmin(module);
    await expect(
      controller.uploadLogoImage(
        { user: { sub: admin.userId } } as unknown as typeof request,
        createImageDTO
      )
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should upload profile file', async () => {
    const file: AppFile = {
      lastModified: 7,
      name: 'file.png',
      size: 7,
      type: 'application/png',
    };
    const createImageDTO: CreatePlatformImageDTO = {
      file: file,
      platformImage: 'logo',
    };
    const admin = await createAdmin(module);
    const signedURL = await controller.uploadLogoImage(
      { user: { sub: admin.userId } } as unknown as typeof request,
      createImageDTO
    );
    expect(signedURL.fileMetadata.filename).toStrictEqual('logo');
  });

  it('should raise an exception when trying to upload a logo that exceeds the maximum allowed size', async () => {
    const file: AppFile = {
      lastModified: 7,
      name: 'file.jpg',
      size: 77777777777,
      type: 'application/jpg',
    };
    const createImageDTO: CreatePlatformImageDTO = {
      file: file,
      platformImage: 'logo',
    };
    const user = await createUser(module);
    await expect(
      controller.uploadLogoImage(
        { user: { sub: user.userId } } as unknown as typeof request,
        createImageDTO
      )
    ).rejects.toThrow(UnauthorizedException);
  });
});
