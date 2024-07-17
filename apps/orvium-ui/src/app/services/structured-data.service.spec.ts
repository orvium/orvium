import { factoryDepositPopulatedDTO } from '../shared/test-data';
import { MockBuilder, MockRender } from 'ng-mocks';
import { StructuredDataService } from './structured-data.service';
import { Organization, Person, ScholarlyArticle, WebSite, WithContext } from 'schema-dts';

describe('StructuredDataService', () => {
  beforeEach(() => {
    return MockBuilder(StructuredDataService);
  });

  it('should be created', () => {
    const fixture = MockRender(StructuredDataService);
    expect(fixture.point.componentInstance).toBeTruthy();
  });

  it('should be create OrganizationJsonLD', () => {
    const fixture = MockRender(StructuredDataService);
    expect(fixture.point.componentInstance).toBeTruthy();
    const service = fixture.point.componentInstance;

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
      // logo: 'https://dapp.orvium.io/favicon.ico',
      // image: 'https://dapp.orvium.io/favicon.ico',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Tallinn, Estonia',
        postalCode: '10151',
        streetAddress: 'Ahtri 6a',
      },
      email: 'info@orvium.io',
    };

    const insertedElement = service.insertOrganizationSchema();
    expect(insertedElement.text).toEqual(JSON.stringify(organizationJsonLD));
    expect(insertedElement.className).toEqual('structured-data-global');
  });

  it('should be create WebsiteJsonLD', () => {
    const fixture = MockRender(StructuredDataService);
    expect(fixture.point.componentInstance).toBeTruthy();
    const service = fixture.point.componentInstance;

    const websiteJsonLD: WithContext<WebSite> = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      url: 'https://dapp.orvium.io/',
      name: 'Orvium',
      description: 'Orvium Accelerating Scientific Publishing',
    };

    const insertedElement = service.insertWebsiteSchema();

    expect(insertedElement.text).toEqual(JSON.stringify(websiteJsonLD));
    expect(insertedElement.className).toEqual('structured-data-global');
  });

  it('should be create ArticleJsonLD', () => {
    const fixture = MockRender(StructuredDataService);
    expect(fixture.point.componentInstance).toBeTruthy();
    const service = fixture.point.componentInstance;

    const metadata = {
      conferenceTitle: 'my conference title',
      dissertationName: 'my dissertation name',
      inbookTitle: 'my inbook title',
      isbn: '123456890',
      issn: 'ISSN-615-682536',
      issue: 1,
      journalTitle: 'the best journal',
      language: 'es',
      publisher: 'test',
      volume: 4,
    };

    const deposit = factoryDepositPopulatedDTO.build({
      images: ['test'],
      publicationDate: '01/01/2020',
      submissionDate: '01/01/2019',
      authors: [
        {
          firstName: 'john',
          lastName: 'Doe',
          credit: [],
          institutions: [],
          nickname: 'john-doe',
        },
        {
          firstName: 'Mike',
          lastName: 'Doe',
          credit: [],
          institutions: [],
        },
      ],
      doi: 'http://dx.doi.org/10.4121/3326451.0004.222',
      extraMetadata: metadata,
      pdfUrl: 'mypublication.pdf',
    });

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
      url: `http://localhost:4200/deposits/${deposit._id}/view`,
      image: deposit.images,
      author: deposit.authors.map(author => {
        const person: Person = {
          '@type': 'Person',
          name: author.firstName,
          givenName: author.firstName,
          familyName: author.lastName,
          url: author.nickname ? 'http://localhost:4200/profile/' + author.nickname : '',
        };
        return person;
      }),
    };

    const insertedElement = service.insertScholarlyArticleSchema(deposit);

    expect(insertedElement.text).toEqual(JSON.stringify(articleJsonLD));
    expect(insertedElement.className).toEqual('structured-data');

    service.removeStructuredData();
    // TODO document is modified automatically by karma so it is difficult to check here, pending
    // const deletedElements = service.removeStructuredData();
    // expect(deletedElements.length).toEqual(1);
  });
});
