import { IsDefined } from 'class-validator';

export class ReviewHtmlPreviewDTO {
  /**
   * Review invitation html
   * @example <p>Example html</p>
   */
  @IsDefined() html!: string;
}
