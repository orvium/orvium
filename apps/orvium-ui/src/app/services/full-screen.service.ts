import { Injectable } from '@angular/core';
import screenfull from 'screenfull';

/**
 * Provides a service to toggle fullscreen mode for specified HTML elements within an Angular application.
 * It leverages the `screenfull.js` library to manage fullscreen state changes and ensure compatibility
 * across different browsers and devices.
 */
@Injectable({
  providedIn: 'root',
})
export class FullScreenService {
  /** Currently targeted HTML element for fullscreen mode. */
  currentHtmlElement!: HTMLElement;

  /** Stores the previous size of the HTML element before entering fullscreen mode. */
  previousSize = { width: '100%', height: '100%' };

  /**
   * Initializes the service and sets up an event listener for fullscreen changes using `screenfull.onchange`.
   */
  constructor() {
    screenfull.onchange(event => this.onchangeEventHandler(event));
  }

  /**
   * Event handler for fullscreen change events. Restores the HTML element's size when exiting fullscreen.
   * @param {Event} event - The event object provided by the fullscreen change.
   */
  onchangeEventHandler(event: Event): void {
    if (!screenfull.isFullscreen) {
      this.currentHtmlElement.style.width = this.previousSize.width;
      this.currentHtmlElement.style.height = this.previousSize.height;
    }
  }

  /**
   * Attempts to toggle fullscreen mode for the provided HTML element.
   * If fullscreen is enabled, it will save the current size of the element, set it to fullscreen, and manage the toggle.
   * If fullscreen is not available, a console warning will be issued.
   *
   * @param {HTMLElement} htmlElement - The HTML element to be displayed in fullscreen.
   */
  setFullScreen(htmlElement: HTMLElement): void {
    if (screenfull.isEnabled) {
      this.currentHtmlElement = htmlElement;
      console.log('current', this.currentHtmlElement);
      this.previousSize = {
        width: this.currentHtmlElement.style.width,
        height: this.currentHtmlElement.style.height,
      };
      this.currentHtmlElement.style.width = '100vw';
      this.currentHtmlElement.style.height = '100vh';
      void screenfull.toggle(htmlElement);
    }
  }
}
