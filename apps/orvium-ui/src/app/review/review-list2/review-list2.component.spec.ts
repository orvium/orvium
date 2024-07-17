import { ReviewList2Component } from './review-list2.component';
import { MockProvider, MockRender } from 'ng-mocks';
import { of } from 'rxjs';
import { ReviewStatus } from '@orvium/api';
import {
  factoryReviewPopulatedDTO,
  factoryUserPrivateDTO,
  generateObjectId,
} from '../../shared/test-data';
import { TestBed } from '@angular/core/testing';
import { DialogService } from '../../dialogs/dialog.service';
import { ConfirmDialogComponent } from '../../dialogs/confirm-dialog/confirm-dialog.component';

import { MatDialogRef } from '@angular/material/dialog';
import { ProfileService } from '../../profile/profile.service';
import { Router } from '@angular/router';
import {
  InputDialogComponent,
  InputDialogResponse,
} from '../../dialogs/input-dialog/input-dialog.component';

describe('ReviewList2Component', () => {
  const review = factoryReviewPopulatedDTO.build({ status: ReviewStatus.PendingApproval });

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ReviewList2Component],
      providers: [
        MockProvider(DialogService, {
          openConfirm: jest.fn().mockReturnValue({
            afterClosed: () => of(true),
          } as MatDialogRef<ConfirmDialogComponent, boolean>),
        }),
        MockProvider(ProfileService, {
          getConversationLink: jest.fn().mockReturnValue(of({})),
          getProfile: jest.fn().mockReturnValue(of(factoryUserPrivateDTO.build())),
        }),
      ],
    });
  });

  it('should create', () => {
    const fixture = MockRender(ReviewList2Component, { reviews: [] });
    fixture.point.componentInstance._reviews = [review];
    expect(fixture.point.componentInstance).toBeDefined();
    expect(fixture.point.componentInstance).toBeTruthy();
  });

  it('should send to draft review', () => {
    const fixture = MockRender(ReviewList2Component);
    fixture.point.componentInstance._reviews = [review];
    const spy = jest.spyOn(fixture.point.componentInstance.draft, 'emit');
    fixture.point.componentInstance.draftReview(review, 'my message');
    expect(spy).toHaveBeenCalled();
  });

  it('should open reject modal', () => {
    const fixture = MockRender(ReviewList2Component);
    fixture.point.componentInstance._reviews = [review];
    const dialogService = TestBed.inject(DialogService);
    jest.spyOn(dialogService, 'openInputDialog').mockReturnValue({
      afterClosed: () => of({ action: true, inputValue: 'test' }),
    } as MatDialogRef<InputDialogComponent, InputDialogResponse>);

    const spy = jest.spyOn(fixture.point.componentInstance.draft, 'emit');
    fixture.point.componentInstance.openRejectModal(review);
    expect(dialogService.openInputDialog).toHaveBeenCalled();
    expect(spy).toHaveBeenCalled();
  });

  it('should open accept modal', () => {
    const fixture = MockRender(ReviewList2Component);
    const dialogService = TestBed.inject(DialogService);
    jest.spyOn(dialogService, 'openInputDialog').mockReturnValue({
      afterClosed: () => of({ action: false } as InputDialogResponse),
    } as MatDialogRef<InputDialogComponent, InputDialogResponse>);
    fixture.point.componentInstance.openAcceptModal(review);
    expect(dialogService.openInputDialog).toHaveBeenCalled();
  });

  it('should cancel reject/accept modals', () => {
    const fixture = MockRender(ReviewList2Component);
    fixture.point.componentInstance._reviews = [review];
    const spyAccept = jest.spyOn(fixture.point.componentInstance, 'acceptReview');
    const dialogService = fixture.point.injector.get(DialogService);

    jest.spyOn(dialogService, 'openInputDialog').mockReturnValue({
      afterClosed: () => of({ action: false }),
    } as MatDialogRef<InputDialogComponent, InputDialogResponse>);
    fixture.point.componentInstance.openAcceptModal(review);
    expect(spyAccept).not.toHaveBeenCalled();

    jest.spyOn(dialogService, 'openInputDialog').mockReturnValue({
      afterClosed: () => of({ action: true }),
    } as MatDialogRef<InputDialogComponent, InputDialogResponse>);
    fixture.point.componentInstance.openAcceptModal(review);
    expect(spyAccept).toHaveBeenCalled();

    jest.spyOn(dialogService, 'openInputDialog').mockReturnValue({
      afterClosed: () => of({ action: false }),
    } as MatDialogRef<InputDialogComponent, InputDialogResponse>);
    const spyReject = jest.spyOn(fixture.point.componentInstance.draft, 'emit');
    fixture.point.componentInstance.openRejectModal(review);
    expect(spyReject).not.toHaveBeenCalled();

    jest.spyOn(dialogService, 'openInputDialog').mockReturnValue({
      afterClosed: () => of({ action: true }),
    } as MatDialogRef<InputDialogComponent, InputDialogResponse>);
    fixture.point.componentInstance.openRejectModal(review);
    expect(spyReject).toHaveBeenCalled();
  });

  it('should open a Conversation', () => {
    const fixture = MockRender(ReviewList2Component);
    const profileService = TestBed.inject(ProfileService);
    const router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockImplementation();
    const params = { routerLink: '/chat', queryParam: { conversationId: generateObjectId() } };
    // @ts-expect-error
    const spy = jest.spyOn(profileService, 'getConversationLink').mockReturnValue(of(params));
    fixture.point.componentInstance.openConversation(factoryReviewPopulatedDTO.build());
    expect(spy).toHaveBeenCalled();
  });
});
