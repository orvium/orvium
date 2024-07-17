import { DepositViewComponent } from './deposit-view.component';
import { BehaviorSubject, of } from 'rxjs';
import {
  factoryAuthorDTO,
  factoryDepositPopulatedDTO,
  factoryFeedback,
  factoryFileMetadata,
  factoryReviewPopulatedDTO,
  factoryUserPrivateDTO,
} from '../../shared/test-data';
import { MockComponent, MockProvider, MockRender, ngMocks } from 'ng-mocks';
import { DefaultService, DepositStatus, UserPrivateDTO } from '@orvium/api';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { BreakpointObserver } from '@angular/cdk/layout';
import { SeoTagsService } from '../../services/seo-tags.service';
import { AppSnackBarService } from '../../services/app-snack-bar.service';
import { ProfileService } from '../../profile/profile.service';
import { NGXLogger } from 'ngx-logger';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FontAwesomeTestingModule } from '@fortawesome/angular-fontawesome/testing';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { DialogService } from '../../dialogs/dialog.service';
import { InviteService } from '../../services/invite.service';
import { HttpErrorResponse, HttpEvent } from '@angular/common/http';
import { AccessDeniedComponent } from '../../shared/access-denied/access-denied.component';
import { EthereumService } from '../../blockchain/ethereum.service';
import { ScriptService } from '../../services/script.service';
import { ButtonsMenuComponent } from '../../buttons-menu/buttons-menu.component';
import { ModerateDepositsService } from '../../services/moderate-deposits.service';

describe('DepositViewComponent', () => {
  const deposit = factoryDepositPopulatedDTO.build({ images: ['example image'] });
  const reviews = [factoryReviewPopulatedDTO.build()];
  const routeSnapshot = {
    paramMap: of(
      convertToParamMap({
        depositId: deposit._id,
        creator: deposit.creator,
      })
    ),
  };
  let defaultServiceMock: Partial<DefaultService>;

  beforeEach(() => {
    defaultServiceMock = {
      getDepositVersions: jest.fn().mockReturnValue(of(factoryDepositPopulatedDTO.buildList(2))),
      getReviews: jest.fn().mockReturnValue(of(reviews)),
      hasBeenInvited: jest.fn().mockReturnValue(of({})),
      updateDeposit: jest.fn().mockReturnValue(of({})),
      createDepositRevision: jest.fn().mockReturnValue(of(factoryDepositPopulatedDTO.build())),
      getCitation: jest.fn().mockReturnValue(of({})),
      createReview: jest.fn().mockReturnValue(of({})),
      createFeedback: jest.fn().mockReturnValue(of({})),
      getDeposit: jest
        .fn()
        .mockReturnValue(of(factoryDepositPopulatedDTO.build({ status: deposit.status }))),
      getComments: jest.fn().mockReturnValue(of([])),
    };

    TestBed.configureTestingModule({
      imports: [
        DepositViewComponent,
        NoopAnimationsModule,
        FontAwesomeTestingModule,
        MatIconTestingModule,
        MockComponent(AccessDeniedComponent),
        MockComponent(ButtonsMenuComponent),
      ],
      providers: [
        MockProvider(ProfileService, {
          profile: new BehaviorSubject<UserPrivateDTO | undefined>(factoryUserPrivateDTO.build()),
          updateProfile: jest.fn().mockReturnValue(of({})),
          getConversationLink: jest.fn().mockReturnValue(of({})),
          getProfile: jest.fn().mockReturnValue(of(factoryUserPrivateDTO.build())),
        }),
        MockProvider(BreakpointObserver, {
          isMatched: jest.fn().mockReturnValue(of({})),
          observe: jest.fn().mockReturnValue(of({ matches: false, breakpoints: {} })),
        }),
        MockProvider(DefaultService, defaultServiceMock),
        MockProvider(DialogService, {
          openConfirm: jest.fn().mockReturnValue(of({})),
          openCustom: jest.fn().mockReturnValue(of({})),
          openInputDialog: jest.fn().mockReturnValue(of({})),
        }),
        MockProvider(AppSnackBarService, {
          info: jest.fn().mockReturnValue(of({})),
          error: jest.fn().mockReturnValue(of({})),
        }),
        MockProvider(EthereumService, {
          isInitialized: true,
          getTokenBalance: jest.fn().mockResolvedValue(''),
          getTokenAllowance: jest.fn().mockResolvedValue(''),
        }),
        MockProvider(ModerateDepositsService, {
          openAcceptModalComplete: jest.fn().mockImplementation(() => of(deposit)),
          publishDeposit: jest.fn().mockImplementation(() => of(deposit)),
          openDraftModalComplete: jest.fn().mockImplementation(() => of(deposit)),
          openMergeModalComplete: jest.fn().mockImplementation(() => of(deposit)),
          openRejectModalComplete: jest.fn().mockImplementation(() => of(deposit)),
          openBackToPendingApprovalComplete: jest.fn().mockImplementation(() => of(deposit)),
        }),
        MockProvider(NGXLogger),
        { provide: ActivatedRoute, useValue: routeSnapshot },
        MockProvider(InviteService),
        MockProvider(ScriptService, {
          loadScript: jest.fn().mockReturnValue(of({})),
        }),
      ],
    });
  });

  it('should create', () => {
    const fixture = MockRender(DepositViewComponent);
    expect(fixture.point.componentInstance).toBeDefined();
    fixture.detectChanges();
    expect(fixture.point.componentInstance).toBeTruthy();
  });

  it('should set all SEO tags correctly', () => {
    const fixture = MockRender(DepositViewComponent);
    const seo = TestBed.inject(SeoTagsService);
    fixture.point.componentInstance.deposit.images = ['test'];
    fixture.point.componentInstance.deposit.publicationDate = '01/01/2020';
    fixture.point.componentInstance.deposit.submissionDate = '01/01/2019';
    fixture.point.componentInstance.deposit.publicationFile = factoryFileMetadata.build();
    fixture.point.componentInstance.deposit.authors[0] = factoryAuthorDTO.build();
    fixture.point.componentInstance.deposit.doi = 'http://dx.doi.org/10.4121/3326451.0004.222';
    fixture.point.componentInstance.deposit.extraMetadata = {
      conferenceTitle: 'my conference title',
      dissertationName: 'my dissertation name',
      inbookTitle: 'my inbook title',
      isbn: '123456890',
      issn: 'ISSN-615-682536',
      issue: 1,
      journalTitle: 'the best journal',
      language: 'es',
      publisher: 'test',
      volume: 4,
    };
    jest.spyOn(seo, 'setPublicationTags');
    fixture.point.componentInstance.setSEOTags();
    expect(seo.setPublicationTags).toHaveBeenCalled();
  });

  it('should create review when deposit has no reviews', () => {
    const fixture = MockRender(DepositViewComponent);
    const apiService = TestBed.inject(DefaultService);
    const router = TestBed.inject(Router);
    fixture.point.componentInstance.deposit.peerReviews = [];
    jest.spyOn(apiService, 'createReview').mockReturnValue(
      // @ts-expect-error
      of({ _id: 'myReviewID' })
    );
    jest.spyOn(router, 'navigate').mockImplementation();
    fixture.point.componentInstance.createReview();
    expect(apiService.createReview).toHaveBeenCalledWith({
      createReviewDTO: {
        deposit: fixture.point.componentInstance.deposit._id,
      },
    });
    expect(router.navigate).toHaveBeenCalledWith(['reviews', 'myReviewID', 'edit']);
  });

  it('should create review when there are reviews but not mine', () => {
    const fixture = MockRender(DepositViewComponent);
    const apiService = TestBed.inject(DefaultService);
    const router = TestBed.inject(Router);
    fixture.point.componentInstance.deposit.peerReviewsPopulated = [
      factoryReviewPopulatedDTO.build({ creator: 'not me' }),
    ];
    jest.spyOn(apiService, 'createReview').mockReturnValue(
      // @ts-expect-error
      of({ _id: 'myReviewID' })
    );
    jest.spyOn(router, 'navigate').mockImplementation();
    fixture.point.componentInstance.createReview();
    expect(apiService.createReview).toHaveBeenCalledWith({
      createReviewDTO: {
        deposit: fixture.point.componentInstance.deposit._id,
      },
    });
    expect(router.navigate).toHaveBeenCalledWith(['reviews', 'myReviewID', 'edit']);
  });

  it('should throw error creating review with no profile', () => {
    const fixture = MockRender(DepositViewComponent);
    fixture.point.componentInstance.profile = undefined;
    // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression,jest/unbound-method
    expect(fixture.point.componentInstance.createReview).toThrow();
  });

  it('should createRevision', () => {
    const fixture = MockRender(DepositViewComponent);
    const router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockImplementation();

    fixture.point.componentInstance.createRevision();
    const apiService = fixture.point.injector.get(DefaultService);
    expect(apiService.createDepositRevision).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalled();
  });

  it('should return error when trying to mark deposit with star', () => {
    const fixture = MockRender(DepositViewComponent);
    fixture.point.componentInstance.profile = undefined;
    fixture.point.componentInstance.star();
    const snackBarService = fixture.point.injector.get(AppSnackBarService);
    expect(snackBarService.error).toHaveBeenCalled();
  });

  it('should mark deposit with star', () => {
    const fixture = MockRender(DepositViewComponent);
    fixture.point.componentInstance.star();
    const profileService = fixture.point.injector.get(ProfileService);
    expect(profileService.updateProfile).toHaveBeenCalled();
  });

  it('should unmark deposit with star', () => {
    const fixture = MockRender(DepositViewComponent);
    fixture.point.componentInstance.profile = factoryUserPrivateDTO.build();
    fixture.point.componentInstance.star();
    const profileService = fixture.point.injector.get(ProfileService);
    expect(profileService.updateProfile).toHaveBeenCalled();
    fixture.point.componentInstance.star();
    expect(profileService.updateProfile).toHaveBeenCalled();
    expect(fixture.point.componentInstance.profile.starredDeposits.length).toBe(0);
  });

  it('should throw unauthorized error', () => {
    defaultServiceMock.getDeposit = jest.fn().mockImplementation(() => {
      // eslint-disable-next-line @typescript-eslint/no-throw-literal
      throw new HttpErrorResponse({ status: 401 });
    });
    const fixture = MockRender(DepositViewComponent);
    expect(fixture.point.componentInstance.unauthorized).toBe(true);
    const accessDenied = ngMocks.find(AccessDeniedComponent);
    expect(accessDenied).toBeDefined();
    expect((fixture.point.nativeElement as HTMLElement).innerHTML).toContain('<app-access-denied>');
  });

  it('should generate mybinder URL', () => {
    const fixture = MockRender(DepositViewComponent);
    fixture.point.componentInstance.deposit.gitRepository = 'https://github.com/xxx/yyy';
    fixture.point.componentInstance.refreshDeposit(deposit);
    expect(fixture.point.componentInstance.getBinderURL('https://github.com/xxx/yyy')).toBe(
      `https://mybinder.org/v2/gh/xxx/yyy/HEAD?urlpath=lab`
    );
  });

  it('should get track', () => {
    const fixture = MockRender(DepositViewComponent);
    deposit.communityPopulated.newTracks = [{ title: 'example', timestamp: 15 }];
    deposit.newTrackTimestamp = 15;
    fixture.point.componentInstance.refreshDeposit(deposit);
    expect(fixture.point.componentInstance.getBinderURL('https://github.com/xxx/yyy')).toBe(
      `https://mybinder.org/v2/gh/xxx/yyy/HEAD?urlpath=lab`
    );
  });

  it('should refresh deposit without publicationFile', () => {
    const fixture = MockRender(DepositViewComponent);
    fixture.point.componentInstance.deposit.publicationFile = undefined;
    fixture.point.componentInstance.deposit.files = [factoryFileMetadata.build()];
    fixture.point.componentInstance.refreshDeposit(fixture.point.componentInstance.deposit);
    expect(fixture.point.componentInstance.getBinderURL('https://github.com/xxx/yyy')).toBe(
      `https://mybinder.org/v2/gh/xxx/yyy/HEAD?urlpath=lab`
    );
  });

  it('should refresh prepint', () => {
    const fixture = MockRender(DepositViewComponent);
    deposit.status = DepositStatus.Preprint;
    fixture.point.componentInstance.refreshDeposit(deposit);
  });

  it('should open share dialog', () => {
    const params = { deposit: deposit };
    const fixture = MockRender(DepositViewComponent, params);
    const dialogService = fixture.point.injector.get(DialogService);
    const spy = jest.spyOn(dialogService, 'openCustom');
    fixture.point.componentInstance.openShare();
    expect(spy).toHaveBeenCalled();
  });

  it('should get publication file extension correctly', () => {
    const params = { deposit: deposit };
    const fixture = MockRender(DepositViewComponent, params);
    const depositUpdated = deposit;
    depositUpdated.pdfUrl = 'exampleURL';
    depositUpdated.publicationFile = factoryFileMetadata.build();
    depositUpdated.publicationFile.filename = 'test.odt';
    fixture.point.componentInstance.refreshDeposit(depositUpdated);
    expect(fixture.point.componentInstance.publicationFileExtension).toEqual('ODT');
  });

  it('should open InviteDialog', () => {
    const params = { deposit: deposit };
    const fixture = MockRender(DepositViewComponent, params);
    fixture.point.componentInstance.openInviteDialog();
  });

  it('should report', async () => {
    const feedback = factoryFeedback.build();
    const params = { deposit: deposit };
    const fixture = MockRender(DepositViewComponent, params);
    await fixture.whenStable();
    fixture.point.componentInstance.reportDeposit(feedback);
  });

  it('should return deposit 1 when returning deposit versions', () => {
    const fixture = MockRender(DepositViewComponent);
    const deposits = [
      factoryDepositPopulatedDTO.build({ version: 2 }),
      factoryDepositPopulatedDTO.build({ version: 1 }),
    ];
    expect(fixture.point.componentInstance.getVersion(deposits)).toBe(deposits[0]);
  });

  it('should claim article', async () => {
    const feedback = factoryFeedback.build();
    const params = { deposit: deposit };
    const fixture = MockRender(DepositViewComponent, params);
    await fixture.whenStable();
    fixture.point.componentInstance.claimArticle(feedback);
    const service = fixture.point.injector.get(DefaultService);
    const createFeedback = jest
      .spyOn(service, 'createFeedback')
      .mockReturnValue(of({} as HttpEvent<unknown>));
    expect(createFeedback).toHaveBeenCalled();
  });

  it('should open accept deposit and accept', async () => {
    const params = { deposit: deposit };
    const fixture = MockRender(DepositViewComponent, params);
    await fixture.whenStable();
    const moderateDepositsService = TestBed.inject(ModerateDepositsService);
    fixture.point.componentInstance.openAcceptModal();
    expect(moderateDepositsService.openAcceptModalComplete).toHaveBeenCalled();
  });

  it('should publish deposit', async () => {
    const params = { deposit: deposit };
    const fixture = MockRender(DepositViewComponent, params);
    await fixture.whenStable();
    const moderateDepositsService = TestBed.inject(ModerateDepositsService);
    fixture.point.componentInstance.publishDeposit();
    expect(moderateDepositsService.publishDeposit).toHaveBeenCalled();
  });

  it('should open draft deposit and draft', async () => {
    const params = { deposit: deposit };
    const fixture = MockRender(DepositViewComponent, params);
    await fixture.whenStable();
    const moderateDepositsService = TestBed.inject(ModerateDepositsService);
    fixture.point.componentInstance.openDraftModal();
    expect(moderateDepositsService.openDraftModalComplete).toHaveBeenCalled();
  });

  it('should open back to pending approval deposit and send back', async () => {
    const params = {
      deposit: factoryDepositPopulatedDTO.build({ status: DepositStatus.Preprint }),
    };
    const fixture = MockRender(DepositViewComponent, params);
    await fixture.whenStable();
    const moderateDepositsService = TestBed.inject(ModerateDepositsService);
    fixture.point.componentInstance.openBackToPendingApprovalDialog();
    expect(moderateDepositsService.openBackToPendingApprovalComplete).toHaveBeenCalled();
  });

  it('should open reject deposit and send reject', async () => {
    const params = { deposit: deposit };
    const fixture = MockRender(DepositViewComponent, params);
    await fixture.whenStable();
    const moderateDepositsService = TestBed.inject(ModerateDepositsService);
    fixture.point.componentInstance.openRejectModal();
    expect(moderateDepositsService.openRejectModalComplete).toHaveBeenCalled();
  });

  it('should open merge deposit and send merge', async () => {
    const params = { deposit: deposit };
    const fixture = MockRender(DepositViewComponent, params);
    await fixture.whenStable();
    const moderateDepositsService = TestBed.inject(ModerateDepositsService);
    fixture.point.componentInstance.openMergeModal();
    expect(moderateDepositsService.openMergeModalComplete).toHaveBeenCalled();
  });
});
