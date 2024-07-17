import { IsString } from 'class-validator';

export class TemplateUpdateDto {
  /**
   * The content of the email template
   * @example "<table style='width: 600px; margin-left: auto; margin-right: auto; border: 0;'></table>"
   */
  @IsString() template!: string;
}
