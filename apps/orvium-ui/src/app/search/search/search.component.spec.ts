import SearchComponent from './search.component';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of } from 'rxjs';
import { factoryDepositPopulatedDTO } from '../../shared/test-data';
import { MockComponent, MockProvider, MockRender, ngMocks } from 'ng-mocks';
import { TestBed } from '@angular/core/testing';
import { DefaultService } from '@orvium/api';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { SeoTagsService } from '../../services/seo-tags.service';
import { DepositsListComponent } from '../../deposits/deposits-list/deposits-list.component';
import { SearchBoxComponent } from '../../shared/search-box/search-box.component';
import { MatPaginator, PageEvent } from '@angular/material/paginator';

describe('SearchComponent', () => {
  const depositsQuery = { deposits: factoryDepositPopulatedDTO.buildList(5), count: 15 };
  let routeSnapshot: { queryParamMap: unknown };

  beforeEach(() => {
    routeSnapshot = {
      queryParamMap: of(
        convertToParamMap({
          query: 'science',
          status: null,
          page: 1,
        })
      ),
    };

    TestBed.configureTestingModule({
      imports: [
        SearchComponent,
        HttpClientTestingModule,
        MockComponent(DepositsListComponent),
        MockComponent(SearchBoxComponent),
      ],
      providers: [
        MockProvider(DefaultService, {
          getDeposits: jest.fn().mockReturnValue(of(depositsQuery)),
        }),
        { provide: ActivatedRoute, useValue: routeSnapshot },
        MockProvider(SeoTagsService),
      ],
    });
  });

  it('should create', () => {
    const fixture = MockRender(SearchComponent);
    fixture.detectChanges();
    expect(fixture.point.componentInstance).toBeDefined();
    fixture.detectChanges();
    expect(fixture.point.componentInstance).toBeTruthy();
  });

  it('should create with no query param', () => {
    routeSnapshot.queryParamMap = of(
      convertToParamMap({
        query: undefined,
        status: null,
        page: undefined,
      })
    );

    const fixture = MockRender(SearchComponent);
    fixture.detectChanges();
    expect(fixture.point.componentInstance).toBeDefined();
    fixture.detectChanges();
    expect(fixture.point.componentInstance).toBeTruthy();
  });

  it('should paginate', () => {
    const fixture = MockRender(SearchComponent);
    fixture.detectChanges();
    expect(fixture.point.componentInstance.pageIndex).toBe(1);
    const paginator = ngMocks.find<MatPaginator>('mat-paginator');
    expect(paginator.componentInstance.length).toBe(15);
    expect(paginator.componentInstance.pageSize).toBe(10);
    const router = fixture.point.injector.get(Router);
    const route = fixture.point.injector.get(ActivatedRoute);
    const navigateSpy = jest.spyOn(router, 'navigate').mockImplementation();
    const event: PageEvent = { previousPageIndex: 1, pageIndex: 2, pageSize: 10, length: 25 };
    fixture.detectChanges();
    fixture.point.componentInstance.paginate(event);
    fixture.detectChanges();
    expect(navigateSpy).toHaveBeenCalledWith([], {
      relativeTo: route,
      queryParams: {
        page: 2,
        size: 10,
      },
      queryParamsHandling: 'merge',
    });
  });

  it('should search', () => {
    const fixture = MockRender(SearchComponent);
    fixture.detectChanges();
    const router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockImplementation();
    fixture.point.componentInstance.searchPapers();
    fixture.detectChanges();
    expect(router.navigate).toHaveBeenCalled();
  });

  describe('filterPublications', () => {
    it('should save inputs', () => {
      const fixture = MockRender(SearchComponent);
      const filterEventMock: Record<string, unknown> = {
        query: 'Urbanism',
        status: 'Preprint',
      };
      fixture.detectChanges();
      fixture.point.componentInstance.filterPublications(filterEventMock);
      fixture.detectChanges();
      expect(fixture.point.componentInstance.status).toBe('Preprint');
      expect(fixture.point.componentInstance.query).toBe('Urbanism');
    });
  });
});
