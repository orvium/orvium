import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  CommentDTO,
  CreateCommentDTO,
  CreateCommentDTOResourceModelEnum,
  DefaultService,
  FeedbackDTO,
} from '@orvium/api';
import { AppSnackBarService } from '../../services/app-snack-bar.service';
import { MatMenuModule } from '@angular/material/menu';

import { MatTooltipModule } from '@angular/material/tooltip';
import { CommentCardComponent } from '../comment-card/comment-card.component';
import { MatIconModule } from '@angular/material/icon';
import { FeedbackDirective } from '../../shared/feedback/feedback.directive';

/**
 * Component for displaying a comment and managing its responses. This includes functionality
 * to reply, delete, and show or hide responses associated with the comment.
 */
@Component({
  selector: 'app-comment-with-responses',
  standalone: true,
  templateUrl: './comment-with-responses.component.html',
  styleUrls: ['./comment-with-responses.component.scss'],
  imports: [
    MatMenuModule,
    MatTooltipModule,
    CommentCardComponent,
    MatIconModule,
    FeedbackDirective,
  ],
})
export class CommentWithResponsesComponent implements OnInit {
  /**
   * Emits an event when a comment is deleted, allowing parent components to react appropriately.
   *
   * @output commentDeleted An EventEmitter that triggers when a comment is successfully deleted.
   */
  @Output() commentDeleted = new EventEmitter();

  /**
   * Required input specifying the resource identifier associated with the comment.
   *
   * @input resource The unique identifier for the resource being commented on.
   */
  @Input({ required: true }) resource!: string;

  /**
   * Required input specifying the model of the resource as defined in the backend. This helps in handling comments
   * specifically tailored to the type of resource.
   *
   * @input resourceModel The model type of the resource associated with the comment.
   */
  @Input({ required: true }) resourceModel!: CreateCommentDTOResourceModelEnum;

  /**
   * Required input for the main comment object. This component displays and manages this comment and its responses.
   *
   * @input comment The main comment DTO object.
   */
  @Input({ required: true }) comment!: CommentDTO;

  /**
   * Flag to show or hide replies to the comment.
   */
  showReplies = false;

  /**
   * Flag to show or hide the reply input field.
   */
  showReplyInput = false;

  /**
   * Array of comments representing replies to the main comment.
   */
  repliesComment: CommentDTO[] = [];

  /**
   * Array of comments representing replies to the main comment.
   */
  canDelete = false;

  /**
   * Boolean indicating if the current user can reply to the main comment.
   */
  canReply = false;

  /**
   * Constructor for the CommentWithResponsesComponent.
   *
   * @param {DefaultService} apiService - Service used to perform API requests related to chat functionalities
   * @param {AppSnackBarService} snackBar - snackBar service definition.
   */
  constructor(
    private apiService: DefaultService,
    private snackBar: AppSnackBarService
  ) {}

  /**
   * Initializes component state by determining permissions to delete and reply based on the comment's available actions.
   */
  ngOnInit(): void {
    this.canDelete = this.canDeleteComment(this.comment);
    this.canReply = this.canReplyComment(this.comment);
  }

  /**
   * Toggles the display of replies for the comment. Fetches replies if they are being shown for the first time.
   */
  toggleReplies(): void {
    this.showReplies = !this.showReplies;
    if (this.showReplies) {
      this.getReplies();
    }
  }

  /**
   * Fetches replies from the server for the given comment and updates the repliesComment array.
   */
  getReplies(): void {
    this.showReplies = true;
    this.apiService
      .getComments({ resource: this.resource, parent: this.comment._id })
      .subscribe(result => {
        this.repliesComment = result;
      });
  }

  /**
   * Toggles the visibility of the reply input field.
   */
  toggleReplyInput(): void {
    this.showReplyInput = !this.showReplyInput;
  }

  /**
   * Creates a reply for the main comment based on the input text, then updates the list of replies.
   *
   * @param {string} text Content of the reply to be created.
   */
  replyToComment(text: string): void {
    if (this.canReplyComment(this.comment)) {
      const comment: CreateCommentDTO = {
        content: text,
        resource: this.resource,
        resourceModel: this.resourceModel,
        parent: this.comment._id,
      };
      this.apiService.createComment({ createCommentDTO: comment }).subscribe(() => {
        this.comment.hasReplies = true;
        this.toggleReplyInput();
        this.getReplies();
      });
    }
  }

  /**
   * Deletes a specified comment or reply and notifies the parent component via the commentDeleted event.
   *
   * @param {string} id The ID of the comment or reply to be deleted.
   */
  deleteComment(id: string): void {
    const isReply = this.repliesComment.find(value => value._id === id);
    const commentToDelete = !!isReply ? isReply : this.comment;
    if (this.canDeleteComment(commentToDelete)) {
      this.apiService.deleteComment({ id: id }).subscribe(response => {
        this.commentDeleted.emit();
        this.snackBar.info('Comment delete');
      });
    }
  }

  /**
   * Reports a comment based on user feedback. Sends the feedback data to the server and acknowledges the user action.
   *
   * @param {object} event The feedback event containing details about the feedback submitted.
   */
  reportComment(event: object): void {
    const feedback = event as FeedbackDTO;
    this.apiService.createFeedback({ feedbackDTO: feedback }).subscribe(data => {
      this.snackBar.info('Thank you for your feedback!');
    });
  }

  /**
   * Determines if the current user has permission to delete a specific comment.
   *
   * @param {CommentDTO} comment The comment to check for deletion permissions.
   * @returns {boolean} True if the user can delete the comment, false otherwise.
   */
  canDeleteComment(comment: CommentDTO): boolean {
    for (const action of comment.actions) {
      if (action === 'delete') {
        return true;
      }
    }
    return false;
  }

  /**
   * Determines if the current user has permission to reply to a specific comment.
   *
   * @param {CommentDTO} comment The comment to check for reply permissions.
   * @returns {boolean} True if the user can reply to the comment, false otherwise.
   */
  canReplyComment(comment: CommentDTO): boolean {
    for (const action of comment.actions) {
      if (action === 'reply') {
        return true;
      }
    }
    return false;
  }
}
