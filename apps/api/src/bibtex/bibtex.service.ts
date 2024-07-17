import { BadRequestException, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { BibtexParser } from 'bibtex-js-parser';
import { getMetaContent } from '../utils/utils';
import { BibtexReferences } from '../deposit/deposit.schema';

/**
 * Service for handling BibTeX data retrieval and parsing operations.
 */
@Injectable()
export class BibtexService {
  /**
   * Constructs a new instance of BibtexService.
   *
   * @param httpService The HTTP service for making HTTP requests.
   */
  constructor(private httpService: HttpService) {}

  /**
   * Retrieves BibTeX data from a specified DOI.
   *
   * @param doi The digital object identifier (DOI) string.
   * @returns A Promise that resolves to BibTeX references parsed from the DOI response.
   * @throws {BadRequestException} Throws when the DOI cannot be resolved.
   */
  async getBibtexDataFromDoi(doi: string): Promise<BibtexReferences> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get<string>(`https://doi.org/${doi}`, {
          headers: { Accept: 'application/x-bibtex' },
        })
      );

      return BibtexParser.parseToJSON(data)[0];
    } catch (e) {
      console.log(e);
      throw new BadRequestException('Doi not found');
    }
  }

  /**
   * Converts text citations to BibTeX references.
   *
   * @param citations An array of citation strings.
   * @returns A Promise that resolves to an array of BibTeX references.
   */
  async textCitationToBibtex(citations: string[]): Promise<BibtexReferences[]> {
    if (citations.length === 0) return [];

    const link = 'https://anystyle.io/';

    const res = await firstValueFrom(this.httpService.get<string>(link, { withCredentials: true }));
    const token = getMetaContent(res.data, 'csrf-token');

    const response = await firstValueFrom(
      this.httpService.post<string>(
        link + 'parse',
        {
          input: citations,
        },
        {
          params: {
            format: 'bibtex',
          },
          headers: {
            'content-type': 'application/json;charset=UTF-8',
            cookie: res.headers['set-cookie'],
            'user-agent':
              'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36',
            'x-csrf-token': token,
          },
        }
      )
    );

    return BibtexParser.parseToJSON(response.data);
  }
}
