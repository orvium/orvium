import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { shareReplay, take } from 'rxjs/operators';
import { DOCUMENT } from '@angular/common';

/**
 * Provides a service for dynamically loading external script files into the HTML.
 * Code service taken from https://github.com/muratcorlu/ngx-script-loader
 */
@Injectable({
  providedIn: 'root',
})
export class ScriptService {
  /**
   * Constructs the ScriptService.
   *
   * @param {Document} _document - A reference to the DOM's Document object, injected to facilitate DOM manipulations.
   */
  constructor(@Inject(DOCUMENT) private _document: Document) {}

  /**
   * An object to store and manage ongoing script loading operations to prevent duplicates.
   */
  private scriptsLoaders: Record<string, Observable<Event>> = {};

  /**
   * Loads a script dynamically into the document with optional attributes and appends it to the specified element.
   *
   * @param {string} url - The source URL of the script to load.
   * @param {Record<string, string>} [attributes] - Optional attributes to set on the script element.
   * @param {(HTMLElement | string)} [targetEl='head'] - The target element or its selector to which the script will be appended.
   * @returns {Observable<Event>} An Observable that emits the load event when the script is successfully loaded, or an error if not.
   */
  private _loadScript(
    url: string,
    attributes?: Record<string, string>,
    targetEl: HTMLElement | string = 'head'
  ): Observable<Event> {
    return new Observable<Event>(observer => {
      const script = this._document.createElement('script');

      if (attributes) {
        for (const key in attributes) {
          if (attributes.hasOwnProperty(key)) {
            script.setAttribute(key, attributes[key]);
          }
        }
      }

      script.onload = (event: Event): void => {
        observer.next(event);
        observer.complete();
      };

      script.onerror = (err): void => {
        observer.error(err);
      };

      script.src = url;

      const targetElement =
        typeof targetEl === 'string' ? this._document.querySelector(targetEl) : targetEl;
      targetElement?.appendChild(script);
    });
  }

  /**
   * Injects script from given url to target place in DOM
   * This method loads script from same url once.
   *
   * @param url Url of the external script to be loaded
   * @param attributes Attribute list to be added to the script element
   * @param targetEl Target element for the placing script tag. It can be a selector or a element reference
   */
  loadScript(
    url: string,
    attributes?: Record<string, string>,
    targetEl: HTMLElement | string = 'head'
  ): Observable<Event> {
    return (this.scriptsLoaders[url] =
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      this.scriptsLoaders[url] ||
      this._loadScript(url, attributes, targetEl).pipe(take(1), shareReplay(1)));
  }

  /**
   * Injects script from given url to target place in DOM
   * If you call this method for same url multiple times, it will inject same code to document multiple times.
   *
   * @param url Url of the external script to be loaded
   * @param attributes Attribute list to be added to the script element
   * @param targetEl Target element for the placing script tag. It can be a selector or a element reference
   */
  runScript(
    url: string,
    attributes?: Record<string, string>,
    targetEl: HTMLElement | string = 'head'
  ): Observable<Event> {
    return this._loadScript(url, attributes, targetEl);
  }
}
