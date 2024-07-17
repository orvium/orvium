import { Injectable, Logger } from '@nestjs/common';
import { IStorageService } from '../storage-service.interface';
import { environment } from '../../environments/environment';
import { Readable } from 'stream';
import { lstatSync, readdirSync, readFileSync } from 'fs';
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  DeleteObjectCommandOutput,
  GetObjectCommand,
  GetObjectCommandInput,
  HeadObjectCommand,
  HeadObjectOutput,
  ListObjectsV2Command,
  ListObjectsV2CommandOutput,
  PutObjectCommand,
  PutObjectCommandInput,
  PutObjectCommandOutput,
  S3Client,
  S3ClientConfig,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import path from 'path';
import { assertIsDefined } from '../../utils/utils';
import { lookup } from 'mime-types';

/**
 * Enum to define the expiration time for signed URLs.
 * @enum {number}
 */
export enum EXPIRATION_TIME {
  ONE_MINUTES = 60,
  FIVE_MINUTES = 300,
  TEN_MINUTES = 600,
  ONE_HOUR = 3600,
}

/**
 * Service responsible for handling operations with AWS S3 storage.
 */
@Injectable()
export class AwsStorageService implements IStorageService {
  s3Client: S3Client;
  privateBucket: string;
  publicBucket: string;

  /**
   * Creates an instance of AwsStorageService.
   */
  constructor() {
    assertIsDefined(environment.aws.s3.privateBucket, 'S3 private bucket not defined');
    assertIsDefined(environment.aws.s3.publicBucket, 'S3 public bucket not defined');

    this.privateBucket = environment.aws.s3.privateBucket;
    this.publicBucket = environment.aws.s3.publicBucket;

    const configuration: S3ClientConfig = {
      endpoint: environment.aws.endpoint,
      region: environment.aws.region,
    };

    Logger.debug('Starting S3Client with config', configuration);
    this.s3Client = new S3Client(configuration);
  }

  /**
   * Lists objects in a bucket based on a specified path.
   *
   * @param {string} path - The path or prefix to list objects from.
   * @returns {Promise<ListObjectsV2CommandOutput>} A promise resolving to the command output of listing objects.
   */
  async listObjectsV2(path: string): Promise<ListObjectsV2CommandOutput> {
    Logger.debug('listObjectsV2', path);
    const command = new ListObjectsV2Command({
      Bucket: this.privateBucket,
      Prefix: path,
    });
    const result = await this.s3Client.send(command);
    return result;
  }
  /**
   * Retrieves an object from S3.
   *
   * @param {string} s3Object The key of the S3 object to retrieve.
   * @returns {Promise<Readable | ReadableStream | Blob>} A promise resolving to the object's data stream.
   */
  async get(s3Object: string): Promise<Readable | ReadableStream | Blob> {
    const command = new GetObjectCommand({ Bucket: this.privateBucket, Key: s3Object });
    const output = await this.s3Client.send(command);
    assertIsDefined(output.Body, 'File content is empty');

    return output.Body;
  }

  /**
   * Saves an object to an AWS S3 bucket.
   *
   * @param {string} s3Object The key under which the object is stored in the bucket.
   * @param {Buffer | Uint8Array | Blob | string | Readable} buffer The data to be saved.
   * @returns {Promise<PutObjectCommandOutput>} A Promise resolving to the PutObjectCommandOutput which provides details about the operation.
   */
  async save(
    s3Object: string,
    buffer: Buffer | Uint8Array | Blob | string | Readable
  ): Promise<PutObjectCommandOutput> {
    Logger.debug(`Uploading ${s3Object} to bucket ${this.privateBucket}`);
    const mimeType = lookup(s3Object);
    const command = new PutObjectCommand({
      Bucket: this.privateBucket,
      Key: s3Object,
      Body: buffer,
      ContentType: typeof mimeType === 'string' ? mimeType : undefined,
    });
    return await this.s3Client.send(command);
  }

  /**
   * Deletes an object from an S3 bucket.
   *
   * @param {string} objectKey The key of the object to be deleted in the S3 bucket.
   * @returns {Promise<DeleteObjectCommandOutput>} resolving to the DeleteObjectCommandOutput with details about of the operation.
   */
  async delete(objectKey: string): Promise<DeleteObjectCommandOutput> {
    const command = new DeleteObjectCommand({ Bucket: this.privateBucket, Key: objectKey });
    Logger.debug(command.input);
    return await this.s3Client.send(command);
  }

  /**
   * Recursively deletes all objects within a folder in an S3 bucket, including the folder itself.
   *
   * @param {string} path - The path of the folder to delete.
   * @returns {Promise<void>} A Promise that resolves when the deletion is complete.
   */
  async deleteRecursive(path: string): Promise<void> {
    // Delete all files in folder
    const request = await this.listObjectsV2(path);
    if (request.Contents) {
      for (const s3Object of request.Contents) {
        if (s3Object.Key && s3Object.Key != path) {
          await this.delete(s3Object.Key);
        }
      }
    }

    // Now delete the folder
    await this.delete(path);
  }

  /**
   * Generates a signed URL for performing specified operations (getObject or putObject) on an S3 object.
   *
   * @param {'getObject' | 'putObject'} operation - The operation to perform (getObject or putObject).
   * @param {GetObjectCommandInput | PutObjectCommandInput} params - Parameters for the operation.
   * @returns {Promise<string>} A Promise that resolves with the signed URL.
   */
  async getSignedUrl(
    operation: 'getObject' | 'putObject',
    params: GetObjectCommandInput | PutObjectCommandInput
  ): Promise<string> {
    let command;
    if (operation === 'getObject') {
      command = new GetObjectCommand(params);
    } else {
      command = new PutObjectCommand(params);
    }
    return await getSignedUrl(this.s3Client, command, { expiresIn: EXPIRATION_TIME.ONE_HOUR });
  }

  /**
   * Recursively copies files from a source directory to a destination directory.
   *
   * @param {string} destinationDirectory - The destination directory.
   * @param {string} sourceDirectory - The source directory.
   * @returns {Promise<void>} A Promise that resolves when the copying is complete.
   */
  async copyRecursive(destinationDirectory: string, sourceDirectory: string): Promise<void> {
    Logger.debug(`Recursive copy source=${sourceDirectory} destination=${destinationDirectory}`);
    const files = readdirSync(sourceDirectory);
    for (const file of files) {
      const sourceFileAbsolutePath = path.join(sourceDirectory, file);
      const destinationFileAbsolutePath = path.join(destinationDirectory, file);
      Logger.debug(`Processing file ${sourceFileAbsolutePath}`);
      if (lstatSync(sourceFileAbsolutePath).isFile()) {
        await this.save(destinationFileAbsolutePath, readFileSync(sourceFileAbsolutePath));
      }
    }
  }

  /**
   * Retrieves metadata of an object in an S3 bucket without returning the object itself.
   *
   * @param {Object} params - Parameters for the HEAD request.
   * @param {string} params.objectKey - The key of the object.
   * @param {string} [params.bucket] - The bucket containing the object (defaults to the private bucket of the S3 client).
   * @returns {Promise<HeadObjectOutput>} Promise with the head object output
   */
  async headObject(params: { objectKey: string; bucket?: string }): Promise<HeadObjectOutput> {
    const command = new HeadObjectCommand({
      Bucket: params.bucket ?? this.privateBucket,
      Key: params.objectKey,
    });
    return await this.s3Client.send(command);
  }

  /**
   * Recursively copies objects from a source S3 path to a destination S3 path within the same bucket.
   *
   * @param {string} sourcePath - The source path in the S3 bucket.
   * @param {string} destinationPath - The destination path in the S3 bucket.
   * @returns {Promise<void>} A Promise that resolves when the copying is complete.
   */
  async copyRecursiveS3(sourcePath: string, destinationPath: string): Promise<void> {
    const request = await this.listObjectsV2(sourcePath);
    if (request.Contents) {
      for (const s3Object of request.Contents) {
        if (s3Object.Key && s3Object.Key != sourcePath) {
          const newObjectKey = s3Object.Key.replace(sourcePath, destinationPath);
          Logger.debug(`Copy ${s3Object.Key} to ${newObjectKey}`);
          const command = new CopyObjectCommand({
            Bucket: this.privateBucket,
            CopySource: `/${this.privateBucket}/${s3Object.Key}`,
            Key: `${newObjectKey}`,
          });
          const result = await this.s3Client.send(command);
          Logger.debug(result);
        }
      }
    }
  }
}
