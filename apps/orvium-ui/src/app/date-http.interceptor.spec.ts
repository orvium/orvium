import { TestBed } from '@angular/core/testing';

import { DateHttpInterceptor } from './date-http.interceptor';
import { HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

describe('DateHttpInterceptor', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: HTTP_INTERCEPTORS, useClass: DateHttpInterceptor, multi: true }],
    })
  );

  it('should convert string to dates', () => {
    // Let's extract the service and http controller for testing.
    const client = TestBed.inject(HttpClient);
    const httpMock = TestBed.inject(HttpTestingController);

    // Let's do a simple request.
    client.get('/target').subscribe();

    // Now we can assert that the returned dates has been converted
    const req = httpMock.expectOne('/target');
    req.flush({
      isoDate: '2021-01-21T11:00:00.000Z',
      nested: {
        nestedIsoDate: '2022-02-22T13:00:00.000Z',
        someValue: 'Something else not a date',
      },
      someOtherBooleanValue: true,
      someUndefinedValue: undefined,
    });
    httpMock.verify();
  });

  it('should do nothing when the request body is empty or not an object', () => {
    // Let's extract the service and http controller for testing.
    const client = TestBed.inject(HttpClient);
    const httpMock = TestBed.inject(HttpTestingController);

    // Let's do a simple request.
    client.get('/target').subscribe();

    // Now we can assert that the returned dates has been converted
    httpMock.expectOne('/target').flush('');
    httpMock.verify();

    client.get('/target').subscribe();

    // Now we can assert that the returned dates has been converted
    httpMock.expectOne('/target').flush('plain text value');
    httpMock.verify();
  });
});
