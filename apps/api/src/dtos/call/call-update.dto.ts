import { CallType } from '../../call/call.schema';
import { IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CallUpdateDTO {
  /**
   * Call Title
   * @example My conference Enabling health, care and well-being through design research
   */
  @IsOptional() title?: string;

  /**
   * Call Deadline
   * @example 21/12/2022
   */
  @IsOptional() deadline?: Date;

  /**
   * Call Description
   * @example This call is to remember to submit the publications for the conference
   */
  @IsOptional() description?: string;

  /**
   * Type of the call created
   * @example Call for papers or call for abstracts
   */
  @ApiProperty({ enum: CallType, enumName: 'CallType' })
  @IsOptional()
  callType?: CallType;

  /**
   * Area or subjects relevant to the call for papers/abstract
   * @example Health care well-being architecture design research
   */
  @IsOptional() scope?: string;

  /**
   * Call Guest editors
   * @example John Doe, Michael Kane
   */
  @IsOptional() guestEditors?: string;

  /**
   * Disciplines related to the topic of the call
   * @example Architecture, Medicine and health, Environmental psychology
   */
  @IsOptional() disciplines?: string[] = [];

  /**
   * Call contact information
   * @example Organizing / Scientific Committee of Orvium
   */
  @IsOptional() contact?: string;

  /**
   * Contact email for this call
   * @example example@example.com
   */
  @IsOptional() contactEmail?: string;

  /**
   * Visibility of this call in the platform
   * @example true
   */
  @IsOptional() visible?: boolean = false;
}
