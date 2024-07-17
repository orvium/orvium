import { TestBed } from '@angular/core/testing';

import { ModerateDepositsService } from './moderate-deposits.service';
import { MockProvider, MockRender } from 'ng-mocks';
import { DialogService } from '../dialogs/dialog.service';
import { DefaultService, DepositStatus } from '@orvium/api';
import { of } from 'rxjs';
import { MatDialogRef } from '@angular/material/dialog';
import {
  InputDialogComponent,
  InputDialogResponse,
} from '../dialogs/input-dialog/input-dialog.component';
import { factoryDepositPopulatedDTO } from '../shared/test-data';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { ConfirmDialogComponent } from '../dialogs/confirm-dialog/confirm-dialog.component';

describe('ModerateDepositsService', () => {
  let service: ModerateDepositsService;
  let defaultServiceMock: Partial<DefaultService>;
  const deposit = factoryDepositPopulatedDTO.build();
  beforeEach(() => {
    defaultServiceMock = {
      depositToPendingApproval: jest
        .fn()
        .mockReturnValue(
          of(factoryDepositPopulatedDTO.build({ status: DepositStatus.PendingApproval }))
        ),
      publishDeposit: jest
        .fn()
        .mockReturnValue(of(factoryDepositPopulatedDTO.build({ status: DepositStatus.Published }))),
      mergeRevisions: jest
        .fn()
        .mockReturnValue(of(factoryDepositPopulatedDTO.build({ status: DepositStatus.Merged }))),
      rejectDeposit: jest
        .fn()
        .mockReturnValue(of(factoryDepositPopulatedDTO.build({ status: DepositStatus.Rejected }))),
      draftDeposit: jest
        .fn()
        .mockReturnValue(of(factoryDepositPopulatedDTO.build({ status: DepositStatus.Draft }))),
      acceptDeposit: jest
        .fn()
        .mockReturnValue(of(factoryDepositPopulatedDTO.build({ status: DepositStatus.Preprint }))),
    };

    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        NoopAnimationsModule,
        HttpClientTestingModule,
        MatSnackBarModule,
      ],
      providers: [
        MockProvider(DialogService, {
          openConfirm: jest.fn().mockReturnValue(of({})),
          openCustom: jest.fn().mockReturnValue(of({})),
          openInputDialog: jest.fn().mockReturnValue(of({})),
        }),
        MockProvider(DefaultService, defaultServiceMock),
      ],
    });
    service = TestBed.inject(ModerateDepositsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should open accept deposit and accept modal', async () => {
    const fixture = MockRender(ModerateDepositsService);
    await fixture.whenStable();
    const dialogService = TestBed.inject(DialogService);
    const spyDialog = jest.spyOn(dialogService, 'openInputDialog').mockReturnValue({
      afterClosed: () => of({ action: true }),
    } as MatDialogRef<InputDialogComponent, InputDialogResponse>);
    fixture.point.componentInstance.openAcceptModal().subscribe();
    expect(spyDialog).toHaveBeenCalled();
  });

  it('should open accept deposit and accept', async () => {
    const fixture = MockRender(ModerateDepositsService);
    await fixture.whenStable();
    const moderateService = TestBed.inject(ModerateDepositsService);
    const apiService = TestBed.inject(DefaultService);
    const spyApi = jest.spyOn(apiService, 'acceptDeposit').mockReturnValue(
      // eslint-disable-next-line
      of(factoryDepositPopulatedDTO.build({ status: DepositStatus.Preprint }) as any)
    );
    const spy = jest
      .spyOn(moderateService, 'openAcceptModal')
      .mockImplementation(() => of({ action: true, inputValue: 'test' }));
    fixture.point.componentInstance.openAcceptModalComplete(deposit, true).subscribe();
    expect(spy).toHaveBeenCalled();
    expect(spyApi).toHaveBeenCalled();
  });

  it('should publish deposit', async () => {
    const deposit = factoryDepositPopulatedDTO.build({ status: DepositStatus.Preprint });
    const fixture = MockRender(ModerateDepositsService);
    await fixture.whenStable();
    const apiService = TestBed.inject(DefaultService);
    const spyApi = jest.spyOn(apiService, 'publishDeposit').mockReturnValue(
      // eslint-disable-next-line
      of(factoryDepositPopulatedDTO.build({ status: DepositStatus.Published }) as any)
    );
    fixture.point.componentInstance.publishDeposit(deposit);
    expect(spyApi).toHaveBeenCalled();
  });

  it('should open draft deposit dialog', async () => {
    const fixture = MockRender(ModerateDepositsService);
    await fixture.whenStable();
    const dialogService = TestBed.inject(DialogService);
    const spyDialog = jest.spyOn(dialogService, 'openInputDialog').mockReturnValue({
      afterClosed: () => of({ action: true }),
    } as MatDialogRef<InputDialogComponent, InputDialogResponse>);
    fixture.point.componentInstance.openDraftModal();
    expect(spyDialog).toHaveBeenCalled();
  });

  it('should open draft deposit and draft', async () => {
    const fixture = MockRender(ModerateDepositsService);
    await fixture.whenStable();
    const moderateService = TestBed.inject(ModerateDepositsService);
    const apiService = TestBed.inject(DefaultService);
    const spyApi = jest.spyOn(apiService, 'draftDeposit').mockReturnValue(
      // eslint-disable-next-line
      of(factoryDepositPopulatedDTO.build({ status: DepositStatus.Preprint }) as any)
    );
    const spy = jest
      .spyOn(moderateService, 'openDraftModal')
      .mockImplementation(() => of({ action: true, inputValue: 'test' }));
    fixture.point.componentInstance.openDraftModalComplete(deposit, true).subscribe();
    expect(spyApi).toHaveBeenCalled();
    expect(spy).toHaveBeenCalled();
  });

  it('should open back to pending approval deposit and send back', async () => {
    const fixture = MockRender(ModerateDepositsService);
    await fixture.whenStable();
    const dialogService = TestBed.inject(DialogService);
    const spyDialog = jest.spyOn(dialogService, 'openInputDialog').mockReturnValue({
      afterClosed: () => of({ action: true, inputValue: 'test' }),
    } as MatDialogRef<InputDialogComponent, InputDialogResponse>);
    fixture.point.componentInstance.openBackToPendingApprovalComplete(deposit, true);
    expect(spyDialog).toHaveBeenCalled();
  });

  it('should open reject deposit dialog', async () => {
    const fixture = MockRender(ModerateDepositsService);
    await fixture.whenStable();
    const dialogService = TestBed.inject(DialogService);
    const spyDialog = jest.spyOn(dialogService, 'openInputDialog').mockReturnValue({
      afterClosed: () => of({ action: true }),
    } as MatDialogRef<InputDialogComponent, InputDialogResponse>);
    fixture.point.componentInstance.openRejectModal().subscribe();
    expect(spyDialog).toHaveBeenCalled();
  });

  it('should open reject deposit dialog and reject', async () => {
    const fixture = MockRender(ModerateDepositsService);
    await fixture.whenStable();
    const moderateService = TestBed.inject(ModerateDepositsService);
    const apiService = TestBed.inject(DefaultService);
    const spyApi = jest.spyOn(apiService, 'rejectDeposit').mockReturnValue(
      // eslint-disable-next-line
      of(factoryDepositPopulatedDTO.build({ status: DepositStatus.PendingApproval }) as any)
    );
    const spy = jest
      .spyOn(moderateService, 'openRejectModal')
      .mockImplementation(() => of({ action: true, inputValue: 'test' }));
    fixture.point.componentInstance.openRejectModalComplete(deposit, true).subscribe();
    expect(spyApi).toHaveBeenCalled();
    expect(spy).toHaveBeenCalled();
  });

  it('should open back to pending approval deposit dialog', async () => {
    const fixture = MockRender(ModerateDepositsService);
    await fixture.whenStable();
    const dialogService = TestBed.inject(DialogService);
    const spyDialog = jest.spyOn(dialogService, 'openInputDialog').mockReturnValue({
      afterClosed: () => of({ action: true }),
    } as MatDialogRef<InputDialogComponent, InputDialogResponse>);
    fixture.point.componentInstance.openBackToPendingApprovalDialog().subscribe();
    expect(spyDialog).toHaveBeenCalled();
  });

  it('should open back to pending approval deposit dialog and reject', async () => {
    const fixture = MockRender(ModerateDepositsService);
    await fixture.whenStable();
    const moderateService = TestBed.inject(ModerateDepositsService);
    const apiService = TestBed.inject(DefaultService);
    const spyApi = jest.spyOn(apiService, 'depositToPendingApproval').mockReturnValue(
      // eslint-disable-next-line
      of(factoryDepositPopulatedDTO.build({ status: DepositStatus.PendingApproval }) as any)
    );
    const spy = jest
      .spyOn(moderateService, 'openBackToPendingApprovalDialog')
      .mockImplementation(() => of({ action: true, inputValue: 'test' }));
    fixture.point.componentInstance.openBackToPendingApprovalComplete(deposit, true).subscribe();
    expect(spyApi).toHaveBeenCalled();
    expect(spy).toHaveBeenCalled();
  });

  it('should open merge deposit dialog', async () => {
    const fixture = MockRender(ModerateDepositsService);
    await fixture.whenStable();
    const dialogService = TestBed.inject(DialogService);
    const spyDialog = jest.spyOn(dialogService, 'openConfirm').mockReturnValue({
      afterClosed: () => of(true),
    } as MatDialogRef<ConfirmDialogComponent, boolean>);
    fixture.point.componentInstance.openMergeModal().subscribe();
    expect(spyDialog).toHaveBeenCalled();
  });

  it('should open merge deposit dialog and merge', async () => {
    const fixture = MockRender(ModerateDepositsService);
    await fixture.whenStable();
    const moderateService = TestBed.inject(ModerateDepositsService);
    const apiService = TestBed.inject(DefaultService);
    const spyApi = jest.spyOn(apiService, 'mergeRevisions').mockReturnValue(
      // eslint-disable-next-line
      of(factoryDepositPopulatedDTO.build({ status: DepositStatus.Preprint }) as any)
    );
    const spy = jest.spyOn(moderateService, 'openMergeModal').mockImplementation(() => of(true));
    fixture.point.componentInstance.openMergeModalComplete(deposit, true).subscribe();
    expect(spy).toHaveBeenCalled();
    expect(spyApi).toHaveBeenCalled();
  });
});
