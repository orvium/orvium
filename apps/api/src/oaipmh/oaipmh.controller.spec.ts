import { Test, TestingModule } from '@nestjs/testing';
import { OaipmhController } from './oaipmh.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { environment } from '../environments/environment';
import { OaipmhService } from './oaipmh.service';
import { AwsStorageService } from '../common/aws-storage-service/aws-storage.service';
import { DepositService } from '../deposit/deposit.service';
import { CommunitiesService } from '../communities/communities.service';

describe('Oaipmh Controller', () => {
  let controller: OaipmhController;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [MongooseModule.forRoot(environment.test.mongoUri)],
      controllers: [OaipmhController],
      providers: [
        OaipmhService,
        { provide: AwsStorageService, useValue: {} },
        { provide: DepositService, useValue: {} },
        { provide: CommunitiesService, useValue: {} },
      ],
    }).compile();

    controller = module.get(OaipmhController);
  });

  afterEach(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
