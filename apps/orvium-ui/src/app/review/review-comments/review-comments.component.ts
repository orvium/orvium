import { Component, inject, Input, OnInit } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatButton } from '@angular/material/button';
import { Editor, NgxEditorModule, Toolbar } from 'ngx-editor';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  CommentDTO,
  CreateCommentDTOResourceModelEnum,
  DefaultService,
  ReviewPopulatedDTO,
} from '@orvium/api';
import { CommentCardComponent } from '../../comment/comment-card/comment-card.component';
import { Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { validateHTMLIsNotBlank } from '../../shared/AppCustomValidators';
import { FeedbackDirective } from '../../shared/feedback/feedback.directive';
import { MatMenu } from '@angular/material/menu';
import { CommentWithResponsesComponent } from '../../comment/comment-with-responses/comment-with-responses.component';

/**
 * Component for displaying and managing comments related to a review.
 * Allows users to post new comments and view existing comments.
 */
@Component({
  selector: 'app-review-comments',
  standalone: true,
  imports: [
    MatIcon,
    MatInput,
    MatButton,
    NgxEditorModule,
    ReactiveFormsModule,
    CommentCardComponent,
    AsyncPipe,
    FeedbackDirective,
    MatMenu,
    CommentWithResponsesComponent,
  ],
  templateUrl: './review-comments.component.html',
  styleUrl: './review-comments.component.scss',
})
export class ReviewCommentsComponent implements OnInit {
  /** The review data, passed as input, which the comments are associated with. */
  @Input({ required: true }) review!: ReviewPopulatedDTO;

  /** Service for API calls to backend related to comments. */
  private apiService = inject(DefaultService);

  /** Editor instance for creating formatted text comments. */
  editor!: Editor;

  /**
   * Form control for message input, validates non-empty HTML content.
   */
  message: FormControl<string> = new FormControl<string>('', {
    nonNullable: true,
    validators: [validateHTMLIsNotBlank, Validators.required],
  });

  /**
   * Configuration for the text editor toolbar.
   */
  toolbar: Toolbar = [
    ['bold', 'italic'],
    ['underline', 'strike'],
    ['ordered_list', 'bullet_list'],
    ['link', 'image'],
  ];

  /** Observable stream of comments fetched from the backend. */
  comments!: Observable<CommentDTO[]>;

  /**
   * Initializes the component by setting up the editor and fetching initial comments.
   */
  ngOnInit(): void {
    this.editor = new Editor({
      features: {
        linkOnPaste: true,
        resizeImage: true,
      },
      plugins: [],
    });

    this.getComments();
  }

  /**
   * Publishes a new comment to the backend and refreshes the list of comments.
   */
  publishComment(): void {
    this.apiService
      .createComment({
        createCommentDTO: {
          content: this.message.value,
          resource: this.review._id,
          resourceModel: CreateCommentDTOResourceModelEnum.Review,
        },
      })
      .subscribe(() => {
        this.message.reset();
        this.getComments();
      });
  }

  /**
   * Fetches comments from the backend for the specified review.
   */
  getComments(): void {
    this.comments = this.apiService.getComments({
      resource: this.review._id,
    });
  }

  /** Enum for specifying the model type of the resource related to the comments, used in API interactions. */
  protected readonly CreateCommentDTOResourceModelEnum = CreateCommentDTOResourceModelEnum;
}
