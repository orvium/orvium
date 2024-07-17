import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { MockProvider, MockRender, MockReset } from 'ng-mocks';

import { OrderInfoComponent } from './order-info.component';
import { DefaultService, StripeLineItem } from '@orvium/api';
import { of } from 'rxjs';
import {
  factoryCommunityPopulatedDTO,
  factoryStripeLineItem,
  generateObjectId,
} from '../../shared/test-data';
import { TestBed } from '@angular/core/testing';

describe('OrderInfoComponent', () => {
  const routeSnapshot = {
    snapshot: {
      paramMap: convertToParamMap({ communityId: 'communityId' }),
      queryParamMap: convertToParamMap({ session_id: 'stripe-session' }),
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [OrderInfoComponent],
      providers: [
        MockProvider(DefaultService, {
          getSuccessInfo: jest.fn().mockReturnValue(of([])),
          getCommunity: jest.fn().mockReturnValue(of(factoryCommunityPopulatedDTO.build())),
        }),
        {
          provide: ActivatedRoute,
          useValue: routeSnapshot,
        },
      ],
    });
  });

  afterEach(MockReset);

  it('should create', () => {
    const fixture = MockRender(OrderInfoComponent);
    expect(fixture.point.componentInstance).toBeDefined();
    fixture.detectChanges();
    expect(fixture.point.componentInstance).toBeTruthy();
  });

  it('should getUnitAmount', () => {
    const fixture = MockRender(OrderInfoComponent);
    expect(fixture.point.componentInstance).toBeDefined();
    fixture.detectChanges();
    // Testing a good unit_amount
    expect(fixture.point.componentInstance.getItemUnitAmount(factoryStripeLineItem.build())).toBe(
      1
    );
    // Testing an incorrect unit_amount
    const badStripeItem: StripeLineItem = {
      id: generateObjectId(),
      object: '',
      amount_discount: 1,
      amount_subtotal: 1,
      amount_tax: 1,
      amount_total: 1,
      currency: 'eu',
      description: 'testing',
      discounts: [],
      price: {},
      product: {},
      quantity: {},
      taxes: [],
    };
    expect(fixture.point.componentInstance.getItemUnitAmount(badStripeItem)).toBe(0);
  });
});
