import { TestBed } from '@angular/core/testing';
import { CommunityPaymentsComponent } from './community-payments.component';
import { MockComponent, MockProvider, MockRender } from 'ng-mocks';
import { DefaultService, PaginationLimit } from '@orvium/api';
import { factoryCommunityDTO, factoryPaymentDTO } from '../../shared/test-data';
import { of } from 'rxjs';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { SearchBoxComponent } from '../../shared/search-box/search-box.component';
import { AccessDeniedComponent } from '../../shared/access-denied/access-denied.component';
import { InfoToolbarComponent } from '../../shared/info-toolbar/info-toolbar.component';
import { DescriptionLineComponent } from '../../shared/description-line/description-line.component';
import { CommunityService } from '../community.service';
import { DialogService } from '../../dialogs/dialog.service';
import { AppSnackBarService } from '../../services/app-snack-bar.service';
import { MatPaginatorModule } from '@angular/material/paginator';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { assertIsDefined } from '../../shared/shared-functions';

describe('CommunityPaymentsComponent', () => {
  const community = factoryCommunityDTO.build();
  const routeSnapshot = {
    paramMap: of(
      convertToParamMap({
        communityId: community._id,
      })
    ),
    fragment: of({}),
  };
  const paymentQueryDTO = {
    payments: [...factoryPaymentDTO.buildList(3, { community: community._id })],
    count: 3,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CommunityPaymentsComponent, MatPaginatorModule, BrowserAnimationsModule],
      providers: [
        MockProvider(DefaultService, {
          getCommunity: jest.fn().mockReturnValue(of(community)),
          getCommunityPayments: jest.fn().mockReturnValue(of(paymentQueryDTO)),
        }),
        MockComponent(SearchBoxComponent),
        MockComponent(AccessDeniedComponent),
        MockComponent(InfoToolbarComponent),
        MockComponent(DescriptionLineComponent),
        MockProvider(DialogService, {
          openCustom: jest.fn().mockReturnValue(of({})),
        }),
        MockProvider(AppSnackBarService, {
          info: jest.fn().mockReturnValue(of({})),
          error: jest.fn().mockReturnValue(of({})),
        }),
        MockProvider(CommunityService, {
          getCommunityActions: jest.fn().mockReturnValue({
            update: true,
            submit: true,
            moderate: true,
          }),
        }),
        { provide: ActivatedRoute, useValue: routeSnapshot },
      ],
    });
  });

  it('should create', () => {
    const fixture = MockRender(CommunityPaymentsComponent);
    expect(fixture.point.componentInstance).toBeTruthy();
  });

  it('should get PaymentsQueryDTO', () => {
    const fixture = MockRender(CommunityPaymentsComponent);
    const apiService = TestBed.inject(DefaultService);

    const spy = jest.spyOn(apiService, 'getCommunityPayments');

    expect(spy).toHaveBeenCalledTimes(1);
    expect(fixture.point.componentInstance.paymentQuery).toBe(paymentQueryDTO);
  });

  it('should search', () => {
    const fixture = MockRender(CommunityPaymentsComponent);

    const spyPaymentsFilter = jest.spyOn(fixture.point.componentInstance, 'filterPayments');
    const apiService = TestBed.inject(DefaultService);
    const spy = jest.spyOn(apiService, 'getCommunityPayments');
    expect(spy).toHaveBeenCalledTimes(1);

    fixture.point.componentInstance.searchPayments();
    expect(spyPaymentsFilter).toHaveBeenCalledTimes(1);
    expect(fixture.point.componentInstance.paymentQuery).toBe(paymentQueryDTO);
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ limit: PaginationLimit._10 }));
  });

  it('should paginate', () => {
    const fixture = MockRender(CommunityPaymentsComponent);

    const spyPaymentsFilter = jest.spyOn(fixture.point.componentInstance, 'filterPayments');
    const apiService = TestBed.inject(DefaultService);
    const spy = jest.spyOn(apiService, 'getCommunityPayments');
    expect(spy).toHaveBeenCalledTimes(1);

    fixture.point.componentInstance.paginatePayments();
    expect(spyPaymentsFilter).toHaveBeenCalledTimes(1);
    expect(fixture.point.componentInstance.paymentQuery).toBe(paymentQueryDTO);
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ limit: PaginationLimit._10 }));
    assertIsDefined(fixture.componentInstance.paymentPaginator);
    fixture.componentInstance.paymentPaginator.pageSize = 25;
    fixture.point.componentInstance.paginatePayments();
    expect(fixture.point.componentInstance.paymentQuery).toBe(paymentQueryDTO);
    expect(spy).toHaveBeenLastCalledWith(expect.objectContaining({ limit: PaginationLimit._25 }));
  });
});
