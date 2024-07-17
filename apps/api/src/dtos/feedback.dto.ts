import { IsDataURI, IsEmail, IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';

export class FeedbackDTO {
  /**
   * User email
   * @example example@example.com
   */
  @ValidateIf(o => !!o.email)
  @IsEmail()
  email?: string;

  /**
   * Description of the feefback you want to send
   * @example "I have an error in the example page"
   */
  @IsString() @IsNotEmpty() description!: string;

  /**
   * Optional screenshot to improve the feedback
   * @example example.png
   */
  @IsOptional() @IsDataURI() screenshot?: unknown;

  /**
   * Extra feedback data
   */
  @IsOptional() data?: unknown;
}
