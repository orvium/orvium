import { Injectable } from '@angular/core';
import { ReviewPopulatedDTO } from '@orvium/api';

/**
 * Interface representing the possible actions a user can perform on a review.
 * Each property is a boolean indicating whether the action is permitted.
 *
 * @property {boolean} read - Whether the review can be read.
 * @property {boolean} update - Whether the review can be updated.
 * @property {boolean} delete - Whether the review can be deleted.
 * @property {boolean} edit - Whether the review can be edited.
 * @property {boolean} moderate - Whether the review can be moderated.
 * @property {boolean} createComment - Whether comments can be created on the review.
 */
export interface IReviewActions {
  read: boolean;
  update: boolean;
  delete: boolean;
  edit: boolean;
  moderate: boolean;
  createComment: boolean;
}

/**
 * Service responsible for managing review actions within the application.
 * It provides functionality to check permissions for various actions related to a review.
 */
@Injectable({
  providedIn: 'root',
})
export class ReviewService {
  /**
   * Determines the actions a user can perform on a specific review based on the actions array in the review object.
   *
   * @param {ReviewPopulatedDTO} review - The review object containing the actions.
   * @returns {IReviewActions} An object representing the allowed actions for the review.
   */
  getReviewActions(review: ReviewPopulatedDTO): IReviewActions {
    return {
      read: review.actions.includes('read'),
      update: review.actions.includes('update'),
      delete: review.actions.includes('delete'),
      edit: review.actions.includes('edit'),
      moderate: review.actions.includes('moderate'),
      createComment: review.actions.includes('createComment'),
    };
  }
}
