import { IsBoolean, IsISSN, IsOptional, IsString, ValidateIf } from 'class-validator';
import { CommunityType, FileExtensions, Track } from '../../communities/communities.schema';
import { AccessRight } from '../../deposit/deposit.schema';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CrossrefDTO } from '../crossref.dto';
import { IsNotBlankValidator } from '../../utils/isNotBlankValidator';
import { CalendarUpdateDTO } from '../calendar-update.dto';
import { DataCiteDTO } from '../dataCite.dto';

export class CommunityUpdateDto {
  /**
   * Community name
   * @example "Orvium Community"
   */
  @IsOptional()
  @IsString()
  @IsNotBlankValidator({ message: 'Name should not be empty' })
  name?: string;

  /**
   * Community description
   * @example "Orvium Community is a multidisciplinary, open access and open peer review community for researchers. Join now and publish your research!"
   */
  @IsOptional() @IsString() description?: string;

  /**
   * the country of the community
   * @example "Vitoria-Gasteiz, Spain"
   */
  @IsOptional() @IsString() country?: string;

  /**
   * Community type
   * @example community
   */
  @ApiProperty({ enum: CommunityType, enumName: 'CommunityType' })
  @IsOptional()
  @IsString()
  type?: CommunityType;

  /**
   * Community acknowledgement
   * @example "<ol><li>The work has not been previously published, nor been submitted to another publisher.</li></ol>"
   */
  @IsOptional() @IsString() acknowledgement?: string;

  /**
   * the twitter URL of the community
   * @example https://twitter.com/orvium
   */
  @IsOptional() @IsString() twitterURL?: string;

  /**
   * the facebook URL of the community
   * @example https://www.facebook.com/orvium
   */
  @IsOptional() @IsString() facebookURL?: string;

  /**
   * the website URL of the community
   * @example https://orvium.io/
   */
  @IsOptional() @IsString() websiteURL?: string;

  /**
   * the guideline URL of the community
   * @example https://orvium.io/
   */
  @IsOptional() @IsString() guidelinesURL?: string;

  /**
   * Community iThenticateAPI key
   * @example "617298619ff9664a706ca6fb"
   */
  @IsOptional() @IsString() iThenticateAPIKey?: string;

  /**
   * Community iThenticateAPI version
   * @example "1"
   */
  @IsOptional() @IsString() iThenticateEULAVersion?: string;

  /**
   * Community custom licenses
   * @example [cc0]
   */
  @ApiProperty({ enum: AccessRight, enumName: 'AccessRight' })
  @IsOptional()
  customLicenses?: AccessRight[];

  /**
   * Community issn
   * @example 2667-2812
   */
  @IsOptional() @ValidateIf(o => o.issn !== '') @IsISSN() issn?: string;

  /**
   * Community preferred file extensions
   * @example [pdf]
   */
  @ApiProperty({ enum: FileExtensions, enumName: 'FileExtensions' })
  @IsOptional()
  preferredFileExtensions?: FileExtensions[];

  /**
   * Community calendar dates
   * @example "{date: 2022-03-14T23:00:00.000+00:00, message: Submission of concept version of papers}"
   */
  @IsOptional() @Type(() => CalendarUpdateDTO) calendarDates?: CalendarUpdateDTO[];

  /**
   * Community calendar visible
   * @example false
   */
  @IsOptional() calendarVisible?: boolean;

  /**
   * Community option to give permission to authors to invite reviewers
   * @example false
   */
  @IsOptional() canAuthorInviteReviewers?: boolean;

  /**
   * Community products visible
   * @example true
   */
  @IsOptional() productsVisible?: boolean;

  @IsOptional() @Type(() => CrossrefDTO) crossref?: CrossrefDTO | null;
  @IsOptional() @Type(() => DataCiteDTO) datacite?: DataCiteDTO | null;

  /**
   * New community tracks
   */
  @IsOptional() @Type(() => Track) newTracks?: Track[];

  /**
   *  The identity of the reviewer is shown to the author of the publication
   * @example true
   */
  @IsOptional() @IsBoolean() showIdentityToAuthor?: boolean;

  /**
   *  The identity of the reviewer is shown to everyone
   * @example true
   */
  @IsOptional() @IsBoolean() showIdentityToEveryone?: boolean;

  /**
   *  The review is shown to the author of the publication
   * @example true
   */
  @IsOptional() @IsBoolean() showReviewToAuthor?: boolean;

  /**
   *  The review is shown to everyone
   * @example true
   */
  @IsOptional() @IsBoolean() showReviewToEveryone?: boolean;
  /**
   *  Community option so that only invited users can create a review
   * @example true
   */
  @IsOptional() @IsBoolean() privateReviews?: boolean;
}
