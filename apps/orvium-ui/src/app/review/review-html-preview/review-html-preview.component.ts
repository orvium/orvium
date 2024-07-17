import { Component, Input } from '@angular/core';

/**
 * Component for displaying a preview of review content in HTML format.
 * Used to show how review content will appear before final submission or display.
 */
@Component({
  selector: 'app-review-html-preview',
  standalone: true,
  imports: [],
  templateUrl: './review-html-preview.component.html',
  styleUrls: ['./review-html-preview.component.scss'],
})
export class ReviewHtmlPreviewComponent {
  /** HTML content of the review to be previewed. The HTML content is passed to this component to display. */
  @Input() reviewPreviewHtml?: string;
}
