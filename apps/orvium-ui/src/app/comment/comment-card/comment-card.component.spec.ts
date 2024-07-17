import { MockRender } from 'ng-mocks';
import { CommentCardComponent } from './comment-card.component';
import { factoryCommentDTO } from '../../shared/test-data';
import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

describe('CommentCardComponent', () => {
  const comment = factoryCommentDTO.build();

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CommentCardComponent, RouterTestingModule],
    });
  });

  it('should create', () => {
    const params = { comment: comment };
    const fixture = MockRender(CommentCardComponent, params);
    expect(fixture.point.componentInstance).toBeDefined();
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should toggle responses', () => {
    const params = { comment: comment };
    const fixture = MockRender(CommentCardComponent, params);
    const spy = jest.spyOn(fixture.point.componentInstance.isRepliesOpened, 'emit');
    fixture.point.componentInstance.toggleResponses();
    expect(spy).toHaveBeenCalled();
  });

  it('should toggle create response', () => {
    const params = { comment: comment };
    const fixture = MockRender(CommentCardComponent, params);
    fixture.point.componentInstance.toggleCreateResponse();
    expect(fixture.point.componentInstance.showReplyInput).toBeTruthy();
  });

  it('should send', () => {
    const params = { comment: comment };
    const fixture = MockRender(CommentCardComponent, params);
    const spy = jest.spyOn(fixture.point.componentInstance.replyContent, 'emit');
    fixture.point.componentInstance.send('hola');
    expect(spy).toHaveBeenCalled();
  });
});
