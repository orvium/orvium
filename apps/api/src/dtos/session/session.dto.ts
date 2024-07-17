import { Exclude, Expose, Type } from 'class-transformer';
import { TransformObjectId } from '../../utils/expose-id.decorator';
import { SpeakerDTO } from '../speaker.dto';

@Exclude()
export class SessionDTO {
  /**
   * Session ID
   * @example 5fa1908fd29a17dc961cc435
   */
  @TransformObjectId()
  @Expose()
  _id!: string;

  /**
   * Session Title
   * @example "Coffee break"
   */
  @Expose() title!: string;

  /**
   * Session creator ID
   * @example 5fa1908fd29a17dc961cc435
   */
  @TransformObjectId() @Expose() creator!: string;

  /**
   * The track timpestamp of the session
   * @example 123435645456
   */
  @Expose() newTrackTimestamp?: number;

  /**
   * The description of the session
   * @example "11:00 Iris Beuls Exploring photo-elicitation to elicit architecturally rich users’ experiences with(in) palliative environments through a human-centred approach: a pilot study"
   */
  @Expose() description?: string;

  /**
   * The ID of the community where the session is created
   * @example 5fa1908fd29a17dc961cc435
   */
  @TransformObjectId() @Expose() community!: string;

  /**
   * Session start date
   * @example 21/12/2022
   */
  @Expose() dateStart?: Date;

  /**
   * Speakers of the current session
   */
  @Expose() @Type(() => SpeakerDTO) speakers!: SpeakerDTO[];

  /**
   * Session end date
   * @example 21/12/2022
   */
  @Expose() dateEnd?: Date;

  /**
   * Publications ID related to the session
   * @example [5fa1908fd29a17dc961cc435, 5fa1908fd29a17dc961cc435]
   */
  @TransformObjectId() @Expose() deposits!: string[];

  /**
   * Session actions
   * @example [Update]
   */
  @Expose() actions: string[] = [];
}
