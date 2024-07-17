import { MockComponent, MockProvider, MockRender } from 'ng-mocks';
import { factoryCommentDTO, factoryDepositPopulatedDTO } from '../../shared/test-data';
import { CreateCommentDTOResourceModelEnum, DefaultService } from '@orvium/api';
import { CommentSectionComponent } from './comment-section.component';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CommentWithResponsesComponent } from '../comment-with-responses/comment-with-responses.component';
import { FormBuilder } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';

describe('CommentsComponent', () => {
  const comment = factoryCommentDTO.build();

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        CommentSectionComponent,
        MockComponent(CommentWithResponsesComponent),
        RouterTestingModule.withRoutes([]),
      ],
      providers: [
        MockProvider(DefaultService, {
          getComments: jest.fn().mockReturnValue(of([comment])),
          createComment: jest.fn().mockReturnValue(of(comment)),
        }),
        FormBuilder,
      ],
    });
  });

  it('should create', () => {
    const fixture = MockRender(CommentSectionComponent, {
      resource: factoryDepositPopulatedDTO.build()._id,
      resourceModel: CreateCommentDTOResourceModelEnum.Deposit,
      canCreateComment: true,
    });
    expect(fixture.point.componentInstance).toBeDefined();
    fixture.detectChanges();
    expect(fixture.point.componentInstance).toBeTruthy();
  });

  it('should get comments', () => {
    const fixture = MockRender(CommentSectionComponent, {
      resource: factoryDepositPopulatedDTO.build()._id,
      resourceModel: CreateCommentDTOResourceModelEnum.Deposit,
      canCreateComment: true,
    });
    fixture.point.componentInstance.viewComments();
    const service = fixture.point.injector.get(DefaultService);
    expect(service.getComments).toHaveBeenCalled();
    expect(fixture.point.componentInstance.comments).toEqual([comment]);
  });

  it('should create main comment', () => {
    const deposit = factoryDepositPopulatedDTO.build();
    const fixture = MockRender(CommentSectionComponent, {
      resource: deposit._id,
      resourceModel: CreateCommentDTOResourceModelEnum.Deposit,
      canCreateComment: true,
    });
    fixture.point.componentInstance.createComment('My comment');
    const service = fixture.point.injector.get(DefaultService);
    expect(service.createComment).toHaveBeenCalledWith({
      createCommentDTO: {
        content: 'My comment',
        resource: deposit._id,
        resourceModel: CreateCommentDTOResourceModelEnum.Deposit,
      },
    });
  });
});
