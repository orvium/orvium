import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { VideoDTO } from '../dtos/video.dto';

//TODO not in use at the moment
@Schema()
class GoogleAnalytics {
  @Prop()
  credentials!: string;

  @Prop()
  property!: string;
}

@Schema()
class Auth {
  @Prop()
  user!: string;

  @Prop()
  pass!: string;
}

@Schema()
class Smtp {
  @Prop()
  host!: string;

  @Prop()
  port!: number;

  @Prop()
  secure!: boolean;

  @Prop({ type: Auth })
  auth!: Auth;
}

export type ConfigurationDocument = HydratedDocument<Configuration>;

@Schema({ collection: 'configuration', timestamps: true, toJSON: { virtuals: true } })
export class Configuration {
  @Prop({ default: [] })
  allowedEmails!: string[];

  @Prop({ default: [] })
  allowedEmailDomains!: string[];

  @Prop({ type: GoogleAnalytics })
  googleAnalytics!: GoogleAnalytics;

  @Prop({ type: Smtp })
  smtp!: Smtp;

  @Prop()
  senderEmail!: string;

  @Prop()
  adminEmail!: string;

  @Prop()
  publicUrl!: string;

  @Prop()
  sentryDSN!: string;

  @Prop([{ required: true, type: MongooseSchema.Types.Mixed, default: [] }])
  videos!: VideoDTO[];
}

export const ConfigurationSchema = SchemaFactory.createForClass(Configuration);
