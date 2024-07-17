import { InviteReviewersDialogComponent } from './invite-reviewers-dialog.component';
import { of } from 'rxjs';
import { factoryDepositPopulatedDTO, factoryUserPrivateDTO } from '../../shared/test-data';
import { ProfileService } from '../../profile/profile.service';
import { CreateInviteDTO, DefaultService, InviteType } from '@orvium/api';
import { MockProvider, MockRender } from 'ng-mocks';
import { TestBed } from '@angular/core/testing';
import { AppSnackBarService } from '../../services/app-snack-bar.service';
import { MatNativeDateModule } from '@angular/material/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('InviteReviewersDialogComponent', () => {
  const deposit = factoryDepositPopulatedDTO.build();
  const profile = factoryUserPrivateDTO.build();

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [InviteReviewersDialogComponent, MatNativeDateModule, NoopAnimationsModule],
      providers: [
        MockProvider(ProfileService, {
          getProfile: jest.fn().mockReturnValue(of(profile)),
        }),
        MockProvider(DefaultService, {
          createInvite: jest.fn().mockReturnValue(of(profile)),
          postInvitePreview: jest.fn().mockReturnValue(of(profile)),
        }),
        MockProvider(AppSnackBarService, {
          info: jest.fn().mockReturnValue(of({})),
        }),
      ],
    });
  });

  it('should create', () => {
    const fixture = MockRender(InviteReviewersDialogComponent, {
      deposit: deposit,
      invitationType: InviteType.CopyEditing,
    });
    expect(fixture.point.componentInstance).toBeDefined();
    fixture.detectChanges();
    expect(fixture.point.componentInstance).toBeTruthy();
  });

  it('should create invitation', () => {
    const fixture = MockRender(InviteReviewersDialogComponent, { deposit: deposit });
    fixture.point.componentInstance.invitationType = InviteType.Review;
    fixture.point.componentInstance.inviteForm.controls.email.setValue('example@email.io');
    const apiService = fixture.point.injector.get(DefaultService);
    jest.spyOn(apiService, 'createInvite');
    const invitation: CreateInviteDTO = {
      inviteType: InviteType.Review,
      addressee: 'example@email.io',
      data: {
        depositId: fixture.point.componentInstance.deposit._id,
        reviewerName: '',
        message: '',
      },
    };

    fixture.point.componentInstance.createInvitation();
    expect(apiService.createInvite).toHaveBeenCalledWith({ createInviteDTO: invitation });
  });

  it('should create Testinvitation', () => {
    const fixture = MockRender(InviteReviewersDialogComponent, { deposit: deposit });
    fixture.point.componentInstance.invitationType = InviteType.Review;
    fixture.point.componentInstance.inviteForm.controls.email.setValue('example@example.io');
    fixture.point.componentInstance.inviteForm.controls.name.setValue('example');
    const apiService = fixture.point.injector.get(DefaultService);
    //spyOn(apiService, 'createTestInvite');
    const invitation: CreateInviteDTO = {
      inviteType: InviteType.Review,
      addressee: 'example@example.io',
      data: {
        depositId: fixture.point.componentInstance.deposit._id,
        reviewerName: 'example',
        message: '',
      },
    };

    fixture.point.componentInstance.createTestInvitation();
    expect(apiService.postInvitePreview).toHaveBeenCalledWith({ createInviteDTO: invitation });
  });

  it('should set template variables', () => {
    const fixture = MockRender(InviteReviewersDialogComponent, { deposit: deposit });
    fixture.point.componentInstance.invitationType = InviteType.Review;
    fixture.point.componentInstance.ngOnInit();
    expect(fixture.point.componentInstance.templateTitle).toBe('Invite Reviewer');
  });
});
