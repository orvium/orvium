import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { IsNotBlankValidator } from '../../utils/isNotBlankValidator';

export class SessionCreateDTO {
  /**
   * Session title
   * @example "User-experience and co-design (3A) – chair: Göran Lindahl"
   */
  @IsString()
  @IsNotBlankValidator({ message: 'Title should not be empty' })
  title!: string;

  /**
   * The description of the session
   * @example "11:00 Iris Beuls Exploring photo-elicitation to elicit architecturally rich users’ experiences with(in) palliative environments through a human-centred approach: a pilot study"
   */
  @IsOptional() @IsString() description?: string;

  /**
   * The ID of the community where the session is created
   * @example 5fa1908fd29a17dc961cc435
   */
  @IsNotEmpty() community!: string;

  /**
   * The track of the session
   * @example user-needs
   */
  @IsOptional() newTrackTimestamp?: number;

  /**
   * Session start date
   * @example 21/12/2022
   */
  @IsNotEmpty() dateStart!: Date;

  /**
   * Session end date
   * @example 22/12/2022
   */
  @IsNotEmpty() dateEnd!: Date;
}
