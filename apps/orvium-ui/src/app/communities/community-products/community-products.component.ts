import { Component, DestroyRef, Inject, OnInit, Optional, inject } from '@angular/core';
import {
  CommunityPopulatedDTO,
  DefaultService,
  OrderDTO,
  OrderProductsDTO,
  StripeProductDTO,
  UserPrivateDTO,
} from '@orvium/api';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { concatMap, finalize, map } from 'rxjs/operators';
import { AppSnackBarService } from '../../services/app-snack-bar.service';
import { ProfileService } from '../../profile/profile.service';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { assertIsDefined, isNotNullOrUndefined } from '../../shared/shared-functions';
import { DOCUMENT, NgTemplateOutlet } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SpinnerService } from '../../spinner/spinner.service';
import { AlertComponent } from '../../shared/alert/alert.component';
import { DescriptionLineComponent } from '../../shared/description-line/description-line.component';
import { InfoToolbarComponent } from '../../shared/info-toolbar/info-toolbar.component';
import { OverlayLoadingDirective } from '../../spinner/overlay-loading.directive';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDividerModule } from '@angular/material/divider';

/**
 * Interface representing the form controls for a product within the community.
 *
 * @property {FormControl<string>} productId - The unique identifier for the product.
 * @property {FormControl<string>} image - The URL of the product's image.
 * @property {FormControl<string>} title - The title of the product.
 * @property {FormControl<string>} description - A brief description of the product.
 * @property {FormControl<string>} currency - The currency code for the product's price.
 * @property {FormControl<string>} price - The price of the product.
 * @property {FormControl<number>} quantity - The quantity of the product to purchase.
 */
interface ProductForm {
  productId: FormControl<string>;
  image: FormControl<string>;
  title: FormControl<string>;
  description: FormControl<string>;
  currency: FormControl<string>;
  price: FormControl<string>;
  quantity: FormControl<number>;
}

/**
 * Component for managing and purchasing products associated with a community.
 * It allows users to view, edit, and buy community-specific products.
 */
@Component({
  selector: 'app-community-products',
  standalone: true,
  templateUrl: './community-products.component.html',
  styleUrls: ['./community-products.component.scss'],
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    RouterLink,
    MatIconModule,
    AlertComponent,
    DescriptionLineComponent,
    InfoToolbarComponent,
    NgTemplateOutlet,
    OverlayLoadingDirective,
    MatDividerModule,
  ],
})
export class CommunityProductsComponent implements OnInit {
  /** Reference to the populated community details. */
  community?: CommunityPopulatedDTO;

  /** Reference to the user's profile details. */
  profile?: UserPrivateDTO;

  /** Manages the destruction of subscriptions upon component destruction. */
  private destroyRef = inject(DestroyRef);

  /** Form group that handles the array of products available for purchase. */
  buyProductsForm = this.formBuilder.group({
    products: this.formBuilder.array<FormGroup<ProductForm>>([]),
  });

  /** Indicates if the component is used within a dialog preview. */
  isPreviewDialog = false;

  /** Array of stripe product details. */
  stripeProducts: StripeProductDTO[] = [];

  /** Indicates if the products are being loaded. */
  loadingProducts = false;

  /**
   * Constructs the CommunityProductsComponent with necessary dependency injections for handling forms, routing,
   * loading states, API interactions, user notifications, user profile management, and document manipulation.
   *
   * @param {FormBuilder} formBuilder - Service to construct forms to capture and validate user input efficiently.
   * @param {ActivatedRoute} route - Service that contains information about the route associated with the component that is loaded in an outlet.
   * @param {SpinnerService} spinnerService - Service to manage the visibility of a global loading spinner, indicating processing or waiting times.
   * @param {DefaultService} apiService - Service to make API calls to the server for fetching or submitting data.
   * @param {AppSnackBarService} snackbar - Service for displaying brief messages in a small popup at the bottom of the screen.
   * @param {ProfileService} profileService - Service that handles fetching and updating the user's profile data.
   * @param {Document} document - A provider for the global document object typically used to manipulate the DOM.
   * @param {{community: CommunityPopulatedDTO} | undefined} data - Optional data passed when the component is instantiated within a dialog.
   */
  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private spinnerService: SpinnerService,
    private apiService: DefaultService,
    private snackbar: AppSnackBarService,
    private profileService: ProfileService,
    @Inject(DOCUMENT) private document: Document,
    @Optional() @Inject(MAT_DIALOG_DATA) public data?: { community: CommunityPopulatedDTO }
  ) {}

  /**
   * Initializes component by fetching community details from route parameters or dialog data,
   * and loads user profile and product details.
   */
  ngOnInit(): void {
    if (this.data) {
      this.setCommunity(this.data.community);
      this.isPreviewDialog = true;
    } else {
      this.route.paramMap
        .pipe(
          map(params => params.get('communityId')),
          isNotNullOrUndefined(),
          concatMap(communityId => this.apiService.getCommunity({ id: communityId })),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe(community => {
          this.setCommunity(community);
          this.setCommunityStripeProducts(community._id);
        });
    }

    this.profileService.getProfile().subscribe(profile => {
      this.profile = profile;
    });
  }

  /**
   * Sets the community data and initializes loading of associated products.
   *
   * @param {CommunityPopulatedDTO} community - The community details to set.
   */
  setCommunity(community: CommunityPopulatedDTO): void {
    this.community = community;
  }

  /**
   * Fetches and populates the form with products from Stripe associated with the community.
   *
   * @param {string} communityId - The ID of the community to fetch products for.
   */
  setCommunityStripeProducts(communityId: string): void {
    this.loadingProducts = true;
    this.apiService
      .getStripeProducts({ communityId: communityId })
      .pipe(
        finalize(() => {
          this.loadingProducts = false;
        })
      )
      .subscribe(stripeProducts => {
        this.stripeProducts = stripeProducts;
        for (const stripeProduct of this.stripeProducts) {
          if (!stripeProduct.default_price) {
            continue;
          }
          stripeProduct.default_price;
          const productForm = this.formBuilder.nonNullable.group<ProductForm>({
            productId: new FormControl(stripeProduct.id, {
              nonNullable: true,
              validators: Validators.required,
            }),
            image: new FormControl(stripeProduct.images ? stripeProduct.images[0] : ''),
            title: new FormControl(stripeProduct.name ? stripeProduct.name : '', {
              nonNullable: true,
              validators: Validators.required,
            }),
            description: new FormControl(stripeProduct.description ?? ''),
            currency: new FormControl(stripeProduct.default_price.currency, {
              nonNullable: true,
              validators: Validators.required,
            }),
            price: new FormControl((stripeProduct.default_price.unit_amount / 100).toFixed(2), {
              nonNullable: true,
              validators: Validators.required,
            }),
            quantity: new FormControl(0, {
              nonNullable: true,
              validators: [Validators.required, Validators.min(0)],
            }),
          } as ProductForm);
          this.buyProductsForm.controls.products.push(productForm);
        }
      });
  }

  /**
   * Handles the purchase of selected products. Validates the order quantities and initiates a checkout process.
   */
  buyProducts(): void {
    assertIsDefined(this.community);
    const orders: OrderProductsDTO[] = [];
    this.buyProductsForm.controls.products.controls.forEach(productFormGroup => {
      const order: OrderProductsDTO = {
        productId: productFormGroup.controls.productId.value,
        quantity: productFormGroup.controls.quantity.value,
      };
      if (order.quantity > 0) {
        orders.push(order);
      }
    });

    if (orders.length === 0) {
      this.snackbar.error(
        'All quantities are zero, please add as many items as you need by changing the quantities of the products you would like to purchase.'
      );
      return;
    }

    const order: OrderDTO = {
      communityId: this.community._id,
      products: orders,
    };

    this.spinnerService.show();

    //Stripe Webhook: checkout.session [status --> open]
    this.apiService
      .checkout({ orderDTO: order })
      .pipe(
        finalize(() => {
          this.spinnerService.hide();
        })
      )
      .subscribe(result => {
        this.document.location.href = result.url;
      });
  }
}
