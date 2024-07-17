import { CommunityModeratorsComponent } from './community-moderators.component';
import { MockProvider, MockRender } from 'ng-mocks';
import { of } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import {
  factoryCommunityModeratorDTO,
  factoryUserPrivateDTO,
  factoryUserSummaryDTO,
  generateObjectId,
} from '../../shared/test-data';
import { DialogService } from '../../dialogs/dialog.service';
import { MatDialogRef } from '@angular/material/dialog';
import { RouterTestingModule } from '@angular/router/testing';
import { ModeratorRole } from '@orvium/api';
import { MatSelect } from '@angular/material/select';
import { ProfileService } from '../../profile/profile.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { CustomDialogComponent } from '../../dialogs/custom-dialog/custom-dialog.component';
import { ConfirmDialogComponent } from '../../dialogs/confirm-dialog/confirm-dialog.component';

describe('CommunityModeratorsComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CommunityModeratorsComponent, RouterTestingModule, HttpClientTestingModule],
      providers: [
        MockProvider(DialogService),
        MockProvider(ProfileService, {
          getConversationLink: jest.fn().mockReturnValue(of({})),
          getProfile: jest.fn().mockReturnValue(of(factoryUserPrivateDTO.build())),
        }),
      ],
    });
  });

  it('should create', () => {
    const fixture = MockRender(CommunityModeratorsComponent);
    expect(fixture.point.componentInstance).toBeDefined();
    fixture.detectChanges();
    expect(fixture.point.componentInstance).toBeTruthy();
  });

  it('should open AssignModeatorDialog correctly', () => {
    const fixture = MockRender(CommunityModeratorsComponent);
    const dialogService = TestBed.inject(DialogService);
    jest.spyOn(dialogService, 'openCustom').mockReturnValue({
      afterClosed: () => of(true),
    } as MatDialogRef<CustomDialogComponent, boolean>);
    fixture.point.componentInstance.openAssignModeatorDialog();
    expect(dialogService.openCustom).toHaveBeenCalled();
  });

  it('should open openChangeNotificationsDialog correctly', () => {
    const fixture = MockRender(CommunityModeratorsComponent);
    const dialogService = TestBed.inject(DialogService);
    jest.spyOn(dialogService, 'open').mockReturnValue({
      afterClosed: () => of(['track1']),
    } as MatDialogRef<CustomDialogComponent>);
    fixture.point.componentInstance.openChangeNotificationsDialog(
      factoryCommunityModeratorDTO.build()
    );
    expect(dialogService.open).toHaveBeenCalled();
  });

  it('should  emit update moderator event', () => {
    const fixture = MockRender(CommunityModeratorsComponent);
    const spy = jest.spyOn(fixture.point.componentInstance.updateModerator, 'emit');
    fixture.point.componentInstance.changeRole(
      {
        value: ModeratorRole.Moderator,
        source: {} as MatSelect,
      },
      factoryCommunityModeratorDTO.build()
    );

    expect(spy).toHaveBeenCalled();
  });

  it('should delete correctly', () => {
    const fixture = MockRender(CommunityModeratorsComponent);
    const dialogService = TestBed.inject(DialogService);
    jest.spyOn(dialogService, 'openConfirm').mockReturnValue({
      afterClosed: () => of(true),
    } as MatDialogRef<ConfirmDialogComponent, boolean>);
    fixture.point.componentInstance.delete(factoryUserSummaryDTO.build());
    expect(dialogService.openConfirm).toHaveBeenCalled();
  });

  it('should not delete', () => {
    const fixture = MockRender(CommunityModeratorsComponent);
    const dialogService = TestBed.inject(DialogService);
    jest.spyOn(dialogService, 'openConfirm').mockReturnValue({
      afterClosed: () => of(false),
    } as MatDialogRef<ConfirmDialogComponent, boolean>);
    fixture.point.componentInstance.delete(factoryUserSummaryDTO.build());
    expect(dialogService.openConfirm).toHaveBeenCalled();
  });

  it('should addModeratorEvent', () => {
    const fixture = MockRender(CommunityModeratorsComponent);
    jest.spyOn(fixture.point.componentInstance.addModerator, 'emit');
    fixture.point.componentInstance.addModeratorEvent();
    expect(fixture.point.componentInstance.addModerator.emit).toHaveBeenCalled();
  });

  it('should open a Conversation', () => {
    const fixture = MockRender(CommunityModeratorsComponent);
    const profileService = TestBed.inject(ProfileService);
    const router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockImplementation();
    const params = { routerLink: '/chat', queryParam: { conversationId: generateObjectId() } };
    // @ts-expect-error
    const spy = jest.spyOn(profileService, 'getConversationLink').mockReturnValue(of(params));
    fixture.point.componentInstance.openConversation(factoryCommunityModeratorDTO.build());
    expect(spy).toHaveBeenCalled();
  });
});
