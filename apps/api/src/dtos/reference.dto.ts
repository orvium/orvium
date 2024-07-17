export class Reference {
  /**
   * The content of the reference
   * @example "Barlow, J., Hendy, J., & Tucker, D. A. (2016). Managing major health service and infrastructure transitions: A comparative study of UK, US and Canadian hospitals. World Health Design, 9(1), 8-22."
   */
  reference!: string;

  /**
   * The url where the reference was taken from
   * @example "https://repository.essex.ac.uk/16327/"
   */
  url?: string;
}
