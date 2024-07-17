import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { ConversationCLASSNAME, UserCLASSNAME } from '../utils/utils';

/**
 * Type alias for a hydrated document of a Message
 */
export type MessageDocument = HydratedDocument<Message>;

/**
 * Represents a message within a conversation in the system.
 * This class is used to store individual messages sent between users, tracking the sender, content,
 * and the conversation context.
 */
@Schema({ collection: 'message', timestamps: true, toJSON: { virtuals: true } })
export class Message {
  /**
   * The ObjectId of the user who sent the message. References the User collection.
   */
  @Prop({
    required: true,
    type: MongooseSchema.Types.ObjectId,
    ref: UserCLASSNAME,
  })
  sender!: Types.ObjectId;

  /**
   * The timestamp when the message was created. This is managed automatically.
   */
  @Prop({
    required: true,
    type: Date,
  })
  createdAt!: Date;

  /**
   * The textual content of the message. This field is trimmed of excess whitespace.
   */
  @Prop({ trim: true })
  content!: string;

  /**
   * The ObjectId of the conversation this message belongs to. References the Conversation collection.
   */
  @Prop({
    required: true,
    type: MongooseSchema.Types.ObjectId,
    ref: ConversationCLASSNAME,
  })
  conversation!: Types.ObjectId;

  /**
   * Optional timestamp indicating when the message was read by the recipient. Not set until the message is read.
   */
  @Prop({
    type: Date,
  })
  readAt?: Date;
}

/**
 * Schema factory for the Message class.
 */
export const MessageSchema = SchemaFactory.createForClass(Message);
