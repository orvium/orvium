import { DateAgoPipe } from './date-ago.pipe';

describe('date-ago', () => {
  const pipe = new DateAgoPipe();

  it('shoud be just now ,', () => {
    expect(pipe.transform(Date.now())).toBe('Just now');
  });

  it('shoud be a year ago ,', () => {
    const date = new Date();
    const yearAgo = date.setDate(date.getDate() - 366);
    expect(pipe.transform(yearAgo)).toBe('1 year');
  });

  it('shoud be 2 years ,', () => {
    const date = new Date();
    const yearAgo = date.setDate(date.getDate() - 366 * 2);
    expect(pipe.transform(yearAgo)).toBe('2 years');
  });
});
