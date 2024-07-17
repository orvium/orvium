import { TestBed } from '@angular/core/testing';
import { CommunityIntegrationsComponent } from './community-integrations.component';
import { MockedComponentFixture, MockProvider, MockRender } from 'ng-mocks';
import { firstValueFrom, Observable, of } from 'rxjs';
import { AppSnackBarService } from '../../services/app-snack-bar.service';
import {
  CommunityPrivateDTO,
  CrossrefDTOServerEnum,
  DataCiteDTOServerEnum,
  DefaultService,
  StripeProductDTO,
} from '@orvium/api';
import {
  factoryCommunityPrivateDTO,
  factoryStripeProductDTO,
  factoryUserPrivateDTO,
} from '../../shared/test-data';
import { ProfileService } from '../../profile/profile.service';
import { CommunityService } from '../community.service';
import { DisciplinesService } from '../../services/disciplines.service';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { SpinnerService } from '../../spinner/spinner.service';
import { DialogService } from '../../dialogs/dialog.service';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../dialogs/confirm-dialog/confirm-dialog.component';
import { assertIsObservable } from '../../shared/shared-functions';
import { SidenavService } from '../../services/sidenav.service';
import { MatChipOption } from '@angular/material/chips';
import { HttpEvent } from '@angular/common/http';

describe('CommunityIntegrationsComponent', () => {
  let community: CommunityPrivateDTO;
  let stripeProducts: StripeProductDTO[];
  const disciplines = ['Acoustics', 'Computing'];
  beforeEach(() => {
    community = factoryCommunityPrivateDTO.build({
      crossref: {
        pass: '',
        prefixDOI: '',
        role: '',
        user: '',
      },
    });
    stripeProducts = [factoryStripeProductDTO.build()];

    const routeSnapshot = {
      paramMap: of(
        convertToParamMap({
          communityId: community._id,
        })
      ),
    };

    TestBed.configureTestingModule({
      imports: [CommunityIntegrationsComponent, NoopAnimationsModule],
      providers: [
        MockProvider(ProfileService, {
          getProfile: jest.fn().mockReturnValue(of(factoryUserPrivateDTO.build())),
        }),
        MockProvider(CommunityService, {
          getCommunityActions: jest.fn().mockReturnValue({
            moderate: true,
            update: true,
            submit: true,
          }),
        }),
        MockProvider(AppSnackBarService, {
          info: jest.fn().mockReturnValue('Info message'),
          error: jest.fn().mockReturnValue('Error message'),
        }),
        MockProvider(DialogService, {
          openConfirm: jest.fn().mockReturnValue(
            of({
              afterClosed: () => of({ action: true, inputValue: 'test' }),
            })
          ),
        }),
        MockProvider(DisciplinesService, {
          getDisciplines: jest.fn().mockReturnValue(of(disciplines)),
        }),
        MockProvider(SpinnerService, {
          show: jest.fn().mockReturnValue(of({})),
          hide: jest.fn().mockReturnValue(of({})),
        }),
        MockProvider(DefaultService, {
          getIThenticateStatus: jest.fn().mockReturnValue(of({ active: true })),
          setupIThenticate: jest.fn().mockReturnValue(of({})),
          submitCommunity: jest.fn().mockReturnValue(of(community)),
          onboard: jest.fn().mockImplementation(() => of({ url: 'example.com' })),
          updateCommunity: jest.fn().mockReturnValue(of({ community })),
          getCommunity: jest.fn().mockReturnValue(of(community)),
          getStripeProducts: jest.fn().mockReturnValue(of(stripeProducts)),
        }),
        { provide: ActivatedRoute, useValue: routeSnapshot },
      ],
    });
  });

  it('should create', () => {
    const fixture = MockRender(CommunityIntegrationsComponent);
    expect(fixture.point.componentInstance).toBeDefined();
    fixture.detectChanges();
    expect(fixture.point.componentInstance).toBeTruthy();
  });

  it('should setup iThenticate', () => {
    const fixture = MockRender(CommunityIntegrationsComponent);
    const snackBarService = fixture.point.injector.get(AppSnackBarService);
    const spySnackBar = jest.spyOn(snackBarService, 'info');
    fixture.point.componentInstance.setupIThenticate();
    expect(spySnackBar).toHaveBeenCalledWith('iThenticate configured successfully');
  });

  it('should setCommunityStripeProducts', () => {
    const fixture = MockRender(CommunityIntegrationsComponent);
    fixture.point.componentInstance.setCommunityStripeProducts('acct_xxxxxxxxxxxxxxxxxx');
    fixture.detectChanges();
  });

  it('should change doi providers', () => {
    const fixture = MockRender(CommunityIntegrationsComponent);
    fixture.point.componentInstance.changeDOIProvider(
      { selected: true } as MatChipOption,
      { selected: false } as MatChipOption
    );
    expect(fixture.point.componentInstance.crossrefFormGroup.enabled).toBe(false);
    expect(fixture.point.componentInstance.dataciteFormGroup.enabled).toBe(true);
    fixture.point.componentInstance.changeDOIProvider(
      { selected: false } as MatChipOption,
      { selected: true } as MatChipOption
    );
    expect(fixture.point.componentInstance.crossrefFormGroup.enabled).toBe(true);
    expect(fixture.point.componentInstance.dataciteFormGroup.enabled).toBe(false);
  });

  it('should send doi provider as null', () => {
    const fixture = MockRender(CommunityIntegrationsComponent);
    const dataciteConfig = {
      accountId: 'test',
      pass: 'test',
      server: DataCiteDTOServerEnum.TestDataciteOrg,
      prefix: 'test',
    };
    const crossrefConfig = {
      pass: 'test',
      server: CrossrefDTOServerEnum.TestCrossrefOrgServletDeposit,
      user: 'test',
      role: 'test',
      prefixDOI: 'test',
    };
    fixture.point.componentInstance.changeDOIProvider(
      { selected: true } as MatChipOption,
      { selected: false } as MatChipOption
    );
    const spy = jest.spyOn(fixture.point.injector.get(DefaultService), 'updateCommunity');
    fixture.point.componentInstance.dataciteFormGroup.setValue(dataciteConfig);
    spy.mockReturnValue(
      of(
        fixture.point.componentInstance.communityForm.getRawValue() as unknown as HttpEvent<CommunityPrivateDTO>
      )
    );
    fixture.point.componentInstance.save();

    expect(spy).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ communityUpdateDto: { datacite: dataciteConfig, crossref: null } })
    );

    fixture.point.componentInstance.changeDOIProvider(
      { selected: false } as MatChipOption,
      { selected: true } as MatChipOption
    );

    fixture.point.componentInstance.crossrefFormGroup.setValue(crossrefConfig);
    fixture.detectChanges();
    fixture.point.componentInstance.save();

    expect(spy).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ communityUpdateDto: { crossref: crossrefConfig, datacite: null } })
    );
  });

  it('should start onboarding', () => {
    const fixture = MockRender(CommunityIntegrationsComponent);
    fixture.point.componentInstance.startStripeOnboarding();
  });

  it('should save', () => {
    const fixture = MockRender(CommunityIntegrationsComponent);
    fixture.point.componentInstance.save();

    // @ts-expect-error
    fixture.point.componentInstance.communityForm.controls.productsVisible.setValue(undefined);
    const snackbarService = fixture.point.injector.get(AppSnackBarService);
    const spy = jest.spyOn(snackbarService, 'error').mockImplementation();
    fixture.point.componentInstance.save();
    expect(spy).toHaveBeenCalled();
  });

  it('should do on exit', async () => {
    const fixture = MockRender(CommunityIntegrationsComponent);
    const sidenavService = fixture.point.injector.get(SidenavService);
    jest.spyOn(sidenavService, 'setExtraSidenav').mockImplementation();

    const onExit = fixture.point.componentInstance.onExit();
    expect(typeof onExit).toBe('boolean');

    fixture.point.componentInstance.communityForm.markAsDirty();
    await testOnExit(fixture);
  });
});

async function testOnExit<
  T extends {
    onExit: () => Observable<boolean> | boolean;
  },
>(fixture: MockedComponentFixture<T>): Promise<void> {
  const dialogService = fixture.point.injector.get(DialogService);

  jest.spyOn(dialogService, 'openConfirm').mockReturnValue({
    afterClosed: () => of(true),
  } as MatDialogRef<ConfirmDialogComponent, boolean>);
  const onExitTrue = fixture.point.componentInstance.onExit();
  assertIsObservable(onExitTrue);
  expect(await firstValueFrom(onExitTrue)).toBe(true);

  jest.spyOn(dialogService, 'openConfirm').mockReturnValue({
    afterClosed: () => of(false),
  } as MatDialogRef<ConfirmDialogComponent, boolean>);
  const onExitFalse = fixture.point.componentInstance.onExit();
  assertIsObservable(onExitFalse);
  expect(await firstValueFrom(onExitFalse)).toBe(false);
}
