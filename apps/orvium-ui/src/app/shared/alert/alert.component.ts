import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/**
 * Component for displaying alert messages with optional icons and types.
 */
@Component({
  selector: 'app-alert',
  standalone: true,
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.scss'],
  imports: [MatIconModule],
})
export class AlertComponent {
  /** Optional icon to display in the alert. */
  @Input() icon?: string;

  /** Type of alert to display, defaults to 'info'. Can be 'info' or 'error'. */
  @Input() type: 'info' | 'error' = 'info';

  /** Whether the alert can be closed manually by the user. */
  @Input() isClosable = false;
}
