import { Component, Input } from '@angular/core';
import { HistoryLogLine } from '@orvium/api';
import { MatDividerModule } from '@angular/material/divider';
import { DatePipe } from '@angular/common';

/**
 * The HistoryLogComponent is a standalone component responsible for displaying
 * a log of history events with timestamps.
 */
@Component({
  selector: 'app-history-log',
  standalone: true,
  templateUrl: './history-log.component.html',
  styleUrls: ['./history-log.component.scss'],
  imports: [MatDividerModule, DatePipe],
})
export class HistoryLogComponent {
  /** An array of history log lines to display. */
  @Input() historyLogLines: HistoryLogLine[] = [];
}
