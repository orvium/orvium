import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class CalendarDTO {
  /**
   * Date marked in the calendar
   * @example 21/12/2022
   */
  @Expose() date!: Date;

  /**
   * Description of the event
   * @example "Start 2022 Orvium conference"
   */
  @Expose() message!: string;

  /**
   * Days left from today to the selected day in the calendar
   * @example 6
   */
  @Expose() daysLeft!: number;
}
