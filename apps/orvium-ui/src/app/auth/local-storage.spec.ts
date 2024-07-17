import { TestBed } from '@angular/core/testing';
import { LocalStorage } from './local-storage';

describe('AuthGuardService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [LocalStorage],
    });
  });

  it('should be created', () => {
    const service = TestBed.inject(LocalStorage);
    expect(service).toBeDefined();
  });

  it('should activate when user is authenticated', () => {
    const localStorage = TestBed.inject(LocalStorage);

    localStorage.write('key1', 'value1');
    expect(localStorage.read('key1')).toBe('value1');
    localStorage.remove('key1');
    expect(localStorage.read('key1')).toBe(null);

    localStorage.write('key1', 'value1');
    localStorage.write('key2', 'value2');
    expect(localStorage.read('key2')).toBe('value2');

    localStorage.clear();
    expect(localStorage.read('key1')).toBe(null);
    expect(localStorage.read('key2')).toBe(null);
  });
});
