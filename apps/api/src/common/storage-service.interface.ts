import { Readable } from 'stream';
import { DeleteObjectCommandOutput, PutObjectCommandOutput } from '@aws-sdk/client-s3';

export interface IStorageService {
  get(s3Object: string): Promise<Readable | ReadableStream | Blob | undefined>;

  save(
    s3Object: string,
    buffer: Buffer | Uint8Array | Blob | string | Readable
  ): Promise<PutObjectCommandOutput>;

  delete(objectKey: string): Promise<DeleteObjectCommandOutput>;

  getSignedUrl(operation: string, params: unknown): Promise<string>;
}
