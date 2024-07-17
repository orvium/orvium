import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * An HTTP interceptor that converts string dates in ISO 8601 format within the response body to JavaScript Date objects.
 */
@Injectable()
export class DateHttpInterceptor implements HttpInterceptor {
  /**
   * Migrated from AngularJS https://raw.githubusercontent.com/Ins87/angular-date-interceptor/master/src/angular-date-interceptor.js
   */

  /** Regular expression to identify ISO 8601 date strings. */
  iso8601 = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?(([+-]\d\d:\d\d)|Z)?$/;

  /**
   * Method that intercepts and handles an HttpRequest or HttpResponse.
   * It modifies the HttpResponse to convert any ISO 8601 date strings in the body to Date objects.
   *
   * @param {HttpRequest<unknown>} request - The outgoing request object to handle.
   * @param {HttpHandler} next - The next interceptor in the chain, or the final handler.
   * @returns {Observable<HttpEvent<unknown>>} An observable of the HTTP event stream.
   */
  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      map(response => {
        if (response instanceof HttpResponse) {
          response = response.clone({
            body: this.convertToDate(response.body),
          });
        }
        return response;
      })
    );
  }
  /**
   * Converts date strings within an object to JavaScript Date objects if they match the ISO 8601 format.
   *
   * @param {unknown} body - The HTTP response body that may contain date strings.
   * @returns {unknown} The modified body with date strings converted to Date objects.
   */
  convertToDate(body: unknown): unknown {
    if (!body) {
      return body;
    }

    if (typeof body !== 'object') {
      return body;
    }

    for (const [key, value] of Object.entries(body)) {
      if (this.isIso8601(value) && body.hasOwnProperty(key)) {
        // @ts-expect-error
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        body[key] = new Date(value);
      } else if (typeof value === 'object') {
        // @ts-expect-error
        body[key] = this.convertToDate(value);
      }
    }
    return body;
  }

  /**
   * Determines whether a value is a string in ISO 8601 date format.
   *
   * @param {unknown} value - The value to test.
   * @returns {boolean} True if the value is a string matching the ISO 8601 date format, otherwise false.
   */
  isIso8601(value: unknown): boolean {
    if (!value) {
      return false;
    }

    if (typeof value === 'string') {
      return this.iso8601.test(value);
    }
    return false;
  }
}
