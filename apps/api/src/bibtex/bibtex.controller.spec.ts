import { Test, TestingModule } from '@nestjs/testing';
import { BibtexController } from './bibtex.controller';
import { BibtexService } from './bibtex.service';
import { HttpModule } from '@nestjs/axios';

describe('BibtexController', () => {
  let controller: BibtexController;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      controllers: [BibtexController],
      providers: [BibtexService],
      imports: [HttpModule],
    }).compile();

    controller = module.get<BibtexController>(BibtexController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get bibtex', async () => {
    const bibtexService = module.get(BibtexService);
    const spy = jest.spyOn(bibtexService, 'getBibtexDataFromDoi').mockImplementation();
    await controller.getBibtexDoi('');
    expect(spy).toHaveBeenCalled();
  });
  it('should transform citations to bibtex', async () => {
    const bibtexService = module.get(BibtexService);
    const spy = jest.spyOn(bibtexService, 'textCitationToBibtex').mockImplementation();
    await controller.transformCitationsToBibtex({ citations: [''] });
    expect(spy).toHaveBeenCalled();
  });

  it('should add bibtex references', async () => {
    const bibtexJson = await controller.uploadBibtexFile({
      bibtexReferences:
        '@article{patashnik1984bibtex,\n' +
        '  title={BIBTEX 101},\n' +
        '  author={Patashnik, Oren},\n' +
        '  year={1984}\n' +
        '}',
    });
    expect(bibtexJson.length).toBe(1);
  });
});
