import { SeparatorPipe } from './separator.pipe';

describe('separator', () => {
  const pipe = new SeparatorPipe();

  it('joins with ,', () => {
    expect(pipe.transform(['Esto', 'es', 'un', 'test'], ',')).toBe('Esto, es, un, test');
  });

  it('joins with -', () => {
    expect(pipe.transform(['Esto', 'es', 'un', 'test'], '-')).toBe('Esto- es- un- test');
  });
});
