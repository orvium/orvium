import { Test, TestingModule } from '@nestjs/testing';
import { BibtexService } from './bibtex.service';
import { HttpModule, HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { AxiosResponse } from 'axios';
import { MongooseTestingModule } from '../utils/mongoose-testing.module';

describe('BibtexService', () => {
  let service: BibtexService;
  let module: TestingModule;
  let http: HttpService;
  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [MongooseTestingModule.forRoot('BibtexService'), HttpModule],
      providers: [BibtexService],
    }).compile();

    service = module.get(BibtexService);
    http = module.get(HttpService);
  });

  afterEach(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should resolve', async () => {
    const result: AxiosResponse = {
      data:
        '@article{Paskin_1999,\n' +
        '\tdoi = {10.1109/5.771073},\n' +
        '\turl = {https://doi.org/10.1109%2F5.771073},\n' +
        '\tyear = 1999,\n' +
        '\tmonth = {jul},\n' +
        '\tpublisher = {Institute of Electrical and Electronics Engineers ({IEEE})},\n' +
        '\tvolume = {87},\n' +
        '\tnumber = {7},\n' +
        '\tpages = {1208--1227},\n' +
        '\tauthor = {N. Paskin},\n' +
        '\ttitle = {Toward unique identifiers},\n' +
        '\tjournal = {Proceedings of the {IEEE}}',
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
      request: {
        res: {
          headers: {},
        },
      },
    } as AxiosResponse;
    const spy = jest.spyOn(http, 'get').mockReturnValue(of(result));
    const bibtex = await service.getBibtexDataFromDoi('https://dx.doi.org/10.1093/ajae/aaq063');
    expect(spy).toHaveBeenCalled();
    expect(bibtex.volume).toBe('87');
    expect(bibtex.title).toBe('Toward unique identifiers');
  });

  it('should not resolve', async () => {
    const result: AxiosResponse = {
      data: null,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
      request: {
        res: {
          headers: {},
        },
      },
    } as AxiosResponse;
    const spy = jest.spyOn(http, 'get').mockReturnValue(of(result));
    await expect(
      service.getBibtexDataFromDoi('https://dx.doi.org/10.1093/ajae/aaq063')
    ).rejects.toThrow();
    expect(spy).toHaveBeenCalled();
  });

  it('should return an array of formatted bibtex citations', async () => {
    const testCitations = [
      'white, J. and DOE, J. and doe, G. and white, J. (2023). CROSS REFT TESTff [preprint]. doi:10.1093/ajae/aaq063',
      'Smith, J. and Doe, J. (2022). My Article. Journal of Articles, 1(1), 1-10. doi:10.1234/5678',
    ];

    const token =
      'o84/nC4G6UfG3qMWdRVx1QwBsn0FYrbPsNAiTgWx1NjcyS7e+nptwSsBi8tp0P8H+3aPJhs1x+8v8gkrNdeD5w==';
    const getResponse: AxiosResponse = {
      data: `<meta name="csrf-token" content="${token}" />`,
      status: 200,
      statusText: 'OK',
      headers: {
        'set-cookie': 'my-cookie',
      },
      config: {},
      request: {
        res: {
          headers: {},
        },
      },
    } as unknown as AxiosResponse;
    const spyGet = jest.spyOn(http, 'get').mockReturnValue(of(getResponse));
    const postResponse = {
      data: `@article@misc{white2023a,
              author = {white, J. and DOE, J. and doe, G. and white, J.},
              date = {2023},
              title = {CROSS REFT},
              edition = {TESTff [preprint},
              doi = {10.1093/ajae/aaq063},
              language = {es}
            }
            @article{smith2022a,
              author = {Smith, J. and Doe, J.},
              date = {2022},
              title = {My Article},
              volume = {1},
              pages = {1–10},
              doi = {10.1234/5678},
              language = {fr},
              journal = {Journal of Articles},
              number = {1}
            }`,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
      request: {
        res: {
          headers: {},
        },
      },
    } as AxiosResponse;
    const spyPost = jest.spyOn(http, 'post').mockReturnValue(of(postResponse));

    const result = await service.textCitationToBibtex(testCitations);

    expect(spyGet).toHaveBeenCalledWith('https://anystyle.io/', { withCredentials: true });
    expect(spyPost).toHaveBeenCalledWith(
      'https://anystyle.io/parse',
      { input: testCitations },
      {
        params: { format: 'bibtex' },
        headers: {
          'content-type': 'application/json;charset=UTF-8',
          cookie: 'my-cookie',
          'user-agent':
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36',
          'x-csrf-token': token,
        },
      }
    );

    expect(result.length).toBe(2);
  });

  it('should return emptyArray if the response does not return valid data', async () => {
    const testCitations = ['Here goes the citation text'];

    const token =
      'o84/nC4G6UfG3qMWdRVx1QwBsn0FYrbPsNAiTgWx1NjcyS7e+nptwSsBi8tp0P8H+3aPJhs1x+8v8gkrNdeD5w==';
    const getResponse: AxiosResponse = {
      data: `<meta name="csrf-token" content="${token}" />`,
      status: 200,
      statusText: 'OK',
      headers: {
        'set-cookie': 'my-cookie',
      },
      config: {},
      request: {
        res: {
          headers: {},
        },
      },
    } as unknown as AxiosResponse;
    const spyGet = jest.spyOn(http, 'get').mockReturnValue(of(getResponse));
    const postResponse = {
      data: '',
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
      request: {
        res: {
          headers: {},
        },
      },
    } as AxiosResponse;
    const spyPost = jest.spyOn(http, 'post').mockReturnValue(of(postResponse));

    // Empty array should not call anything
    const emptyResult = await service.textCitationToBibtex([]);
    expect(spyGet).not.toHaveBeenCalled();
    expect(emptyResult.length).toBe(0);

    const result = await service.textCitationToBibtex(testCitations);
    expect(spyGet).toHaveBeenCalledWith('https://anystyle.io/', { withCredentials: true });
    expect(spyPost).toHaveBeenCalledWith(
      'https://anystyle.io/parse',
      { input: testCitations },
      {
        params: { format: 'bibtex' },
        headers: {
          'content-type': 'application/json;charset=UTF-8',
          cookie: 'my-cookie',
          'user-agent':
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36',
          'x-csrf-token': token,
        },
      }
    );

    expect(result).toBeTruthy();
  });
});
