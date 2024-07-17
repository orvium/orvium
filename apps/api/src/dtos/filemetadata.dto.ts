export class FileMetadata {
  /**
   * Name of the file
   * @example "example.png"
   */
  filename!: string;

  /**
   * Description of the file
   * @example "Charts for presentation"
   */
  description!: string;

  /**
   * File type
   * @example "pdf"
   */
  contentType!: string;

  /**
   * Size of the file
   * @example 1024
   */
  contentLength!: number;

  /**
   * Mark for what type of content the file is related
   * @example [profile]
   */
  tags!: string[];

  /**
   * URL where the image is hosted
"   * @example https://s3.eu-central-1.amazonaws.com/public-files.example.com/profile/61f12bb224a817c22e70f108/media/banner.png
"   */
  url?: string;
}
