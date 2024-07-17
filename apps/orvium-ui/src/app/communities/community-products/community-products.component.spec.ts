import { CommunityProductsComponent } from './community-products.component';
import {
  factoryCommunityPopulatedDTO,
  factoryStripeOrderDTO,
  factoryStripeProductDTO,
  factoryUserPrivateDTO,
} from '../../shared/test-data';
import { MockProvider, MockRender, ngMocks } from 'ng-mocks';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { ShareService } from 'ngx-sharebuttons';
import { DefaultService } from '@orvium/api';
import { of } from 'rxjs';
import { ProfileService } from '../../profile/profile.service';
import { SpinnerService } from '../../spinner/spinner.service';
import { TestBed } from '@angular/core/testing';
import { AppSnackBarService } from '../../services/app-snack-bar.service';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('CommunityProductsComponent', () => {
  const community = factoryCommunityPopulatedDTO.build({
    productsVisible: true,
  });
  const stripeOrder = factoryStripeOrderDTO.build();

  const routeSnapshot = {
    data: of({ community }),
    paramMap: of(
      convertToParamMap({
        communityId: community._id,
      })
    ),
  };

  const profile = factoryUserPrivateDTO.build();

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CommunityProductsComponent, NoopAnimationsModule],
      providers: [
        MockProvider(DefaultService, {
          getCommunity: jest.fn().mockReturnValue(of(community)),
          getStripeProducts: jest.fn().mockReturnValue(of(factoryStripeProductDTO.buildList(1))),
          checkout: jest.fn().mockReturnValue(of(stripeOrder)),
        }),
        MockProvider(SpinnerService, {
          show: jest.fn().mockReturnValue(null),
          hide: jest.fn().mockReturnValue(null),
        }),
        MockProvider(ProfileService, {
          getProfile: jest.fn().mockReturnValue(of(profile)),
        }),
        MockProvider(ShareService),
        MockProvider(AppSnackBarService),
        { provide: ActivatedRoute, useValue: routeSnapshot },
      ],
    });
  });

  it('should setCommunity', () => {
    const fixture = MockRender(CommunityProductsComponent);
    fixture.point.componentInstance.setCommunity(community);
    fixture.detectChanges();
  });

  it('should create', () => {
    const fixture = MockRender(CommunityProductsComponent);
    expect(fixture.point.componentInstance).toBeDefined();
    fixture.detectChanges();
    expect(fixture.point.componentInstance).toBeTruthy();
  });

  it('should setCommunityStripeProducts', () => {
    const fixture = MockRender(CommunityProductsComponent);
    fixture.point.componentInstance.setCommunityStripeProducts('5fa1908fd29a17dc961cc435');
  });

  it('should buy products', () => {
    const fixture = MockRender(CommunityProductsComponent);
    const apiService = fixture.point.injector.get(DefaultService);
    const spyApiService = jest.spyOn(apiService, 'checkout').mockReturnValue(of());
    const quantityInput = ngMocks.findAll(fixture, '[data-test="input-quantity"]');
    ngMocks.change(quantityInput[0], 1);
    fixture.point.componentInstance.buyProducts();
    expect(spyApiService).toHaveBeenCalled();
  });

  it('should start buyProducts', () => {
    const fixture = MockRender(CommunityProductsComponent);
    fixture.point.componentInstance.buyProducts();
  });

  it('should start checkout', () => {
    const fixture = MockRender(CommunityProductsComponent);
    fixture.detectChanges();
    const quantityInput = ngMocks.findAll(fixture, '[data-test="input-quantity"]');
    ngMocks.change(quantityInput[0], 1);
    fixture.detectChanges();
    const apiService = fixture.point.injector.get(DefaultService);
    const spinnerService = fixture.point.injector.get(SpinnerService);

    const buttonBuyProducts = ngMocks.find<HTMLButtonElement>(
      fixture,
      '[data-test="button-buy-products"]'
    );
    expect(buttonBuyProducts.componentInstance.disabled).toBe(false);
    // https://github.com/help-me-mom/ng-mocks/issues/756
    (buttonBuyProducts.nativeElement as HTMLButtonElement).click();

    expect(spinnerService.show).toHaveBeenCalled();
    expect(apiService.checkout).toHaveBeenCalled();
    expect(spinnerService.hide).toHaveBeenCalled();
  });

  it('should fail buy product because of negative quantity', () => {
    const fixture = MockRender(CommunityProductsComponent);
    fixture.detectChanges();
    const quantityInput = ngMocks.findAll(fixture, '[data-test="input-quantity"]');
    ngMocks.change(quantityInput[0], -1);
    fixture.detectChanges();
    const buttonBuyProducts = ngMocks.find<HTMLButtonElement>(
      fixture,
      '[data-test="button-buy-products"]'
    );
    expect(buttonBuyProducts.componentInstance.disabled).toBe(true);
  });
});
