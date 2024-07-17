import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { UserCLASSNAME } from '../utils/utils';

/**
 * Type alias for a hydrated document of a converstion
 */
export type ConversationDocument = HydratedDocument<Conversation>;

/**
 * Schema definition for a conversation entity.
 * This schema models the data structure for storing conversation details in the database,
 * focusing on the participants involved in each conversation.
 */
@Schema({
  collection: 'conversation',
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Conversation {
  /**
   * Array of ObjectIds representing the users participating in the conversation
   */
  @Prop([
    {
      required: true,
      type: MongooseSchema.Types.ObjectId,
      ref: UserCLASSNAME,
    },
  ])
  participants!: Types.ObjectId[];
}

/**
 * Schema factory for the Conversation class
 */
export const ConversationSchema = SchemaFactory.createForClass(Conversation);

/**
 * Define a virtual field for participants that populates user details from the User collection
 */
ConversationSchema.virtual('participantsPopulated', {
  ref: UserCLASSNAME,
  localField: 'participants',
  foreignField: '_id',
  justOne: false,
});
