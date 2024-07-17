import { TestBed } from '@angular/core/testing';

import { LocalStorageService } from './local-storage.service';

describe('StorageService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    const service = TestBed.inject(LocalStorageService);
    expect(service).toBeDefined();
  });

  it('should add, remove and clear localstorage', () => {
    const service = TestBed.inject(LocalStorageService);
    service.write('key1', 'value1');
    expect(service.read('key1')).toBe('value1');
    service.remove('key1');
    expect(service.read('key1')).toBe(null);

    service.write('key1', 'value1');
    service.write('key2', 'value2');
    expect(service.read('key2')).toBe('value2');

    service.clear();
    expect(service.read('key1')).toBe(null);
    expect(service.read('key2')).toBe(null);
  });
});
