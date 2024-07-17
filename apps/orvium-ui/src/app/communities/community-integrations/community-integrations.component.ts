import {
  AfterViewInit,
  Component,
  DestroyRef,
  inject,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { concatMap, finalize, map, tap } from 'rxjs/operators';
import {
  CommunityPrivateDTO,
  CommunityUpdateDto,
  CrossrefDTOServerEnum,
  DataCiteDTOServerEnum,
  DefaultService,
  StripeProductDTO,
  StripeProductDTODefaultPrice,
  UserPrivateDTO,
} from '@orvium/api';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import { ProfileService } from '../../profile/profile.service';
import { AppSnackBarService } from '../../services/app-snack-bar.service';
import { CommunityService, ICommunityActions } from '../community.service';
import { Observable } from 'rxjs';
import { assertIsDefined, getDelta, isNotNullOrUndefined } from '../../shared/shared-functions';
import { SidenavService } from '../../services/sidenav.service';
import { environment } from '../../../environments/environment';
import { AccessDeniedComponent } from '../../shared/access-denied/access-denied.component';

import { InfoToolbarComponent } from '../../shared/info-toolbar/info-toolbar.component';
import { DescriptionLineComponent } from '../../shared/description-line/description-line.component';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipOption, MatChipsModule } from '@angular/material/chips';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { SpinnerService } from '../../spinner/spinner.service';
import { OverlayLoadingDirective } from '../../spinner/overlay-loading.directive';
import { AlertComponent } from '../../shared/alert/alert.component';
import { DialogService } from '../../dialogs/dialog.service';
import { MatIconModule } from '@angular/material/icon';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

/**
 * Interface representing the form controls for Crossref integration settings.
 *
 * @property {FormControl<string>} user - The user name for Crossref integration.
 * @property {FormControl<string>} pass - The user password for Crossref integration
 * @property {FormControl<string>} role - The role associated with the Crossref account
 * @property {FormControl<string>} prefixDOI - The DOI prefix for Crossref.
 * @property {FormControl<CrossrefDTOServerEnum>} server - The server configuration for Crossref.
 */
interface CrossrefForm {
  user: FormControl<string>;
  pass: FormControl<string>;
  role: FormControl<string>;
  prefixDOI: FormControl<string>;
  server: FormControl<CrossrefDTOServerEnum>;
}

interface DataCiteForm {
  accountId: FormControl<string>;
  pass: FormControl<string>;
  prefix: FormControl<string>;
  server: FormControl<DataCiteDTOServerEnum>;
}

/**
 * Interface representing the form controls for community integrations, including iThenticate, DataCite, and Crossref.
 *
 * @property {FormControl<string>} iThenticateAPIKey - The API key for iThenticate integration.
 * @property {FormControl<boolean>} productsVisible - Visibility setting for products.
 * @property {FormGroup<DataCiteForm> | FormControl<null>} datacite - Form group or control for DataCite integration settings.
 * @property {FormGroup<CrossrefForm> | FormControl<null>} crossref - Form group or control for Crossref integration settings.
 */
interface CommunityIntegrationsForm {
  iThenticateAPIKey: FormControl<string>;
  productsVisible: FormControl<boolean>;
  datacite: FormGroup<DataCiteForm> | FormControl<null>;
  crossref: FormGroup<CrossrefForm> | FormControl<null>;
}

/**
 * List of values for DataCite servers, including test and production environments.
 *
 * @property {DataCiteDTOServerEnum} value - The enum value representing the server.
 * @property {string} viewValue - The display value for the server.
 */
const DATACITE_SERVERS_LOV = [
  {
    value: DataCiteDTOServerEnum.TestDataciteOrg,
    viewValue: 'TEST - https://api.test.datacite.org',
  },
  {
    value: DataCiteDTOServerEnum.DataciteOrg,
    viewValue: 'PRODUCTION - https://api.datacite.org',
  },
];

/**
 * List of values for Crossref servers, including test and production environments.
 *
 * @property {CrossrefDTOServerEnum} value - The enum value representing the server.
 * @property {string} viewValue - The display value for the server.
 */
const CROSSREF_SERVERS_LOV = [
  {
    value: CrossrefDTOServerEnum.TestCrossrefOrgServletDeposit,
    viewValue: 'TEST - https://test.crossref.org/servlet/deposit',
  },
  {
    value: CrossrefDTOServerEnum.DoiCrossrefOrgServletDeposit,
    viewValue: 'PRODUCTION - https://doi.crossref.org/servlet/deposit',
  },
];

/**
 * Component responsible for managing the integration settings of a community, including API keys and DOI configurations.
 * Allows for configuration and management of DataCite and CrossRef integrations as well as iThenticate API settings.
 */
@Component({
  selector: 'app-community-integrations',
  standalone: true,
  templateUrl: './community-integrations.component.html',
  styleUrls: ['./community-integrations.component.scss'],
  imports: [
    AccessDeniedComponent,
    InfoToolbarComponent,
    DescriptionLineComponent,
    MatButtonModule,
    RouterLink,
    ReactiveFormsModule,
    MatExpansionModule,
    MatChipsModule,
    MatSlideToggleModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatListModule,
    RouterLinkActive,
    OverlayLoadingDirective,
    AlertComponent,
    MatIconModule,
  ],
})
export class CommunityIntegrationsComponent implements OnInit, AfterViewInit {
  /**
   * Reference to the extra sidenav template.
   */
  @ViewChild('extraSidenavTemplate') extraSidenavTemplate!: TemplateRef<unknown>;

  /**
   * Manages the destruction of subscriptions upon component destruction.
   */
  private destroyRef = inject(DestroyRef);

  /**
   * Community details fetched based on community ID.
   */
  community?: CommunityPrivateDTO;

  /**
   * Current user profile details.
   */
  profile?: UserPrivateDTO;

  /**
   * Cached community updates for detecting changes.
   */
  cachedCommunityUpdate!: CommunityUpdateDto;

  /**
   * List of DataCite servers available for selection.
   */
  dataciteServerLOV = DATACITE_SERVERS_LOV;

  /**
   * List of CrossRef servers available for selection.
   */
  crossrefServerLOV = CROSSREF_SERVERS_LOV;

  /**
   * URL for Stripe onboarding process.
   */
  stripeOnboardingUrl = '';

  /**
   * Environment configuration settings.
   */
  environment = environment;

  /**
   * Permissions and actions available to the current user for this community.
   */
  communityActions: ICommunityActions = {
    update: false,
    moderate: false,
    submit: false,
  };

  /**
   * Indicates if the current user has administrative rights.
   */
  isAdmin = false;

  /**
   * FormGroup for managing CrossRef integration settings.
   */
  crossrefFormGroup = this.formBuilder.group<CrossrefForm>({
    user: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    pass: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    role: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    prefixDOI: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    server: new FormControl(CrossrefDTOServerEnum.TestCrossrefOrgServletDeposit, {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  /**
   * FormGroup for managing DataCite integration settings.
   */
  dataciteFormGroup = this.formBuilder.group<DataCiteForm>({
    accountId: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    pass: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    prefix: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    server: new FormControl(DataCiteDTOServerEnum.TestDataciteOrg, {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  /**
   * FormGroup for all community integration settings including API keys and product visibility.
   */
  communityForm = this.formBuilder.group<CommunityIntegrationsForm>({
    iThenticateAPIKey: new FormControl('', { nonNullable: true }),
    productsVisible: new FormControl(false, { nonNullable: true, validators: Validators.required }),
    datacite: new FormControl(null),
    crossref: new FormControl(null),
  });

  /**
   * Activation status of iThenticate.
   */
  iThenticateActive = false;

  /**
   * Form control for the iThenticate API key.
   */
  iThenticateKeyControl: FormControl;

  /**
   * The community ID extracted from the route parameters.
   */
  communityId: string | undefined;

  /**
   * List of Stripe products associated with the community.
   */
  stripeProducts: StripeProductDTO[] = [];

  /**
   * Default price details for the Stripe products.
   */
  stripePrices: StripeProductDTODefaultPrice | undefined | null;

  /**
   * Indicates if the community details are being loaded.
   */
  loadingCommunity = true;
  /**
   * Constructs the CommunityIntegrationsComponent.
   * Initializes services, sets up form controls, and fetches community details based on the route parameter.
   *
   * @param {ActivatedRoute} route - Service to access route parameters.
   * @param {ProfileService} profileService - Service to manage user profiles.
   * @param {FormBuilder} formBuilder - Service to create form controls.
   * @param {SpinnerService} spinnerService - Service to show and hide the loading spinner.
   * @param {AppSnackBarService} snackBar - Service to show snack bar notifications.
   * @param {CommunityService} communityService - Service to manage community data.
   * @param {DialogService} dialogService - Service to manage dialog interactions.
   * @param {DefaultService} apiService - Service to interact with the API.
   * @param {SidenavService} sidenavService - Service to manage the sidenav.
   */
  constructor(
    private route: ActivatedRoute,
    private profileService: ProfileService,
    private formBuilder: FormBuilder,
    private spinnerService: SpinnerService,
    public snackBar: AppSnackBarService,
    private communityService: CommunityService,
    private dialogService: DialogService,
    private apiService: DefaultService,
    private sidenavService: SidenavService
  ) {
    this.route.paramMap
      .pipe(
        map(params => params.get('communityId')),
        isNotNullOrUndefined(),
        concatMap(communityId =>
          this.apiService.getCommunity({ id: communityId }).pipe(
            finalize(() => {
              this.loadingCommunity = false;
            })
          )
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(community => {
        // narrow type to CommunityPrivateDTO by checking `isPrivateDTO` property
        if ('isPrivateDTO' in community) {
          this.refreshCommunity(community);
        }
      });
    this.iThenticateKeyControl = new FormControl('', [Validators.required]);
  }

  /**
   * Sets up additional UI components after view initialization.
   */
  ngAfterViewInit(): void {
    this.sidenavService.setExtraSidenav(this.extraSidenavTemplate);
  }

  /**
   * Initializes component properties and fetches necessary data.
   */
  ngOnInit(): void {
    this.profileService.getProfile().subscribe(profile => {
      this.profile = profile;
      if (this.profile) {
        this.isAdmin = this.profile.roles.includes('admin');
      }
    });
  }

  /**
   * Handles the logic required before exiting the component, especially when there are unsaved changes.
   *
   * @returns {Observable<boolean> | boolean} Whether the exit can proceed.
   */
  onExit(): Observable<boolean> | boolean {
    if (!this.communityForm.dirty) {
      this.sidenavService.setExtraSidenav(undefined);
      return true;
    }
    const dialog = this.dialogService
      .openConfirm({
        title: 'Exit Edit',
        content: 'Are you sure you want to exit? You have unsaved changes that will be lost.',
        cancelMessage: 'Cancel',
        acceptMessage: 'Ok',
      })
      .afterClosed()
      .pipe(
        map(value => !!value),
        tap(value => {
          if (value) {
            this.sidenavService.setExtraSidenav(undefined);
          }
        })
      );

    return dialog;
  }

  /**
   * Fetches and sets the Stripe products for the community.
   *
   * @param {string} communityId The ID of the community.
   */
  setCommunityStripeProducts(communityId: string): void {
    this.apiService.getStripeProducts({ communityId: communityId }).subscribe(stripeProducts => {
      this.stripeProducts = stripeProducts;
      for (const stripeProduct of this.stripeProducts) {
        this.stripePrices = stripeProduct.default_price;
      }
    });
  }

  /**
   * Configures the iThenticate service with the provided API key.
   */
  setupIThenticate(): void {
    assertIsDefined(this.community, 'Community not defined');
    this.spinnerService.show();
    this.apiService
      .setupIThenticate({
        webhookPayload: { key: this.iThenticateKeyControl.value, communityId: this.community._id },
      })
      .pipe(
        finalize(() => {
          this.spinnerService.hide();
        })
      )
      .subscribe(response => {
        this.snackBar.info('iThenticate configured successfully');
      });
  }

  /**
   * Initiates the Stripe onboarding process.
   */
  startStripeOnboarding(): void {
    assertIsDefined(this.community, 'Community not defined');
    this.spinnerService.show();
    this.apiService
      .onboard({ stripeOnboardPayload: { communityId: this.community._id } })
      .pipe(
        finalize(() => {
          this.spinnerService.hide();
        })
      )
      .subscribe(resp => {
        if (resp.url) {
          this.stripeOnboardingUrl = resp.url;
        }
      });
  }

  /**
   * Refreshes actions available for the community based on current permissions.
   *
   * @param {CommunityPrivateDTO} community The community data.
   */
  refreshActions(community: CommunityPrivateDTO): void {
    this.communityActions = this.communityService.getCommunityActions(community);
  }

  /**
   * Refreshes the community details from the server and updates local state.
   * @param {CommunityPrivateDTO} community The community data.
   */
  refreshCommunity(community: CommunityPrivateDTO): void {
    this.community = community;
    this.refreshActions(this.community);
    this.communityForm.controls.datacite = this.community.datacite
      ? this.dataciteFormGroup
      : new FormControl(null);
    this.communityForm.controls.crossref = this.community.crossref
      ? this.crossrefFormGroup
      : new FormControl(null);
    this.communityForm.reset(this.community);

    this.apiService
      .getIThenticateStatus({ communityId: this.community._id })
      .subscribe(response => {
        this.iThenticateActive = response.active;
      });

    this.cachedCommunityUpdate = this.communityForm.getRawValue() as CommunityUpdateDto;
  }

  /**
   * Saves the community integration settings. Validates the form and submits the changes if valid and
   * Displays an error message if the form is invalid.
   */
  save(): void {
    assertIsDefined(this.community, 'Community not defined');

    if (!this.communityForm.valid) {
      this.snackBar.error('Make sure all details are correct');
      return;
    }
    const currentValue = this.communityForm.getRawValue() as CommunityUpdateDto;

    const delta = getDelta(currentValue, this.cachedCommunityUpdate);
    this.spinnerService.show();
    this.apiService
      .updateCommunity({ id: this.community._id, communityUpdateDto: delta })
      .pipe(
        finalize(() => {
          this.spinnerService.hide();
        })
      )
      .subscribe(response => {
        this.refreshCommunity(response);
        this.snackBar.info('Community saved');
      });
  }

  /**
   * Configures the DataCite settings based on the selected chip option. Enables/disables the DataCite based on the chip selection.
   * Marks the CrossRef form control as dirty to indicate changes.
   *
   * @param {MatChipOption} chip - The chip option representing the DataCite configuration state.
   */
  configureDatacite(chip: MatChipOption): void {
    if (!chip.selected) {
      this.dataciteFormGroup.disable();
      this.communityForm.setControl('datacite', new FormControl(null));
      this.communityForm.controls.crossref.markAsDirty();
    } else {
      this.dataciteFormGroup.enable();
      this.communityForm.setControl('datacite', this.dataciteFormGroup);
    }
  }

  /**
   * Configures the CrossRef settings based on the selected chip option. Enables or disables the form based on the chip selection.
   * Marks the CrossRef form control as dirty to indicate changes.
   *
   * @param {MatChipOption} chip - The chip option representing the CrossRef configuration state.
   */
  configureCrossref(chip: MatChipOption): void {
    if (!chip.selected) {
      this.crossrefFormGroup.disable();
      this.communityForm.setControl('crossref', new FormControl(null));
      this.communityForm.controls.crossref.markAsDirty();
    } else {
      this.crossrefFormGroup.enable();
      this.communityForm.setControl('crossref', this.crossrefFormGroup);
    }
  }

  /**
   * Changes the DOI provider based on the selected DataCite and CrossRef chip options.
   * Configures the DataCite and CrossRef settings accordingly.
   *
   * @param {MatChipOption} dataciteChip - The chip option representing the DataCite configuration state.
   * @param {MatChipOption} crossrefChip - The chip option representing the CrossRef configuration state.
   */
  changeDOIProvider(dataciteChip: MatChipOption, crossrefChip: MatChipOption): void {
    this.configureCrossref(crossrefChip);
    this.configureDatacite(dataciteChip);
  }
}
