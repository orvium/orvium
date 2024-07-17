import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

/**
 * A standalone Angular pipe that sanitizes URLs to be safe for use in hyperlinks or other URL contexts within templates.
 * This pipe leverages Angular's security framework to bypass security checks for URLs, which is useful when binding URLs dynamically.
 */
@Pipe({
  standalone: true,
  name: 'trustUrl',
})
export class TrustUrlPipe implements PipeTransform {
  /**
   * Creates an instance of TrustUrlPipe.
   *
   * @param {DomSanitizer} sanitizer - Injects the Angular DomSanitizer service for sanitizing URLs.
   */
  constructor(private sanitizer: DomSanitizer) {}

  /**
   * Transforms the given URL into a SafeUrl, which can be safely bound to the DOM without risking XSS attacks.
   *
   * @param {string} value - The URL string to be sanitized and transformed into a SafeUrl.
   * @returns {SafeUrl} A SafeUrl object that can be safely used in the Angular templates.
   */
  public transform(value: string): SafeUrl {
    return this.sanitizer.bypassSecurityTrustUrl(value);
  }
}
