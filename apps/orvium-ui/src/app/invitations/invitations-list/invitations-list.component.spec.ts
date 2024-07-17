import { InvitationsListComponent } from './invitations-list.component';
import { of } from 'rxjs';
import {
  factoryDepositPopulatedDTO,
  factoryInvitePopulatedDTO,
  factoryReviewPopulatedDTO,
  factoryUserPrivateDTO,
} from '../../shared/test-data';
import { MockProvider, MockRender } from 'ng-mocks';
import { DepositsService } from '../../deposits/deposits.service';
import { AppSnackBarService } from '../../services/app-snack-bar.service';
import { LoggerTestingModule } from 'ngx-logger/testing';
import { ProfileService } from '../../profile/profile.service';
import {
  DefaultService,
  InvitePopulatedDTO,
  InviteStatus,
  InviteType,
  ReviewStatus,
} from '@orvium/api';
import { SpinnerService } from '../../spinner/spinner.service';
import { DialogService } from '../../dialogs/dialog.service';
import { MatDialogRef } from '@angular/material/dialog';
import { HttpEvent } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ConfirmDialogComponent } from '../../dialogs/confirm-dialog/confirm-dialog.component';

describe('InvitationsListComponent', () => {
  const deposit = factoryDepositPopulatedDTO.build();
  const review = factoryReviewPopulatedDTO.build({ status: ReviewStatus.Draft });
  const invite = factoryInvitePopulatedDTO.build({ data: { depositId: deposit._id } });
  const profile = factoryUserPrivateDTO.build();

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [InvitationsListComponent],
      providers: [
        MockProvider(DepositsService, {
          canReviewDeposit: jest.fn().mockReturnValue(true),
        }),
        MockProvider(ProfileService, {
          getProfile: jest.fn().mockReturnValue(of(profile)),
        }),
        MockProvider(SpinnerService, {
          show: jest.fn().mockReturnValue(of({})),
        }),
        MockProvider(AppSnackBarService, {
          info: jest.fn().mockReturnValue(of({})),
          error: jest.fn().mockReturnValue(of({})),
        }),
        MockProvider(DefaultService),
        MockProvider(DialogService),
      ],
    });
  });

  it('should create', () => {
    const fixture = MockRender(InvitationsListComponent, {
      invites: [invite, invite],
    });
    expect(fixture.point.componentInstance).toBeDefined();
    fixture.detectChanges();
    expect(fixture.point.componentInstance).toBeTruthy();
  });

  it('should accept invite', () => {
    const fixture = MockRender(InvitationsListComponent, {
      invites: [{ ...invite, status: InviteStatus.Pending }],
    });
    const apiService = fixture.point.injector.get(DefaultService);
    const dialogService = TestBed.inject(DialogService);
    jest.spyOn(dialogService, 'openConfirm').mockReturnValue({
      afterClosed: () => of(true),
    } as MatDialogRef<ConfirmDialogComponent, boolean>);
    const apiSpy = jest.spyOn(apiService, 'updateInvite').mockReturnValue(
      // eslint-disable-next-line
      of({ ...invite, status: InviteStatus.Accepted } as any)
    );
    fixture.point.componentInstance.acceptInvite({ ...invite, status: InviteStatus.Pending });
    fixture.detectChanges();
    expect(apiSpy).toHaveBeenCalled();
    expect(invite.status).toBe(InviteStatus.Accepted);
  });

  it('should create review', async () => {
    const fixture = MockRender(InvitationsListComponent, {
      invites: [invite],
    });
    const apiService = fixture.point.injector.get(DefaultService);
    // eslint-disable-next-line
    const createReviewSpy = jest
      .spyOn(apiService, 'createReview')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
      .mockReturnValue(of(review as any));
    // eslint-disable-next-line
    jest.spyOn(apiService, 'getDeposit').mockReturnValue(of(deposit as any));
    fixture.detectChanges();
    await fixture.point.componentInstance.createReview(invite);
    expect(createReviewSpy).toHaveBeenCalled();
  });
});

describe('InvitationsListComponent Suite 2', () => {
  const deposit = factoryDepositPopulatedDTO.build();
  const invite = factoryInvitePopulatedDTO.build({ data: { depositId: deposit._id } });

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [InvitationsListComponent, RouterTestingModule],
      providers: [
        MockProvider(DepositsService, {
          canReviewDeposit: jest.fn().mockReturnValue(false),
        }),
        MockProvider(ProfileService, {
          getProfile: jest.fn().mockReturnValue(of(undefined)),
        }),
        MockProvider(SpinnerService, {
          show: jest.fn().mockReturnValue(of({})),
        }),
        MockProvider(DefaultService),
        MockProvider(AppSnackBarService),
        MockProvider(LoggerTestingModule),
        MockProvider(DialogService),
      ],
    });
  });

  it('should create', () => {
    const fixture = MockRender(InvitationsListComponent, {
      invites: [invite, invite],
    });
    expect(fixture.point.componentInstance).toBeDefined();
    fixture.detectChanges();
    expect(fixture.point.componentInstance).toBeTruthy();
  });

  it('should reject invite', () => {
    const fixture = MockRender(InvitationsListComponent, {
      invites: [invite, invite],
    });
    const apiService = fixture.point.injector.get(DefaultService);
    const dialogService = TestBed.inject(DialogService);
    jest.spyOn(dialogService, 'openConfirm').mockReturnValue({
      afterClosed: () => of(true),
    } as MatDialogRef<ConfirmDialogComponent, boolean>);
    const apiServiceSpy = jest.spyOn(apiService, 'updateInvite').mockReturnValue(
      of({
        _id: '1',
        addressee: 'test@example.com',
        sender: factoryUserPrivateDTO.build(),
        data: {},
        inviteType: InviteType.Review,
        status: InviteStatus.Rejected,
        deadline: new Date(),
        createdOn: new Date(),
        actions: [],
      } as unknown as HttpEvent<InvitePopulatedDTO>)
    );
    fixture.detectChanges();
    fixture.point.componentInstance.rejectInvite(invite);
    expect(apiServiceSpy).toHaveBeenCalled();
  });
});
