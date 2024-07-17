import { IsDate, IsString } from 'class-validator';

export class CalendarUpdateDTO {
  /**
   * Date marked in the calendar
   * @example 21/12/2022
   */
  @IsDate() date!: Date;

  /**
   * Description of the event
   * @example "Start 2022 Orvium conference"
   */
  @IsString() message!: string;
}
