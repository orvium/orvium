import { IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { SpeakerDTO } from '../speaker.dto';

export class SessionUpdateDTO {
  /**
   * Session title
   * @example "User-experience and co-design (3A) – chair: Göran Lindahl"
   */
  @IsOptional() title?: string;

  /**
   * The description of the session
   * @example "11:00 Iris Beuls Exploring photo-elicitation to elicit architecturally rich users’ experiences with(in) palliative environments through a human-centred approach: a pilot study"
   */
  @IsOptional() description?: string;

  /**
   * The track timestamp of the session
   * @example 2354632456
   */
  @IsOptional() newTrackTimestamp?: number;

  /**
   * Speakers of the current session
   */
  @IsOptional() @Type(() => SpeakerDTO) speakers?: SpeakerDTO[];

  /**
   * Session start date
   * @example 21/12/2022
   */
  @IsOptional() dateStart?: Date;

  /**
   * Session end date
   * @example 21/12/2022
   */
  @IsOptional() dateEnd?: Date;

  /**
   * Publications ID related to the session
   * @example [5fa1908fd29a17dc961cc435, 5fa1908fd29a17dc961cc435]
   */
  @IsOptional() deposits?: string[];
}
