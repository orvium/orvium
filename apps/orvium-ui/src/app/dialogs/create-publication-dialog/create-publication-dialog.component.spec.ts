import { CreatePublicationDialogComponent } from './create-publication-dialog.component';
import { RouterTestingModule } from '@angular/router/testing';
import { MockProvider, MockRender } from 'ng-mocks';
import { of } from 'rxjs';
import { factoryCommunityDTO, factoryDepositPopulatedDTO } from '../../shared/test-data';
import { AppSnackBarService } from '../../services/app-snack-bar.service';
import { DepositDetailsComponent } from '../../deposits/deposit-details/deposit-details.component';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { CommunityDTO, DefaultService } from '@orvium/api';
import { DialogService } from '../dialog.service';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

const deposit = factoryDepositPopulatedDTO.build();
const community = factoryCommunityDTO.build({ _id: 'id' });
const communities: CommunityDTO[] = [
  { ...community, codename: 'orvium' },
  { ...community, codename: 'example' },
];

describe('CreatePublicationDialogComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        CreatePublicationDialogComponent,
        RouterTestingModule.withRoutes([
          { path: `deposits/${deposit._id}/edit`, component: DepositDetailsComponent },
        ]),
        NoopAnimationsModule,
      ],
      providers: [
        MockProvider(DefaultService, {
          createDeposit: jest.fn().mockReturnValue(of(deposit)),
          createWithDOI: jest.fn().mockReturnValue(of(deposit)),
          getCommunities: jest.fn().mockReturnValue(of(communities)),
          getCommunity: jest.fn().mockReturnValue(of(communities[0])),
        }),
        MockProvider(AppSnackBarService, {
          error: jest.fn().mockReturnValue('Publication not valid'),
        }),
        MockProvider(DialogService, {
          openVideo: jest.fn().mockImplementation(),
          closeAll: jest.fn().mockImplementation(),
        }),
      ],
    });
  });

  it('should create', () => {
    const fixture = MockRender(CreatePublicationDialogComponent);
    expect(fixture.point.componentInstance).toBeDefined();
    fixture.detectChanges();
    expect(fixture.point.componentInstance).toBeTruthy();
  });

  it('should not create a publication with empty title', () => {
    const fixture = MockRender(CreatePublicationDialogComponent, {
      community: community,
    });
    const service = fixture.point.injector.get(AppSnackBarService);
    fixture.point.componentInstance.titleFormControl.setValue('');
    fixture.point.componentInstance.create();
    expect(service.error).toHaveBeenCalled();
  });

  it('should not import a publication with empty DOI', () => {
    const fixture = MockRender(CreatePublicationDialogComponent, {
      community: community,
    });
    const service = fixture.point.injector.get(AppSnackBarService);
    fixture.point.componentInstance.doiFormControl.setValue('');
    fixture.point.componentInstance.import();
    expect(service.error).toHaveBeenCalled();
  });

  it('should create a publication by title and navigate', fakeAsync(() => {
    const fixture = MockRender(CreatePublicationDialogComponent, {
      selectedCommunity: community,
    });
    const service = fixture.point.injector.get(DefaultService);
    const router = fixture.point.injector.get(Router);
    jest.spyOn(router, 'navigate').mockImplementation();
    fixture.point.componentInstance.titleFormControl.setValue('Publication title');
    fixture.point.componentInstance.create();
    tick(100);
    expect(service.createDeposit).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['deposits', deposit._id, 'edit']);
  }));

  it('should import a publication by DOI and navigate', fakeAsync(() => {
    const fixture = MockRender(CreatePublicationDialogComponent, {
      selectedCommunity: community,
    });
    const service = fixture.point.injector.get(DefaultService);
    const router = fixture.point.injector.get(Router);
    jest.spyOn(router, 'navigate').mockImplementation();
    fixture.point.componentInstance.doiFormControl.setValue('10.0000/1234');
    fixture.point.componentInstance.import();
    tick(100);
    expect(service.createWithDOI).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['deposits', deposit._id, 'edit']);
  }));

  it('should test doi listener', () => {
    const fixture = MockRender(CreatePublicationDialogComponent);
    fixture.point.componentInstance.doiFormControl.setValue(
      'http://dx.doi.org/10.4121/3326451.0004.222'
    );
    expect(fixture.point.componentInstance.doiFormControl.value).toBe('10.4121/3326451.0004.222');
  });

  it('should open video dialog', () => {
    const fixture = MockRender(CreatePublicationDialogComponent);
    fixture.point.componentInstance.openVideo();
  });
});
