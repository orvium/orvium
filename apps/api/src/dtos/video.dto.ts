import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class VideoDTO {
  /**
   * Video name
   * @example "example.mp4"
   */
  @Expose() name!: string;

  /**
   * The url where the video is hosted
   * @example "https://synthesia-ttv-data.s3-eu-west-1.amazonaws.com/video_data/af14d36d-cb9e-4ec7-a225-092ec509d8c8/transfers/target_transfer.mp4"
   */
  @Expose() videoUrl!: string;

  /**
   * The type of the video file
   * @example "video/mp4"
   */
  @Expose() videoType!: string;

  /**
   * Action that can be made in the video
   * @example [Update]
   */
  @Expose() actions: string[] = [];
}
