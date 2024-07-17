import { Test, TestingModule } from '@nestjs/testing';
import { OrcidService } from './orcid.service';
import { HttpModule, HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { AxiosResponse } from 'axios';

describe('OrcidService', () => {
  let service: OrcidService;
  let module: TestingModule;
  let http: HttpService;
  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [OrcidService],
    }).compile();

    service = module.get(OrcidService);
    http = module.get(HttpService);
  });

  afterEach(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should resolve', async () => {
    const spy = jest.spyOn(http, 'get').mockReturnValue(of({} as AxiosResponse));
    await service.getOrcidData('0000-0000-0000-0000');
    expect(spy).toHaveBeenCalled();
  });
});
