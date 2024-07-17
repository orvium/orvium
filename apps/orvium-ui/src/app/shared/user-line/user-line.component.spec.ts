import { TestBed } from '@angular/core/testing';

import { UserLineComponent } from './user-line.component';
import { MockRender } from 'ng-mocks';
import { factoryUserSummaryDTO } from '../test-data';
import { RouterTestingModule } from '@angular/router/testing';

describe('UserLineComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [UserLineComponent, RouterTestingModule],
    });
  });

  it('should create', () => {
    const fixture = MockRender(UserLineComponent, { user: factoryUserSummaryDTO.build() });
    fixture.detectChanges();
    expect(fixture.point.componentInstance).toBeTruthy();
  });
});
