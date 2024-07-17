import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class SpeakerDTO {
  /**
   * User ID of the speaker
   * @example 5fa1908fd29a17dc961cc435
   */
  @Expose() userId?: string;

  /**
   * Speaker first name
   * @example "john"
   */
  @Expose() firstName!: string;

  /**
   * Speaker last name
   * @example "doe"
   */
  @Expose() lastName!: string;

  /**
   * Speaker nickname generated in the platform
   * @example "john-doe"
   */
  @Expose() nickname?: string;

  /**
   * Speaker orcid
   * @example 0000-0001-5000-0007
   */
  @Expose() orcid?: string;

  /**
   * Tags related to the speaker
   * @example [Architecture]
   */
  @Expose() tags!: string[];

  /**
   * Generated gravatar for the speaker with md5hash
   * @example 4d950dd20ef84d1ce7552c78c577ba00
   */
  @Expose() gravatar?: string;

  /**
   * The url of the image put in the profile avatar
   * @example https://s3.eu-central-1.amazonaws.com/public-files.example.com/profile/61f12bb224a817c22e70f108/media/avatar.png
   */
  @Expose() avatar?: string;

  /**
   * An array with the institutions of the speaker
   * @example [Orvium, Tech]
   */
  @Expose() institutions!: string[];
}
