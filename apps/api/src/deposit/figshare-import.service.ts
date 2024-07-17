import { Injectable, NotFoundException } from '@nestjs/common';
import { AccessRight, Author, Deposit, DepositDocument, PublicationType } from './deposit.schema';
import { AwsStorageService } from '../common/aws-storage-service/aws-storage.service';
import { DepositService } from './deposit.service';
import { FileMetadata } from '../dtos/filemetadata.dto';
import { extname } from 'path';
import { HttpService } from '@nestjs/axios';
import { assertIsDefined } from '../utils/utils';

/**
 * Service responsible for importing deposits from the Figshare API.
 */
@Injectable()
export class FigshareImportService {
  /**
   * Initializes the FigshareImportService with required services.
   *
   * @param {AwsStorageService} storageService - Service for interacting with AWS S3 storage.
   * @param {HttpService} httpService - Service for making HTTP requests.
   * @param {DepositService} depositService - Service for interacting with deposits.
   */
  constructor(
    private readonly storageService: AwsStorageService,
    private readonly httpService: HttpService,
    private readonly depositService: DepositService
  ) {}

  /**
   * Imports a deposit from the Figshare API.
   *
   * @param {Partial<Deposit>} query - The query object containing information about the deposit.
   * @returns {Promise<DepositDocument>} The newly imported deposit.
   */
  async importDeposit(query: Partial<Deposit>): Promise<DepositDocument> {
    const searchArticle = await this.httpService
      .post('https://api.figshare.com/v2/articles/search', {
        doi: query.doi,
      })
      .toPromise()
      .catch(error => {
        console.log(error);
        throw new NotFoundException('Unable to import');
      });
    assertIsDefined(searchArticle);
    assertIsDefined(searchArticle.data[0], 'Unable to import');
    const result = await this.httpService
      .get(`https://api.figshare.com/v2/articles/${String(searchArticle.data[0].id)}`)
      .toPromise();
    assertIsDefined(result, 'Unable to import');
    assertIsDefined(result.data, 'Unable to import');
    query.abstract = result.data.description;
    query.title = result.data.title;
    query.keywords = result.data.tags;
    const authors = result.data.authors;
    query.authors = [];
    for (const author of authors) {
      query.authors.push(this.generateAuthorFromAuthorField(author));
    }
    query.accessRight = this.generateLicenseFromLicenseField(result.data.license);
    query.publicationType = this.generateTypeFromMetaData(result.data.defined_type_name);
    const deposit = await this.depositService.create(query);

    for (const file of result.data.files) {
      await this.downloadFile(file, deposit);
    }

    return deposit;
  }

  /**
   * Downloads a file from the Figshare file field.
   *
   * @param {Object} figshareFile - The file object from the Figshare API response.
   * @param {DepositDocument} deposit - The deposit document associated with the file.
   * @returns {Promise<void>} A promise that resolves when the file is downloaded and saved.
   */
  async downloadFile(
    figshareFile: {
      is_link_only: boolean;
      name: string;
      supplied_md5: string;
      computed_md: string;
      id: number;
      download_url: string;
      size: number;
    },
    deposit: DepositDocument
  ): Promise<void> {
    const response = await this.httpService
      .axiosRef({
        url: figshareFile.download_url,
        method: 'GET',
        timeout: 25000,
        responseType: 'stream',
      })
      .catch(error => {
        console.log(
          `Unable to download deposit ${deposit._id.toHexString()} file with url ${
            figshareFile.download_url
          }. Error: ${String(error)}`
        );
        return;
      });
    const filename = figshareFile.name;
    const fileExtension = extname(filename).toLowerCase();
    if (response) {
      await this.storageService.save(`${deposit._id.toHexString()}/${filename}`, response.data);
      const fileMetadata: FileMetadata = {
        filename: filename,
        description: figshareFile.name,
        contentType: `application/${fileExtension.replace('.', '')}`,
        contentLength: +(response.headers['content-length'] || 0),
        tags: [],
      };
      deposit.files.push(fileMetadata);
      deposit.markModified('files');
      await deposit.save();
    }
  }

  /**
   * Generates an author from the Figshare author field.
   *
   * @param {Object} figshareAuthor - The author object from the Figshare API response.
   * @returns {Author} The generated author object.
   */
  generateAuthorFromAuthorField(figshareAuthor: {
    id: number;
    full_name: string;
    is_active: number;
    url_name: string;
    orcid_id: string;
  }): Author {
    const fullName = figshareAuthor.full_name.split(' ');
    const name = fullName[0];
    fullName.shift();
    const surname = fullName.join(' ');
    const author: Author = {
      firstName: name,
      lastName: surname,
      credit: [],
      institutions: [],
    };
    if (figshareAuthor.orcid_id != '') {
      author.orcid = `https://orcid.org/${figshareAuthor.orcid_id}`;
    }
    return author;
  }

  /**
   * Generates a license from the Figshare license field.
   *
   * @param {Object} figshareLicense - The license object from the Figshare API response.
   * @returns {AccessRight} The generated license object.
   */
  generateLicenseFromLicenseField(figshareLicense: {
    value: number;
    name: string;
    url: string;
  }): AccessRight {
    if (figshareLicense.name in AccessRight) {
      const license: AccessRight = AccessRight[figshareLicense.name as keyof typeof AccessRight];
      return license;
    } else {
      return AccessRight.CC0;
    }
  }

  /**
   * Generates a publication type from the defined_type_name field.
   *
   * @param {string} figshareType - The type string from the Figshare API response.
   * @returns {PublicationType} The generated publication type.
   */
  generateTypeFromMetaData(figshareType: string): PublicationType {
    if (figshareType in PublicationType) {
      const type: PublicationType = PublicationType[figshareType as keyof typeof PublicationType];
      return type;
    } else {
      return PublicationType.article;
    }
  }
}
