import { DATACITE_ENDPOINT } from '../datacite/datacite.service';

export class DataCiteDTO {
  /**
   * Prefix of the DOI
   * @example 10.55835
   */
  prefix!: string;

  /**
   * Account id
   * @example 63848e5d2e63b7fa277f58b0
   */
  accountId!: string;

  /**
   * DataCite password
   * @example my_password_example
   */
  pass!: string;

  /**
   * DataCite server
   * @example https://doi.crossref.org/servlet/deposit
   */
  server!: DATACITE_ENDPOINT;
}
