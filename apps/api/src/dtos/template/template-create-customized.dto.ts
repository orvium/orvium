import { IsDefined, IsString } from 'class-validator';

export class TemplateCreateCustomizedDto {
  /**
   * The community ID where the email template belong
   * @example 5fa1908fd29a17dc961cc435
   */
  @IsDefined() @IsString() communityId!: string;

  /**
   * The content of the email template
   * @example "<table style='width: 600px; margin-left: auto; margin-right: auto; border: 0;'></table>"
   */
  @IsDefined() @IsString() template!: string;
}
