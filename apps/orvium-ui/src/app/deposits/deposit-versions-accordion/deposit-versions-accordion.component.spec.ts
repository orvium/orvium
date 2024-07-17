import { TestBed } from '@angular/core/testing';

import { DepositVersionsAccordionComponent } from './deposit-versions-accordion.component';
import { MockComponent, MockRender } from 'ng-mocks';
import { ContributorLineComponent } from '../../shared/contributor-line/contributor-line.component';

describe('DepositVersionsAccordionComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DepositVersionsAccordionComponent, MockComponent(ContributorLineComponent)],
    });
  });

  it('should create', () => {
    const fixture = MockRender(DepositVersionsAccordionComponent);
    expect(fixture.point.componentInstance).toBeDefined();
    fixture.detectChanges();
    expect(fixture.point.componentInstance).toBeTruthy();
  });
});
