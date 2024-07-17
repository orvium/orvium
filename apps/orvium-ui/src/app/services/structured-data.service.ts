import { Inject, Injectable } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { DepositPopulatedDTO } from '@orvium/api';
import { Organization, Person, ScholarlyArticle, WebSite, WithContext } from 'schema-dts';
import { assertIsDefined } from '../shared/shared-functions';
import { environment } from '../../environments/environment';

const STRUCTURED_DATA = 'structured-data';

/**
 * Service to manage structured data (JSON-LD) scripts in the HTML document head for SEO purposes.
 * Allows the dynamic insertion and removal of structured data scripts based on schema.org standards.
 * These scripts help improve the visibility and interpretation of webpage content by search engines.
 */
@Injectable({
  providedIn: 'root',
})
export class StructuredDataService {
  /**
   * Constructs the StructuredDataService.
   *
   * @param {Document} document - A reference to the DOM's Document object, injected to facilitate DOM manipulations.
   */
  constructor(@Inject(DOCUMENT) private document: Document) {}

  /**
   * Removes all structured data scripts from the document head. These are typically identified by a specific class name.
   *
   * @returns {HTMLCollectionOf<Element>} The collection of elements that were removed.
   */
  removeStructuredData(): HTMLCollectionOf<Element> {
    const elementsToDelete = this.document.head.getElementsByClassName(STRUCTURED_DATA);
    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let i = 0; i < elementsToDelete.length; i++) {
      this.document.head.removeChild(elementsToDelete[i]);
    }
    return elementsToDelete;
  }

  /**
   * Inserts a new structured data script into the document head.
   *
   * @param {string} jsonLDData - The JSON-LD string representing the structured data.
   * @param {string} [className='structured-data'] - Optional class name for the script element to facilitate management.
   * @returns {HTMLScriptElement} The script element that was added to the document head.
   */
  insertSchema(jsonLDData: string, className = 'structured-data'): HTMLScriptElement {
    const script = this.document.createElement('script');
    script.setAttribute('class', className);
    script.setAttribute('type', 'application/ld+json');
    script.text = jsonLDData;
    return this.document.head.appendChild(script);
  }

  /**
   * Inserts a structured data script for an organization according to schema.org standards.
   * This is typically used for corporate or organization-level SEO enhancements.
   *
   * @returns {HTMLScriptElement} The script element containing the organization's JSON-LD structured data.
   */
  insertOrganizationSchema(): HTMLScriptElement {
    const organizationJsonLD: WithContext<Organization> = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Orvium',
      url: 'https://orvium.io',
      sameAs: [
        'https://www.facebook.com/orvium.io/',
        'https://twitter.com/orvium',
        'https://www.youtube.com/channel/UCToae47jUc6LNw-_WgLEJnw/channels',
        'https://www.linkedin.com/company/orvium?originalSubdomain=gt',
      ],
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Tallinn, Estonia',
        postalCode: '10151',
        streetAddress: 'Ahtri 6a',
      },
      email: 'info@orvium.io',
    };
    const organizationSchema = this.insertSchema(
      JSON.stringify(organizationJsonLD),
      'structured-data-global'
    );
    return organizationSchema;
  }

  /**
   * Inserts a structured data script for a website according to schema.org standards.
   * Enhances SEO for the website's main or homepage.
   *
   * @returns {HTMLScriptElement} The script element containing the website's JSON-LD structured data.
   */
  insertWebsiteSchema(): HTMLScriptElement {
    const websiteJsonLD: WithContext<WebSite> = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      url: 'https://dapp.orvium.io/',
      name: 'Orvium',
      description: 'Orvium Accelerating Scientific Publishing',
    };
    const websiteSchema = this.insertSchema(
      JSON.stringify(websiteJsonLD),
      'structured-data-global'
    );
    return websiteSchema;
  }

  /**
   * Inserts a structured data script for a scholarly article. This method is particularly useful for academic publications
   * or detailed article pages that benefit from enhanced search engine visibility and data parsing.
   *
   * @param {DepositPopulatedDTO} deposit - The deposit data transfer object.
   * @returns {HTMLScriptElement} The script element containing the article's JSON-LD structured data.
   */
  insertScholarlyArticleSchema(deposit: DepositPopulatedDTO): HTMLScriptElement {
    assertIsDefined(deposit, 'deposit is not defined');

    const articleJsonLD: WithContext<ScholarlyArticle> = {
      '@context': 'https://schema.org',
      '@type': 'ScholarlyArticle',
      headline: deposit.title,
      sdPublisher: deposit.submissionDate,
      datePublished: deposit.publicationDate,
      description: deposit.abstract,
      publisher: {
        '@type': 'Person',
        givenName: deposit.ownerProfile.firstName,
        familyName: deposit.ownerProfile.lastName,
      },

      about: deposit.disciplines,
      keywords: deposit.keywords,
      commentCount: deposit.socialComments,
      url: `${environment.publicUrl}/deposits/${deposit._id}/view`,
    };
    articleJsonLD.image = deposit.images;
    articleJsonLD.author = deposit.authors.map(author => {
      const person: Person = {
        '@type': 'Person',
        name: author.firstName,
        givenName: author.firstName,
        familyName: author.lastName,
        url: author.nickname ? `${environment.publicUrl}/profile/${author.nickname}` : '',
      };
      return person;
    });
    const articleSchema = this.insertSchema(JSON.stringify(articleJsonLD));
    return articleSchema;
  }
}
