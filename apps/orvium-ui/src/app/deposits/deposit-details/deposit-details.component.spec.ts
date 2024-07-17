import { DepositDetailsComponent } from './deposit-details.component';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import {
  factoryBibtexReference,
  factoryCommunityDTO,
  factoryCommunityPopulatedDTO,
  factoryDepositPopulatedDTO,
  factoryFileMetadata,
  factoryUserPrivateDTO,
} from '../../shared/test-data';
import { ProfileService } from '../../profile/profile.service';
import { BehaviorSubject, firstValueFrom, Observable, of } from 'rxjs';
import {
  AccessRight,
  BibtexReferences,
  DefaultService,
  DepositPopulatedDTO,
  FileExtensions,
  ReviewType,
  SimpleSubmissionResponseStatusEnum,
  StringDataPayload,
  UserPrivateDTO,
} from '@orvium/api';
import { MockComponent, MockedComponentFixture, MockProvider, MockRender, ngMocks } from 'ng-mocks';
import { DepositsService } from '../deposits.service';
import { BreakpointObserver } from '@angular/cdk/layout';
import { HttpEvent, HttpEventType, HttpResponse } from '@angular/common/http';
import { assertIsDefined, assertIsObservable } from '../../shared/shared-functions';
import { FullScreenService } from '../../services/full-screen.service';
import { AppSnackBarService } from '../../services/app-snack-bar.service';
import { DisciplinesService } from '../../services/disciplines.service';
import { discardPeriodicTasks, fakeAsync, flush, TestBed, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NGXLogger } from 'ngx-logger';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FontAwesomeTestingModule } from '@fortawesome/angular-fontawesome/testing';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { DialogService } from '../../dialogs/dialog.service';
import { MatSelect } from '@angular/material/select';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipOption } from '@angular/material/chips';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { MatInput } from '@angular/material/input';
import { BibtexEditComponent } from '../../shared/bibtex-edit/bibtex-edit.component';
import {
  InputDialogComponent,
  InputDialogResponse,
} from '../../dialogs/input-dialog/input-dialog.component';
import { TableOfContentsComponent } from '../../shared/table-of-contents/table-of-contents.component';
import { LocalStorageService } from '../../services/local-storage.service';
import { CustomDialogComponent } from '../../dialogs/custom-dialog/custom-dialog.component';
import { ConfirmDialogComponent } from '../../dialogs/confirm-dialog/confirm-dialog.component';

describe('DepositDetailsComponent', () => {
  const profile: UserPrivateDTO = factoryUserPrivateDTO.build({
    isOnboarded: true,
    emailPendingConfirmation: 'pending@example.com',
  });

  const bibtexResponse: BibtexReferences[] = [
    factoryBibtexReference.build({ type: 'article', title: 'example' }),
    factoryBibtexReference.build({ type: 'article', title: 'example2' }),
  ];

  const orcidResponse = {
    title: 'Jane Doe (0000-0000-0000-0000) - ORCID | Connecting Research and Researchers',
    displayName: 'Jane Doe',
    names: {
      visibility: {
        errors: [],
        required: true,
        getRequiredMessage: null,
        visibility: 'PUBLIC',
      },
      errors: [],
      givenNames: {
        errors: [],
        value: 'john',
        required: true,
        getRequiredMessage: null,
      },
      familyName: {
        errors: [],
        value: 'white',
        required: true,
        getRequiredMessage: null,
      },
      creditName: null,
    },
    biography: null,
    otherNames: {
      errors: [],
      otherNames: [],
      visibility: null,
    },
    countries: {
      errors: [],
      addresses: [],
      visibility: null,
    },
    keyword: {
      errors: [],
      keywords: [],
      visibility: null,
    },
    emails: {
      emails: [
        {
          value: 'john@example.com',
          primary: true,
          current: true,
          verified: true,
          visibility: 'PUBLIC',
          source: '0000-0000-0000-0000',
          sourceName: 'Jane Doe',
          assertionOriginOrcid: null,
          assertionOriginClientId: null,
          assertionOriginName: null,
          createdDate: {
            errors: [],
            month: '2',
            day: '3',
            year: '2023',
            required: true,
            getRequiredMessage: null,
          },
          lastModified: {
            errors: [],
            month: '2',
            day: '3',
            year: '2023',
            required: true,
            getRequiredMessage: null,
          },
          errors: [],
        },
      ],
      errors: [],
    },
    externalIdentifier: {
      errors: [],
      externalIdentifiers: [],
      visibility: null,
    },
    website: {
      errors: [],
      websites: [],
      visibility: null,
    },
    lastModifiedTime: 1675439623311,
  };

  const disciplines = ['Acoustics', 'Computing'];

  const community = factoryCommunityDTO.build({
    preferredFileExtensions: [FileExtensions.Pdf],
  });

  function getDefaultDeposit(): DepositPopulatedDTO {
    return factoryDepositPopulatedDTO.build({
      _id: '60c3799a103070000856d462',
      disciplines: ['Acoustics', 'Computing'],
      abstract: 'abstract',
      authors: [
        {
          firstName: 'John',
          lastName: 'Doe',
          email: 'johndoe@gmail.com',
          credit: [],
          institutions: [],
        },
        {
          firstName: 'William',
          lastName: 'Wallace',
          email: 'joestev@gmail.com',
          credit: [],
          institutions: [],
        },
      ],
      reviewType: ReviewType.OpenReview,
      keywords: ['science', 'cloud'],
      references: [
        { reference: 'test1', url: 'myweb.com' },
        { reference: 'test2', url: 'myweb2.com' },
      ],
      bibtexReferences: [
        factoryBibtexReference.build({ type: 'article', title: 'example' }),
        factoryBibtexReference.build({ type: 'article', title: 'example2' }),
      ],
      publicationFile: factoryFileMetadata.build(),
      actions: ['edit', 'moderate', 'update'],
      community: factoryCommunityDTO.build()._id,
      communityPopulated: factoryCommunityDTO.build(),
    });
  }

  beforeEach(() => {
    const deposit = getDefaultDeposit();
    TestBed.configureTestingModule({
      imports: [
        DepositDetailsComponent,
        RouterTestingModule,
        MatSnackBarModule,
        NoopAnimationsModule,
        HttpClientTestingModule,
        FontAwesomeTestingModule,
        MatIconTestingModule,
        MockComponent(TableOfContentsComponent),
      ],
      providers: [
        MockProvider(ProfileService, {
          profile: new BehaviorSubject<UserPrivateDTO | undefined>(profile),
        }),
        MockProvider(FullScreenService, {
          setFullScreen: jest.fn().mockReturnValue(of({})),
        }),
        MockProvider(DisciplinesService, {
          getDisciplines: jest.fn().mockReturnValue(of(disciplines)),
        }),
        MockProvider(LocalStorageService, {
          read: jest.fn().mockReturnValue(of('true')),
          write: jest.fn().mockReturnValue(of('true')),
        }),
        MockProvider(BreakpointObserver, {
          observe: jest.fn().mockReturnValue(of({ matches: false, breakpoints: {} })),
        }),
        MockProvider(NGXLogger),
        MockProvider(DialogService),
        MockProvider(DefaultService, {
          getCommunity: jest.fn().mockReturnValue(of(factoryCommunityPopulatedDTO.build())),
          getIThenticateStatus: jest.fn().mockReturnValue(of({ active: true })),
          getIThenticateEULAAcceptance: jest.fn().mockReturnValue(of([{ acceptance: true }])),
          getSimilarityReportURL: jest.fn().mockReturnValue(of({})),
          acceptIThenticateEULA: jest.fn().mockReturnValue(of([{ eula: true }])),
          getDeposit: jest.fn().mockReturnValue(of({ ...deposit })),
          getIThenticateSubmissionInfo: jest.fn().mockReturnValue(of({ ...deposit })),
          getIThenticateReport: jest.fn().mockReturnValue(of({ ...deposit })),
          getOrcidData: jest.fn().mockReturnValue(of(orcidResponse)),
          uploadBibtexFile: jest.fn().mockReturnValue(of([bibtexResponse])),
          uploadFile: jest.fn().mockReturnValue(of({})),
          uploadFileConfirmationDeposit: jest
            .fn()
            .mockReturnValue(of(factoryDepositPopulatedDTO.build())),
        }),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(
              convertToParamMap({
                depositId: deposit._id,
              })
            ),
          },
        },
      ],
    });
  });

  it('should create', () => {
    const fixture = MockRender(DepositDetailsComponent);
    expect(fixture.point.componentInstance).toBeDefined();
    fixture.detectChanges();
    expect(fixture.point.componentInstance).toBeTruthy();
  });

  it('should disable form when canUpdateDeposit is false', () => {
    const fixture = MockRender(DepositDetailsComponent);
    const depositsService = fixture.point.injector.get(DepositsService);
    jest.spyOn(depositsService, 'canUpdateDeposit').mockReturnValue(false);
    assertIsDefined(fixture.point.componentInstance.deposit, 'deposit not found');
    fixture.point.componentInstance.refreshDeposit(fixture.point.componentInstance.deposit);
    expect(fixture.point.componentInstance.depositForm.disabled).toBe(true);
  });

  it('should remove an author', () => {
    const fixture = MockRender(DepositDetailsComponent);
    fixture.detectChanges();
    const selectAuthor = ngMocks.find<MatChipOption>(fixture, '[data-test=author-chip]');
    selectAuthor.componentInstance.select();
    fixture.detectChanges();
    assertIsDefined(fixture.point.componentInstance.deposit, 'deposit not found');
    expect(fixture.point.componentInstance.deposit.authors.length).toBe(2);
    fixture.detectChanges();
    const deleteAuthor = ngMocks.find(fixture, '[data-test=delete-author-button]');
    ngMocks.click(deleteAuthor);
    fixture.detectChanges();
    expect(fixture.point.componentInstance.deposit.authors.length).toBe(1);
  });

  it('should open acknowledgement modal and accept', () => {
    const fixture = MockRender(DepositDetailsComponent);
    assertIsDefined(fixture.point.componentInstance.deposit, 'deposit not found');
    jest.spyOn(fixture.point.componentInstance, 'canBeSentToPendingApproval').mockReturnValue(true);
    const dialogService = fixture.point.injector.get(DialogService);
    const spyDialog = jest.spyOn(dialogService, 'openCustom').mockReturnValue({
      afterClosed: () => of(true),
    } as MatDialogRef<CustomDialogComponent, boolean>);
    const spyFunction = jest
      .spyOn(fixture.point.componentInstance, 'sendToPendingApproval')
      .mockImplementation();
    fixture.point.componentInstance.openAcknowledgementModal();
    expect(spyFunction).toHaveBeenCalled();
    expect(spyDialog).toHaveBeenCalled();
  });

  it('should open acknowledgement modal and reject', () => {
    const fixture = MockRender(DepositDetailsComponent);
    fixture.detectChanges();
    assertIsDefined(fixture.point.componentInstance.deposit, 'deposit not found');
    jest.spyOn(fixture.point.componentInstance, 'canBeSentToPendingApproval').mockReturnValue(true);
    const dialogService = fixture.point.injector.get(DialogService);
    const spyDialog = jest.spyOn(dialogService, 'openCustom').mockReturnValue({
      afterClosed: () => of(false),
    } as MatDialogRef<CustomDialogComponent, boolean>);
    const spyFunction = jest
      .spyOn(fixture.point.componentInstance, 'sendToPendingApproval')
      .mockImplementation();
    fixture.point.componentInstance.openAcknowledgementModal();
    expect(spyFunction).not.toHaveBeenCalled();
    expect(spyDialog).toHaveBeenCalled();
  });

  it('should open acknowledgement modal but fail', () => {
    const fixture = MockRender(DepositDetailsComponent);
    jest
      .spyOn(fixture.point.componentInstance, 'canBeSentToPendingApproval')
      .mockReturnValue(false);
    const dialogService = fixture.point.injector.get(DialogService);
    const spyDialog = jest.spyOn(dialogService, 'openCustom');
    const spyFunction = jest.spyOn(fixture.point.componentInstance, 'sendToPendingApproval');

    fixture.point.componentInstance.openAcknowledgementModal();
    expect(spyFunction).not.toHaveBeenCalled();
    expect(spyDialog).not.toHaveBeenCalled();
  });

  it('should send to pending approval', fakeAsync(() => {
    const fixture = MockRender(DepositDetailsComponent);
    const apiService = fixture.point.injector.get(DefaultService);
    const profService = fixture.point.injector.get(ProfileService);
    const router = fixture.point.injector.get(Router);
    const spyApiService = jest.spyOn(apiService, 'submitDeposit').mockReturnValue(
      // eslint-disable-next-line
      of(getDefaultDeposit()) as any
    );
    const spyProfService = jest
      .spyOn(profService, 'getProfileFromApi')
      .mockReturnValue(of(profile));
    const spyRouter = jest.spyOn(router, 'navigateByUrl').mockImplementation();

    if (fixture.ngZone) {
      fixture.ngZone.run(() => fixture.point.componentInstance.sendToPendingApproval());
      tick(100);
    }
    expect(spyApiService).toHaveBeenCalled();
    expect(spyRouter).toHaveBeenCalledWith('deposits/submitted', expect.anything());
    expect(spyProfService).toHaveBeenCalled();
    flush();
  }));

  it('should send to pending approval but fail if not publicationFile', () => {
    const fixture = MockRender(DepositDetailsComponent);
    fixture.detectChanges();
    assertIsDefined(fixture.point.componentInstance.deposit, 'deposit not found');
    fixture.point.componentInstance.deposit.publicationFile = undefined;

    const snackBarService = fixture.point.injector.get(AppSnackBarService);
    const spySnackBar = jest.spyOn(snackBarService, 'error');

    fixture.point.componentInstance.sendToPendingApproval();
    expect(fixture.point.componentInstance.fileExpanded).toBeTruthy();
    expect(spySnackBar).toHaveBeenCalledWith('Upload your publication file');
  });

  it('should send to pending approval but fail if no deposit authors', () => {
    const fixture = MockRender(DepositDetailsComponent);
    assertIsDefined(fixture.point.componentInstance.deposit, 'deposit not found');
    fixture.point.componentInstance.deposit.authors = [];
    fixture.detectChanges();
    const snackBarService = fixture.point.injector.get(AppSnackBarService);
    const spySnackBar = jest.spyOn(snackBarService, 'error');
    fixture.point.componentInstance.sendToPendingApproval();
    fixture.detectChanges();
    expect(fixture.point.componentInstance.authorsExpanded).toBeTruthy();
    expect(spySnackBar).toHaveBeenCalledWith('Add publication authors');
  });

  it('should save', () => {
    const fixture = MockRender(DepositDetailsComponent);
    const apiService = fixture.point.injector.get(DefaultService);
    // eslint-disable-next-line
    const spy = jest
      .spyOn(apiService, 'updateDeposit')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
      .mockReturnValue(of(getDefaultDeposit() as any));
    fixture.point.componentInstance.save();
    expect(spy).toHaveBeenCalled();
  });

  it('should detect wrong file extension', () => {
    const fixture = MockRender(DepositDetailsComponent);
    assertIsDefined(fixture.point.componentInstance.deposit, 'deposit not found');
    fixture.point.componentInstance.deposit.communityPopulated = community;
    fixture.point.componentInstance.deposit.publicationFile = factoryFileMetadata.build({
      filename: 'test.docx',
    });
    fixture.point.componentInstance.refreshDeposit(fixture.point.componentInstance.deposit);

    expect(fixture.point.componentInstance.isPreferredFileExtension).toBe(false);
  });

  it('should delete deposit', fakeAsync(() => {
    const fixture = MockRender(DepositDetailsComponent);

    const dialogService = fixture.point.injector.get(DialogService);
    jest.spyOn(dialogService, 'openConfirm').mockReturnValue({
      afterClosed: () => of(true),
    } as MatDialogRef<ConfirmDialogComponent, boolean>);
    const apiService = fixture.point.injector.get(DefaultService);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
    const spyApiService = jest.spyOn(apiService, 'deleteDeposit').mockReturnValue(of('' as any));
    const router = fixture.point.injector.get(Router);
    const spyRouter = jest.spyOn(router, 'navigateByUrl').mockImplementation();

    // deleting a publication should trigger an async navigation
    if (fixture.ngZone) {
      fixture.ngZone.run(() => fixture.point.componentInstance.deleteDeposit());
      tick(100);
    }
    expect(spyRouter).toHaveBeenCalled();
    expect(spyApiService).toHaveBeenCalled();
    discardPeriodicTasks();
    flush();
  }));

  it('should delete deposit but decline', () => {
    const fixture = MockRender(DepositDetailsComponent);

    const dialogService = fixture.point.injector.get(DialogService);
    const defaultService = fixture.point.injector.get(DefaultService);

    jest.spyOn(dialogService, 'openConfirm').mockReturnValue({
      afterClosed: () => of(false),
    } as MatDialogRef<ConfirmDialogComponent, boolean>);
    const spy = jest.spyOn(defaultService, 'deleteDeposit');

    fixture.point.componentInstance.deleteDeposit();
    expect(spy).not.toHaveBeenCalled();
  });

  it('should delete file', () => {
    const fixture = MockRender(DepositDetailsComponent);

    const dialogService = fixture.point.injector.get(DialogService);
    jest.spyOn(dialogService, 'openConfirm').mockReturnValue({
      afterClosed: () => of(true),
    } as MatDialogRef<ConfirmDialogComponent, boolean>);
    const apiService = fixture.point.injector.get(DefaultService);
    const spyApiService = jest.spyOn(apiService, 'deleteDepositFile').mockReturnValue(
      // eslint-disable-next-line
      of(getDefaultDeposit() as any)
    );
    const snackBarService = fixture.point.injector.get(AppSnackBarService);
    const spySnackBar = jest.spyOn(snackBarService, 'info');

    fixture.point.componentInstance.deleteFile(getDefaultDeposit()._id);
    expect(spySnackBar).toHaveBeenCalledWith('File deleted');
    expect(spyApiService).toHaveBeenCalled();
  });

  it('should delete file but decline', () => {
    const fixture = MockRender(DepositDetailsComponent);

    const dialogService = fixture.point.injector.get(DialogService);
    jest.spyOn(dialogService, 'openConfirm').mockReturnValue({
      afterClosed: () => of(false),
    } as MatDialogRef<ConfirmDialogComponent, boolean>);
    const apiService = fixture.point.injector.get(DefaultService);
    const spyApiService = jest.spyOn(apiService, 'deleteDepositFile').mockReturnValue(
      // eslint-disable-next-line
      of(getDefaultDeposit() as any)
    );
    fixture.point.componentInstance.deleteFile(getDefaultDeposit()._id);
    expect(spyApiService).not.toHaveBeenCalled();
  });

  it('should generate mybinder URL', () => {
    const fixture = MockRender(DepositDetailsComponent);
    assertIsDefined(fixture.point.componentInstance.deposit, 'deposit not found');
    fixture.point.componentInstance.deposit.gitRepository = 'https://github.com/xxx/yyy';
    const result = fixture.point.componentInstance.getBinderURL(
      fixture.point.componentInstance.deposit.gitRepository
    );
    expect(result).toBe(`https://mybinder.org/v2/gh/xxx/yyy/HEAD?urlpath=lab`);
  });

  it('should submit to preprint', () => {
    const fixture = MockRender(DepositDetailsComponent);
    fixture.point.componentInstance.refreshDeposit(getDefaultDeposit());
    fixture.point.componentInstance.depositForm.markAsPristine();
    fixture.detectChanges();
    expect(fixture.point.componentInstance.canBeSentToPendingApproval()).toBe(true);
  });

  it('should not submit to preprint', () => {
    const fixture = MockRender(DepositDetailsComponent);
    fixture.point.componentInstance.refreshDeposit(getDefaultDeposit());
    fixture.point.componentInstance.depositForm.markAsDirty();
    expect(fixture.point.componentInstance.canBeSentToPendingApproval()).toBe(false);
  });

  it('should validate access right licenses', () => {
    const fixture = MockRender(DepositDetailsComponent);
    const deposit = getDefaultDeposit();
    deposit.accessRight = AccessRight.CcByNd;
    fixture.point.componentInstance.refreshDeposit(deposit);
    fixture.point.componentInstance.depositForm.markAsPristine();
    expect(fixture.point.componentInstance.canBeSentToPendingApproval()).toBe(false);
    const select = ngMocks.find<MatSelect>('[data-test=accessRightInput]');
    expect(select.componentInstance.options.length).toBe(2);
  });

  it('should prevent submit if title is empty', () => {
    const fixture = MockRender(DepositDetailsComponent);
    fixture.point.componentInstance.refreshDeposit(getDefaultDeposit());
    fixture.point.componentInstance.depositForm.controls.title.setValue('');
    expect(fixture.point.componentInstance.canBeSentToPendingApproval()).toBe(false);
  });

  it('should test doi listener', () => {
    const fixture = MockRender(DepositDetailsComponent);
    fixture.point.componentInstance.depositForm.controls.doi.setValue(
      'http://dx.doi.org/10.4121/3326451.0004.222'
    );
    expect(fixture.point.componentInstance.depositForm.controls.doi.value).toBe(
      '10.4121/3326451.0004.222'
    );
  });

  it('should add author', async () => {
    const fixture = MockRender(DepositDetailsComponent);
    await fixture.whenStable();
    fixture.detectChanges();
    const addAuthorButton = ngMocks.find(fixture, '[data-test=add-author-button]');
    ngMocks.click(addAuthorButton);
    fixture.detectChanges();
    const nameInput = ngMocks.find(fixture, '[data-test=name-author-input]');
    ngMocks.change(nameInput, 'Teresa');
    const surnameInput = ngMocks.find(fixture, '[data-test=surname-author-input]');
    ngMocks.change(surnameInput, 'Doe');
    const emailInput = ngMocks.find(fixture, '[data-test=email-author-input]');
    ngMocks.change(emailInput, 'Email@gmail.com');
    const button = ngMocks.find(fixture, '[data-test=save-author-button]');
    fixture.detectChanges();
    ngMocks.click(button);
    assertIsDefined(fixture.point.componentInstance.deposit, 'deposit not found');
    fixture.detectChanges();

    expect(fixture.point.componentInstance.deposit.authors.length).toBe(3);

    fixture.detectChanges();
    expect(fixture.point.componentInstance.deposit.authors[2].firstName).toBe('Teresa');
  });

  it('should not add author', () => {
    const fixture = MockRender(DepositDetailsComponent);
    fixture.detectChanges();
    const addAuthorButton = ngMocks.find(fixture, '[data-test=add-author-button]');
    ngMocks.click(addAuthorButton);
    fixture.detectChanges();
    const nameInput = ngMocks.find(fixture, '[data-test=name-author-input]');
    ngMocks.change(nameInput, 'Sara');
    const button = ngMocks.find(fixture, '[data-test=save-author-button]');
    ngMocks.click(button);
    assertIsDefined(fixture.point.componentInstance.deposit, 'deposit not found');

    expect(fixture.point.componentInstance.deposit.authors.length).toBe(2);
  });

  it('should not add author with wrong email', () => {
    const fixture = MockRender(DepositDetailsComponent);
    fixture.detectChanges();
    const addAuthorButton = ngMocks.find(fixture, '[data-test=add-author-button]');
    ngMocks.click(addAuthorButton);
    fixture.detectChanges();
    const nameInput = ngMocks.find(fixture, '[data-test=name-author-input]');
    ngMocks.change(nameInput, 'Pedro');
    const surnameInput = ngMocks.find(fixture, '[data-test=surname-author-input]');
    ngMocks.change(surnameInput, 'Doe');
    const emailInput = ngMocks.find(fixture, '[data-test=email-author-input]');
    ngMocks.change(emailInput, 'Email@gma');
    const button = ngMocks.find(fixture, '[data-test=save-author-button]');
    fixture.detectChanges();
    ngMocks.click(button);
    fixture.detectChanges();
    assertIsDefined(fixture.point.componentInstance.deposit, 'deposit not found');

    expect(fixture.point.componentInstance.deposit.authors.length).toBe(2);
  });

  it('should not add author with wrong ORCID', () => {
    const fixture = MockRender(DepositDetailsComponent);
    fixture.detectChanges();
    const addAuthorButton = ngMocks.find(fixture, '[data-test=add-author-button]');
    ngMocks.click(addAuthorButton);
    fixture.detectChanges();
    const nameInput = ngMocks.find(fixture, '[data-test=name-author-input]');
    ngMocks.change(nameInput, 'Michael');
    const surnameInput = ngMocks.find(fixture, '[data-test=surname-author-input]');
    ngMocks.change(surnameInput, 'Page');
    const orcidInput = ngMocks.find(fixture, '[data-test=orcid-author-input]');
    ngMocks.change(orcidInput, 'https://orcid.org/0000-0002-1825-009');
    const button = ngMocks.find(fixture, '[data-test=save-author-button]');
    fixture.detectChanges();
    ngMocks.click(button);
    fixture.detectChanges();
    assertIsDefined(fixture.point.componentInstance.deposit, 'deposit not found');

    expect(fixture.point.componentInstance.deposit.authors.length).toBe(2);
  });

  it('should add user as author', () => {
    const fixture = MockRender(DepositDetailsComponent);
    const button = ngMocks.find(fixture, '[data-test=add-me-button]');
    ngMocks.click(button);
    expect(fixture.point.componentInstance.authorsForm.value).toEqual({
      firstName: 'William',
      lastName: 'Wallace',
      email: 'test@example.com',
      orcid: '',
      credit: [],
      index: -1,
      institutions: [],
    });
  });

  it('should do onExit', () => {
    const fixture = MockRender(DepositDetailsComponent);
    assertIsDefined(fixture.point.componentInstance.depositForm, 'deposit form is not defined');
    fixture.point.componentInstance.depositForm.markAsPristine();
    fixture.point.componentInstance.onExit();
  });

  it('should do on exit not pristine', async () => {
    const fixture = MockRender(DepositDetailsComponent);
    fixture.point.componentInstance.depositForm.markAsDirty();
    await testOnExit(fixture);
  });

  it('should run onInputValueChange', () => {
    const fixture = MockRender(DepositDetailsComponent);
    fixture.point.componentInstance.onInputValueChange('example');
  });

  it('should select the author', () => {
    const fixture = MockRender(DepositDetailsComponent);
    fixture.detectChanges();
    const authorChips = ngMocks.findAll<MatChipOption>(fixture, '[data-test=author-chip]');
    fixture.detectChanges();
    expect(authorChips.length).toBe(2);
    authorChips[0].componentInstance.select();
    fixture.detectChanges();
    expect(fixture.point.componentInstance.authorsForm.value).toEqual(
      expect.objectContaining({ firstName: 'John', lastName: 'Doe', index: 0 })
    );
    authorChips[1].componentInstance.select();
    fixture.detectChanges();
    expect(fixture.point.componentInstance.authorsForm.value).toEqual(
      expect.objectContaining({ firstName: 'William', lastName: 'Wallace', index: 1 })
    );
  });

  it('should cancel the author selection', () => {
    const fixture = MockRender(DepositDetailsComponent);
    const authorChips = ngMocks.findAll<MatChipOption>(fixture, '[data-test=author-chip]');
    fixture.detectChanges();
    //Should show author edit
    fixture.point.componentInstance.editAuthor();
    expect(fixture.point.componentInstance.showAuthorEdit).toBe(true);
    expect(authorChips.length).toBe(2);
    authorChips[0].componentInstance.select();
    fixture.detectChanges();
    const cancelButton = ngMocks.find(fixture, '[data-test=cancel-author-button]');
    ngMocks.click(cancelButton);
    fixture.detectChanges();
    expect(fixture.point.componentInstance.authorsForm.value).toEqual(
      expect.objectContaining({ firstName: '', lastName: '', index: -1 })
    );
  });

  it('should generate doi', () => {
    const fixture = MockRender(DepositDetailsComponent);
    expect(fixture.point.componentInstance.doiMetadataText).toBeFalsy();
    const apiService = fixture.point.injector.get(DefaultService);
    const spyApiService = jest.spyOn(apiService, 'createDoi').mockReturnValue(
      of({
        data: '10.2222/972439723573',
      } as unknown as HttpEvent<StringDataPayload>)
    );
    fixture.point.componentInstance.registerDOI();
    expect(spyApiService).toHaveBeenCalled();
    expect(fixture.point.componentInstance.doiMetadataText).toBeTruthy();
  });

  it('should get doi', () => {
    const fixture = MockRender(DepositDetailsComponent);
    expect(fixture.point.componentInstance.doiMetadataJson).toStrictEqual({});
    const apiService = fixture.point.injector.get(DefaultService);
    const spyApiService = jest
      .spyOn(apiService, 'getDoi')
      .mockReturnValue(of({ data: { somedata: '' } } as unknown as HttpEvent<object>));
    fixture.point.componentInstance.getRegisteredDOIMetadata();
    expect(spyApiService).toHaveBeenCalled();
    expect(fixture.point.componentInstance.doiMetadataJson).toStrictEqual({
      data: { somedata: '' },
    });
  });

  it('should preview doi', () => {
    const fixture = MockRender(DepositDetailsComponent);
    const apiService = fixture.point.injector.get(DefaultService);
    const spyApiService = jest
      .spyOn(apiService, 'previewDOIRegistration')
      .mockReturnValue(of({ data: 'some text' } as unknown as HttpEvent<StringDataPayload>));
    fixture.point.componentInstance.previewDOI();
    expect(spyApiService).toHaveBeenCalled();
    expect(fixture.point.componentInstance.doiMetadataText).toBe('some text');

    // Now test if return value is json
    jest
      .spyOn(apiService, 'previewDOIRegistration')
      .mockReturnValue(
        of({ data: JSON.stringify({ somedata: '' }) } as unknown as HttpEvent<StringDataPayload>)
      );
    fixture.point.componentInstance.previewDOI();
    expect(spyApiService).toHaveBeenCalled();
    expect(fixture.point.componentInstance.doiMetadataJson).toStrictEqual({ somedata: '' });
  });

  it('should create submission', () => {
    const fixture = MockRender(DepositDetailsComponent);
    const snackBarService = fixture.point.injector.get(AppSnackBarService);
    const spySnackBar = jest.spyOn(snackBarService, 'info');
    const apiService = fixture.point.injector.get(DefaultService);
    jest.spyOn(apiService, 'createIThenticateSubmission').mockReturnValue(
      of({
        type: HttpEventType.Sent, // This time Sent will be traversed.
        body: {
          id: '',
          owner: '',
          title: '',
          status: SimpleSubmissionResponseStatusEnum.Created,
          created_time: '',
        },
        status: 200,
        loaded: 0,
      })
    );
    jest.spyOn(apiService, 'getIThenticateSubmissionInfo').mockReturnValue(
      of({
        type: HttpEventType.Sent,
        body: {
          id: '',
          owner: '',
          title: '',
          status: SimpleSubmissionResponseStatusEnum.Created,
          created_time: '',
        },
        status: 200,
        loaded: 0,
      })
    );
    fixture.point.componentInstance.createIThenticateSubmission();
    expect(spySnackBar).toHaveBeenCalled();
  });

  it('should upload file', () => {
    const fixture = MockRender(DepositDetailsComponent);
    assertIsDefined(fixture.point.componentInstance.deposit, 'deposit not found');

    fixture.point.componentInstance.deposit.iThenticate = {
      submissionId: 'id',
      submissionStatus: SimpleSubmissionResponseStatusEnum.Created,
    };
    const snackBarService = fixture.point.injector.get(AppSnackBarService);
    const spySnackBar = jest.spyOn(snackBarService, 'info');
    const apiService = fixture.point.injector.get(DefaultService);
    jest.spyOn(apiService, 'uploadFileToSubmission').mockReturnValue(
      of({
        type: HttpEventType.Sent,
        body: {
          message: 'message',
        },
        status: 200,
        loaded: 0,
      })
    );
    jest.spyOn(apiService, 'getIThenticateSubmissionInfo').mockReturnValue(
      of({
        type: HttpEventType.Sent,
        body: {
          id: '',
          owner: '',
          title: '',
          status: SimpleSubmissionResponseStatusEnum.Created,
          created_time: '',
        },
        status: 200,
        loaded: 0,
      })
    );

    fixture.point.componentInstance.uploadFileToSubmission();
    expect(spySnackBar).toHaveBeenCalled();
  });

  it('should generate report', () => {
    const fixture = MockRender(DepositDetailsComponent);
    assertIsDefined(fixture.point.componentInstance.deposit, 'deposit not found');

    fixture.point.componentInstance.deposit.iThenticate = {
      submissionId: 'id',
      submissionStatus: SimpleSubmissionResponseStatusEnum.Complete,
    };
    const snackBarService = fixture.point.injector.get(AppSnackBarService);
    const spySnackBar = jest.spyOn(snackBarService, 'info');
    const apiService = fixture.point.injector.get(DefaultService);
    jest.spyOn(apiService, 'generateSimilarityReport').mockReturnValue(
      of({
        type: HttpEventType.Sent,
        body: {
          response: 'response',
        },
        status: 200,
        loaded: 0,
      })
    );
    jest.spyOn(apiService, 'getIThenticateReport').mockReturnValue(
      of({
        type: HttpEventType.Sent,
        body: {
          id: 'id',
        },
        status: 200,
        loaded: 0,
      })
    );

    fixture.point.componentInstance.generateSimilarityReport();
    expect(spySnackBar).toHaveBeenCalled();
  });

  it('should get EULA', () => {
    const fixture = MockRender(DepositDetailsComponent);
    const apiService = fixture.point.injector.get(DefaultService);
    jest.spyOn(apiService, 'getIThenticateEULA').mockReturnValue(
      of({
        type: HttpEventType.Sent,
        body: {},
        status: 200,
        loaded: 0,
      })
    );
    const dialogService = fixture.point.injector.get(DialogService);
    const spyDialog = jest.spyOn(dialogService, 'openCustom').mockReturnValue({
      afterClosed: () => of(true),
    } as MatDialogRef<CustomDialogComponent, boolean>);

    fixture.point.componentInstance.getIThenticateEULA();
    expect(spyDialog).toHaveBeenCalled();
  });

  it('should get EULA similarity report', () => {
    const fixture = MockRender(DepositDetailsComponent);
    const apiService = fixture.point.injector.get(DefaultService);
    jest.spyOn(apiService, 'getSimilarityReportURL').mockReturnValue(of());
    fixture.point.componentInstance.getSimilarityReportURL();
  });

  it('should refresh ithenticate with no report', () => {
    const fixture = MockRender(DepositDetailsComponent);
    fixture.point.componentInstance.refreshIThenticate();
    expect(fixture.point.componentInstance.iThenticateSubmission).toBe(undefined);
  });

  it('should do before upload', () => {
    const fixture = MockRender(DepositDetailsComponent);
    fixture.point.componentInstance.depositForm.markAsPristine();
    const spy = fixture.point.componentInstance.beforeUpload(Event);
    expect(spy).toBe(true);
  });

  it('should beforeUpload communityform dirty', () => {
    const fixture = MockRender(DepositDetailsComponent);
    fixture.point.componentInstance.depositForm.markAsDirty();
    const canSave = fixture.point.componentInstance.beforeUpload(undefined);
    expect(canSave).toBe(false);
  });

  it('should show optional fields', () => {
    const fixture = MockRender(DepositDetailsComponent);
    fixture.point.componentInstance.optionalFields({
      source: {
        checked: true,
      },
    } as MatSlideToggleChange);
    const option = fixture.point.componentInstance.showOptionalFields;
    expect(option).toBe(true);
  });

  it('should not show optional fields', () => {
    const fixture = MockRender(DepositDetailsComponent);
    fixture.point.componentInstance.optionalFields({
      source: {
        checked: false,
      },
    } as MatSlideToggleChange);
    const option = fixture.point.componentInstance.showOptionalFields;
    expect(option).toBe(false);
  });

  it('should get user data from orcid', () => {
    const fixture = MockRender(DepositDetailsComponent);
    const spy = jest.spyOn(fixture.point.componentInstance, 'setOrcidData');
    const addAuthorButton = ngMocks.find(fixture, '[data-test=add-author-button]');
    ngMocks.click(addAuthorButton);
    fixture.detectChanges();
    const orcidInput = ngMocks.find<MatInput>(fixture, '[data-test=orcid-author-input]');
    ngMocks.change(orcidInput, 'https://orcid.org/0000-0000-0000-0000');
    fixture.detectChanges();
    expect(spy).toHaveBeenCalled();
  });

  it('should remove a reference', () => {
    const fixture = MockRender(DepositDetailsComponent);
    fixture.detectChanges();
    const selectReference = ngMocks.find<MatChipOption>(fixture, '[data-test=reference-chip]');
    selectReference.componentInstance.select();
    assertIsDefined(fixture.point.componentInstance.deposit, 'deposit not found');
    expect(fixture.point.componentInstance.deposit.references.length).toBe(2);
    fixture.detectChanges();
    const deleteButton = ngMocks.find(fixture, '[data-test=delete-reference-button]');
    ngMocks.click(deleteButton);
    expect(fixture.point.componentInstance.deposit.references.length).toBe(1);
  });

  it('should add reference', () => {
    const fixture = MockRender(DepositDetailsComponent);
    fixture.detectChanges();
    const addReferenceButton = ngMocks.find(fixture, '[data-test=add-reference-button]');
    ngMocks.click(addReferenceButton);
    fixture.detectChanges();
    const referenceInput = ngMocks.find(fixture, '[data-test=reference-input]');
    ngMocks.change(referenceInput, 'Reference');

    const referenceLinkInput = ngMocks.find(fixture, '[data-test=reference-input]');
    ngMocks.change(referenceLinkInput, 'https://publication.com');

    const button = ngMocks.find(fixture, '[data-test=save-reference-button]');
    fixture.detectChanges();
    ngMocks.click(button);
    assertIsDefined(fixture.point.componentInstance.deposit, 'deposit not found');

    expect(fixture.point.componentInstance.deposit.references.length).toBe(3);
  });

  it('should select the reference', () => {
    const fixture = MockRender(DepositDetailsComponent);
    fixture.detectChanges();
    const referenceChips = ngMocks.findAll<MatChipOption>(fixture, '[data-test=reference-chip]');
    expect(referenceChips.length).toBe(2);
    referenceChips[0].componentInstance.select();
    fixture.detectChanges();
    expect(fixture.point.componentInstance.referencesForm.value).toEqual(
      expect.objectContaining({ reference: 'test1', url: 'myweb.com', index: 0 })
    );
    referenceChips[1].componentInstance.select();
    fixture.detectChanges();
    expect(fixture.point.componentInstance.referencesForm.value).toEqual(
      expect.objectContaining({ reference: 'test2', url: 'myweb2.com', index: 1 })
    );
  });

  it('should cancel the reference selection', () => {
    const fixture = MockRender(DepositDetailsComponent);
    fixture.detectChanges();

    const referenceChips = ngMocks.findAll<MatChipOption>(fixture, '[data-test=reference-chip]');
    expect(referenceChips.length).toBe(2);
    referenceChips[0].componentInstance.select();
    fixture.detectChanges();
    const cancelButton = ngMocks.find(fixture, '[data-test=cancel-reference-button]');
    ngMocks.click(cancelButton);
    expect(fixture.point.componentInstance.referencesForm.value).toEqual(
      expect.objectContaining({ reference: '', url: '', index: -1 })
    );
  });

  it('should add bibtex reference', () => {
    const fixture = MockRender(DepositDetailsComponent);
    fixture.detectChanges();
    const referenceChips = ngMocks.findAll<MatChipOption>(
      fixture,
      '[data-test=bibtex-reference-chip]'
    );
    expect(referenceChips.length).toBe(2);

    const dialogService = fixture.point.injector.get(DialogService);
    const spy = jest.spyOn(dialogService, 'open').mockReturnValue({
      afterClosed: () => of(factoryBibtexReference.build()),
    } as MatDialogRef<BibtexEditComponent, BibtexReferences>);

    fixture.point.componentInstance.addBibtexReference();

    expect(spy).toHaveBeenCalled();
    expect(fixture.point.componentInstance.depositForm.controls.bibtexReferences.value.length).toBe(
      3
    );
    expect(fixture.point.componentInstance.depositForm.controls.bibtexReferences.value[2]).toEqual(
      expect.objectContaining(factoryBibtexReference.build())
    );
    expect(fixture.point.componentInstance.depositForm.controls.bibtexReferences.dirty).toBe(true);
  });

  it('should select bibtex reference', () => {
    const fixture = MockRender(DepositDetailsComponent);
    fixture.detectChanges();
    const referenceChip = ngMocks.find<MatChipOption>(fixture, '[data-test=bibtex-reference-chip]');

    const dialogService = fixture.point.injector.get(DialogService);
    const spy = jest.spyOn(dialogService, 'open').mockReturnValue({
      afterClosed: () => of(getDefaultDeposit().bibtexReferences[0]),
    } as MatDialogRef<BibtexEditComponent, BibtexReferences>);
    ngMocks.click(referenceChip);

    expect(spy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        data: { type: 'article', title: 'example', id: 'example', raw: '' },
      })
    );
    expect(
      fixture.point.componentInstance.depositForm.controls.bibtexReferences.value.length
    ).toEqual(2);
    expect(fixture.point.componentInstance.depositForm.controls.bibtexReferences.dirty).toBe(true);
  });

  it('should remove bibtex reference', () => {
    const fixture = MockRender(DepositDetailsComponent);
    fixture.detectChanges();
    const referenceChips = ngMocks.findAll<MatChipOption>(
      fixture,
      '[data-test=bibtex-reference-chip]'
    );

    expect(referenceChips.length).toBe(2);
    referenceChips[0].componentInstance.remove();

    expect(
      fixture.point.componentInstance.depositForm.controls.bibtexReferences.value.length
    ).toEqual(1);
    expect(fixture.point.componentInstance.depositForm.controls.bibtexReferences.dirty).toBe(true);
  });

  it('should add bibtex file', () => {
    const fixture = MockRender(DepositDetailsComponent);
    fixture.detectChanges();
    //Show reference edit
    fixture.point.componentInstance.editReference();
    expect(fixture.point.componentInstance.showReferenceEdit).toBe(true);
    const bibtexFile = ngMocks.find(fixture, '[data-test=bibtex-file]');
    ngMocks.click(bibtexFile);

    const referenceChips = ngMocks.findAll<MatChipOption>(
      fixture,
      '[data-test=bibtex-reference-chip]'
    );
    expect(referenceChips.length).toBe(2);
  });

  it('should upload the file', async () => {
    const fixture = MockRender(DepositDetailsComponent);
    fixture.detectChanges();
    const apiService = fixture.point.injector.get(DefaultService);
    // Test if the upload can be done and return false
    fixture.point.componentInstance.depositForm.markAsDirty();
    expect(fixture.point.componentInstance.beforeUpload(undefined)).toBe(false);
    // Test if the upload can be done and return true
    fixture.point.componentInstance.depositForm.markAsPristine();
    expect(fixture.point.componentInstance.beforeUpload(undefined)).toBe(true);
    const files: File[] = [
      // @ts-expect-error
      {
        lastModified: 1666681728398,
        name: 'logo8.svg',
        size: 2863,
        type: 'image/svg+xml',
        webkitRelativePath: '',
      },
    ];
    const originalEvent: HttpResponse<unknown> = {
      body: null,
      // @ts-expect-error
      headers: {},
      ok: true,
      status: 200,
      statusText: 'OK',
      type: 4,
      url: '',
    };
    const payload = {
      fileMetadata: {
        filename: 'logo8.svg',
        description: 'logo8.svg',
        contentType: 'image/svg',
        contentLength: 2863,
        tags: ['Deposits'],
      },
      isMainFile: false,
      replacePDF: false,
      signedUrl: '',
    };
    await fixture.point.componentInstance.filesUploaded({ originalEvent, files, payload });
    expect(apiService.uploadFileConfirmationDeposit).toHaveBeenCalled();
  });

  it('should generate signed URL', async () => {
    const fixture = MockRender(DepositDetailsComponent);
    await fixture.whenStable();
    fixture.detectChanges();

    const apiService = fixture.point.injector.get(DefaultService);
    // @ts-expect-error
    const file: File = {
      lastModified: 1666681728398,
      name: 'logo8.svg',
      size: 2863,
      type: 'image/svg+xml',
      webkitRelativePath: '',
    };

    const fileUploadComponent = {
      uploadFile: jest.fn().mockImplementation(),
    };

    await fixture.point.componentInstance.generateSignedUrl(
      // ts-ignore added for form data value
      // @ts-expect-error
      { fileObject: file, formData: {} },
      false,
      true,
      fileUploadComponent
    );
    expect(apiService.uploadFile).toHaveBeenCalled();
  });

  it('should import citations to bibtex', () => {
    const fixture = MockRender(DepositDetailsComponent);
    const dialogService = TestBed.inject(DialogService);
    const citation =
      'Erim, K. T. (1967, August). Ancient Aphrodisias and its marble treasures. National Geographic, 132(2), 280–294.';
    const citation2 =
      'Karim, K. T. (1967, August). Ancient Aphrodisias and its marble treasures. National Geographic, 132(2), 280–294.';
    jest.spyOn(dialogService, 'openInputDialog').mockReturnValue({
      afterClosed: () =>
        of({
          action: true,
          inputValue: citation + '\n' + citation2 + '\n' + 'invalidCitation',
        }),
    } as MatDialogRef<InputDialogComponent, InputDialogResponse>);
    const defaultService = TestBed.inject(DefaultService);
    const spy = jest
      .spyOn(defaultService, 'transformCitationsToBibtex')
      .mockReturnValue(
        of([citation, citation2, null] as unknown as HttpResponse<BibtexReferences[]>)
      );

    fixture.point.componentInstance.openImportCitationToBibtexDialog();

    expect(dialogService.openInputDialog).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith({
      citationsToBibtexBody: {
        citations: [citation, citation2, 'invalidCitation'],
      },
    });
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
