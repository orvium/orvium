import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { TemplateCategory } from '../../template/template.schema';
import { TransformObjectId } from '../../utils/expose-id.decorator';

export class TemplateCreateDTO {
  /**
   * Email template name
   * @example confirm-email
   */
  @IsString() name!: string;

  /**
   * The content of the email template
   * @example <table style='width: 600px; margin-left: auto; margin-right: auto; border: 0;'></table>
   */
  @IsString() template!: string;

  /**
   * The community ID where the email template belong
   * @example 5fa1908fd29a17dc961cc435
   */
  @TransformObjectId() @IsNotEmpty() community!: string;

  /**
   * Check if the email is customizable by the community or a system email
   * @example true
   */
  @IsNotEmpty() isCustomizable!: boolean;

  /**
   * The description of the template
   * @example 11:00 Iris Beuls Exploring photo-elicitation to elicit architecturally rich users’ experiences with(in) palliative environments through a human-centred approach: a pilot study
   */
  @IsString() description!: string;

  /**
   * Email template title
   * @example Confirmation email
   */
  @IsString() title!: string;

  /**
   * Mark if the email template is a system or a customizable email
   * @example system
   */
  @ApiProperty({ enum: TemplateCategory, enumName: 'TemplateCategory' })
  @IsString()
  category!: TemplateCategory;
}
