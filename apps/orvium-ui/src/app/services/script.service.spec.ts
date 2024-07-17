/* eslint-disable jest/no-done-callback */
import { TestBed } from '@angular/core/testing';
import { ScriptService } from './script.service';
import { DOCUMENT } from '@angular/common';
import { combineLatest } from 'rxjs';
// import { JSDOM } from 'jsdom';
import { catchError, timeout } from 'rxjs/operators';

// TODO there is a problem with "import { JSDOM } from 'jsdom';"
// Try to enable it back when updating jsdom or jest
describe.skip('ScriptService', () => {
  let service: ScriptService;
  let document: Document;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ScriptService,
        {
          provide: DOCUMENT,
          // useValue: new JSDOM('<!doctype html><html><body></body></html>').window.document,
        },
      ],
    });

    service = TestBed.inject(ScriptService);
    document = TestBed.inject(DOCUMENT);

    document.querySelectorAll('head script[src$="example.com"]').forEach(item => item.remove());
    document.querySelectorAll('body script[src$="example.com"]').forEach(item => item.remove());
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('loadScript', () => {
    it('should inject the script', done => {
      const scriptUrl = 'http://example.com';
      service
        .loadScript(scriptUrl)
        .pipe(
          timeout(10),
          catchError(err => {
            return [];
          })
        )
        .subscribe();
      expect(document.querySelector('head script')?.getAttribute('src')).toBe(scriptUrl);
      done();
    });

    it('should inject the script to correct target', done => {
      const scriptUrl = 'http://example.com';
      service
        .loadScript(scriptUrl, {}, 'body')
        .pipe(
          timeout(10),
          catchError(err => {
            return [];
          })
        )
        .subscribe();
      expect(document.querySelector('body script[src$="example.com"]')).not.toBeNull();
      done();
    });
  });

  describe('runScript', () => {
    it('should inject the script', done => {
      const scriptUrl = 'http://example.com';
      service
        .runScript(scriptUrl)
        .pipe(
          timeout(10),
          catchError(err => {
            return [];
          })
        )
        .subscribe();
      expect(document.querySelector('head script')?.getAttribute('src')).toBe(scriptUrl);
      done();
    });

    it('should inject the script to correct target', done => {
      const scriptUrl = 'http://example.com';
      service
        .runScript(scriptUrl, {}, 'body')
        .pipe(
          timeout(10),
          catchError(err => {
            return [];
          })
        )
        .subscribe();
      expect(document.querySelector('body script[src$="example.com"]')).not.toBeNull();
      done();
    });

    it('should inject multiple script if you call runScript multiple times', done => {
      const scriptUrl = 'http://example.com';

      combineLatest(
        service.runScript(scriptUrl, {}, 'body'),
        service.runScript(scriptUrl, {}, 'body'),
        service.runScript(scriptUrl, {}, 'body')
      )
        .pipe(
          timeout(10),
          catchError(err => {
            return [];
          })
        )
        .subscribe();
      expect(document.querySelectorAll('body script[src$="example.com"]').length).toBe(3);
      done();
    });
  });
});
