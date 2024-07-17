import { ModeratorPanelComponent } from './moderator-panel.component';

import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import {
  factoryCallDTO,
  factoryCommunityDTO,
  factoryCommunityModeratorDTO,
  factoryCommunityPopulatedDTO,
  factoryDepositPopulatedDTO,
  factoryInvitePopulatedDTO,
  factoryReviewPopulatedDTO,
  factoryUserPrivateDTO,
  generateObjectId,
} from '../../shared/test-data';
import {
  CallDTO,
  DefaultService,
  DepositPopulatedDTO,
  DepositStatus,
  PaginationLimit,
  ReviewPopulatedDTO,
  ReviewStatus,
  StringDataPayload,
} from '@orvium/api';
import {
  MockComponent,
  MockDirective,
  MockInstance,
  MockProvider,
  MockRender,
  ngMocks,
} from 'ng-mocks';
import { ProfileService } from '../../profile/profile.service';
import { AppSnackBarService } from '../../services/app-snack-bar.service';
import { SearchBoxComponent } from '../../shared/search-box/search-box.component';
import { DialogService } from '../../dialogs/dialog.service';
import { TestBed } from '@angular/core/testing';
import { AccessDeniedComponent } from '../../shared/access-denied/access-denied.component';
import { ModeratorDepositTableComponent } from '../moderator-deposit-table/moderator-deposit-table.component';
import { CommunityModeratorsComponent } from '../community-moderators/community-moderators.component';
import { InfoToolbarComponent } from '../../shared/info-toolbar/info-toolbar.component';
import { DescriptionLineComponent } from '../../shared/description-line/description-line.component';
import { AlertComponent } from '../../shared/alert/alert.component';
import { HttpEvent } from '@angular/common/http';
import { CommunityService } from '../community.service';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { OverlayLoadingDirective } from '../../spinner/overlay-loading.directive';
import { ReviewList2Component } from '../../review/review-list2/review-list2.component';
import { SpinnerService } from '../../spinner/spinner.service';
import { MatSelectModule } from '@angular/material/select';
import { MatTab } from '@angular/material/tabs';
import { assertIsDefined } from '../../shared/shared-functions';
import { MatDialogRef } from '@angular/material/dialog';
import { CustomDialogComponent } from '../../dialogs/custom-dialog/custom-dialog.component';
import { ButtonsMenuComponent } from '../../buttons-menu/buttons-menu.component';
import { ConfirmDialogComponent } from '../../dialogs/confirm-dialog/confirm-dialog.component';
import { AlertDialogComponent } from '../../dialogs/alert-dialog/alert-dialog.component';

describe('ModeratorPanelComponent', () => {
  const profile = factoryUserPrivateDTO.build();
  const deposit = factoryDepositPopulatedDTO.build({ status: DepositStatus.PendingApproval });
  const invitation = factoryInvitePopulatedDTO.build();
  const invitationsQuery = { invites: [invitation], count: 1 };
  const depositsQuery = { deposits: [deposit], count: 1 };
  const review = factoryReviewPopulatedDTO.build({ status: ReviewStatus.PendingApproval });
  const reviewsQuery = { reviews: [review], count: 1 };
  const moderator = factoryCommunityModeratorDTO.build();
  const moderators = [moderator];
  const community = factoryCommunityPopulatedDTO.build({ moderatorsPopulated: moderators });
  const communityEmails = [
    { email: 'example@example', firstName: 'test', lastName: 'example', gravatar: '' },
  ];
  const withouInvitationsIds = [generateObjectId(), generateObjectId()];
  const routeSnapshot = {
    paramMap: of(
      convertToParamMap({
        communityId: community._id,
      })
    ),
    fragment: of({}),
  };

  beforeEach(() => {
    ngMocks.reset();
    TestBed.configureTestingModule({
      imports: [
        ModeratorPanelComponent,
        MockComponent(SearchBoxComponent),
        MockComponent(AccessDeniedComponent),
        ModeratorDepositTableComponent,
        MockComponent(ButtonsMenuComponent),
        MockComponent(CommunityModeratorsComponent),
        MockComponent(InfoToolbarComponent),
        MockComponent(DescriptionLineComponent),
        ReviewList2Component,
        MockComponent(AlertComponent),
        MockDirective(OverlayLoadingDirective),
        NoopAnimationsModule,
        MockComponent(SearchBoxComponent),
        MatSelectModule, // Included this because the MatPaginator is missing somthing about this._scrollStrategyFactory
      ],
      providers: [
        MockProvider(ProfileService, {
          getProfile: jest.fn().mockReturnValue(of(profile)),
        }),
        MockProvider(DialogService, {
          openVideo: jest.fn(),
          openCustom: jest.fn().mockReturnValue(of({})),
        }),
        MockProvider(SpinnerService, {
          hide: jest.fn(),
        }),
        MockProvider(CommunityService, {
          getCommunityActions: jest.fn().mockReturnValue({
            moderate: true,
            update: true,
            submit: true,
          }),
        }),
        MockProvider(DefaultService, {
          updateReview: jest.fn().mockReturnValue(of(review)),
          deleteModerator: jest.fn().mockReturnValue(of(null)),
          addModerator: jest.fn().mockReturnValue(of(null)),
          updateModerator: jest.fn().mockReturnValue(of(null)),
          getCommunity: jest.fn().mockReturnValue(of(community)),
          mergeRevisions: jest.fn().mockReturnValue(of(deposit)),
          updateDeposit: jest.fn().mockReturnValue(of(deposit)),
          getCommunityDepositsWithoutInvites: jest.fn().mockReturnValue(of(withouInvitationsIds)),
          getModeratorDeposits: jest.fn().mockReturnValue(of(depositsQuery)),
          getModeratorReviews: jest.fn().mockReturnValue(of(reviewsQuery)),
          getCommunityInvites: jest.fn().mockReturnValue(of(invitationsQuery)),
          sendEmailToUsers: jest.fn().mockReturnValue(of({})),
          getModeratorDepositsEmails: jest.fn().mockReturnValue(of(communityEmails)),
          getModeratorReviewsEmails: jest.fn().mockReturnValue(of(communityEmails)),
        }),
        MockProvider(AppSnackBarService, {
          info: jest.fn().mockReturnValue('Status changed to preprint'),
        }),
        { provide: ActivatedRoute, useValue: routeSnapshot },
      ],
    });
  });

  it('should create', async () => {
    const fixture = MockRender(ModeratorPanelComponent);
    expect(fixture.point.componentInstance).toBeDefined();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.point.componentInstance).toBeTruthy();
    expect(fixture.point.componentInstance.moderators).toEqual(moderators);
  });

  it('should accept deposit', () => {
    const fixture = MockRender(ModeratorPanelComponent);
    const apiService = fixture.point.injector.get(DefaultService);
    fixture.point.componentInstance.acceptDeposit(deposit);
    expect(apiService.getModeratorDeposits).toHaveBeenCalled();
  });

  it('should accept deposits in bulk', () => {
    const depositQuery = {
      deposits: factoryDepositPopulatedDTO.buildList(2, { status: DepositStatus.PendingApproval }),
      count: 2,
    };
    MockInstance(
      DefaultService,
      'getModeratorDeposits',
      jest.fn().mockReturnValue(of(depositQuery))
    );

    const fixture = MockRender(ModeratorPanelComponent);
    const apiService = TestBed.inject(DefaultService);
    const spyApi = jest
      .spyOn(apiService, 'acceptDeposit')
      .mockReturnValueOnce(of({} as unknown as HttpEvent<DepositPopulatedDTO>))
      .mockReturnValueOnce(throwError(() => new Error('Error')));
    const dialogService = fixture.point.injector.get(DialogService);
    const spyDialogAlert = jest.spyOn(dialogService, 'openAlert');
    const spyDialogConfirm = jest.spyOn(dialogService, 'openConfirm').mockReturnValue({
      afterClosed: () => of(true),
    } as MatDialogRef<ConfirmDialogComponent, boolean>);

    fixture.point.componentInstance.depositsTable?.selector.select(depositQuery.deposits[0]);
    fixture.point.componentInstance.depositsTable?.selector.select(depositQuery.deposits[1]);

    fixture.point.componentInstance.bulkDepositAccept();

    expect(spyApi).toHaveBeenCalledTimes(2);
    expect(spyDialogAlert).toHaveBeenCalledTimes(1);
    expect(spyDialogConfirm).toHaveBeenCalledTimes(1);
  });

  it('should publish deposit', () => {
    const fixture = MockRender(ModeratorPanelComponent);
    const apiService = fixture.point.injector.get(DefaultService);
    fixture.point.componentInstance.publishDeposit(deposit);
    expect(apiService.getModeratorDeposits).toHaveBeenCalled();
  });

  it('should return back to pending approval deposit', () => {
    const fixture = MockRender(ModeratorPanelComponent);
    const apiService = fixture.point.injector.get(DefaultService);
    fixture.point.componentInstance.pendingApproval(deposit);
    expect(apiService.getModeratorDeposits).toHaveBeenCalled();
  });

  it('should reject deposit', () => {
    const fixture = MockRender(ModeratorPanelComponent);
    const apiService = fixture.point.injector.get(DefaultService);
    fixture.point.componentInstance.rejectDeposit(deposit);
    expect(apiService.getModeratorDeposits).toHaveBeenCalled();
  });

  it('should draft deposit', () => {
    const fixture = MockRender(ModeratorPanelComponent);
    const apiService = fixture.point.injector.get(DefaultService);
    fixture.point.componentInstance.draftDeposit(deposit);
    expect(apiService.getModeratorDeposits).toHaveBeenCalled();
  });

  it('should update deposit status', () => {
    const fixture = MockRender(ModeratorPanelComponent);
    fixture.point.componentInstance.setDepositStatus(deposit, DepositStatus.Preprint);
    const apiService = fixture.point.injector.get(DefaultService);
    const snackBarService = fixture.point.injector.get(AppSnackBarService);
    expect(apiService.updateDeposit).toHaveBeenCalled();
    expect(apiService.getModeratorDeposits).toHaveBeenCalled();
    expect(snackBarService.info).toHaveBeenCalled();
  });

  it('should accept review', () => {
    const fixture = MockRender(ModeratorPanelComponent);
    const apiService = fixture.point.injector.get(DefaultService);
    const spy = jest
      .spyOn(apiService, 'publishedReview')
      .mockReturnValue(of(review as unknown as HttpEvent<ReviewPopulatedDTO>));
    fixture.point.componentInstance.publishReview({ review: review, reason: 'example' });
    expect(spy).toHaveBeenCalled();
  });

  it('should draft review', () => {
    const fixture = MockRender(ModeratorPanelComponent);
    const defaultService = fixture.point.injector.get(DefaultService);
    jest
      .spyOn(defaultService, 'draftReview')
      .mockReturnValue(of(review as unknown as HttpEvent<ReviewPopulatedDTO>));
    fixture.point.componentInstance.draftReview({ review, reason: 'my message' });
    expect(defaultService.draftReview).toHaveBeenCalledWith({
      id: review._id,
      moderateReviewPayload: { reason: 'my message' },
    });
  });

  it('should draft review without message', () => {
    const fixture = MockRender(ModeratorPanelComponent);
    const defaultService = fixture.point.injector.get(DefaultService);
    jest
      .spyOn(defaultService, 'draftReview')
      .mockReturnValue(of(review as unknown as HttpEvent<ReviewPopulatedDTO>));
    fixture.point.componentInstance.draftReview({ review, reason: '' });
    expect(defaultService.draftReview).toHaveBeenCalledWith({
      id: review._id,
      moderateReviewPayload: { reason: '' },
    });
  });

  it('should open video dialog', () => {
    const fixture = MockRender(ModeratorPanelComponent);
    fixture.point.componentInstance.openVideo();
  });

  it('should change tab', () => {
    const fixture = MockRender(ModeratorPanelComponent);
    fixture.detectChanges();
    const tabs = ngMocks.findAll('[role="tab"]');
    expect(tabs.length).toBe(4);

    const router = fixture.point.injector.get(Router);
    const spy = jest.spyOn(router, 'navigate').mockImplementation();
    fixture.point.componentInstance.onTabChanged({
      index: 1,
      tab: { textLabel: 'Reviews' } as MatTab,
    });
    expect(spy).toHaveBeenCalled();
  });

  it('should delete moderator', () => {
    const fixture = MockRender(ModeratorPanelComponent);
    fixture.point.componentInstance.deleteModerator(moderator.user._id);
    const apiService = fixture.point.injector.get(DefaultService);
    expect(apiService.deleteModerator).toHaveBeenCalled();
    expect(apiService.getCommunity).toHaveBeenCalled();
    expect(fixture.point.componentInstance.moderators).toEqual(moderators);
  });

  it('should add moderator', () => {
    const fixture = MockRender(ModeratorPanelComponent);
    fixture.point.componentInstance.addModerator('example@example.com');
    const apiService = fixture.point.injector.get(DefaultService);
    expect(apiService.addModerator).toHaveBeenCalled();
    expect(apiService.getCommunity).toHaveBeenCalled();
    expect(fixture.point.componentInstance.moderators).toEqual(moderators);
  });

  it('should update moderator', () => {
    const fixture = MockRender(ModeratorPanelComponent);
    moderator.notificationOptions = { tracks: [1, 2, 3] };
    fixture.point.componentInstance.updateModerator(moderator);
    const apiService = fixture.point.injector.get(DefaultService);
    expect(apiService.updateModerator).toHaveBeenCalled();
  });

  it('should show number of pending approval deposits/reviews/deposits-without-invites', () => {
    const fixture = MockRender(ModeratorPanelComponent);
    fixture.point.componentInstance.searchDeposits();
    fixture.point.componentInstance.getPapersPendingApprovalNumber();
    fixture.point.componentInstance.searchReviews();
    fixture.point.componentInstance.getReviewsPendingApprovalNumber();
    fixture.point.componentInstance.searchInvites();
    fixture.point.componentInstance.getPapersWithNoInvitations();
    expect(fixture.point.componentInstance.counterPendingApproval).toBe(1);
    expect(fixture.point.componentInstance.reviewsPendingApprovalNumber).toBe(1);
    expect(fixture.point.componentInstance.depositsWithoutInvitations.length).toBe(2);
  });

  it('should create a call', () => {
    const fixture = MockRender(ModeratorPanelComponent);
    const apiService = fixture.point.injector.get(DefaultService);
    const router = fixture.point.injector.get(Router);
    jest.spyOn(router, 'navigate').mockImplementation();
    jest
      .spyOn(apiService, 'createCall')
      .mockReturnValue(of(factoryCallDTO.build() as unknown as HttpEvent<CallDTO>));
    fixture.point.componentInstance.createCall();
    expect(apiService.createCall).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalled();
    fixture.point.componentInstance.profile = undefined;
    expect(() => fixture.point.componentInstance.createCall()).toThrow(
      new Error('There is no profile when trying to create a call')
    );
  });

  it('should show number of invitations pending', () => {
    const fixture = MockRender(ModeratorPanelComponent);
    fixture.point.componentInstance.getInvitationsPendingNumber();
    expect(fixture.point.componentInstance.invitesPendingResponse).toBe(1);
  });

  it('should call getCommunityInvites', () => {
    const fixture = MockRender(ModeratorPanelComponent);
    const pageEventMock = {
      pageIndex: 0,
      pageSize: 1,
      length: 1,
    };
    fixture.point.componentInstance.invitesPageChange(pageEventMock);
    const apiService = fixture.point.injector.get(DefaultService);
    expect(apiService.getCommunityInvites).toHaveBeenCalled();
  });

  it('should send community email for deposits', () => {
    const fixture = MockRender(ModeratorPanelComponent);
    const apiService = fixture.point.injector.get(DefaultService);
    const dialogService = fixture.point.injector.get(DialogService);
    // Open send email dialog
    jest.spyOn(dialogService, 'openCustom').mockReturnValue({
      afterClosed: () => of(true),
    } as MatDialogRef<CustomDialogComponent, boolean>);
    fixture.point.componentInstance.openSendCommunityEmailDialog();
    // Use that recipients
    fixture.point.componentInstance.sendCommunityEmail({
      subject: 'example',
      body: 'testing',
      recipients: [],
    });
    expect(apiService.sendEmailToUsers).toHaveBeenCalled();
  });

  it('should send community email for reviews', () => {
    const fixture = MockRender(ModeratorPanelComponent);
    const apiService = fixture.point.injector.get(DefaultService);
    const dialogService = fixture.point.injector.get(DialogService);
    // Open send email dialog
    jest.spyOn(dialogService, 'openCustom').mockReturnValue({
      afterClosed: () => of(true),
    } as MatDialogRef<CustomDialogComponent, boolean>);
    const router = fixture.point.injector.get(Router);
    const spy = jest.spyOn(router, 'navigate').mockImplementation();
    fixture.point.componentInstance.onTabChanged({
      index: 1,
      tab: { textLabel: 'Reviews' } as MatTab,
    });
    expect(spy).toHaveBeenCalled();
    fixture.point.componentInstance.openSendCommunityEmailDialog();
    // Use that recipients
    fixture.point.componentInstance.sendCommunityEmail({
      subject: 'example',
      body: 'testing',
      recipients: [],
    });
    expect(apiService.sendEmailToUsers).toHaveBeenCalled();
  });

  it('should get review emails', () => {
    const fixture = MockRender(ModeratorPanelComponent);
    const apiService = fixture.point.injector.get(DefaultService);

    const spy = jest.spyOn(apiService, 'getModeratorReviewsEmails').mockImplementation();
    fixture.point.componentInstance.getCommunityEmailRecipients({ textLabel: 'Reviews' } as MatTab);
    expect(spy).toHaveBeenCalled();
  });

  it('should download csv', () => {
    const community = factoryCommunityDTO.build();
    const fixture = MockRender(ModeratorPanelComponent, { community: community });
    const apiService = fixture.point.injector.get(DefaultService);

    const spyExportSubmissions = jest
      .spyOn(apiService, 'exportSubmissions')
      .mockReturnValue(of('' as unknown as HttpEvent<string>));
    global.URL.createObjectURL = jest.fn().mockImplementation();
    const spyWindowOpen = jest.spyOn(window, 'open').mockImplementation();
    fixture.point.componentInstance.downloadSubmisions();
    expect(spyExportSubmissions).toHaveBeenCalledWith({
      id: fixture.point.componentInstance.community._id,
    });
    expect(spyWindowOpen).toHaveBeenCalled();
  });

  describe('publicationsPageChange', () => {
    it('should call getModeratorDeposits', () => {
      const fixture = MockRender(ModeratorPanelComponent);
      const pageEventMock = {
        pageIndex: 1,
        pageSize: 1,
        length: 1,
      };
      fixture.point.componentInstance.publicationsPageChange(pageEventMock);
      const apiService = fixture.point.injector.get(DefaultService);
      expect(apiService.getModeratorDeposits).toHaveBeenCalledWith(
        expect.objectContaining({ limit: PaginationLimit._10 })
      );

      assertIsDefined(fixture.point.componentInstance.paginatorDeposits);
      fixture.point.componentInstance.paginatorDeposits.pageSize = 25;
      fixture.point.componentInstance.publicationsPageChange(pageEventMock);
      expect(apiService.getModeratorDeposits).toHaveBeenNthCalledWith(
        4,
        expect.objectContaining({ limit: PaginationLimit._25 })
      );
    });
  });

  describe('reviewsPageChange', () => {
    it('should call getModeratorDeposits', () => {
      const fixture = MockRender(ModeratorPanelComponent);
      const pageEventMock = {
        pageIndex: 1,
        pageSize: 1,
        length: 1,
      };
      fixture.point.componentInstance.reviewsPageChange(pageEventMock);
      const apiService = fixture.point.injector.get(DefaultService);
      expect(apiService.getModeratorReviews).toHaveBeenCalledWith(
        expect.objectContaining({ limit: PaginationLimit._10 })
      );

      assertIsDefined(fixture.point.componentInstance.paginatorReviews);
      fixture.point.componentInstance.paginatorReviews.pageSize = 25;
      fixture.point.componentInstance.reviewsPageChange(pageEventMock);
      expect(apiService.getModeratorReviews).toHaveBeenNthCalledWith(
        4,
        expect.objectContaining({ limit: PaginationLimit._25 })
      );
    });
  });

  describe('apply metrics filters', () => {
    it('should apply publications pending approval filter', () => {
      const fixture = MockRender(ModeratorPanelComponent);
      const apiService = fixture.point.injector.get(DefaultService);
      fixture.point.componentInstance.setFilterPublicationsPendingApproval();
      expect(apiService.getModeratorDeposits).toHaveBeenCalledWith(
        expect.objectContaining({ status: DepositStatus.PendingApproval })
      );
    });

    it('should apply reviews pending approval filter', () => {
      const fixture = MockRender(ModeratorPanelComponent);
      const apiService = fixture.point.injector.get(DefaultService);
      fixture.point.componentInstance.setFilterReviewsPendingApproval();
      expect(apiService.getModeratorReviews).toHaveBeenCalledWith(
        expect.objectContaining({ reviewStatus: ReviewStatus.PendingApproval })
      );
    });

    it('should apply publications without invitations filter', () => {
      const fixture = MockRender(ModeratorPanelComponent);
      const apiService = fixture.point.injector.get(DefaultService);
      fixture.point.componentInstance.setFilterPublicationsWithOutInvitations();
      expect(apiService.getModeratorDeposits).toHaveBeenCalled();
    });

    it('should apply review invitations pending filter', () => {
      const fixture = MockRender(ModeratorPanelComponent);
      const apiService = fixture.point.injector.get(DefaultService);
      fixture.point.componentInstance.setFilterReviewsInvitationsPending();
      expect(apiService.getCommunityInvites).toHaveBeenCalled();
    });

    it('should apply review invitations about to expire filter', () => {
      const fixture = MockRender(ModeratorPanelComponent);
      const apiService = fixture.point.injector.get(DefaultService);
      fixture.point.componentInstance.setFilterReviewsInvitationsAboutToExpire();
      expect(apiService.getCommunityInvites).toHaveBeenCalled();
    });
  });

  describe('tabgroup index', () => {
    it('should change tabgroup index if the url fragment changes', () => {
      const activatedRouteMock = {
        paramMap: of(
          convertToParamMap({
            communityId: community._id,
          })
        ),
        fragment: new BehaviorSubject('Reviews'),
      };
      const fixture = MockRender(ModeratorPanelComponent, undefined, {
        providers: [{ provide: ActivatedRoute, useValue: activatedRouteMock }],
      });

      expect(fixture.point.componentInstance.selectedTab).toBe('Reviews');

      fixture.point.componentInstance.onTabChanged({
        index: 0,
        tab: { textLabel: 'Publications' } as unknown as MatTab,
      });
      expect(fixture.point.componentInstance.selectedTab).toBe('Publications');
      activatedRouteMock.fragment.next('');
      expect(fixture.point.componentInstance.selectedTab).toBe('Publications');
    });
  });

  describe('mergeDeposit', () => {
    it('should call mergeRevisions', () => {
      const fixture = MockRender(ModeratorPanelComponent);
      const apiService = fixture.point.injector.get(DefaultService);
      fixture.point.componentInstance.mergeDeposit(deposit);
      expect(apiService.getModeratorDeposits).toHaveBeenCalled();
    });
  });

  it('should generate deposit doi in bulk', () => {
    const depositQuery = {
      deposits: factoryDepositPopulatedDTO.buildList(3, {}),
      count: 3,
    };
    MockInstance(
      DefaultService,
      'getModeratorDeposits',
      jest.fn().mockReturnValue(of(depositQuery))
    );

    const fixture = MockRender(ModeratorPanelComponent);
    const apiService = TestBed.inject(DefaultService);
    const spyApi = jest
      .spyOn(apiService, 'createDoi')
      .mockReturnValueOnce(of({ data: '' } as unknown as HttpEvent<StringDataPayload>))
      .mockReturnValueOnce(
        throwError(() => {
          return {
            error: {
              message: 'test error',
            },
          };
        })
      )
      .mockReturnValueOnce(
        throwError(() => {
          return {
            error: {
              msg: 'test error',
            },
          };
        })
      );

    const dialogService = fixture.point.injector.get(DialogService);
    const spyDialogAlert = jest.spyOn(dialogService, 'openAlert');
    const spyDialogConfirm = jest.spyOn(dialogService, 'openConfirm').mockReturnValue({
      afterClosed: () => of(true),
    } as MatDialogRef<ConfirmDialogComponent, boolean>);

    fixture.point.componentInstance.depositsTable?.selector.select(depositQuery.deposits[0]);
    fixture.point.componentInstance.depositsTable?.selector.select(depositQuery.deposits[1]);
    fixture.point.componentInstance.depositsTable?.selector.select(depositQuery.deposits[2]);
    fixture.point.componentInstance.bulkDOIGenerationDeposits();

    expect(spyApi).toHaveBeenCalledTimes(3);
    expect(spyDialogAlert).toHaveBeenCalledTimes(1);
    expect(spyDialogConfirm).toHaveBeenCalledTimes(1);
  });

  it('should generate review doi in bulk', () => {
    const reviewQuery = {
      reviews: factoryReviewPopulatedDTO.buildList(3, {}),
      count: 3,
    };
    MockInstance(DefaultService, 'getModeratorReviews', jest.fn().mockReturnValue(of(reviewQuery)));

    const fixture = MockRender(ModeratorPanelComponent);
    const apiService = TestBed.inject(DefaultService);
    const spyApi = jest
      .spyOn(apiService, 'createDoiReview')
      .mockReturnValueOnce(of({} as unknown as HttpEvent<StringDataPayload>))
      .mockReturnValueOnce(
        throwError(() => {
          return {
            error: {
              message: 'test error',
            },
          };
        })
      )
      .mockReturnValueOnce(
        throwError(() => {
          return {
            error: {
              msg: 'test error',
            },
          };
        })
      );

    const dialogService = fixture.point.injector.get(DialogService);
    const spyDialogAlert = jest.spyOn(dialogService, 'openAlert').mockReturnValue({
      afterClosed: () => of(true),
    } as MatDialogRef<AlertDialogComponent, boolean>);
    const spyDialogConfirm = jest.spyOn(dialogService, 'openConfirm').mockReturnValue({
      afterClosed: () => of(true),
    } as MatDialogRef<ConfirmDialogComponent, boolean>);

    fixture.point.componentInstance.reviewTable?.selector.select(reviewQuery.reviews[0]);
    fixture.point.componentInstance.reviewTable?.selector.select(reviewQuery.reviews[1]);
    fixture.point.componentInstance.reviewTable?.selector.select(reviewQuery.reviews[2]);
    fixture.point.componentInstance.bulkDOIGenerationReviews();

    expect(spyApi).toHaveBeenCalledTimes(3);
    expect(spyDialogAlert).toHaveBeenCalledTimes(1);
    expect(spyDialogConfirm).toHaveBeenCalledTimes(1);
  });
});
