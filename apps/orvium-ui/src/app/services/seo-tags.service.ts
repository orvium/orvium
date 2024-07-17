import { Inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { DepositPopulatedDTO } from '@orvium/api';
import { DOCUMENT, formatDate } from '@angular/common';
import { environment } from '../../environments/environment';

/**
 * Provides a service for managing SEO tags for web pages, including the dynamic insertion and
 * removal of meta tags and link elements for canonical URLs.
 */
@Injectable({
  providedIn: 'root',
})
export class SeoTagsService {
  /** An array to store references to meta elements created by the service for easy removal and management. */
  public metaElements: HTMLMetaElement[] = [];

  /** A reference to the link element for the canonical URL of the page, allowing for its dynamic update and removal. */
  private canonicalLink: HTMLLinkElement | undefined;

  /**
   * Constructs the SeoTagsService with necessary dependencies.
   *
   * @param {Title} titleService - Angular's Title service to dynamically change the document's title.
   * @param {Document} document - A reference to the DOM's Document object, injected to facilitate DOM manipulations.
   * @param {Meta} metaService - Angular's Meta service to manage meta tags in the document head.
   */
  constructor(
    private titleService: Title,
    @Inject(DOCUMENT) private document: Document,
    private metaService: Meta
  ) {}

  /**
   * Removes all meta tags managed by this service from the document and the canonical link if it exists.
   */
  removeTagsAndCanonical(): void {
    for (const element of this.metaElements) {
      this.metaService.removeTagElement(element);
    }
    if (this.canonicalLink) {
      this.document.head.removeChild(this.canonicalLink);
      this.canonicalLink = undefined;
    }
    this.metaElements = [];
  }

  /**
   * Retrieves a meta tag by its name from the stored meta elements.
   *
   * @param {string} name - The name attribute of the meta tag to retrieve.
   * @returns {HTMLMetaElement | undefined} The meta element if found, or undefined if not.
   */
  getTag(name: string): HTMLMetaElement | undefined {
    return this.metaElements.find(meta => meta.name === name);
  }

  /**
   * Sets general SEO tags such as title and description for the page.
   *
   * @param {string} title - The title of the page.
   * @param {string} description - The description of the page.
   */
  setGeneralSeo(title: string, description: string): void {
    this.titleService.setTitle(title);
    const descriptionTag = this.metaService.addTag({
      name: 'description',
      content: description,
    });
    if (descriptionTag) {
      this.metaElements.push(descriptionTag);
    }
  }

  /**
   * Sets Open Graph meta tags to enhance link sharing on social media platforms.
   *
   * @param {string} title - The Open Graph title of the page.
   * @param {string} description - The Open Graph description of the page.
   * @param {string} url - The canonical URL of the page.
   */
  setOpengraphTags(title: string, description: string, url: string): void {
    const newTags = this.metaService.addTags([
      { name: 'og:title', content: title },
      {
        name: 'og:description',
        content: description,
      },
      { name: 'og:url', content: url },
      { name: 'og:site_name', content: 'Orvium' },
    ]);
    this.metaElements = this.metaElements.concat(newTags);
  }

  /**
   * Sets detailed publication-related meta tags based on a deposit object.
   *
   * @param {DepositPopulatedDTO} deposit - The deposit object containing publication details.
   * @param {string} url - The relative URL to the publication.
   */
  setPublicationTags(deposit: DepositPopulatedDTO, url: string): void {
    // Generate publication date and pdf url meta tag content
    let citationPublicationDate = undefined;
    if (deposit.publicationDate) {
      citationPublicationDate = formatDate(deposit.publicationDate, 'y/M/d', 'en-US');
      const onlineDate = this.metaService.addTag({
        name: 'citation_online_date',
        content: deposit.publicationDate,
      });
      if (onlineDate) {
        this.metaElements.push(onlineDate);
      }
    } else if (deposit.submissionDate) {
      citationPublicationDate = formatDate(deposit.submissionDate, 'y/M/d', 'en-US');
    }

    if (citationPublicationDate) {
      const metadates = this.metaService.addTags([
        { name: 'citation_publication_date', content: citationPublicationDate },
        { name: 'citation_year', content: citationPublicationDate.slice(0, 4) },
      ]);
      this.metaElements = this.metaElements.concat(metadates);
    }

    const newElements = this.metaService.addTags([
      { name: 'citation_title', content: deposit.title },
      { name: 'description', content: deposit.abstract },
      { name: 'citation_keywords', content: deposit.keywords.join(', ') },
      { name: 'citation_abstract_html_url', content: environment.publicUrl + url },
      { name: 'citation_public_url', content: environment.publicUrl + url },
    ]);

    this.metaElements = this.metaElements.concat(newElements);

    if (deposit.pdfUrl) {
      const pdfElement = this.metaService.addTag({
        name: 'citation_pdf_url',
        content: deposit.pdfUrl,
      });
      if (pdfElement) {
        this.metaElements.push(pdfElement);
      }
    }

    if (deposit.html) {
      const htmlElement = this.metaService.addTag({
        name: 'citation_fulltext_html_url',
        content: environment.publicUrl + url,
      });
      if (htmlElement) {
        this.metaElements.push(htmlElement);
      }
    }

    for (const author of deposit.authors) {
      const authorElement = this.metaService.addTag({
        name: 'citation_author',
        content: `${author.firstName} ${author.lastName}`,
      });
      if (authorElement) {
        this.metaElements.push(authorElement);
      }
      for (const institution of author.institutions) {
        const authorInstitution = this.metaService.addTag({
          name: 'citation_author_institution',
          content: institution,
        });
        if (authorInstitution) {
          this.metaElements.push(authorInstitution);
        }
      }
      if (author.orcid) {
        const authorOrcid = this.metaService.addTag({
          name: 'citation_author_orcid',
          content: author.orcid,
        });
        if (authorOrcid) {
          this.metaElements.push(authorOrcid);
        }
      }
    }

    if (deposit.doi) {
      const doiElement = this.metaService.addTag({ name: 'citation_doi', content: deposit.doi });
      if (doiElement) {
        this.metaElements.push(doiElement);
      }
    }

    if (deposit.extraMetadata.conferenceTitle) {
      const conferenceTitle = this.metaService.addTag({
        name: 'citation_conference_title',
        content: deposit.extraMetadata.conferenceTitle,
      });
      if (conferenceTitle) {
        this.metaElements.push(conferenceTitle);
      }
    }

    if (deposit.extraMetadata.dissertationName) {
      const dissertationName = this.metaService.addTag({
        name: 'citation_dissertation_name',
        content: deposit.extraMetadata.dissertationName,
      });
      if (dissertationName) {
        this.metaElements.push(dissertationName);
      }
    }

    if (deposit.extraMetadata.inbookTitle) {
      const inbookTitle = this.metaService.addTag({
        name: 'citation_inbook_title',
        content: deposit.extraMetadata.inbookTitle,
      });
      if (inbookTitle) {
        this.metaElements.push(inbookTitle);
      }
    }

    if (deposit.extraMetadata.isbn) {
      const isbn = this.metaService.addTag({
        name: 'citation_isbn',
        content: deposit.extraMetadata.isbn,
      });
      if (isbn) {
        this.metaElements.push(isbn);
      }
    }

    if (deposit.extraMetadata.issn) {
      const issn = this.metaService.addTag({
        name: 'citation_issn',
        content: deposit.extraMetadata.issn,
      });
      if (issn) {
        this.metaElements.push(issn);
      }
    }

    if (deposit.extraMetadata.issue) {
      const issue = this.metaService.addTag({
        name: 'citation_issue',
        content: `${deposit.extraMetadata.issue}`,
      });
      if (issue) {
        this.metaElements.push(issue);
      }
    }

    if (deposit.extraMetadata.firstpage) {
      const firstpage = this.metaService.addTag({
        name: 'citation_firstpage',
        content: `${deposit.extraMetadata.firstpage}`,
      });
      if (firstpage) {
        this.metaElements.push(firstpage);
      }
    }

    if (deposit.extraMetadata.lastpage) {
      const lastpage = this.metaService.addTag({
        name: 'citation_lastpage',
        content: `${deposit.extraMetadata.lastpage}`,
      });
      if (lastpage) {
        this.metaElements.push(lastpage);
      }
    }

    if (deposit.extraMetadata.dissertationInstitution) {
      const dissertationInstitution = this.metaService.addTag({
        name: 'citation_dissertation_institution',
        content: deposit.extraMetadata.dissertationInstitution,
      });
      if (dissertationInstitution) {
        this.metaElements.push(dissertationInstitution);
      }
    }

    if (deposit.extraMetadata.technicalReportInstitution) {
      const reportInstitution = this.metaService.addTag({
        name: 'citation_technical_report_institution',
        content: deposit.extraMetadata.technicalReportInstitution,
      });
      if (reportInstitution) {
        this.metaElements.push(reportInstitution);
      }
    }

    if (deposit.extraMetadata.journalTitle) {
      const journalTitle = this.metaService.addTag({
        name: 'citation_journal_title',
        content: deposit.extraMetadata.journalTitle,
      });
      if (journalTitle) {
        this.metaElements.push(journalTitle);
      }
    }

    if (deposit.extraMetadata.language) {
      const language = this.metaService.addTag({
        name: 'citation_language',
        content: deposit.extraMetadata.language,
      });
      if (language) {
        this.metaElements.push(language);
      }
    }

    if (deposit.extraMetadata.publisher) {
      const publisher = this.metaService.addTag({
        name: 'citation_publisher',
        content: deposit.extraMetadata.publisher,
      });
      if (publisher) {
        this.metaElements.push(publisher);
      }
    }

    if (deposit.extraMetadata.volume) {
      const volume = this.metaService.addTag({
        name: 'citation_volume',
        content: `${deposit.extraMetadata.volume}`,
      });
      if (volume) {
        this.metaElements.push(volume);
      }
    }

    if (deposit.extraMetadata.canonical && !this.canonicalLink) {
      this.canonicalLink = this.document.createElement('link');
      this.canonicalLink.setAttribute('rel', 'canonical');
      this.canonicalLink.setAttribute('href', deposit.extraMetadata.canonical);
      this.document.head.appendChild(this.canonicalLink);
    }
  }
}
