import { Test, TestingModule } from '@nestjs/testing';
import { OrcidController } from './orcid.controller';
import { OrcidData, OrcidService } from './orcid.service';
import { HttpModule } from '@nestjs/axios';

describe('OrcidController', () => {
  let controller: OrcidController;
  let orvidService: OrcidService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrcidController],
      providers: [OrcidService],
      imports: [HttpModule],
    }).compile();

    controller = module.get(OrcidController);
    orvidService = module.get(OrcidService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get orcid data', async () => {
    jest.spyOn(orvidService, 'getOrcidData').mockReturnValue({} as Promise<OrcidData>);
    const result = await controller.getOrcidData('0000-0000-0000-0000');
    expect(result).toStrictEqual({});
  });
});
