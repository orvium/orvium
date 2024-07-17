import { Test, TestingModule } from '@nestjs/testing';
import { DisciplineController } from './discipline.controller';
import { DisciplineService } from './discipline.service';
import { MongooseTestingModule } from '../utils/mongoose-testing.module';

describe('DisciplineController', () => {
  let controller: DisciplineController;
  let disciplineService: DisciplineService;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      controllers: [DisciplineController],
      imports: [MongooseTestingModule.forRoot('DisciplineController')],
      providers: [],
    }).compile();
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    controller = module.get(DisciplineController);
    disciplineService = module.get(DisciplineService);

    await disciplineService.disciplineModel.deleteMany();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get disciplines', async () => {
    await disciplineService.disciplineModel.insertMany([
      {
        name: 'Medicine',
        description: 'This is medicine field',
      },
      {
        name: 'Computing',
        description: 'This is computing field',
      },
    ]);

    const disciplines = await controller.getDisciplines();
    expect(disciplines.length).toBe(2);
    expect(disciplines[1].name).toBe('Computing');
  });
});
