import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { TemplateCategory } from '../../template/template.schema';
import { TransformObjectId } from '../../utils/expose-id.decorator';

@Exclude()
export class TemplateDTO {
  /**
   * Template ID
   * @example 5fa1908fd29a17dc961cc435
   */
  @TransformObjectId() @Expose() _id!: string;

  /**
   * Email template name
   * @example confirm-email
   */
  @Expose() name!: string;

  /**
   * The content of the email template
   * @example "<table style='width: 600px; margin-left: auto; margin-right: auto; border: 0;'></table>"
   */
  @Expose() template!: string;

  /**
   * The content of the email template compilated
   * @example "<table style='width: 600px; margin-left: auto; margin-right: auto; border: 0;'></table>"
   */
  @Expose() compiledTemplate?: string;

  /**
   * The community ID where the email template belong
   * @example 5fa1908fd29a17dc961cc435
   */
  @TransformObjectId() @Expose() community?: string;

  /**
   * Template actions
   * @example [Update]
   */
  @Expose() actions: string[] = [];

  /**
   * The description of the template
   * @example "This email is sent to confirm your email by copying the code of the email in the last step of the onboarding."
   */
  @Expose() description?: string;

  /**
   * Email template title
   * @example "Confirmation email"
   */
  @Expose() title!: string;

  /**
   * Check if the email is customizable by the community or a system email
   * @example true
   */
  @Expose() isCustomizable!: boolean;

  /**
   * Mark if the email template is a system or a customizable email
   * @example system
   */
  @ApiProperty({ enum: TemplateCategory, enumName: 'TemplateCategory' })
  @Expose()
  category!: TemplateCategory;
}
