import { MockBuilder, MockRender } from 'ng-mocks';
import { FullScreenService } from './full-screen.service';
import screenfull from 'screenfull';

jest.mock('screenfull', () => {
  return {
    onchange: jest.fn(),
    toggle: jest.fn(),
    isFullscreen: false,
    isEnabled: true,
  };
});

describe('FullScreenService', () => {
  beforeEach(() => {
    return MockBuilder(FullScreenService);
  });

  it('should be created', () => {
    const fixture = MockRender(FullScreenService);
    expect(fixture.point.componentInstance).toBeTruthy();
  });

  it('should do toogle', () => {
    const fixture = MockRender(FullScreenService);
    jest.spyOn(screenfull, 'toggle');
    const div = document.createElement('div');
    div.style.width = '250px';
    div.style.height = '250px';
    fixture.point.componentInstance.setFullScreen(div);
    expect(screenfull.toggle).toHaveBeenCalledWith(div);
    expect(div.style.width).toBe('100vw');
    expect(div.style.height).toBe('100vh');
    fixture.point.componentInstance.onchangeEventHandler({} as Event);
    expect(div.style.width).toBe('250px');
    expect(div.style.height).toBe('250px');
  });
});
