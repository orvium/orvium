import { Component, DestroyRef, inject, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { concatMap, finalize, map } from 'rxjs/operators';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { DefaultService, DepositPopulatedDTO } from '@orvium/api';
import { SeoTagsService } from '../../services/seo-tags.service';
import { environment } from '../../../environments/environment';
import { SearchBoxComponent } from '../../shared/search-box/search-box.component';

import { DepositsListComponent } from '../../deposits/deposits-list/deposits-list.component';
import { OverlayLoadingDirective } from '../../spinner/overlay-loading.directive';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

/**
 * Component responsible for displaying and handling search operations for deposits.
 * It integrates various components like search box and deposits list to facilitate user interactions.
 */
@Component({
  selector: 'app-search',
  standalone: true,
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
  imports: [SearchBoxComponent, DepositsListComponent, MatPaginatorModule, OverlayLoadingDirective],
})
export default class SearchComponent implements OnInit, OnDestroy {
  /** Contains the list of deposits fetched based on the search criteria as DTOs */
  deposits: DepositPopulatedDTO[] = [];

  /** Stores the total number of deposits that match the current search criteria. */
  totalDeposits = 0;

  /** Represents the current search query string, may be null if no query is present. */
  query?: string | null;

  /** Represents the filter status applied to the search, may be null if no status filter is applied. */
  status?: string | null;

  /** Represents the current page index in the paginator. */
  pageIndex = 0;

  /** Indicates if the search is currently being performed and results are being loaded. */
  loadingSearch = true;

  /** Used for managing the cleanup of subscriptions and avoiding memory leaks. */
  private destroyRef = inject(DestroyRef);

  /**
   * Constructs an instance of the SearchComponent.
   *
   * @param {SeoTagsService} seoTagsService - Service to manage SEO tags.
   * @param {ActivatedRoute} route - The active route that allows access to the route parameters.
   * @param {Router} router - Router service to navigate to different routes.
   * @param {DefaultService} apiService - API service for performing backend operations related to deposits.
   */
  constructor(
    private seoTagsService: SeoTagsService,
    private route: ActivatedRoute,
    private router: Router,
    private apiService: DefaultService
  ) {}

  /**
   * Initializes component and sets SEO tags. It also starts a subscription to route parameters to fetch
   * deposits based on query parameters like query, status, page, and discipline.
   */
  ngOnInit(): void {
    this.seoTagsService.setGeneralSeo(
      'Search Publications',
      'Find Open Access publications in Orvium'
    );
    this.seoTagsService.setOpengraphTags(
      'Search Publications',
      'Find Open Access publications in Orvium',
      environment.publicUrl + this.router.url
    );
    this.route.queryParamMap
      .pipe(
        map(params => {
          const query = params.get('query') ?? '';
          this.query = query;
          const status = params.get('status') ?? '';
          const page = parseInt(params.get('page') ?? '0', 10);
          const discipline = params.get('discipline') ?? '';
          this.pageIndex = page;
          return { query, status, page, discipline };
        }),
        concatMap(queryParams =>
          this.apiService
            .getDeposits({
              query: queryParams.query,
              discipline: queryParams.discipline,
              // @ts-expect-error
              status: queryParams.status,
              page: queryParams.page,
            })
            .pipe(
              finalize(() => {
                this.loadingSearch = false;
              })
            )
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(depositsQueryResponse => {
        this.loadingSearch = true;
        this.deposits = depositsQueryResponse.deposits;
        this.totalDeposits = depositsQueryResponse.count;
      });
  }

  /**
   * Removes SEO tags when the component is destroyed and cleans up the subscription to avoid memory leaks.
   */
  ngOnDestroy(): void {
    this.seoTagsService.removeTagsAndCanonical();
  }

  /**
   * Handles page events from pagination to navigate to the correct page of search results while retaining existing query parameters.
   *
   * @param $event - PageEvent containing information about the new page index and size.
   */

  paginate($event: PageEvent): void {
    const params: Params = {
      page: $event.pageIndex,
      size: $event.pageSize,
    };
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'merge',
    });
  }

  /**
   * Initiates a new search based on the current query and status stored in the component's state and navigates to the updated URL.
   */
  searchPapers(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        query: this.query,
        status: this.status,
        size: 10,
      },
      queryParamsHandling: 'merge',
    });
  }

  /**
   * Updates the search parameters based on selected filters and initiates a new search by calling `searchPapers()`.
   *
   * @param $event - An object containing the new query and status as key-value pairs.
   */
  filterPublications($event: Record<string, unknown>): void {
    this.query = $event['query'] as string | null;
    this.status = $event['status'] as string | null;
    this.searchPapers();
  }
}
