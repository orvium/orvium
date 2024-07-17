import { Test, TestingModule } from '@nestjs/testing';
import { PandocService } from './pandoc.service';
import { AwsStorageService } from '../common/aws-storage-service/aws-storage.service';
import { DepositService, PopulatedDepositDocument } from '../deposit/deposit.service';
import { DepositStatus } from '../deposit/deposit.schema';
import fs, { Dirent } from 'fs';
import child_process from 'child_process';
import { FileMetadata } from '../dtos/filemetadata.dto';
import { HttpModule } from '@nestjs/axios';
import { factoryDepositDocumentDefinition, factoryReview } from '../utils/test-data';
import { ListObjectsV2CommandOutput } from '@aws-sdk/client-s3';
import { MongooseTestingModule } from '../utils/mongoose-testing.module';
import { ReviewDocumentPopulated, ReviewService } from '../review/review.service';
import { ReviewStatus } from '../review/review.schema';

describe('PandocService', () => {
  let service: PandocService;
  let depositService: DepositService;
  let reviewService: ReviewService;
  let awsStorageService: AwsStorageService;
  let reviewDocument: ReviewDocumentPopulated;
  let depositDocument: PopulatedDepositDocument;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [MongooseTestingModule.forRoot('PandocService'), HttpModule],
      providers: [PandocService],
    }).compile();
  });

  beforeEach(async () => {
    service = module.get(PandocService);
    reviewService = module.get(ReviewService);
    const review = factoryReview.build({
      status: ReviewStatus.published,
      creator: '6124e35e399717c9e3fc0607',
    });
    await reviewService.reviewModel.deleteMany();
    await reviewService.reviewModel.create(review);
    reviewDocument = (await reviewService.findOne({
      creator: '6124e35e399717c9e3fc0607',
      status: ReviewStatus.published,
    })) as ReviewDocumentPopulated;
    depositService = module.get(DepositService);
    awsStorageService = module.get(AwsStorageService);
    const deposit = factoryDepositDocumentDefinition.build({
      status: DepositStatus.published,
      creator: '6124e35e399717c9e3fc0607',
    });
    await depositService.depositModel.deleteMany();
    await depositService.depositModel.create(deposit);
    depositDocument = (await depositService.findOne({
      creator: '6124e35e399717c9e3fc0607',
      status: DepositStatus.published,
    })) as PopulatedDepositDocument;
    const file: FileMetadata = {
      filename: 'test.docx',
      contentType: 'application/pdf',
      contentLength: 1,
      tags: [],
      description: '',
    };
    await depositService.depositModel.updateOne(
      { _id: depositDocument._id },
      {
        $set: {
          publicationFile: file,
          status: DepositStatus.draft,
        },
      }
    );
  });

  afterAll(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should export file to HTML and media', async () => {
    const spyReadFileSync = jest.spyOn(fs, 'readFileSync').mockImplementation(() => 'file1');
    const spyExecFileSync = jest
      .spyOn(child_process, 'execFileSync')
      .mockImplementation(() => 'file1');
    const spyDeleteRecursive = jest
      .spyOn(awsStorageService, 'deleteRecursive')
      .mockImplementation();
    const spyDepositService = jest.spyOn(depositService, 'findOneAndUpdate').mockImplementation();
    await service.exportToHTML('test.docx', {
      depositOrReview: depositDocument.toJSON(),
      filename: 'test.pdf',
    });
    expect(spyExecFileSync).toHaveBeenCalled();
    expect(spyReadFileSync).toHaveBeenCalled();
    expect(spyDeleteRecursive).toHaveBeenCalled();
    expect(spyDepositService).toHaveBeenCalled();
  });

  it('should export file to docx and then export to HTML and media', async () => {
    const spyReadFileSync = jest.spyOn(fs, 'readFileSync').mockImplementation(() => 'file1');
    const spyExecFileSync = jest
      .spyOn(child_process, 'execFileSync')
      .mockImplementation(() => 'file1');
    const spyDeleteRecursive = jest
      .spyOn(awsStorageService, 'deleteRecursive')
      .mockImplementation();
    const spyDepositService = jest.spyOn(depositService, 'findOneAndUpdate').mockImplementation();
    await service.exportToHTML('test.docx', {
      depositOrReview: depositDocument.toJSON(),
      filename: 'test.docx',
    });
    expect(spyExecFileSync).toHaveBeenCalled();
    expect(spyReadFileSync).toHaveBeenCalled();
    expect(spyDeleteRecursive).toHaveBeenCalled();
    expect(spyDepositService).toHaveBeenCalled();
  });

  it('should export file to docx and then export to HTML and media in review', async () => {
    const spyReadFileSync = jest.spyOn(fs, 'readFileSync').mockImplementation(() => 'file1');
    const spyExecFileSync = jest
      .spyOn(child_process, 'execFileSync')
      .mockImplementation(() => 'file1');
    const spyDeleteRecursive = jest
      .spyOn(awsStorageService, 'deleteRecursive')
      .mockImplementation();
    const spyDepositService = jest.spyOn(reviewService, 'findOneAndUpdate').mockImplementation();
    await service.exportToHTML('test.pdf', {
      depositOrReview: reviewDocument.toJSON(),
      filename: 'test.pdf',
    });
    expect(spyExecFileSync).toHaveBeenCalled();
    expect(spyReadFileSync).toHaveBeenCalled();
    expect(spyDeleteRecursive).toHaveBeenCalled();
    expect(spyDepositService).toHaveBeenCalled();
  });

  it('should export file to HTML and media and update old media', async () => {
    const spyReadFileSync = jest.spyOn(fs, 'readFileSync').mockImplementation(() => 'file1');
    const spyExistsSync = jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    const spyReadFileSync2 = jest
      .spyOn(fs, 'readdirSync')
      .mockImplementation(
        () => '/tmp/nestApi/6299f229b4c550b4b8028f1a/media/' as unknown as Dirent[]
      );
    const spyExecFileSync = jest
      .spyOn(child_process, 'execFileSync')
      .mockImplementation(() => 'file1');
    const spyDeleteRecursive = jest
      .spyOn(awsStorageService, 'deleteRecursive')
      .mockImplementation();
    const spyCopyRecursive = jest.spyOn(awsStorageService, 'copyRecursive').mockImplementation();

    const listObjectsOutput: ListObjectsV2CommandOutput = {
      Contents: [{ Key: 'myPath' }, { Key: 'myPath/objectKey1' }, { Key: 'myPath/objectKey2' }],
      $metadata: {},
    };
    const spyListObjectsV2 = jest
      .spyOn(awsStorageService, 'listObjectsV2')
      .mockResolvedValue(listObjectsOutput);
    const spyDepositService = jest.spyOn(depositService, 'findOneAndUpdate').mockImplementation();
    await service.exportToHTML('test.docx', {
      depositOrReview: depositDocument.toJSON(),
      filename: 'test.docx',
    });
    expect(spyExecFileSync).toHaveBeenCalled();
    expect(spyExistsSync).toHaveBeenCalled();
    expect(spyReadFileSync2).toHaveBeenCalled();
    expect(spyCopyRecursive).toHaveBeenCalled();
    expect(spyListObjectsV2).toHaveBeenCalled();
    expect(spyReadFileSync).toHaveBeenCalled();
    expect(spyDeleteRecursive).toHaveBeenCalled();
    expect(spyDepositService).toHaveBeenCalled();
  });

  it('should export file to PDF', async () => {
    const spyExecFileSync = jest
      .spyOn(child_process, 'execFileSync')
      .mockImplementation(() => 'file1');
    const spySave = jest.spyOn(awsStorageService, 'save').mockImplementation();
    const spyDepositService = jest.spyOn(depositService, 'findOneAndUpdate');
    await service.exportToPDF('localfiletest.docx', {
      depositOrReview: depositDocument.toJSON(),
      filename: 'test.docx',
    });
    expect(spyExecFileSync).toHaveBeenCalled();
    expect(spySave).toHaveBeenCalled();
    expect(spyDepositService).toHaveBeenCalled();
  });

  it('should download file from S3', async () => {
    const spyExecFileSync = jest
      .spyOn(child_process, 'execFileSync')
      .mockImplementation(() => 'file1');
    service.downloadFile({
      depositOrReview: depositDocument.toJSON(),
      filename: 'myfilename.docx',
    });
    expect(spyExecFileSync).toHaveBeenCalled();
  });

  it('should unzip file', async () => {
    const spyExecFileSync = jest
      .spyOn(child_process, 'execFileSync')
      .mockImplementation(() => 'file1');
    service.unzipFile('/myfolder/myfilename.zip');
    expect(spyExecFileSync).toHaveBeenCalledWith('unzip', [
      '-o',
      '/myfolder/myfilename.zip',
      '-d',
      '/myfolder/unzipped',
    ]);
  });

  it('should find latex file', () => {
    jest.spyOn(fs, 'readdirSync').mockReturnValue([
      // @ts-expect-error
      { name: 'onefile.docx', isDirectory: (): boolean => false },
      // @ts-expect-error
      { name: 'mylatexfile.tex', isDirectory: (): boolean => false },
    ]);
    const filefound = service.findLatexMainFile('/myfolder');
    expect(filefound).toBe('/myfolder/mylatexfile.tex');

    jest
      .spyOn(fs, 'readdirSync')
      // @ts-expect-error
      .mockReturnValue([{ name: 'onefile.docx', isDirectory: (): boolean => false }]);
    const filenotfound = service.findLatexMainFile('/myfolder');
    expect(filenotfound).toBe(undefined);
  });

  it('should convert to html a .dot file', () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    jest.spyOn(fs, 'readFileSync').mockReturnValue('<body></body>');
    jest.spyOn(fs, 'writeFileSync').mockImplementation();
    jest.spyOn(fs, 'mkdirSync').mockImplementation();
    const spyExecFileSync = jest.spyOn(child_process, 'execFileSync').mockImplementation();
    const output = service.convertToHTML('/myfolder/myfile.odt');
    expect(spyExecFileSync).toHaveBeenCalledTimes(2);
    expect(output).toStrictEqual({
      destinationHtml: '/myfolder/conversions/myfile.html',
      outDir: '/myfolder/conversions',
    });
  });

  it('should convert to html a .tex file', () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    jest.spyOn(fs, 'readFileSync').mockReturnValue('<body></body>');
    jest.spyOn(fs, 'writeFileSync').mockImplementation();
    jest.spyOn(fs, 'mkdirSync').mockImplementation();
    const chdirSpy = jest.spyOn(process, 'chdir').mockImplementation();
    const spyExecFileSync = jest.spyOn(child_process, 'execFileSync').mockImplementation();
    const output = service.convertToHTML('/myfolder/myfile.tex');
    expect(spyExecFileSync).toHaveBeenCalledTimes(2);
    expect(output).toStrictEqual({
      destinationHtml: '/myfolder/conversions/myfile.html',
      outDir: '/myfolder/conversions',
    });
    expect(chdirSpy).toHaveBeenCalledWith('/myfolder');
  });

  it('should compress images', () => {
    const spyExecFileSync = jest.spyOn(child_process, 'execFileSync').mockImplementation();
    service.compressImg('image1.png');
    expect(spyExecFileSync).toHaveBeenNthCalledWith(1, 'optipng', ['-fix', 'image1.png']);
    expect(spyExecFileSync).toHaveBeenNthCalledWith(2, 'pngquant', [
      '--speed',
      '3',
      'image1.png',
      '--ext',
      '.png',
      '--force',
      '--verbose',
    ]);

    spyExecFileSync.mockClear();
    service.compressImg('image1.jpeg');
    expect(spyExecFileSync).toHaveBeenCalledWith(
      'jpegoptim',
      ['--size=500', '--strip-all', 'image1.jpeg'],
      { stdio: 'inherit' }
    );

    spyExecFileSync.mockClear();
    service.compressImg('image1.webp');
    expect(spyExecFileSync).not.toHaveBeenCalled();
  });

  it('should convert images', () => {
    const spyExecFileSync = jest.spyOn(child_process, 'execFileSync').mockImplementation();
    service.convertImage('image1.emf');
    expect(spyExecFileSync).toHaveBeenCalledWith('inkscape', [
      '--export-type',
      'svg',
      'image1.emf',
    ]);

    spyExecFileSync.mockClear();
    service.convertImage('image1.wmf');
    expect(spyExecFileSync).toHaveBeenNthCalledWith(1, 'libreoffice7.5', [
      '--headless',
      '--convert-to',
      'png',
      'image1.wmf',
      '--outdir',
      '.',
    ]);
    expect(spyExecFileSync).toHaveBeenNthCalledWith(2, 'convert', [
      'image1.png',
      '-trim',
      'image1.png',
    ]);

    spyExecFileSync.mockClear();
    service.convertImage('image1.webp');
    expect(spyExecFileSync).not.toHaveBeenCalled();
  });
});
