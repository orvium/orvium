import { TestBed } from '@angular/core/testing';
import { DepositStatusInfoComponent } from './deposit-status-info.component';
import { MockRender } from 'ng-mocks';
import { DepositStatus } from '@orvium/api';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('DepositStatusInfoComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DepositStatusInfoComponent, NoopAnimationsModule],
    });
  });

  it('should create', () => {
    const fixture = MockRender(DepositStatusInfoComponent);
    fixture.detectChanges();
    expect(fixture).toBeTruthy();
  });

  it('should update status classes', () => {
    const fixture = MockRender(DepositStatusInfoComponent);
    fixture.detectChanges();
    const spy = jest.spyOn(fixture.point.componentInstance, 'setClasses');
    fixture.point.componentInstance.status = DepositStatus.Published;
    expect(spy).toHaveBeenCalled();
  });

  it('should set status classes', () => {
    const fixture = MockRender(DepositStatusInfoComponent);
    fixture.detectChanges();
    fixture.point.componentInstance.setClasses(DepositStatus.Published);
    expect(fixture.point.componentInstance.completedSteps).toEqual({
      draft: true,
      pending: true,
      preprint: true,
      published: true,
    });
    fixture.point.componentInstance.setClasses(DepositStatus.Preprint);
    expect(fixture.point.componentInstance.completedSteps).toEqual({
      draft: true,
      pending: true,
      preprint: true,
      published: false,
    });
    fixture.point.componentInstance.setClasses(DepositStatus.PendingApproval);
    expect(fixture.point.componentInstance.completedSteps).toEqual({
      draft: true,
      pending: true,
      preprint: false,
      published: false,
    });
    fixture.point.componentInstance.setClasses(DepositStatus.Draft);
    expect(fixture.point.componentInstance.completedSteps).toEqual({
      draft: true,
      pending: false,
      preprint: false,
      published: false,
    });
  });
});
