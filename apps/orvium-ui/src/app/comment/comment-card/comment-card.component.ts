import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommentDTO } from '@orvium/api';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { AvatarDirective } from '../../shared/directives/avatar.directive';

/**
 * Component for displaying a single comment card within a discussion or comment section.
 * It includes functionalities to reply to comments, toggle the visibility of replies, and emit actions related to these replies.
 */
@Component({
  selector: 'app-comment-card',
  templateUrl: './comment-card.component.html',
  styleUrls: ['./comment-card.component.scss'],
  standalone: true,
  imports: [RouterLink, MatIconModule, DatePipe, AvatarDirective],
})
export class CommentCardComponent {
  /**
   * The comment data to display, expected to be provided by the parent component.
   *
   * @input comment The comment object containing all relevant data.
   */
  @Input({ required: true }) comment!: CommentDTO;

  /**
   * Optional input to control the visibility of the reply input box within the comment card.
   * Defaults to false, indicating that the reply input box is initially hidden.
   *
   * @input showReplyInput A boolean that determines whether the reply input should be shown.
   */
  @Input() showReplyInput = false;

  /**
   * Emits a boolean value indicating whether the replies are opened or closed.
   *
   * @output isRepliesOpened Event emitter for toggling the visibility of replies.
   */
  @Output() isRepliesOpened: EventEmitter<boolean> = new EventEmitter<boolean>();

  /**
   * Emits the text content of a reply when it is sent.
   *
   * @output replyContent Event emitter for sending reply text content.
   */
  @Output() replyContent: EventEmitter<string> = new EventEmitter<string>();

  /**
   * A boolean to track whether the replies to a comment are currently shown or hidden.
   */
  showReplies = false;

  /**
   * Toggles the visibility of replies to the comment. This function will invert the current visibility state
   * and emit the new state to any listening components.
   */
  toggleResponses(): void {
    this.showReplies = !this.showReplies;
    this.isRepliesOpened.emit(this.showReplies);
  }

  /**
   * Toggles the visibility of the input field used to create a new response.
   */
  toggleCreateResponse(): void {
    this.showReplyInput = !this.showReplyInput;
  }

  /**
   * Emits the given text as a new reply to the comment. This is typically called when a user submits their reply through the UI.
   *
   * @param {string} text The content of the user's reply to be sent.
   */
  send(text: string): void {
    this.replyContent.emit(text);
  }
}
