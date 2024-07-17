import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DepositService } from './deposit.service';
import { DepositStatus } from './deposit.schema';
import { HttpModule } from '@nestjs/axios';
import { DepositController } from './deposit.controller';
import request from 'supertest';
import { JwtStrategy } from '../auth/jwt.strategy';
import { AnonymousStrategy } from '../auth/anonymous.strategy';
import { factoryDepositDocumentDefinition } from '../utils/test-data';
import { MongooseTestingModule } from '../utils/mongoose-testing.module';

describe('Deposit E2E', () => {
  let app: INestApplication;
  let depositService: DepositService;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [HttpModule, MongooseTestingModule.forRoot('DepositE2E')],
      providers: [JwtStrategy, AnonymousStrategy],
      controllers: [DepositController],
    }).compile();

    depositService = module.get(DepositService);
    await depositService.depositModel.deleteMany({});

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/GET deposits', async () => {
    const deposit = await depositService.depositModel.create(
      factoryDepositDocumentDefinition.build({
        status: DepositStatus.preprint,
      })
    );

    const response = await request(app.getHttpServer())
      .get('/deposits')
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');
    expect(response.body.deposits[0]._id).toEqual(deposit._id.toString());
  });

  it('/GET one deposit by id', async () => {
    const deposit = await depositService.depositModel.create(
      factoryDepositDocumentDefinition.build({
        status: DepositStatus.preprint,
      })
    );

    const response = await request(app.getHttpServer())
      .get(`/deposits/${deposit._id.toHexString()}`)
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');
    expect(response.body._id).toEqual(deposit._id.toString());
  });

  it('/GET should failed when accesing private endpoint', async () => {
    await request(app.getHttpServer()).get('/deposits/myDeposits').expect(401);
  });

  afterAll(async () => {
    await app.close();
  });
});
