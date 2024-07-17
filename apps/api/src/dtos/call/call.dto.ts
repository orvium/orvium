import { Exclude, Expose } from 'class-transformer';
import { CallType } from '../../call/call.schema';
import { TransformObjectId } from '../../utils/expose-id.decorator';
import { ApiProperty } from '@nestjs/swagger';

@Exclude()
export class CallDTO {
  /**
   * Call ID
   * @example 542c2b97bac0595474108b48
   */
  @TransformObjectId()
  @Expose()
  _id!: string;

  /**
   * Call Title
   * @example My conference Enabling health, care and well-being through design research
   */
  @Expose() title!: string;

  /**
   * Call Deadline
   * @example 21/12/2022
   */
  @Expose() deadline?: Date;

  /**
   * Call Description
   * @example This call is to remember to submit the publications for the conference
   */
  @Expose() description!: string;

  /**
   * Type of the call created
   * @example Call for papers or call for abstracts
   */
  @ApiProperty({ enum: CallType, enumName: 'CallType' })
  @Expose()
  callType!: CallType;

  /**
   * Area or subjects relevant to the call for papers/abstract
   * @example Health care well-being architecture design research
   */
  @Expose() scope!: string;

  /**
   * Call Guest editors
   * @example John Doe, Michael Kane
   */
  @Expose() guestEditors!: string;

  /**
   * Disciplines related to the topic of the call
   * @example Architecture, Medicine and health, Environmental psychology
   */
  @Expose() disciplines: string[] = [];

  /**
   * Call contact information
   * @example Organizing / Scientific Committee of Orvium
   */
  @Expose() contact!: string;

  /**
   * Contact email for this call
   * @example example@example.com
   */
  @Expose() contactEmail!: string;

  /**
   * Visibility of this call in the platform
   * @example true
   */
  // eslint-disable-next-line @typescript-eslint/no-inferrable-types
  @Expose() visible: boolean = false;

  /**
   * Community ID of the community where this call has been created
   * @example 63848e5d2e63b7fa277f58b0
   */
  @TransformObjectId() @Expose() community!: string;

  /**
   * Call actions
   * @example [Update]
   */
  @Expose() actions: string[] = [];
}
