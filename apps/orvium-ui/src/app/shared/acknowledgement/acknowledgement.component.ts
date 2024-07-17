import { Component, Input } from '@angular/core';

/**
 * Component to display an HTML content acknowledgement.
 */
@Component({
  selector: 'app-acknowledgement',
  standalone: true,
  templateUrl: './acknowledgement.component.html',
  styleUrls: ['./acknowledgement.component.scss'],
  imports: [],
})
export class AcknowledgementComponent {
  /** HTML content to be displayed as an acknowledgement. */
  @Input() acknowledgementHTML?: string;
}
