import { IsDefined } from 'class-validator';
import { FileMetadata } from './filemetadata.dto';

export class SignedUrlDTO {
  @IsDefined() signedUrl!: string;
  // TODO add documentation
  fileMetadata!: FileMetadata;
  isMainFile!: boolean;
  replacePDF!: boolean;
}
