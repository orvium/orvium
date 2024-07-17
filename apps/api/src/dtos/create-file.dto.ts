import { IsDefined, IsEnum, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AppFile {
  readonly lastModified!: number;
  readonly name!: string;
  readonly size!: number;
  readonly type!: string;
}

export class CreateFileDTO {
  // TODO add documentation
  @IsDefined() file!: AppFile;
}

export class CreateImageDTO extends CreateFileDTO {
  /**
   * Type of the community image upload
   * @example logo
   */
  @ApiProperty({ enum: ['logo', 'banner', 'card'], enumName: 'ImageType' })
  @IsDefined()
  @IsString()
  @IsEnum(['logo', 'banner', 'card'])
  communityImage!: 'logo' | 'banner' | 'card';
}

export class CreateProfileImageDTO extends CreateFileDTO {
  /**
   * Type of the profile image upload
   * @example banner
   */
  @ApiProperty({ enum: ['avatar', 'banner'], enumName: 'ProfileImageType' })
  @IsDefined()
  @IsString()
  @IsEnum(['avatar', 'banner'])
  profileImage!: 'avatar' | 'banner';
}

export class CreatePlatformImageDTO extends CreateFileDTO {
  /**
   * Type of the platform image upload
   * @example banner
   */
  @ApiProperty({ enum: ['logo', 'logo-icon', 'favicon'], enumName: 'PlatformImageType' })
  @IsDefined()
  @IsString()
  @IsEnum(['logo', 'logo-icon', 'favicon'])
  platformImage!: 'logo' | 'logo-icon' | 'favicon';
}
