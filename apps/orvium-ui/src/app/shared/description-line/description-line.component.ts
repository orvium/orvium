import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * A component that displays a line with optional avatar, title, and subtitle,
 * often used to describe a community or a content item within the application.
 */
@Component({
  selector: 'app-description-line',
  standalone: true,
  templateUrl: './description-line.component.html',
  styleUrls: ['./description-line.component.scss'],
  imports: [RouterLink],
})
export class DescriptionLineComponent {
  /** Optional URL for the avatar image to display. */
  @Input() avatar?: string;

  /** Optional identifier for the community, used to link to community-specific views or actions. */
  @Input() communityId?: string;

  /** Optional title text to display, can be used to describe the associated community or content. */
  @Input() title?: string;

  /** Optional subtitle text to provide additional context about the community or content. */
  @Input() subtitle?: string;
}
