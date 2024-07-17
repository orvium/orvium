import { DepositCardComponent } from './deposit-card.component';
import { MockProvider, MockRender } from 'ng-mocks';
import { of } from 'rxjs';
import { DialogService } from '../../dialogs/dialog.service';
import { factoryDepositPopulatedDTO, factoryReviewPopulatedDTO } from '../../shared/test-data';
import { TestBed } from '@angular/core/testing';
import { BreakpointObserver } from '@angular/cdk/layout';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { InviteService } from '../../services/invite.service';
import { ReviewStatus } from '@orvium/api';

describe('DepositCardComponent', () => {
  const deposit = factoryDepositPopulatedDTO.build();
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DepositCardComponent, RouterTestingModule, NoopAnimationsModule],
      providers: [
        MockProvider(BreakpointObserver, {
          observe: jest.fn().mockReturnValue(of({ matches: false, breakpoints: {} })),
        }),
        MockProvider(DialogService),
        MockProvider(InviteService),
      ],
    });
  });

  it('should create', () => {
    const params = { deposit: deposit };
    const fixture = MockRender(DepositCardComponent, params);
    expect(fixture.point.componentInstance).toBeDefined();
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should create with reviews published', () => {
    const params = {
      deposit: factoryDepositPopulatedDTO.build({
        peerReviewsPopulated: [factoryReviewPopulatedDTO.build({ status: ReviewStatus.Published })],
      }),
    };
    const fixture = MockRender(DepositCardComponent, params);
    expect(fixture.point.componentInstance).toBeDefined();
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should emit star event', () => {
    const params = { deposit: deposit };
    const fixture = MockRender(DepositCardComponent, params);
    const spy = jest.spyOn(fixture.point.componentInstance.starDeposit, 'emit');
    fixture.point.componentInstance.star();
    expect(spy).toHaveBeenCalled();
  });

  it('should emit review event', () => {
    const params = { deposit: deposit };
    const fixture = MockRender(DepositCardComponent, params);
    const spy = jest.spyOn(fixture.point.componentInstance.createReview, 'emit');
    fixture.point.componentInstance.review();
    expect(spy).toHaveBeenCalled();
  });
});
