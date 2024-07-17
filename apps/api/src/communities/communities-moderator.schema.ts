import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { CommunityCLASSNAME, UserCLASSNAME } from '../utils/utils';

export enum ModeratorRole {
  moderator = 'moderator',
  admin = 'admin',
  owner = 'owner',
}

export class NotificationOptions {
  // Tracks IDs
  tracks: number[] = [];
}

export type CommunityModeratorDocument = HydratedDocument<CommunityModerator>;

@Schema({ collection: 'communityModerator', timestamps: true, toJSON: { virtuals: true } })
export class CommunityModerator {
  @Prop({ required: true, ref: UserCLASSNAME, type: MongooseSchema.Types.ObjectId })
  user!: Types.ObjectId;

  @Prop({ required: true, ref: CommunityCLASSNAME, type: MongooseSchema.Types.ObjectId })
  community!: Types.ObjectId;

  @Prop({
    required: true,
    enum: Object.values(ModeratorRole),
    default: ModeratorRole.moderator,
  })
  moderatorRole!: ModeratorRole;

  @Prop({ type: NotificationOptions })
  notificationOptions?: NotificationOptions;
}

export const CommunityModeratorSchema = SchemaFactory.createForClass(CommunityModerator);

CommunityModeratorSchema.index({ user: 1, community: 1 }, { unique: true });
