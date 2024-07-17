import { Component, Input, OnInit } from '@angular/core';
import { animate, state, style, transition, trigger } from '@angular/animations';

import { MatButtonModule } from '@angular/material/button';

/**
 * Component to show more or less of a text content.
 */
@Component({
  selector: 'app-show-more',
  standalone: true,
  templateUrl: './show-more.component.html',
  styleUrls: ['./show-more.component.scss'],
  animations: [
    trigger('openClose', [
      state('false', style({})),
      state('true', style({})),
      transition('false <=> true', [
        style({ opacity: 0.2 }),
        animate('1s ease', style({ opacity: 1 })),
      ]),
    ]),
  ],
  imports: [MatButtonModule],
})
export class ShowMoreComponent implements OnInit {
  /** The text content to be shown or hidden. */
  @Input() text = '';

  /** Flag indicating whether the text is expanded or not. */
  @Input() expanded = false;

  /** The number of words to display when the text is not expanded. */
  @Input() truncateLength = 50;

  /** The text content to be displayed. */
  displayText = '';

  /** Flag indicating whether to show the "Show More/Less" buttons. */
  showButtons = false;

  /** Array of words from the input text. */
  inputWords: string[] = [];

  /**
   * Initializes the component and sets the display text based on the input text and truncate length.
   */
  ngOnInit(): void {
    this.inputWords = this.text.split(' ');
    if (this.inputWords.length > this.truncateLength) {
      this.showButtons = true;
    }

    if (this.showButtons && !this.expanded) {
      this.displayText = this.inputWords.slice(0, this.truncateLength).join(' ') + '...';
    } else {
      this.displayText = this.text;
    }
  }

  /**
   * Toggles the expanded state of the text and updates the display text accordingly.
   */
  readMore(): void {
    this.expanded = !this.expanded;
    if (this.expanded) {
      this.displayText = this.text;
    } else {
      this.displayText = this.inputWords.slice(0, this.truncateLength).join(' ') + '...';
    }
  }
}
