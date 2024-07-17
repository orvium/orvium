import { Component, Input, OnInit } from '@angular/core';
import { CalendarDTO } from '@orvium/api';
import { DatePipe, NgClass } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';

/**
 * Component for displaying a calendar of events specific to a community. It processes and shows upcoming
 * events along with the days left until these events occur.
 */
@Component({
  selector: 'app-calendar',
  standalone: true,
  templateUrl: './community-calendar.component.html',
  styleUrls: ['./community-calendar.component.scss'],
  imports: [NgClass, MatChipsModule, DatePipe, MatDividerModule],
})
export class CommunityCalendarComponent implements OnInit {
  /**
   * An array of calendar events to be displayed. Each event includes date information and other relevant details.
   *
   * @input calendarEvents Array of events, where each event conforms to the CalendarDTO interface.
   */
  @Input({ required: true }) calendarEvents: CalendarDTO[] = [];

  /**
   * Initializes the component by calculating the number of days left until each event in the `calendarEvents` array.
   * This calculation is performed as soon as the component initializes to ensure all events display the correct time until occurrence.
   */
  ngOnInit(): void {
    const now = new Date();
    for (const event of this.calendarEvents) {
      const diff = new Date(event.date).getTime() - now.getTime();
      event.daysLeft = Math.ceil(diff / (1000 * 3600 * 24));
    }
  }
}
