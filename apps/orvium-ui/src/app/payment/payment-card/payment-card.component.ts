import { DatePipe, TitleCasePipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { PaymentDTO } from '@orvium/api';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { DescriptionLineComponent } from '../../shared/description-line/description-line.component';
import { MatChipsModule } from '@angular/material/chips';

/**
 * Component that displays payment information in a card layout. It is used to present details of a payment
 * such as the amount, date, recipient, etc., in a structured and stylized manner.
 */
@Component({
  selector: 'app-payment-card',
  standalone: true,
  templateUrl: './payment-card.component.html',
  styleUrls: ['./payment-card.component.scss'],
  imports: [
    DatePipe,
    MatCardModule,
    MatButtonModule,
    TitleCasePipe,
    MatDividerModule,
    MatIconModule,
    MatRippleModule,
    DescriptionLineComponent,
    MatChipsModule,
  ],
})
export class PaymentCardComponent {
  /** The payment data that will be displayed in the cardas a DTO */
  @Input({ required: true }) payment!: PaymentDTO;
}
