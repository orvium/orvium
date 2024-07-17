import { Test, TestingModule } from '@nestjs/testing';
import { InstitutionController } from './institution.controller';
import { InstitutionService } from './institution.service';
import { factoryUser } from '../utils/test-data';
import { CreateInstitutionDTO } from '../dtos/institution/create-institution.dto';
import { request } from 'express';
import { UserService } from '../users/user.service';
import { UnauthorizedException } from '@nestjs/common';
import { MongooseTestingModule } from '../utils/mongoose-testing.module';

describe('Institution Controller', () => {
  let controller: InstitutionController;
  let institutionService: InstitutionService;
  let userService: UserService;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      controllers: [InstitutionController],
      imports: [MongooseTestingModule.forRoot('InstitutionController')],
      providers: [],
    }).compile();

    controller = module.get(InstitutionController);
    institutionService = module.get(InstitutionService);
    userService = module.get(UserService);

    await userService.userModel.deleteMany();
    await institutionService.institutionModel.deleteMany();
    await institutionService.institutionModel.insertMany([
      { name: 'Orvium', domain: 'orvium.io' },
      { name: 'HW', domain: 'example.com' },
    ]);
  });

  afterEach(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get institution', async () => {
    const institution = await controller.getInstitution('orvium.io');
    expect(institution.name).toBe('Orvium');
    const institutionHW = await controller.getInstitution('students.example.com');
    expect(institutionHW.name).toBe('HW');
  });

  it('admin should be able to create institutions', async () => {
    const admin = await new userService.userModel(factoryUser.build({ roles: ['admin'] })).save();
    expect(institutionService.canCreateInstitution(admin)).toBeTruthy();
  });

  it('should create an institution', async () => {
    const admin = await new userService.userModel(factoryUser.build({ roles: ['admin'] })).save();
    const createInstitutionDTO: CreateInstitutionDTO = {
      domain: 'ikustek.com',
      name: 'Ikustek',
      country: 'spain',
      city: 'vitoria',
    };
    const institution = await controller.createInstitution(
      { user: { sub: admin.userId } } as unknown as typeof request,
      createInstitutionDTO
    );
    expect(institution.name).toBe('Ikustek');
    await expect(
      controller.createInstitution(
        { user: { sub: admin.userId } } as unknown as typeof request,
        createInstitutionDTO
      )
    ).rejects.toThrow(UnauthorizedException);

    const notAdmin = await new userService.userModel(factoryUser.build({ roles: [] })).save();
    await expect(
      controller.createInstitution(
        { user: { sub: notAdmin.userId } } as unknown as typeof request,
        createInstitutionDTO
      )
    ).rejects.toThrow(UnauthorizedException);
  });
});
