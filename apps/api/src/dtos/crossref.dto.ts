import { CROSSREF_ENDPOINT } from '../utils/utils';

export class CrossrefDTO {
  /**
   * Prefix of the DOI
   * @example 10.55835
   */
  prefixDOI!: string;

  /**
   * User id
   * @example 63848e5d2e63b7fa277f58b0
   */
  user!: string;

  /**
   * Crossref password
   * @example my_password_example
   */
  pass!: string;

  /**
   * Crossref role
   * @example orvi
   */
  role!: string;

  /**
   * Crossref server
   * @example https://doi.crossref.org/servlet/deposit
   */
  server!: CROSSREF_ENDPOINT;
}
