import { Component, TemplateRef, ViewChild } from '@angular/core';
import { CalendarDTO } from '@orvium/api';
import { CommunityCalendarComponent } from '../../communities/community-calendar/community-calendar.component';
import { MatButtonModule } from '@angular/material/button';
import { DialogService } from '../../dialogs/dialog.service';

@Component({
  selector: 'app-community-calendar-demo',
  standalone: true,
  templateUrl: './community-calendar-demo.component.html',
  styleUrls: ['./community-calendar-demo.component.scss'],
  imports: [CommunityCalendarComponent, MatButtonModule],
})
export class CommunityCalendarDemoComponent {
  calendarEvents: CalendarDTO[] = [
    {
      date: new Date(new Date().setDate(new Date().getDate() - 1)),
      message: 'Call for abstracts/papers opens',
      daysLeft: 0,
    },
    {
      date: new Date(new Date()),
      message: 'TODAY IS THE DAY!',
      daysLeft: 0,
    },
    {
      date: new Date(new Date().setDate(new Date().getDate() + 20)),
      message: 'Call for abstract/papers closes',
      daysLeft: 0,
    },
    {
      date: new Date(new Date().setDate(new Date().getDate() + 40)),
      message: 'Full paper and abstract submission deadline',
      daysLeft: 0,
    },
    {
      date: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      message: 'Papers peer reviewed',
      daysLeft: 0,
    },
    {
      date: new Date(new Date().setMonth(new Date().getMonth() + 2)),
      message: 'Conference begins',
      daysLeft: 0,
    },
  ];

  @ViewChild('calendarDialogTemplate') calendarDialogTemplate!: TemplateRef<unknown>;

  constructor(public dialogService: DialogService) {}

  openCalendar(): void {
    this.dialogService.openCustom({
      title: `Calendar (${this.calendarEvents.length})`,
      template: this.calendarDialogTemplate,
      showActionButtons: false,
    });
  }
}
