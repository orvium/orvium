import { Component, Input } from '@angular/core';
import { Location } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

/**
 * Component responsible for displaying an access denied message when a user tries to access a restricted page.
 */
@Component({
  selector: 'app-access-denied',
  standalone: true,
  templateUrl: './access-denied.component.html',
  styleUrls: ['./access-denied.component.scss'],
  imports: [MatCardModule, MatIconModule, RouterModule, MatButtonModule],
})
export class AccessDeniedComponent {
  /** Title displayed in the component, defaulting to 'Access Denied'. */
  @Input() title = 'Access Denied';

  /** Subtitle displayed, defaulting to 'Unauthorized'. */
  @Input() subtitle = 'Unauthorized';

  /** Message explaining the denial, defaulting to a generic unauthorized access message. */
  @Input() message = 'Sorry, you are not authorized to access this page.';

  /** Icon to display, defaulting to 'exit_to_app'. */
  @Input() icon = 'exit_to_app';

  /**
   * Constructs the AccessDeniedComponent.
   *
   * @param location The service for interacting with the browser's URL.
   */
  constructor(private location: Location) {}

  /**
   * Navigates back to the previous page in history.
   */
  back(): void {
    this.location.back();
  }
}
