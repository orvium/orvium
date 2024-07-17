import { PaymentCardComponent } from './payment-card.component';
import { MockRender } from 'ng-mocks';
import { factoryPaymentDTO } from '../../shared/test-data';
import { TestBed } from '@angular/core/testing';

describe('PaymentCardComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PaymentCardComponent],
      providers: [],
    });
  });

  it('should create', () => {
    const fixture = MockRender(PaymentCardComponent, { payment: factoryPaymentDTO.build() });
    expect(fixture.point.componentInstance).toBeDefined();
  });
});
