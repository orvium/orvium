import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentCardDemoComponent } from './payment-card-demo.component';

describe('PaymentCardDemoComponent', () => {
  let component: PaymentCardDemoComponent;
  let fixture: ComponentFixture<PaymentCardDemoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PaymentCardDemoComponent],
    });
    fixture = TestBed.createComponent(PaymentCardDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
