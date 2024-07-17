import { Test } from '@nestjs/testing';
import { AwsStorageService } from './aws-storage.service';
import fs, { Dirent, Stats } from 'fs';
import { ListObjectsV2CommandOutput } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { environment } from '../../environments/environment';

jest.mock('@aws-sdk/s3-request-presigner');
const getSignedUrlMock = getSignedUrl as jest.MockedFunction<typeof getSignedUrl>;

environment.aws.s3 = { privateBucket: 'myPrivateBucket', publicBucket: 'myPublicBucket' };

describe('AwsStorageService', () => {
  let service: AwsStorageService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [],
      providers: [AwsStorageService],
    }).compile();

    service = module.get(AwsStorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should listObjectsV2', async () => {
    const spy = jest.spyOn(service.s3Client, 'send').mockImplementation(() => undefined);
    await service.listObjectsV2('pathToObject');
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ input: { Bucket: 'myPrivateBucket', Prefix: 'pathToObject' } })
    );
  });

  it('should headObject', async () => {
    const spy = jest.spyOn(service.s3Client, 'send').mockImplementation(() => undefined);
    await service.headObject({ objectKey: 'pathToObject' });
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ input: { Bucket: 'myPrivateBucket', Key: 'pathToObject' } })
    );
  });

  it('should get object', async () => {
    // @ts-expect-error
    const spy = jest.spyOn(service.s3Client, 'send').mockResolvedValue({ Body: 'aasdfasdf' });
    await service.get('myObjectKey');
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ input: { Bucket: 'myPrivateBucket', Key: 'myObjectKey' } })
    );
  });

  it('should save object', async () => {
    const spy = jest.spyOn(service.s3Client, 'send').mockImplementation(() => undefined);
    await service.save('myObjectKey', 'content');
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        input: { Bucket: 'myPrivateBucket', Key: 'myObjectKey', Body: 'content' },
      })
    );
  });

  it('should delete object', async () => {
    const spy = jest.spyOn(service.s3Client, 'send').mockImplementation(() => undefined);
    await service.delete('myObjectKey');
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ input: { Bucket: 'myPrivateBucket', Key: 'myObjectKey' } })
    );
  });

  it('should delete recursive', async () => {
    const listObjectsV2Request: Partial<ListObjectsV2CommandOutput> = {
      Contents: [{ Key: 'myPath' }, { Key: 'myPath/objectKey1' }, { Key: 'myPath/objectKey2' }],
    };
    const spyS3Client = jest.spyOn(service.s3Client, 'send').mockImplementation(command => {
      // @ts-expect-error
      if (command.input.Prefix) {
        return listObjectsV2Request;
      }
      return undefined;
    });

    await service.deleteRecursive('myPath');

    expect(spyS3Client).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ input: { Bucket: 'myPrivateBucket', Prefix: 'myPath' } })
    );

    expect(spyS3Client).toHaveBeenCalledTimes(4);

    expect(spyS3Client).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ input: { Bucket: 'myPrivateBucket', Key: 'myPath/objectKey1' } })
    );

    expect(spyS3Client).toHaveBeenLastCalledWith(
      expect.objectContaining({ input: { Bucket: 'myPrivateBucket', Key: 'myPath' } })
    );
  });

  it('should getSignedUrl', async () => {
    const params = { Key: 'myObjectKey', Bucket: service.privateBucket };
    getSignedUrlMock.mockResolvedValue('my signed url');
    await service.getSignedUrl('getObject', params);
    expect(getSignedUrlMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ input: { Bucket: 'myPrivateBucket', Key: 'myObjectKey' } }),
      { expiresIn: 3600 }
    );
  });

  it('should copy recursive', async () => {
    const spyreaddirSync = jest
      .spyOn(fs, 'readdirSync')
      .mockImplementation(() => ['file1', 'file2'] as unknown as Dirent[]);
    const spyreadFileSync = jest.spyOn(fs, 'readFileSync').mockReturnValue('file content');
    const spylstatSync = jest
      .spyOn(fs, 'lstatSync')
      .mockReturnValue({ isFile: () => true } as Stats);

    const spyUpload = jest.spyOn(service.s3Client, 'send').mockImplementation(() => undefined);

    await service.copyRecursive('remotePath', 'myLocalPath');
    expect(spyreaddirSync).toHaveBeenCalled();
    expect(spylstatSync).toHaveBeenCalled();
    expect(spyreadFileSync).toHaveBeenCalledTimes(2);
    expect(spyUpload).toHaveBeenCalledTimes(2);
    expect(spyUpload).toHaveBeenLastCalledWith(
      expect.objectContaining({
        input: { Bucket: 'myPrivateBucket', Key: 'remotePath/file2', Body: 'file content' },
      })
    );
  });
});
