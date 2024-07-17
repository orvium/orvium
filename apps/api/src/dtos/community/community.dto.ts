import { Exclude, Expose, Type } from 'class-transformer';
import {
  CommunityStatus,
  CommunityType,
  FileExtensions,
  SubscriptionType,
  Track,
} from '../../communities/communities.schema';
import { AccessRight } from '../../deposit/deposit.schema';
import { TransformObjectId } from '../../utils/expose-id.decorator';
import { CalendarDTO } from '../calendar.dto';
import { ApiProperty } from '@nestjs/swagger';

@Exclude()
export class CommunityDTO {
  /**
   * Community ID
   * @example "617298619ff9664a706ca6fb"
   */
  @TransformObjectId() @Expose() _id!: string;

  /**
   * Community name
   * @example "Orvium Community"
   */
  @Expose() name!: string;

  /**
   * Community description
   * @example "Orvium Community is a multidisciplinary, open access and open peer review community for researchers. Join now and publish your research!"
   */
  @Expose() description?: string;

  /**
   * Community creator ID
   * @example "5ea719e04c7bdc7dad15673e"
   */
  @TransformObjectId() @Expose() creator!: string;

  /**
   * Community status
   * @example published
   */
  @ApiProperty({ enum: CommunityStatus, enumName: 'CommunityStatus' })
  @Expose()
  status!: CommunityStatus;

  /**
   * the country of the community
   * @example "Vitoria-Gasteiz, Spain"
   */
  @Expose() country?: string;

  /**
   * Community type
   * @example community
   */
  @ApiProperty({ enum: CommunityType, enumName: 'CommunityType' })
  @Expose()
  type!: CommunityType;

  /**
   * Community subscription
   * @example free
   */
  @ApiProperty({ enum: SubscriptionType, enumName: 'SubscriptionType' })
  @Expose()
  subscription!: SubscriptionType;

  /**
   * Community codename
   * @example "orvium"
   */
  @Expose() codename!: string;

  /**
   * Community acknowledgement
   * @example "<ol><li>The work has not been previously published, nor been submitted to another publisher.</li></ol>"
   */
  @Expose() acknowledgement?: string;

  /**
   * The twitter URL of the community
   * @example https://twitter.com/orvium
   */
  @Expose() twitterURL?: string;

  /**
   * the facebook URL of the community
   * @example https://www.facebook.com/orvium
   */
  @Expose() facebookURL?: string;

  /**
   * the website URL of the community
   * @example https://orvium.io/
   */
  @Expose() websiteURL?: string;

  /**
   * the logo URL of the community
   * @example https://assets.orvium.io/OrviumCommunity/logo.jpg
   */
  @Expose() logoURL?: string;

  /**
   * the banner URL of the community
   * @example https://assets.orvium.io/OrviumCommunity/banner1.jpg
   */
  @Expose() bannerURL?: string;

  /**
   * the card image URL of the community
   * @example https://i.postimg.cc/8cG0jsrQ/image.png
   */
  @Expose() cardImageUrl?: string;

  /**
   * the guideline URL of the community
   * @example https://orvium.io/
   */
  @Expose() guidelinesURL?: string;

  /**
   * Community actions
   * @example [Update]
   */
  @Expose() actions: string[] = [];

  /**
   * Conferences ID associated with this community
   * @example ['613ef9d5c8b4c84c09c292bf']
   */
  @TransformObjectId() @Expose() conferenceProceedings!: string[];

  /**
   * New community tracks
   */
  @Expose() @Type(() => Track) newTracks: Track[] = [];

  /**
   * Community custom licenses
   * @example [cc0]
   */
  @ApiProperty({ enum: AccessRight, enumName: 'AccessRight' })
  @Expose()
  customLicenses!: AccessRight[];

  /**
   * Community have privates reviewers
   * @example false
   */
  @Expose() privateReviews!: boolean;

  /**
   * Community option to give permission to authors to invite reviewers
   * @example false
   */
  @Expose() canAuthorInviteReviewers!: boolean;

  /**
   * Community issn
   * @example 2667-2812
   */
  @Expose() issn?: string;

  /**
   * Community preferred file extensions
   * @example [pdf]
   */
  @ApiProperty({ enum: FileExtensions, enumName: 'FileExtensions' })
  @Expose()
  preferredFileExtensions?: FileExtensions[];

  /**
   * Community calendar dates
   * @example "{date: 2022-03-14T23:00:00.000+00:00, message: Submission of concept version of papers, daysLeft: null}"
   */
  @Expose() @Type(() => CalendarDTO) calendarDates!: CalendarDTO[];

  /**
   * Community calendar visible
   * @example false
   */
  @Expose() calendarVisible!: boolean;

  /**
   * Community follower counts
   * @example 74
   */
  @Expose() followersCount!: number;

  /**
   * Community products visible
   * @example true
   */
  @Expose() productsVisible!: boolean;

  /**
   * Community views
   * @example 74
   */
  @Expose() views!: number;

  /**
   *  The identity of the reviewer is shown to the author of the publication
   * @example true
   */
  @Expose() showIdentityToAuthor!: boolean;

  /**
   *  The identity of the reviewer is shown to everyone
   * @example true
   */
  @Expose() showIdentityToEveryone!: boolean;

  /**
   *  The review is shown to the author of the publication
   * @example true
   */
  @Expose() showReviewToAuthor!: boolean;

  /**
   *  The review is shown to everyone
   * @example true
   */
  @Expose() showReviewToEveryone!: boolean;
}
