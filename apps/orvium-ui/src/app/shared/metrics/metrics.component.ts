import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

/**
 * Component to display metrics with an icon and description.
 */
@Component({
  selector: 'app-metrics',
  standalone: true,
  templateUrl: './metrics.component.html',
  imports: [MatIconModule, MatCardModule, MatButtonModule, MatTooltipModule],
})
export class MetricsComponent {
  /** The number to display. */
  @Input({ required: true }) number!: number;

  /** The icon to display. */
  @Input({ required: true }) icon!: string;

  /** The description of the metric. */
  @Input({ required: true }) description!: string;

  /** Optional tooltip text to display. */
  @Input() tooltipText?: string;
}
