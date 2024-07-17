import { TestBed } from '@angular/core/testing';

import { SearchBoxComponent } from './search-box.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockRender } from 'ng-mocks';
import { DepositStatus } from '@orvium/api';

describe('SearchBoxComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SearchBoxComponent, NoopAnimationsModule],
    });
  });

  it('should create', () => {
    const fixture = MockRender(SearchBoxComponent);
    expect(fixture.point.componentInstance).toBeTruthy();
  });

  it('should searchPapers', () => {
    const fixture = MockRender(SearchBoxComponent);
    const spy = jest.spyOn(fixture.point.componentInstance.search, 'emit');
    fixture.point.componentInstance.searchPapers();
    expect(spy).toHaveBeenCalled();
  });

  it('should set params', () => {
    const fixture = MockRender(SearchBoxComponent);
    fixture.point.componentInstance.setCurrentQueryParams({
      status: DepositStatus.PendingApproval,
    });

    expect(fixture.point.componentInstance.searchFormGroup.controls.status.value).toBe(
      DepositStatus.PendingApproval
    );
  });
});
