import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import {
  CommentDTO,
  CreateCommentDTO,
  CreateCommentDTOResourceModelEnum,
  DefaultService,
} from '@orvium/api';

import { CommentWithResponsesComponent } from '../comment-with-responses/comment-with-responses.component';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

/**
 * Component for managing and displaying a section of comments associated with a specific resource.
 */
@Component({
  selector: 'app-comment-section',
  standalone: true,
  templateUrl: './comment-section.component.html',
  styleUrls: ['./comment-section.component.scss'],
  imports: [CommentWithResponsesComponent, MatIconModule, MatInputModule, MatButtonModule],
})
export class CommentSectionComponent implements OnInit, OnChanges {
  /**
   * The identifier of the resource to which the comments are related. This is a required input.
   *
   * @input resource The unique identifier for the resource being commented on.
   */
  @Input({ required: true }) resource!: string;

  /**
   * The model of the resource that defines the type of the resource in the backend.
   *
   * @input resourceModel The model type of the resource, as defined by an enum in the application.
   */
  @Input({ required: true }) resourceModel!: CreateCommentDTOResourceModelEnum;

  /**
   * A flag to indicate whether the user has the capability to create new comments. Defaults to false.
   *
   * @input canCreateComment Boolean flag to control the visibility of the comment input field.
   */
  @Input() canCreateComment = false;

  /**
   * Array of comments currently displayed in the section.
   *
   * @property {CommentDTO[]} comments List of comment data transfer objects (DTOs).
   */
  comments: CommentDTO[] = [];

  /**
   * Constructor for the CommentSectionComponent.
   *
   * @param {DefaultService} apiService - Service used to perform API requests related to chat functionalities
   */
  constructor(private apiService: DefaultService) {}

  /**
   * Lifecycle hook that is called after Angular has initialized all data-bound properties of the component.
   */
  ngOnInit(): void {
    this.viewComments();
  }

  /**
   * Lifecycle hook that responds to changes in the input properties of the component.
   * Here, it specifically checks for changes in the 'resource' input and updates the comments accordingly.
   *
   * @param {SimpleChanges} changes An object of Angular's SimpleChanges containing current and previous property values.
   */
  ngOnChanges(changes: SimpleChanges): void {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (changes['resource']) {
      this.viewComments();
    }
  }

  /**
   * Fetches and updates the list of comments for the specified resource from the backend.
   * This method handles the retrieval of comments associated with the resource.
   */
  viewComments(): void {
    this.apiService.getComments({ resource: this.resource }).subscribe(result => {
      this.comments = result;
    });
  }

  /**
   * Creates a new comment based on the provided text and submits it to the backend.
   *
   * @param {string} text The content of the new comment to be created and submitted.
   */
  createComment(text: string): void {
    const comment: CreateCommentDTO = {
      content: text,
      resource: this.resource,
      resourceModel: this.resourceModel,
    };
    this.apiService.createComment({ createCommentDTO: comment }).subscribe(() => {
      this.viewComments();
    });
  }
}
