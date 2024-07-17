import '@angular/localize/init';
import 'jest-preset-angular/setup-jest';
import 'jest-localstorage-mock';
import { ngMocks } from 'ng-mocks';
import { TextDecoder, TextEncoder } from 'util';

ngMocks.autoSpy('jest');

// @ts-ignore
global.TextEncoder = TextEncoder;
// @ts-ignore
global.TextDecoder = TextDecoder;
// @ts-ignore
global.fetch = require('node-fetch');
