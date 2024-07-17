//http://div.div1.com.au/div-thoughts/div-commentaries/66-div-commentary-metadata
//https://zenodo.org/ viewing the mandatory upload fields
export class ExtraMetadata {
  /**
   * Conference title
   * @example "Arch 22"
   */
  conferenceTitle?: string | null;

  /**
   * The theme is the slogan or special emphasis of a conference in a particular year.
   * It differs from the subject of a conference in that the subject is stable over the years while the theme may vary
   * from year to year. For example, the American Society for Information Science and Technology conference theme was
   * "Knowledge: Creation, Organization and Use" in 1999 and "Defining Information Architecture" in 2000.
   * @example "Contributing to more responsible, sustainable and transparent methods to assess academic work"
   */
  conferenceTheme?: string | null;

  /**
   * Publication issn
   * @example 2049-3630
   */
  issn?: string | null;

  /**
   * Publication isbn
   * @example 978-3-16-148410-0
   */
  isbn?: string | null;

  /**
   * Publication volume
   * @example 6
   */
  volume?: number | null;

  /**
   * Publication issue
   * @example 15
   */
  issue?: number | null;

  /**
   * Publication firstpage
   * @example 1
   */
  firstpage?: number | null;

  /**
   * Publication lastpage
   * @example 155
   */
  lastpage?: number | null;

  /**
   * Publication publisher name
   * @example "John Doe"
   */
  publisher?: string | null;

  /**
   * The title of the journal of the publication
   * @example "My architecture journal"
   */
  journalTitle?: string | null;

  /**
   * The dissertationName of the publication
   * @example "Architecture in late 20s"
   */
  dissertationName?: string | null;

  /**
   * The title of the inbook refered in the publication
   * @example "New horizons"
   */
  inbookTitle?: string | null;

  /**
   * Language of the publication
   * @example es-ES
   */
  language?: string | null;

  /**
   * Institution where the publications have been submitted
   * @example Orvium
   */
  dissertationInstitution?: string | null;

  /**
   * Institution where the technical report have been done for the publication
   * @example Orvium
   */
  technicalReportInstitution?: string | null;

  /**
   * The canonical URL is the URL of the best representative page from a group of duplicate pages
   * @example "example.com? dress=1234 and example.com/dresses/1234"
   */
  canonical?: string | null;
}
