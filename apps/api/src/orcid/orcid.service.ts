import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface OrcidData {
  names: {
    givenNames: {
      value: string;
    };
    familyName: {
      value: string;
    };
  };
  emails: {
    emails: [
      {
        value: string;
      },
    ];
  };
}

/**
 * Service for handling OrcidService.
 */
@Injectable()
export class OrcidService {
  /**
   * Constructs an instance of OrcidService with required services.
   */
  constructor(private http: HttpService) {}

  /**
   * Fetches the public record data for a given ORCID ID from the ORCID API.
   *
   * @param {string} orcidID - The ORCID ID to retrieve data for.
   * @returns {Promise<OrcidData>} A promise that resolves to the ORCID data.
   */
  async getOrcidData(orcidID: string): Promise<OrcidData> {
    const { data } = await firstValueFrom(
      this.http.get<OrcidData>(`https://orcid.org/${orcidID}/public-record.json`)
    );
    return data;
  }
}
