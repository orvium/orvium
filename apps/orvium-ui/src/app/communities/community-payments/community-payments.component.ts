import { Component, DestroyRef, inject, OnInit, ViewChild } from '@angular/core';

import { AccessDeniedComponent } from '../../shared/access-denied/access-denied.component';
import { concatMap, finalize, map } from 'rxjs/operators';
import { isNotNullOrUndefined } from '../../shared/shared-functions';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  CommunityPopulatedDTO,
  DefaultService,
  DepositStatus,
  PaginationLimit,
  PaymentQueryDTO,
} from '@orvium/api';
import { InfoToolbarComponent } from '../../shared/info-toolbar/info-toolbar.component';
import { CommunityService, ICommunityActions } from '../community.service';
import { OverlayLoadingDirective } from '../../spinner/overlay-loading.directive';
import { PaymentCardComponent } from '../../payment/payment-card/payment-card.component';
import { Title } from '@angular/platform-browser';
import { ButtonsMenuComponent } from '../../buttons-menu/buttons-menu.component';
import { DescriptionLineComponent } from '../../shared/description-line/description-line.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PaymentViewComponent } from '../../payment/payment-view/payment-view.component';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { SearchBoxComponent } from '../../shared/search-box/search-box.component';

/**
 * Component for managing community payments, including viewing and filtering payments.
 * Integrates with various UI components like paginators and search boxes to facilitate user interaction.
 */
@Component({
  selector: 'app-community-payments',
  standalone: true,
  imports: [
    AccessDeniedComponent,
    InfoToolbarComponent,
    OverlayLoadingDirective,
    PaymentCardComponent,
    ButtonsMenuComponent,
    DescriptionLineComponent,
    MatButtonModule,
    MatIconModule,
    RouterLink,
    PaymentViewComponent,
    MatPaginatorModule,
    SearchBoxComponent,
  ],
  templateUrl: './community-payments.component.html',
  styleUrls: ['./community-payments.component.scss'],
})
export class CommunityPaymentsComponent implements OnInit {
  /**
   * Paginator for managing pagination of payment data.
   */
  @ViewChild('paymentPaginator') paymentPaginator?: MatPaginator;

  /**
   * Search box component for filtering payment data.
   */
  @ViewChild('searchboxPayments') paymentSearchBox?: SearchBoxComponent;

  /**
   * Reference to manage component lifecycle and destroy subscriptions.
   */
  private destroyRef = inject(DestroyRef);

  /**
   * Indicates if the payment data is currently being loaded.
   */
  loadingPayments = true;

  /**
   * Community data retrieved from the API.
   */
  community!: CommunityPopulatedDTO;

  /**
   * Available actions on the community based on user permissions.
   */
  communityActions: ICommunityActions = {
    update: false,
    submit: false,
    moderate: false,
  };

  /**
   * Current state of payment data including pagination and count.
   */
  paymentQuery: PaymentQueryDTO = {
    payments: [],
    count: 0,
  };

  constructor(
    private route: ActivatedRoute,
    private apiService: DefaultService,
    private communityService: CommunityService,
    private titleService: Title
  ) {}

  /**
   * Initializes the component, sets the page title, and fetches community details and payment data.
   */
  ngOnInit(): void {
    this.titleService.setTitle('Community Payments');
    this.route.paramMap
      .pipe(
        map(params => params.get('communityId')),
        isNotNullOrUndefined(),
        concatMap(communityId =>
          this.apiService.getCommunity({ id: communityId }).pipe(
            finalize(() => {
              this.loadingPayments = false;
            })
          )
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(community => {
        this.community = community;
        this.communityActions = this.communityService.getCommunityActions(this.community);
        this.filterPayments();
      });
  }

  /**
   * Triggers re-filtering of payment data based on current pagination settings.
   */
  paginatePayments(): void {
    this.filterPayments();
  }

  /**
   * Deposit status
   */
  protected readonly DepositStatus = DepositStatus;

  /**
   * Filters and fetches payment data based on current search and pagination settings.
   */
  filterPayments(): void {
    this.loadingPayments = true;
    const page = this.paymentPaginator?.pageIndex ?? 0;
    const limit =
      this.paymentPaginator?.pageSize === 25 ? PaginationLimit._25 : PaginationLimit._10;
    const queryParams = this.paymentSearchBox?.getCurrentQueryParams();
    this.apiService
      .getCommunityPayments({
        communityId: this.community._id,
        page,
        limit,
        query: queryParams?.query,
        paymentStatus: queryParams?.paymentStatus,
      })
      .pipe(finalize(() => (this.loadingPayments = false)))
      .subscribe(res => {
        this.paymentQuery = res;
      });
  }

  searchPayments(): void {
    this.filterPayments();
  }
}
