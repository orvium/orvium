import { DepositInvitationsPanelComponent } from './deposit-invitations-panel.component';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import {
  factoryDepositPopulatedDTO,
  factoryInvitePopulatedDTO,
  factoryUserPrivateDTO,
} from '../../shared/test-data';
import { ProfileService } from '../../profile/profile.service';
import { DefaultService, InviteDTO, InviteType, UserPrivateDTO } from '@orvium/api';
import { MockProvider, MockRender, ngMocks } from 'ng-mocks';
import { DepositsService } from '../deposits.service';
import { TestBed } from '@angular/core/testing';
import { DialogService } from '../../dialogs/dialog.service';
import { MatDialogRef } from '@angular/material/dialog';
import { CustomDialogComponent } from '../../dialogs/custom-dialog/custom-dialog.component';

describe('DepositInvitationsPanelComponent', () => {
  const deposit = factoryDepositPopulatedDTO.build();
  const routeSnapshot = {
    paramMap: of(
      convertToParamMap({
        depositId: deposit._id,
      })
    ),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DepositInvitationsPanelComponent],
      providers: [
        MockProvider(ProfileService, {
          profile: new BehaviorSubject<UserPrivateDTO | undefined>(factoryUserPrivateDTO.build()),
        }),
        MockProvider(DefaultService, {
          getDepositVersions: jest
            .fn()
            .mockReturnValue(of(factoryDepositPopulatedDTO.buildList(2))),
          getDepositInvites: jest
            .fn()
            .mockReturnValue(of([factoryInvitePopulatedDTO.build()] as InviteDTO[])),
          getDeposit: jest.fn().mockReturnValue(of(deposit)),
        }),
        MockProvider(DepositsService, {
          canInviteReviewers: jest.fn().mockReturnValue(true),
        }),
        { provide: ActivatedRoute, useValue: routeSnapshot },
      ],
    });
  });

  it('should create', () => {
    const fixture = MockRender(DepositInvitationsPanelComponent);
    expect(fixture.point.componentInstance).toBeDefined();
    fixture.detectChanges();
    expect(fixture.point.componentInstance).toBeTruthy();
  });

  it('should refresh correctly', () => {
    const fixture = MockRender(DepositInvitationsPanelComponent);
    const apiService = TestBed.inject(DefaultService);
    jest.spyOn(apiService, 'getDepositInvites');
    fixture.point.componentInstance.refresh();
    expect(apiService.getDepositInvites).toHaveBeenCalled();
  });

  it('should set review type', () => {
    const fixture = MockRender(DepositInvitationsPanelComponent);
    const dialogService = ngMocks.get(DialogService);
    fixture.point.componentInstance.inviteType = InviteType.CopyEditing;
    jest.spyOn(dialogService, 'openCustom').mockReturnValue({
      afterClosed: () => of(true),
    } as MatDialogRef<CustomDialogComponent, boolean>);
    fixture.point.componentInstance.inviteReviewer();
    expect(fixture.point.componentInstance.inviteType).toBe(InviteType.Review);
  });

  it('should inviteCopyEditor', () => {
    const fixture = MockRender(DepositInvitationsPanelComponent);
    const dialogService = ngMocks.get(DialogService);
    fixture.point.componentInstance.inviteType = InviteType.Review;
    jest.spyOn(dialogService, 'openCustom').mockReturnValue({
      afterClosed: () => of(true),
    } as MatDialogRef<CustomDialogComponent, boolean>);
    fixture.point.componentInstance.inviteCopyEditor();
    expect(fixture.point.componentInstance.inviteType).toBe(InviteType.CopyEditing);
  });

  it('should open video dialog', () => {
    const fixture = MockRender(DepositInvitationsPanelComponent);
    fixture.point.componentInstance.openVideo();
  });

  it('should return deposit 1 when returning deposit versions', () => {
    const fixture = MockRender(DepositInvitationsPanelComponent);
    const deposits = [
      factoryDepositPopulatedDTO.build({ version: 2 }),
      factoryDepositPopulatedDTO.build({ version: 1 }),
    ];
    expect(fixture.point.componentInstance.getVersion(deposits)).toBe(deposits[0]);
  });
});
