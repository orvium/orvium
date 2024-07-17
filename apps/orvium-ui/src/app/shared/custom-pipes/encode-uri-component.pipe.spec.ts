import { EncodeURIComponentPipe } from './encode-uri-component.pipe';

describe('EncodeURIComponentPipe', () => {
  let pipe: EncodeURIComponentPipe;

  beforeEach(() => {
    pipe = new EncodeURIComponentPipe();
  });

  it('Should return the value encoded', () => {
    const url = 'https://example.com';
    expect(pipe.transform(url)).toEqual(encodeURIComponent(url));
  });
});
