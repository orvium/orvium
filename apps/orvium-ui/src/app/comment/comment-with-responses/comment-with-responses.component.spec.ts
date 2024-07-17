import { CommentWithResponsesComponent } from './comment-with-responses.component';
import { MockProvider, MockRender } from 'ng-mocks';
import { of } from 'rxjs';
import {
  factoryCommentDTO,
  factoryDepositPopulatedDTO,
  factoryFeedback,
} from '../../shared/test-data';
import { AppSnackBarService } from '../../services/app-snack-bar.service';
import { CommentDTO, CreateCommentDTOResourceModelEnum, DefaultService } from '@orvium/api';
import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpResponse } from '@angular/common/http';

describe('CommentCardComponent', () => {
  const comment = factoryCommentDTO.build();
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CommentWithResponsesComponent, RouterTestingModule],
      providers: [
        MockProvider(DefaultService, {
          getComments: jest.fn().mockReturnValue(of([comment])),
          createComment: jest.fn().mockReturnValue(of(comment)),
          deleteComment: jest.fn().mockReturnValue(of(comment)),
          createFeedback: jest.fn().mockReturnValue(of([comment])),
        }),
        MockProvider(AppSnackBarService, {
          info: jest.fn().mockReturnValue('Status changed to preprint'),
        }),
      ],
    });
  });

  it('should create', () => {
    const fixture = MockRender(CommentWithResponsesComponent, {
      comment: comment,
      resource: factoryDepositPopulatedDTO.build()._id,
      resourceModel: CreateCommentDTOResourceModelEnum.Deposit,
    });
    expect(fixture.point.componentInstance).toBeDefined();
    fixture.detectChanges();
    expect(fixture.point.componentInstance).toBeTruthy();
  });

  it('should get replies', () => {
    const fixture = MockRender(CommentWithResponsesComponent, {
      comment: comment,
      resource: factoryDepositPopulatedDTO.build()._id,
      resourceModel: CreateCommentDTOResourceModelEnum.Deposit,
    });
    fixture.point.componentInstance.getReplies();
    const service = fixture.point.injector.get(DefaultService);
    expect(service.getComments).toHaveBeenCalled();
    expect(fixture.point.componentInstance.repliesComment).toEqual([comment]);
  });

  it('should create reply comment', () => {
    const deposit = factoryDepositPopulatedDTO.build();
    const fixture = MockRender(CommentWithResponsesComponent, {
      comment: { ...comment, actions: ['reply'] },
      resource: deposit._id,
      resourceModel: CreateCommentDTOResourceModelEnum.Deposit,
    });
    const service = fixture.point.injector.get(DefaultService);
    jest.spyOn(service, 'createComment');
    fixture.point.componentInstance.replyToComment('My comment');
    expect(service.createComment).toHaveBeenCalledWith({
      createCommentDTO: {
        content: 'My comment',
        resource: deposit._id,
        resourceModel: CreateCommentDTOResourceModelEnum.Deposit,
        parent: comment._id,
      },
    });
  });

  it('should hide replies', () => {
    const fixture = MockRender(CommentWithResponsesComponent, {
      comment: comment,
      resource: factoryDepositPopulatedDTO.build()._id,
      resourceModel: CreateCommentDTOResourceModelEnum.Deposit,
    });
    const service = fixture.point.injector.get(DefaultService);
    jest.spyOn(service, 'getComments');
    fixture.point.componentInstance.repliesComment = [comment];
    fixture.point.componentInstance.toggleReplies();
    expect(fixture.point.componentInstance.showReplies).toBeTruthy();
    expect(service.getComments).toHaveBeenCalled();
  });

  it('should set wants to reply', () => {
    const fixture = MockRender(CommentWithResponsesComponent, {
      comment: comment,
      resource: factoryDepositPopulatedDTO.build()._id,
      resourceModel: CreateCommentDTOResourceModelEnum.Deposit,
    });
    fixture.point.componentInstance.showReplyInput = false;
    fixture.point.componentInstance.toggleReplyInput();
    expect(fixture.point.componentInstance.showReplyInput).toBeTruthy();
  });

  it('should delete comment', () => {
    const comment = factoryCommentDTO.build();
    const fixture = MockRender(CommentWithResponsesComponent, {
      comment: { ...comment, actions: ['delete'] },
      resource: factoryDepositPopulatedDTO.build()._id,
      resourceModel: CreateCommentDTOResourceModelEnum.Deposit,
    });
    const apiService = fixture.point.injector.get(DefaultService);
    const snackBar = fixture.point.injector.get(AppSnackBarService);
    fixture.point.componentInstance.deleteComment(comment._id);
    expect(apiService.deleteComment).toHaveBeenCalledWith({ id: comment._id });
    expect(snackBar.info).toHaveBeenCalled();
  });

  it('should delete reply', () => {
    const comment = factoryCommentDTO.build();
    const fixture = MockRender(CommentWithResponsesComponent, {
      comment: { ...comment, actions: ['delete'] },
      resource: factoryDepositPopulatedDTO.build()._id,
      resourceModel: CreateCommentDTOResourceModelEnum.Deposit,
    });
    const reply = factoryCommentDTO.build({ parent: comment._id });

    jest
      .spyOn(fixture.point.injector.get(DefaultService), 'getComments')
      .mockReturnValue(
        of([{ ...reply, actions: ['delete'] }] as unknown as HttpResponse<CommentDTO[]>)
      );

    fixture.point.componentInstance.getReplies();
    const apiService = fixture.point.injector.get(DefaultService);
    const snackBar = fixture.point.injector.get(AppSnackBarService);
    fixture.point.componentInstance.deleteComment(reply._id);
    expect(apiService.deleteComment).toHaveBeenCalledWith({ id: reply._id });
    expect(snackBar.info).toHaveBeenCalled();
  });

  it('should report comment', () => {
    const feedback = factoryFeedback.build();
    const fixture = MockRender(CommentWithResponsesComponent, {
      comment: comment,
      resource: factoryDepositPopulatedDTO.build()._id,
      resourceModel: CreateCommentDTOResourceModelEnum.Deposit,
    });
    const service = fixture.point.injector.get(DefaultService);
    const snackBar = fixture.point.injector.get(AppSnackBarService);
    fixture.point.componentInstance.reportComment(feedback);
    expect(service.createFeedback).toHaveBeenCalled();
    expect(snackBar.info).toHaveBeenCalled();
  });
});
