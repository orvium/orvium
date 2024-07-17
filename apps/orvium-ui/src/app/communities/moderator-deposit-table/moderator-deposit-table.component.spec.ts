import { MockProvider, MockRender } from 'ng-mocks';
import {
  factoryCommunityModeratorDTO,
  factoryDepositDTO,
  factoryDepositPopulatedDTO,
  factoryFileMetadata,
  factoryUserPrivateDTO,
  generateObjectId,
} from '../../shared/test-data';
import { MatSort } from '@angular/material/sort';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ReactiveFormsModule } from '@angular/forms';
import { ModeratorDepositTableComponent } from './moderator-deposit-table.component';
import { AppSnackBarService } from '../../services/app-snack-bar.service';
import { DialogService } from '../../dialogs/dialog.service';
import { CommunityService } from '../community.service';
import { SpinnerService } from '../../spinner/spinner.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { DefaultService, DepositPopulatedDTO } from '@orvium/api';
import { ProfileService } from '../../profile/profile.service';
import { Router } from '@angular/router';
import { ModerateDepositsService } from '../../services/moderate-deposits.service';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpEvent } from '@angular/common/http';
import { MatSelectChange } from '@angular/material/select';

describe('DepositsTableComponent', () => {
  const deposit = factoryDepositDTO.build({
    disciplines: ['Acoustics', 'Computing'],
    authors: [
      { firstName: 'John', lastName: 'Doe', credit: [], institutions: [] },
      {
        firstName: 'William',
        lastName: 'Wallace',
        credit: [],
        institutions: [],
      },
    ],
    keywords: ['science', 'cloud'],
    references: [{ reference: 'test1' }, { reference: 'test2' }],
    publicationFile: factoryFileMetadata.build(),
    community: '1',
  });

  const depositPopulated = factoryDepositPopulatedDTO.build();

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ModeratorDepositTableComponent,
        ReactiveFormsModule,
        HttpClientTestingModule,
        RouterTestingModule,
        NoopAnimationsModule,
      ],
      providers: [
        MockProvider(CommunityService, {
          getCommunityActions: jest.fn().mockReturnValue({
            moderate: true,
            update: true,
            submit: true,
          }),
        }),
        MockProvider(AppSnackBarService, {
          info: jest.fn().mockReturnValue('Info message'),
        }),
        MockProvider(DialogService, {
          openConfirm: jest.fn().mockReturnValue(of({})),
          openCustom: jest.fn().mockReturnValue(of({})),
          openInputDialog: jest.fn().mockReturnValue(of({})),
        }),
        MockProvider(SpinnerService, {
          show: jest.fn().mockReturnValue(of({})),
          hide: jest.fn().mockReturnValue(of({})),
        }),
        MockProvider(ModerateDepositsService, {
          openAcceptModalComplete: jest.fn().mockImplementation(() => of(deposit)),
          publishDeposit: jest.fn().mockImplementation(() => of(deposit)),
          openDraftModalComplete: jest.fn().mockImplementation(() => of(deposit)),
          openMergeModalComplete: jest.fn().mockImplementation(() => of(deposit)),
          openRejectModalComplete: jest.fn().mockImplementation(() => of(deposit)),
          openBackToPendingApprovalComplete: jest.fn().mockImplementation(() => of(deposit)),
        }),
        MockProvider(ProfileService, {
          getConversationLink: jest.fn().mockReturnValue(of({})),
          getProfile: jest.fn().mockReturnValue(of(factoryUserPrivateDTO.build())),
        }),
      ],
    });
  });

  it('should create', () => {
    const fixture = MockRender(ModeratorDepositTableComponent, {
      deposits: [deposit],
      tracks: [],
    });
    expect(fixture.point.componentInstance).toBeDefined();
    fixture.detectChanges();
    expect(fixture.point.componentInstance).toBeTruthy();
  });

  it('should open reject modal', () => {
    const fixture = MockRender(ModeratorDepositTableComponent, {
      deposits: [deposit],
      tracks: [],
    });
    const moderateDepositsService = TestBed.inject(ModerateDepositsService);
    jest
      .spyOn(moderateDepositsService, 'openRejectModalComplete')
      .mockReturnValue(of(depositPopulated));
    const spy = jest.spyOn(fixture.point.componentInstance.reject, 'emit');
    fixture.point.componentInstance.rejectDeposit(deposit);
    expect(moderateDepositsService.openRejectModalComplete).toHaveBeenCalled();
    expect(spy).toHaveBeenCalled();
  });

  it('should open reject modal with false dialog action', () => {
    const fixture = MockRender(ModeratorDepositTableComponent, {
      deposit: [deposit],
      tracks: [],
    });
    const moderateDepositsService = TestBed.inject(ModerateDepositsService);
    jest
      .spyOn(moderateDepositsService, 'openRejectModalComplete')
      .mockReturnValue(of(depositPopulated));
    fixture.point.componentInstance.rejectDeposit(deposit);
    expect(moderateDepositsService.openRejectModalComplete).toHaveBeenCalled();
  });

  it('should open draft modal', () => {
    const fixture = MockRender(ModeratorDepositTableComponent, {
      deposits: [deposit],
      tracks: [],
    });
    const moderateDepositsService = TestBed.inject(ModerateDepositsService);
    jest
      .spyOn(moderateDepositsService, 'openDraftModalComplete')
      .mockReturnValue(of(depositPopulated));

    const spy = jest.spyOn(fixture.point.componentInstance.draft, 'emit');
    fixture.point.componentInstance.draftDeposit(deposit);
    expect(moderateDepositsService.openDraftModalComplete).toHaveBeenCalled();
    expect(spy).toHaveBeenCalled();
  });

  it('should open draft modal with dialog action in false', () => {
    const fixture = MockRender(ModeratorDepositTableComponent, {
      deposit: [deposit],
      tracks: [],
    });
    const moderateDepositsService = TestBed.inject(ModerateDepositsService);
    jest
      .spyOn(moderateDepositsService, 'openDraftModalComplete')
      .mockReturnValue(of(depositPopulated));

    fixture.point.componentInstance.draftDeposit(deposit);
    expect(moderateDepositsService.openDraftModalComplete).toHaveBeenCalled();
  });

  it('should open back to pending approval modal', () => {
    const fixture = MockRender(ModeratorDepositTableComponent, {
      deposits: [deposit],
      tracks: [],
    });
    const moderateDepositsService = TestBed.inject(ModerateDepositsService);
    jest
      .spyOn(moderateDepositsService, 'openBackToPendingApprovalComplete')
      .mockReturnValue(of(depositPopulated));

    const spy = jest.spyOn(fixture.point.componentInstance.pendingApproval, 'emit');
    fixture.point.componentInstance.backToPendingApproval(deposit);
    fixture.detectChanges();
    expect(moderateDepositsService.openBackToPendingApprovalComplete).toHaveBeenCalled();
    expect(spy).toHaveBeenCalled();
  });

  it('should open back to pending approval modal with dialog action in false', () => {
    const fixture = MockRender(ModeratorDepositTableComponent, {
      deposit: [deposit],
      tracks: [],
    });
    const moderateDepositsService = TestBed.inject(ModerateDepositsService);
    jest
      .spyOn(moderateDepositsService, 'openBackToPendingApprovalComplete')
      .mockReturnValue(of(depositPopulated));

    const spy = jest.spyOn(fixture.point.componentInstance.pendingApproval, 'emit');
    fixture.point.componentInstance.backToPendingApproval(deposit);
    expect(moderateDepositsService.openBackToPendingApprovalComplete).toHaveBeenCalled();
    expect(spy).toHaveBeenCalled();
  });

  it('should emit publish event', () => {
    const fixture = MockRender(ModeratorDepositTableComponent, {
      deposit: [deposit],
      tracks: [],
    });
    const spy = jest.spyOn(fixture.point.componentInstance.publish, 'emit');
    fixture.point.componentInstance.publishDeposit(deposit);
    expect(spy).toHaveBeenCalled();
  });

  it('should cancel reject/accept modals', () => {
    const fixture = MockRender(ModeratorDepositTableComponent, {
      deposits: [deposit],
      tracks: [],
    });
    const spyReject = jest.spyOn(fixture.point.componentInstance.reject, 'emit');
    const spyAccept = jest.spyOn(fixture.point.componentInstance, 'acceptDeposit');
    const moderateDepositsService = TestBed.inject(ModerateDepositsService);
    jest
      .spyOn(moderateDepositsService, 'openAcceptModalComplete')
      .mockReturnValue(of(depositPopulated));
    fixture.point.componentInstance.acceptDeposit(deposit);
    expect(spyAccept).toHaveBeenCalled();

    jest
      .spyOn(moderateDepositsService, 'openRejectModal')
      .mockReturnValue(of({ action: true, inputValue: 'test' }));
    fixture.point.componentInstance.rejectDeposit(deposit);
    expect(spyReject).toHaveBeenCalled();
  });

  it('should cancel merge modals', () => {
    const fixture = MockRender(ModeratorDepositTableComponent, {
      deposits: [deposit],
      tracks: [],
    });
    const spyMergeEmit = jest.spyOn(fixture.point.componentInstance.merge, 'emit');
    const moderateDepositsService = TestBed.inject(ModerateDepositsService);
    jest
      .spyOn(moderateDepositsService, 'openMergeModalComplete')
      .mockReturnValue(of(depositPopulated));
    fixture.point.componentInstance.mergeDeposit(deposit);
    expect(spyMergeEmit).toHaveBeenCalled();
  });

  it('should trigger assignModerator event', () => {
    const fixture = MockRender(ModeratorDepositTableComponent, {
      deposits: [deposit],
      tracks: [],
      sort: new MatSort(),
    });
    const snackBarService = fixture.point.injector.get(AppSnackBarService);
    const spySnackBar = jest.spyOn(snackBarService, 'info');
    const apiService = fixture.point.injector.get(DefaultService);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
    jest.spyOn(apiService, 'assignEditor').mockReturnValue(of(deposit as any));
    //Add moderators to assing
    expect(fixture.point.componentInstance.moderators.length).toBe(0);
    fixture.point.componentInstance.moderators = [factoryCommunityModeratorDTO.build()];
    expect(fixture.point.componentInstance.moderators.length).toBe(1);
    fixture.point.componentInstance.findModerator(
      fixture.point.componentInstance.moderators[0].user.userId
    );
    fixture.point.componentInstance.assignModerator(
      fixture.point.componentInstance.moderators[0],
      deposit
    );
    expect(apiService.assignEditor).toHaveBeenCalled();
    expect(spySnackBar).toHaveBeenCalled();
  });

  it('should trigger removeModerator event', () => {
    const fixture = MockRender(ModeratorDepositTableComponent, {
      deposits: [deposit],
      tracks: [],
      sort: new MatSort(),
    });
    const apiService = TestBed.inject(DefaultService);
    jest.spyOn(apiService, 'assignEditor').mockReturnValue(of());
    fixture.point.componentInstance.removeModerator(deposit);
    expect(apiService.assignEditor).toHaveBeenCalled();
  });

  it('should trigger selectDecision event', () => {
    const fixture = MockRender(ModeratorDepositTableComponent, {
      deposits: [deposit],
      tracks: [],
      sort: new MatSort(),
    });
    const apiService = TestBed.inject(DefaultService);
    jest
      .spyOn(apiService, 'assignEditorialDecision')
      .mockImplementation(() => of(deposit as unknown as HttpEvent<DepositPopulatedDTO>));

    fixture.point.componentInstance.selectDecision(
      { value: 'presentation' } as MatSelectChange,
      deposit,
      0
    );
    expect(apiService.assignEditorialDecision).toHaveBeenCalled();
  });

  it('should open a Conversation', () => {
    const fixture = MockRender(ModeratorDepositTableComponent, {
      deposits: [deposit],
      tracks: [],
      sort: new MatSort(),
    });
    const profileService = TestBed.inject(ProfileService);
    const router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockImplementation();
    const params = { routerLink: '/chat', queryParam: { conversationId: generateObjectId() } };
    // @ts-expect-error
    const spy = jest.spyOn(profileService, 'getConversationLink').mockReturnValue(of(params));
    fixture.point.componentInstance.openConversation(factoryDepositDTO.build());
    expect(spy).toHaveBeenCalled();
  });
});
