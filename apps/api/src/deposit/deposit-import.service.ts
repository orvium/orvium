import { Injectable, Logger } from '@nestjs/common';
import { Author, Deposit, DepositDocument, PublicationType } from './deposit.schema';
import { AwsStorageService } from '../common/aws-storage-service/aws-storage.service';
import { Reference } from '../dtos/reference.dto';
import { FigshareImportService } from './figshare-import.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { assertIsDefined } from '../utils/utils';
import { HTMLElement, parse } from 'node-html-parser';
import { DepositService } from './deposit.service';

const titleTags = ['citation_title', 'dc_title', 'og:title', 'dc.title', 'datacite.title'];
const abstractTags = [
  'citation_abstract',
  'dc_description',
  'og:description',
  'dc.description',
  'description',
  'abstract',
];
const keywordTags = ['citation_keywords', 'keywords'];
const doiTags = ['citation_doi', 'dc_identifier', 'dc.identifier', 'dc.identifier.doi'];
const pdfUrlTags = ['citation_pdf_url'];
const authorTags = ['citation_author', 'dc_creator', 'dc.creator', 'datacite.contributor'];
const referencesTags = ['citation_reference'];
const typesTags = ['dc.type'];
const journalTags = ['citation_journal_title'];
const conferenceTags = ['citation_conference_title'];
const bookTags = ['citation_inbook_title'];
const issnTags = ['citation_issn'];
const isbnTags = ['citation_isbn'];
const volumeTags = ['citation_volume'];
const publisherTags = ['citation_publisher'];
const issueTags = ['citation_issue'];
const languageTags = ['citation_language'];
// const institutionTags = ['citation_author_institution', 'citation_dissertation_institution'];
const dissertationTags = ['citation_dissertation_name'];
const firstPageTags = ['citation_firstpage'];
const lastPageTags = ['citation_lastpage'];

/**
 * Service for importing deposit data from various sources and generating metadata for deposits.
 */
@Injectable()
export class DepositImportService {
  /**
   * Initializes a new instance of the DepositImportService.
   */
  constructor(
    private readonly storageService: AwsStorageService,
    private readonly httpService: HttpService,
    private readonly figshareImportService: FigshareImportService,
    private readonly depositService: DepositService
  ) {}

  /**
   * Retrieves HTML content from a specified URL.
   * @param {string} link - The URL from which to fetch HTML.
   * @returns {Promise<string>} A Promise that resolves to the HTML content as a string.
   */
  async getHtmlFromUrl(link: string): Promise<string> {
    const response = await firstValueFrom(this.httpService.get(link, { withCredentials: true }));
    return response.data;
  }

  /**
   * Retrieves HTML content for a given DOI by constructing a URL to the DOI resolver.
   * @param {string} doi - The DOI for which to fetch HTML content.
   * @returns {Promise<string>} A Promise that resolves to the HTML content as a string.
   */
  async getHtmlFromDOI(doi: string): Promise<string> {
    return await this.getHtmlFromUrl(`https://doi.org/${doi}`);
  }

  /**
   * Extracts all meta tags from the provided HTML string.
   * @param {string} html - The HTML content to parse.
   * @returns {HTMLElement[]} An array of HTMLElements representing <meta> tags.
   */
  collectMetaTags(html: string): HTMLElement[] {
    const document = parse(html);
    return document.querySelectorAll('meta');
  }

  /**
   * Splits keyword strings into individual keywords and cleans them up.
   * @param {string[]} keywords - Array of keyword strings to process.
   * @returns {string[]} An array of individual, cleaned keywords.
   */
  getKeywords(keywords: string[]): string[] {
    return keywords
      .flatMap((keyword: string) => keyword.split(/[,;]+/))
      .map((keyword: string) => keyword.trim())
      .filter(keyword => !!keyword);
  }

  /**
   * Generates deposit data from the extracted meta tags.
   * @param {HTMLElement[]} tags - An array of HTMLElements representing <meta> tags.
   * @returns {Partial<DepositDocument>} An object containing extracted metadata suitable for creating or updating a deposit document.
   */
  generateData(tags: HTMLElement[]): Partial<DepositDocument> {
    Logger.debug('Generating data for tags', tags);
    const tempKeywords = this.getAllMetaTags(keywordTags, tags);
    const keywords = this.getKeywords(
      tempKeywords.map(keyword => keyword.getAttribute('content') as string)
    );
    const tempAuthors = this.getAllMetaTags(authorTags, tags);
    const authors = tempAuthors.map(author =>
      this.generateAuthorFromMetaData(author.getAttribute('content') as string)
    );
    const tempReferences = this.getAllMetaTags(referencesTags, tags);
    const references = tempReferences.map(reference =>
      this.generateReferenceFromMetaData(reference.getAttribute('content') as string)
    );
    const type = this.getOneMetaTag(typesTags, tags);
    const depositData: Partial<DepositDocument> = {
      title: this.getOneMetaTag(titleTags, tags),
      abstract: this.getOneMetaTag(abstractTags, tags),
      doi: this.getOneMetaTag(doiTags, tags),
      publicationType:
        type && type.length > 0 ? this.generateTypeFromMetaData(type) : PublicationType.article,
      keywords: keywords,
      pdfUrl: this.getOneMetaTag(pdfUrlTags, tags),
      authors: authors,
      references: references,
      extraMetadata: {
        conferenceTitle: this.getOneMetaTag(conferenceTags, tags),
        issn: this.getOneMetaTag(issnTags, tags),
        isbn: this.getOneMetaTag(isbnTags, tags),
        volume: this.getOneMetaTagNumber(volumeTags, tags),
        issue: this.getOneMetaTagNumber(issueTags, tags),
        firstpage: this.getOneMetaTagNumber(firstPageTags, tags),
        lastpage: this.getOneMetaTagNumber(lastPageTags, tags),
        publisher: this.getOneMetaTag(publisherTags, tags),
        journalTitle: this.getOneMetaTag(journalTags, tags),
        dissertationName: this.getOneMetaTag(dissertationTags, tags),
        inbookTitle: this.getOneMetaTag(bookTags, tags),
        language: this.getOneMetaTag(languageTags, tags),
      },
    };
    return depositData;
  }

  /**
   * Imports deposit from a specific URL and creates a deposit document.
   * @param {string} url - The URL to import metadata from.
   * @returns {Promise<Partial<DepositDocument>>} A Promise that resolves to the partial deposit document with extracted metadata.
   */
  async importDepositWithUrl(url: string): Promise<Partial<DepositDocument>> {
    Logger.debug(`Importing ${url}`);
    const html = await this.getHtmlFromUrl(url);
    assertIsDefined(html, 'Data not found');
    Logger.debug(html);
    const metatags = this.collectMetaTags(html);
    const partialDeposit = this.generateData(metatags);

    // if (finalDeposit.pdfUrl) {
    //   await this.downloadFile(finalDeposit.pdfUrl, finalDeposit);
    // }

    return partialDeposit;
  }

  /**
   * Imports deposit from a DOI and creates a deposit document.
   * @param {Partial<Deposit>} documentDefinition - The initial data for the deposit document.
   * @returns {Promise<DepositDocument>} A Promise that resolves to the fully created deposit document.
   */
  async importDeposit(documentDefinition: Partial<Deposit>): Promise<DepositDocument> {
    assertIsDefined(documentDefinition.doi);
    const html = await this.getHtmlFromDOI(`https://doi.org/${documentDefinition.doi}`);
    const metatags = this.collectMetaTags(html);
    if (this.isFigshareRepository(metatags)) {
      return this.figshareImportService.importDeposit(documentDefinition);
    }
    const partialDeposit = this.generateData(metatags);
    documentDefinition = { ...documentDefinition, ...partialDeposit };
    const deposit = await this.depositService.create(documentDefinition);
    if (deposit.pdfUrl) {
      await this.downloadFile(deposit.pdfUrl, deposit);
    }
    return deposit;
  }

  /**
   * Returns the content of the first matching meta tag for a specified list of tag names.
   * @param {string[]} tagsToFind - Array of tag names to search for.
   * @param {HTMLElement[]} tags - Array of HTMLElements representing <meta> tags.
   * @returns {string | undefined} The content of the first matching meta tag, or undefined if no match is found.
   */
  getOneMetaTag(tagsToFind: string[], tags: HTMLElement[]): string | undefined {
    Logger.debug('Finding tags', tagsToFind);
    for (const meta of tagsToFind) {
      const foundMetatag = tags.find(tag => tag.getAttribute('name') === meta);
      if (foundMetatag) {
        Logger.debug(`Found tag ${foundMetatag.getAttribute('name') || 'undefined key'}`);
        Logger.debug(foundMetatag.getAttribute('content'));
        return foundMetatag.getAttribute('content');
      }
    }
    return undefined;
  }

  /**
   * Returns the numeric content of the first matching meta tag for a specified list of tag names.
   * @param {string[]} tagsToFind - Array of tag names to search for.
   * @param {HTMLElement[]} tags - Array of HTMLElements representing <meta> tags.
   * @returns {number | undefined} The numeric content of the first matching meta tag, or undefined if no match is found or the content is not numeric.
   */
  getOneMetaTagNumber(tagsToFind: string[], tags: HTMLElement[]): number | undefined {
    Logger.debug('Finding tags', tagsToFind);
    for (const meta of tagsToFind) {
      const foundMetatag = tags.find(tag => tag.getAttribute('name') === meta);
      if (foundMetatag) {
        Logger.debug(`Found tag ${foundMetatag.getAttribute('name') || 'undefined key'}`);
        const content = foundMetatag.getAttribute('content');
        const value = content ? +content : 0;
        return value;
      }
    }
    return undefined;
  }

  /**
   * Returns all HTMLElements for a specified list of meta tag names.
   * @param {string[]} tagsToFind - Array of tag names to search for.
   * @param {HTMLElement[]} tags - Array of HTMLElements representing <meta> tags.
   * @returns {HTMLElement[]} An array of HTMLElements for the specified tag names.
   */
  getAllMetaTags(tagsToFind: string[], tags: HTMLElement[]): HTMLElement[] {
    Logger.debug('Finding tags', tagsToFind);
    for (const meta of tagsToFind) {
      const foundMetatags = tags.filter(tag => tag.getAttribute('name') === meta);
      if (foundMetatags.length > 0) {
        Logger.debug(`Found tag ${meta}`);
        return foundMetatags;
      }
    }
    return [];
  }

  /**
   * Downloads a file from a given URL and attaches it to a deposit document.
   * @param {string} url - The URL of the file to download.
   * @param {DepositDocument} deposit - The deposit document to which the file is attached.
   */
  async downloadFile(url: string, deposit: DepositDocument): Promise<void> {
    const response = await this.httpService
      .axiosRef({
        url: url,
        method: 'GET',
        timeout: 25000,
        responseType: 'arraybuffer',
      })
      .catch(error => {
        Logger.debug(
          `Unable to download deposit ${deposit._id.toHexString()} file with url ${url}. Error: ${String(
            error
          )}`
        );
        return;
      });
    let filename = deposit.title.replace(/\s/g, '');
    filename = filename + '.pdf';
    if (response) {
      await this.storageService.save(`${deposit._id.toHexString()}/${filename}`, response.data);
      deposit.publicationFile = {
        filename: filename,
        description: filename,
        contentType: 'application/pdf',
        contentLength: +(response.headers['content-length'] || 0),
        tags: ['Publication'],
      };
      deposit.pdfUrl = filename;
      await deposit.save();
    }
  }

  /**
   * Generates reference from citation_reference meta tag used by Google Scholar
   *
   * @param {string} meta metatag content as a string
   * @returns {string} the complete reference with authors, date and title
   */
  generateReferenceFromMetaData(meta: string): Reference {
    const referenceSplit = meta.split(';');
    let titleReference = '';
    const authorReference: string[] = [];
    let dateReference = 'n.d.';
    for (const reference of referenceSplit) {
      const referenceSubTag = reference.split('=');
      switch (referenceSubTag[0].trim()) {
        case 'citation_title': {
          titleReference = referenceSubTag[1].trim();
          break;
        }
        case 'citation_author': {
          authorReference.push(referenceSubTag[1].trim());
          break;
        }
        case 'citation_publication_date': {
          dateReference = referenceSubTag[1].trim();
          break;
        }
        default: {
          break;
        }
      }
    }
    return { reference: authorReference.join(',') + ' (' + dateReference + ') ' + titleReference };
  }

  /**
   * Generates author from author meta tag, based on Google Scholar citation_author metatag
   *
   * @param {string} meta metatag content as a string
   * @returns {Author} the author
   */
  generateAuthorFromMetaData(meta: string): Author {
    const splitAuthor = meta.split(' ');
    // Author names can be listed either as "Smith, John" or as "John Smith".
    if (meta.includes(',')) {
      const splitAuthor = meta.split(',');
      const surname = splitAuthor[0] || '';
      const name = splitAuthor[1] || '';
      const author: Author = {
        firstName: name.trim(),
        lastName: surname.trim(),
        credit: [],
        institutions: [],
      };
      return author;
    } else {
      const name = splitAuthor[0] || '';
      splitAuthor.shift();
      const surname = splitAuthor.join(' ');
      const author: Author = {
        firstName: name.trim(),
        lastName: surname.trim(),
        credit: [],
        institutions: [],
      };
      return author;
    }
  }

  /**
   * Generates publication type from type meta tag
   *
   * @param {string} meta metatag type as a string
   * @returns {PublicationType} the type
   */
  generateTypeFromMetaData(meta: string): PublicationType {
    if (meta in PublicationType) {
      return PublicationType[meta as keyof typeof PublicationType];
    } else {
      return PublicationType.article;
    }
  }

  /**
   * Checks if the publication is hosted on a Figshare repository
   *
   * @param {unknown[]} tags
   * @returns {boolean} is or not hosted on a Figshare repository
   */
  isFigshareRepository(tags: HTMLElement[]): boolean {
    const element = tags.find(
      tag =>
        tag.getAttribute('name') === 'application-name' &&
        tag.getAttribute('content') === 'figshare'
    );
    return !!element;
  }
}
