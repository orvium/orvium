import { ApiBearerAuth, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import {
  Body,
  Controller,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';
import { CreatePlatformImageDTO } from '../dtos/create-file.dto';
import { SignedUrlDTO } from '../dtos/signedUrl.dto';
import { assertIsDefined } from '../utils/utils';
import { extname } from 'path';
import { FileMetadata } from '../dtos/filemetadata.dto';
import { PutObjectCommandInput } from '@aws-sdk/client-s3';
import { UserService } from '../users/user.service';
import { AwsStorageService } from '../common/aws-storage-service/aws-storage.service';
import { IsDefined, IsString } from 'class-validator';

const PLATFORM_ALLOWED_FILE_EXTENSIONS = ['.jpeg', '.jpg', '.png', '.webp', '.svg'];

/**
 * Class representing the confirmation payload for a platform upload.
 */
export class PlatformUploadConfirmation {
  @IsDefined() @IsString() @ApiProperty() imageType!: string;
  @IsDefined() @ApiProperty() fileMetadata!: FileMetadata;
}

/**
 * Controller handling administrative actions related to media management on the platform.
 * @class AdminController
 * @controller
 * @tags 'admin'
 */
@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly userService: UserService,
    private readonly storageService: AwsStorageService
  ) {}

  /**
   * POST method to upload an image to the platform's media storage.
   * Requires admin privileges and checks for valid file extensions.
   * @param {Request} req - The incoming HTTP request with the user's authentication info.
   * @param {CreatePlatformImageDTO} payload - DTO containing the image file details.
   * @returns {Promise<SignedUrlDTO>} - The signed URL for the uploaded image and its metadata.
   * @throws {UnauthorizedException} - If the user is not found or is not an admin.
   */
  @ApiOperation({ summary: 'Upload images to the platform toolbar' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('platform/media')
  async uploadLogoImage(
    @Req() req: Request,
    @Body() payload: CreatePlatformImageDTO
  ): Promise<SignedUrlDTO> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');
    if (!user.roles.includes('admin')) {
      throw new UnauthorizedException();
    }

    const file = payload.file;

    const fileExtension = extname(file.name).toLowerCase();

    if (!PLATFORM_ALLOWED_FILE_EXTENSIONS.includes(fileExtension)) {
      throw new UnauthorizedException('Invalid extension file');
    }
    const tags: string[] = [];
    tags.push('Admin');

    const fileMetadata: FileMetadata = {
      filename: `${payload.platformImage}`,
      description: file.name,
      contentType: file.type,
      contentLength: file.size,
      tags: tags,
    };

    const objectKey = `platform/media/${fileMetadata.filename}`;

    const params: PutObjectCommandInput = {
      Key: objectKey,
      ContentType: fileMetadata.contentType,
      Bucket: this.storageService.publicBucket,
    };

    const signedUrl = await this.storageService.getSignedUrl('putObject', params);

    return { signedUrl, fileMetadata, isMainFile: false, replacePDF: false };
  }

  /**
   * PATCH method to confirm the upload of a logo to the platform.
   * Checks that the uploaded file is accessible and logs the confirmation.
   * @param {Request} req - The incoming HTTP request with the user's authentication info.
   * @param {PlatformUploadConfirmation} payload - Confirmation data including the type of image and its metadata.
   * @throws {UnauthorizedException} - If the user is not found or is not an admin.
   */
  @ApiOperation({ summary: 'Confirm logo image upload' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('platform/media/confirm')
  async uploadLogoImageConfirmation(
    @Req() req: Request,
    @Body() payload: PlatformUploadConfirmation
  ): Promise<void> {
    const user = await this.userService.getLoggedUser(req);

    assertIsDefined(user, 'User not found');
    if (!user.roles.includes('admin')) {
      throw new UnauthorizedException();
    }

    const objectKey = `platform/media/${payload.imageType}`;

    await this.storageService.headObject({
      objectKey: objectKey,
      bucket: this.storageService.publicBucket,
    });
  }
}
