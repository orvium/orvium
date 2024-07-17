import { IsNotEmpty, IsString } from 'class-validator';
import { IsNotBlankValidator } from '../../utils/isNotBlankValidator';

export class CallCreateDTO {
  /**
   * Call Title
   * @example My conference Enabling health, care and well-being through design research
   */
  @IsString()
  @IsNotBlankValidator({ message: 'Title should not be empty' })
  title!: string;

  /**
   * Community ID of the community where this call has been created
   * @example 63848e5d2e63b7fa277f58b0
   */
  @IsNotEmpty() community!: string;
}
