import { Test, TestingModule } from '@nestjs/testing';
import { cleanCollections, MongooseTestingModule } from '../utils/mongoose-testing.module';
import {
  createCommunity,
  createDeposit,
  factoryAuthor,
  factoryFileMetadata,
} from '../utils/test-data';
import { DepositService } from './deposit.service';
import { assertIsDefined, generateObjectId } from '../utils/utils';
import { AwsStorageService } from '../common/aws-storage-service/aws-storage.service';
import { DepositStatus } from './deposit.schema';
import { readFileSync } from 'fs';
import path from 'path';
import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';

describe('DepositService', () => {
  let depositService: DepositService;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [MongooseTestingModule.forRoot('DepositService')],
      providers: [],
    }).compile();

    depositService = module.get(DepositService);
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    await cleanCollections(module);
  });

  it('should be defined', () => {
    expect(depositService).toBeDefined();
  });

  it('should setPresignedURLs', async () => {
    const { community } = await createCommunity(module);
    const { deposit } = await createDeposit(module, {
      community,
      deposit: {
        publicationFile: factoryFileMetadata.build({ filename: 'myfile' }),
        files: factoryFileMetadata.buildList(2),
      },
    });

    const depositWithPresigned = await depositService.setPresignedURLs(deposit);
    assertIsDefined(depositWithPresigned.publicationFile);
    expect(depositWithPresigned.publicationFile.url).toBe(
      `http://localhost:4200/api/v1/deposits/${depositWithPresigned._id.toHexString()}/files/myfile`
    );

    // When deposit is draft the url is presigned
    const { deposit: draft } = await createDeposit(module, {
      community,
      deposit: {
        status: DepositStatus.draft,
        publicationFile: factoryFileMetadata.build({ filename: 'myfile' }),
        files: factoryFileMetadata.buildList(2),
      },
    });

    const awsService = module.get(AwsStorageService);
    jest
      .spyOn(awsService, 'getSignedUrl')
      .mockResolvedValueOnce('https://s3mock/publicationFile')
      .mockResolvedValueOnce('https://s3mock/pdfURL')
      .mockResolvedValueOnce('https://s3mock/files-0')
      .mockResolvedValueOnce('https://s3mock/files-1');
    const drafttWithPresigned = await depositService.setPresignedURLs(draft);
    assertIsDefined(drafttWithPresigned.publicationFile);
    expect(drafttWithPresigned.publicationFile.url).toBe('https://s3mock/publicationFile');
    expect(drafttWithPresigned.files[0].url).toBe('https://s3mock/files-0');
    expect(drafttWithPresigned.files[1].url).toBe('https://s3mock/files-1');
  });

  describe('getBibtexCitation', () => {
    it('should get bibtex citation', async () => {
      const { deposit } = await createDeposit(module, {
        deposit: {
          _id: new Types.ObjectId('64900ee96bcda8382ed8737e'),
        },
      });
      const res = await depositService.getBibtexCitation(deposit._id.toHexString());
      const fixture = readFileSync(
        path.resolve(__dirname, './fixtures/bibtex-reference.txt')
      ).toString();
      expect(res).toBe(fixture);
    });

    it('should raise exception if deposit not exists', async () => {
      await expect(depositService.getBibtexCitation(generateObjectId())).rejects.toThrow(
        new NotFoundException('Deposit not found')
      );
    });
  });

  it('should update deposit to latest version', async () => {
    const { deposit } = await createDeposit(module);
    const { deposit: updatedDeposit } = await createDeposit(module, {
      deposit: {
        parent: deposit.parent,
        version: deposit.version + 1,
      },
    });
    const updatedDepositPopulated = await depositService.findById(updatedDeposit._id);
    assertIsDefined(updatedDepositPopulated);
    await depositService.updateToLastVersion(updatedDepositPopulated);
    const oldDeposit = await depositService.findById(deposit._id);
    assertIsDefined(oldDeposit);
    expect(oldDeposit.isLatestVersion).toBe(false);
    expect(updatedDeposit.isLatestVersion).toBe(true);
  });

  it('should get APA citation', async () => {
    const { deposit } = await createDeposit(module, {
      deposit: {
        status: DepositStatus.preprint,
      },
    });

    const depositPopulated = await depositService.findById(deposit._id);
    assertIsDefined(depositPopulated, 'deposit not found');

    let res = depositService.getAPACitation(depositPopulated);
    expect(res).toBe(
      'Doe, J. (2024). Big data analytics as a service infrastructure: challenges, desired properties and solutions [preprint]. Orvium Community. https://doi.org/doiexample'
    );

    const { deposit: otherDeposit } = await createDeposit(module, {
      deposit: {
        status: DepositStatus.published,
        authors: [
          factoryAuthor.build({
            lastName: 'white',
            firstName: 'john',
          }),
          factoryAuthor.build({
            lastName: 'doe',
            firstName: 'john',
          }),
        ],
      },
    });
    const otherDepositPopulated = await depositService.findById(otherDeposit._id);
    assertIsDefined(otherDepositPopulated, 'deposit not found');
    res = depositService.getAPACitation(otherDepositPopulated);
    expect(res).toBe(
      'white, J. & doe, G. (2024). Big data analytics as a service infrastructure: challenges, desired properties and solutions. Orvium Community. https://doi.org/doiexample'
    );
  });

  it('should delete authors emails', async () => {
    const { deposit } = await createDeposit(module, {
      deposit: {
        authors: [
          factoryAuthor.build({
            lastName: 'doe',
            firstName: 'john',
            email: 'test@test.test',
          }),
        ],
      },
    });

    const depositPopulated = await depositService.findById(deposit._id);
    assertIsDefined(depositPopulated, 'deposit not found');
    depositService.deleteAuthorsEmail(depositPopulated);
    expect(depositPopulated.authors[0].email).toBe('');
  });
});
