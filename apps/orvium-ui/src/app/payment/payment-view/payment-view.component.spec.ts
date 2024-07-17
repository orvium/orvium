import { MockProvider, MockRender } from 'ng-mocks';
import { RouterTestingModule } from '@angular/router/testing';
import { CheckoutSessionPaymentsDto, DefaultService } from '@orvium/api';
import { of } from 'rxjs';
import { PaymentViewComponent } from './payment-view.component';
import { factoryPaymentDTO } from '../../shared/test-data';
import { TestBed } from '@angular/core/testing';

describe('PaymentViewComponent', () => {
  const checkoutSessions: CheckoutSessionPaymentsDto[] = [
    {
      _id: '',
      payments: factoryPaymentDTO.buildList(2),
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PaymentViewComponent, RouterTestingModule],
      providers: [
        MockProvider(DefaultService, {
          getUserPayments: jest.fn().mockReturnValue(of(checkoutSessions)),
        }),
      ],
    });
  });

  it('should create', () => {
    const fixture = MockRender(PaymentViewComponent);
    expect(fixture.point.componentInstance).toBeDefined();
  });
});
