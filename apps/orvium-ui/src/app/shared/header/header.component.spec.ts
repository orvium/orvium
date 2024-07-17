import { HeaderComponent } from './header.component';
import { MockRender } from 'ng-mocks';
import { factoryCommunityPopulatedDTO } from '../test-data';
import { TestBed } from '@angular/core/testing';

describe('HeaderComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HeaderComponent],
    });
  });

  it('should create', () => {
    const fixture = MockRender(HeaderComponent, {
      community: factoryCommunityPopulatedDTO.build(),
    });
    expect(fixture.point.componentInstance).toBeDefined();
    fixture.detectChanges();
    expect(fixture.point.componentInstance).toBeTruthy();
  });
});
