import { TestBed } from '@angular/core/testing';

import { ShareMediaComponent } from './share-media.component';
import { MockRender } from 'ng-mocks';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { FontAwesomeTestingModule } from '@fortawesome/angular-fontawesome/testing';

describe('ShareMediaComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ShareMediaComponent, MatIconTestingModule, FontAwesomeTestingModule],
    });
  });

  it('should create', () => {
    const fixture = MockRender(ShareMediaComponent);
    expect(fixture.point.componentInstance).toBeDefined();
  });
});
