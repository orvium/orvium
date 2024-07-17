import { Component } from '@angular/core';

import { PaymentCardComponent } from '../../payment/payment-card/payment-card.component';
import { FileCardComponent } from '../../shared/file-card/file-card.component';
import { PaymentDTO } from '@orvium/api';
import { factoryPaymentDTO } from '../../shared/test-data';

@Component({
  selector: 'app-payment-card-demo',
  standalone: true,
  imports: [PaymentCardComponent, FileCardComponent],
  templateUrl: './payment-card-demo.component.html',
  styleUrls: ['./payment-card-demo.component.scss'],
})
export class PaymentCardDemoComponent {
  payments: PaymentDTO[] = [
    factoryPaymentDTO.build({ eventStatus: 'open' }),
    factoryPaymentDTO.build({ eventStatus: 'complete' }),
  ];
}
