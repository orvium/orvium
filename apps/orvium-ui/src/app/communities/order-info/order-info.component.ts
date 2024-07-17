import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  CommunityPopulatedDTO,
  CommunityPrivateDTO,
  DefaultService,
  StripeLineItem,
} from '@orvium/api';
import { assertIsDefined } from '../../shared/shared-functions';
import { MatButtonModule } from '@angular/material/button';
import { DescriptionLineComponent } from '../../shared/description-line/description-line.component';
import { InfoToolbarComponent } from '../../shared/info-toolbar/info-toolbar.component';
import { CurrencyPipe, UpperCasePipe } from '@angular/common';
import { finalize } from 'rxjs/operators';
import { OverlayLoadingDirective } from '../../spinner/overlay-loading.directive';
import { MatIconModule } from '@angular/material/icon';
import { ContributorLineComponent } from '../../shared/contributor-line/contributor-line.component';
import { ListWrapperComponent } from '../../shared/list-wrapper/list-wrapper.component';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';

/**
 * Component responsible for displaying order details after a Stripe checkout session is completed.
 * It fetches the community details and order information using the Stripe session ID from the query parameters.
 */
@Component({
  selector: 'app-order-info',
  standalone: true,
  templateUrl: './order-info.component.html',
  styleUrls: ['./order-info.component.scss'],
  imports: [
    MatButtonModule,
    MatIconModule,
    RouterLink,
    DescriptionLineComponent,
    InfoToolbarComponent,
    UpperCasePipe,
    CurrencyPipe,
    OverlayLoadingDirective,
    ContributorLineComponent,
    ListWrapperComponent,
    MatDividerModule,
    MatFormFieldModule,
    MatOptionModule,
    MatSelectModule,
    MatTooltipModule,
  ],
})
export class OrderInfoComponent implements OnInit {
  /** List of line items in the Stripe order. */
  itemsList: StripeLineItem[] = [];

  /** Total price of all items in the order. */
  totalPrice = 0;

  /** Currency used for the order's prices. */
  currency = '';

  /** The community ID derived from the route parameters, used to fetch community-specific data. */
  communityId: string;

  /** Community data loaded based on the community ID. It can be either populated or private DTO. */
  community?: CommunityPopulatedDTO | CommunityPrivateDTO;

  /** Indicates if the page is currently loading data. */
  pageLoading = false;

  /**
   * Initializes a new instance of the OrderInfoComponent with necessary dependency injections.
   *
   * @param {ActivatedRoute} route - The active route that allows you to retrieve parameters and query params.
   * @param {DefaultService} apiService - Service for API calls to fetch community and order data.
   */
  constructor(
    private route: ActivatedRoute,
    private apiService: DefaultService
  ) {
    this.communityId = this.route.snapshot.paramMap.get('communityId') || '';
  }

  /**
   * Lifecycle hook that is called after data-bound properties are initialized. Fetches community and order data.
   */
  ngOnInit(): void {
    this.pageLoading = true;
    this.apiService.getCommunity({ id: this.communityId }).subscribe(community => {
      this.community = community;
    });

    const stripeSessionId = this.route.snapshot.queryParamMap.get('session_id');
    assertIsDefined(stripeSessionId, 'Invalid stripe session id');

    //Here is the: [stripe.checkout.session] status --> complete
    this.apiService
      .getSuccessInfo({ sessionId: stripeSessionId, communityId: this.communityId })
      .pipe(
        finalize(() => {
          this.pageLoading = false;
        })
      )
      .subscribe(result => {
        this.itemsList = result;
        this.currency = result[0].currency.toUpperCase();
        this.totalPrice = result.reduce((accumulator, object) => {
          return accumulator + object.amount_total;
        }, 0);
      });
  }

  /**
   * Retrieves the unit amount for a given item, handling potential data structure differences.
   *
   * @param {StripeLineItem} item - The item for which to retrieve the unit amount.
   * @returns {number} The unit amount of the item.
   */
  getItemUnitAmount(item: StripeLineItem): number {
    if (item.price.hasOwnProperty('unit_amount')) {
      // @ts-expect-error
      return item.price.unit_amount as number;
    } else {
      return 0;
    }
  }
}
