import { ThousandConversorPipe } from './thousand-conversor.pipe';

describe('ThousandConversorPipe', () => {
  const pipe = new ThousandConversorPipe();

  it('separator', () => {
    expect(pipe.transform(1500)).toBe('1.5k');
    expect(pipe.transform(1000)).toBe('1k');
    expect(pipe.transform(1530001)).toBe('1.53M');
    expect(pipe.transform(150)).toBe('150');
  });
});
