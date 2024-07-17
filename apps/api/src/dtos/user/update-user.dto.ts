import { IsBoolean, IsEmail, IsOptional, IsString, IsUrl, ValidateIf } from 'class-validator';
import { IsNotBlankValidator } from '../../utils/isNotBlankValidator';
import { UserType } from '../../users/user.schema';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDTO {
  /**
   * User email
   * @example example@example.com
   */
  @IsOptional() @IsEmail() emailPendingConfirmation?: string;

  /**
   * User fist name
   * @example john
   */
  @IsOptional() @IsString() @IsNotBlankValidator() firstName?: string;

  /**
   * User last name
   * @example doe
   */
  @IsOptional() @IsString() @IsNotBlankValidator() lastName?: string;

  /**
   * User description
   * @example Working in a tech department
   */
  @IsOptional() @IsString() aboutMe?: string;

  /**
   * User orcid
   * @example 0000-0001-5000-0007
   */
  @IsOptional() @ValidateIf(o => o.orcid !== '') @IsUrl() orcid?: string;

  /**
   * User linkedin url
   * @example https://www.linkedin.com/in/john-doe
   */
  @IsOptional() @ValidateIf(o => o.linkedin !== '') @IsUrl() linkedin?: string;

  /**
   * Blog url
   * @example https://myblog.com
   */
  @IsOptional() @ValidateIf(o => o.blog !== '') @IsUrl() blog?: string;

  /**
   * Institutions of the user
   * @example [Orvium]
   */
  @IsOptional() @IsString({ each: true }) institutions?: string[];

  /**
   * User role in the platform
   * @example moderator
   */
  @IsOptional() @IsString() role?: string;

  /**
   * Publications where the user is mentioned as author or submitter in the platform
   * @example [63a09f6ce3d5ff0813586171,63a09f6ce3d5ff0813586176]
   */
  @IsOptional() @IsString({ each: true }) starredDeposits?: string[];

  /**
   * Check if the user has finished the sign-up
   * @example false
   */
  @IsOptional() @IsBoolean() isOnboarded?: boolean;

  /**
   * Check if the user has accepted the Terms and Conditions
   * @example true
   */
  @IsOptional() @IsBoolean() acceptedTC?: boolean;

  /**
   * User type
   * @example Medical
   */
  @ApiProperty({ enum: UserType, enumName: 'UserType' })
  @IsOptional()
  @IsString()
  userType?: UserType;

  /**
   * Communities that have joined the user
   * @example [5fa1908fd29a17dc961cc435]
   */
  @IsOptional() communities?: string[];

  /**
   * User disciplines
   * @example Medical
   */
  @IsOptional() @IsString({ each: true }) disciplines?: string[];

  /**
   * Check if the user is impersonating another user
   * @example false
   */
  @IsOptional() @IsString() impersonatedUser?: string;
}
