import { TestBed } from '@angular/core/testing';

import { SearchBarComponent } from './search-bar.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockRender, ngMocks } from 'ng-mocks';

describe('SearchBarComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchBarComponent, NoopAnimationsModule],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = MockRender(SearchBarComponent);
    expect(fixture.point.componentInstance).toBeTruthy();
  });

  it('should trigger event', () => {
    const fixture = MockRender(SearchBarComponent);
    const input = ngMocks.find(fixture, 'input');
    ngMocks.change(input, 'my input value');
    fixture.detectChanges();
    expect(fixture.point.componentInstance).toBeTruthy();
  });
});
