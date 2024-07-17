import { Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { DefaultService, PaymentDTO } from '@orvium/api';
import { PaymentCardComponent } from '../payment-card/payment-card.component';

/**
 * Component that provides a view layer for displaying user payment details.
 */
@Component({
  selector: 'app-payment-view',
  standalone: true,
  templateUrl: './payment-view.component.html',
  styleUrls: ['./payment-view.component.scss'],
  imports: [PaymentCardComponent, MatIconModule],
})
export class PaymentViewComponent implements OnInit {
  /** An array of user's payments to be displayed. Each payment is a `PaymentDTO` object */
  userPayments: PaymentDTO[] = [];

  /**
   * Constructs a new instance of PaymentViewComponent.
   *
   * @param apiService The service used to fetch user payment data from a backend server.
   */
  constructor(private apiService: DefaultService) {}

  /**
   * Fetches payment data for the user when the component is initialized. This method subscribes to the `getUserPayments`
   * observable provided by `apiService` and updates the component's `userPayments` array with the most recent payment
   * from each set of payment transactions retrieved.
   */
  ngOnInit(): void {
    this.apiService.getUserPayments().subscribe(userPayments => {
      this.userPayments = userPayments.map(
        e => e.payments.sort((a, b) => a.date.getTime() - b.date.getTime())[e.payments.length - 1]
      );
    });
  }
}
