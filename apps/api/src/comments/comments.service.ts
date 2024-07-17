import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AnyKeys, MergeType, Model, mongo, SortOrder, Types } from 'mongoose';
import { Commentary, CommentaryDocument, CommentTags } from './comments.schema';
import { ReviewDocument } from '../review/review.schema';
import { UserDocument } from '../users/user.schema';
import { DepositDocument } from '../deposit/deposit.schema';
import { StrictFilterQuery } from '../utils/types';

export interface PopulatedCommentaryDocument extends Omit<CommentaryDocument, ''> {
  user: UserDocument;
  parentPopulated: CommentaryDocument;
}

/**
 * Service for managing comments.
 */
@Injectable()
export class CommentsService {
  /**
   * Initializes a new instance of the CommentsService.
   *
   * @param commentModel The Mongoose model for comment documents.
   */
  constructor(@InjectModel(Commentary.name) public commentModel: Model<Commentary>) {}

  /**
   * Creates a new comment record.
   *
   * @param filter The properties to set on the new comment record.
   * @returns A Promise resolving to the newly created CommentaryDocument.
   */
  async create(filter: AnyKeys<Commentary>): Promise<CommentaryDocument> {
    return this.commentModel.create(filter);
  }

  /**
   * Finds comment records matching the given filter.
   *
   * @param filter A query filter that conforms to the CommentaryDocument structure to find matching records.
   * @param sort Sorting criteria for the query results.
   * @returns A Promise that resolves to an array of CommentaryDocument.
   */
  async find(
    filter: StrictFilterQuery<CommentaryDocument>,
    sort: string | Record<string, SortOrder> = { createdAt: -1 }
  ): Promise<CommentaryDocument[]> {
    return this.commentModel
      .find(filter)
      .populate<{ user: UserDocument }>('user')
      .sort(sort)
      .exec();
  }

  /**
   * Finds a single comment record by ID and populates related documents.
   *
   * @param _id The ID of the comment to retrieve.
   * @returns A Promise that resolves to a PopulatedCommentaryDocument or null if no match is found.
   */
  async findOneByIdPopulated(
    _id: string | Types.ObjectId
  ): Promise<PopulatedCommentaryDocument | null> {
    return await this.commentModel
      .findById(_id)
      .populate<{
        user: UserDocument;
        parentPopulated: CommentaryDocument;
      }>(['user', 'parentPopulated'])
      .exec();
  }

  /**
   * Checks if a comment exists based on the given filter.
   *
   * @param filter A query filter to check for an existing comment.
   * @returns A Promise resolving to the document identifier if found, otherwise null.
   */
  async exists(
    filter: StrictFilterQuery<CommentaryDocument>
  ): Promise<Pick<CommentaryDocument, '_id'> | null> {
    return this.commentModel.exists(filter);
  }

  /**
   * Deletes a comment.
   *
   * @param comment The CommentaryDocument to delete.
   * @returns A Promise resolving to the result of the delete operation.
   */
  async delete(comment: CommentaryDocument): Promise<mongo.DeleteResult> {
    return await comment.deleteOne();
  }

  /**
   * Retrieves tags for a comment based on the associated resource and user roles.
   *
   * @param comment A comment merged with additional resource details.
   * @returns A Promise resolving to an array of CommentTags.
   */
  async getCommentTags(
    comment: MergeType<CommentaryDocument, { resource: DepositDocument | ReviewDocument }>
  ): Promise<CommentTags[]> {
    const tags: CommentTags[] = [];

    if (comment.resource.creator === comment.user_id) {
      tags.push(CommentTags.author);
    }
    if ('peerReviews' in comment.resource) {
      const deposit = await comment.resource.populate<{ peerReviews: ReviewDocument[] }>(
        'peerReviews'
      );
      const isReviewer = deposit.peerReviews.some(review => review.creator === comment.user_id);
      if (isReviewer) {
        tags.push(CommentTags.reviewer);
      }
    }

    return tags;
  }
}
