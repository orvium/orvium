import { Component } from '@angular/core';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

/**
 * Component for displaying a loading spinner. It can be used across different parts of the application
 * to indicate that a process is ongoing.
 */
@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  templateUrl: './loading-spinner.component.html',
  styleUrls: ['./loading-spinner.component.scss'],
  imports: [MatProgressSpinnerModule],
})
export class LoadingSpinnerComponent {
  /**
   * A flag to indicate if the spinner is styled as a button. This can be used to toggle spinner
   * presentation in button-like contexts.
   */
  isButton = false;
}
