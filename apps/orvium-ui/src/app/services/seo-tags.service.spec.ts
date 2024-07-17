import { SeoTagsService } from './seo-tags.service';
import { Meta, Title } from '@angular/platform-browser';
import { factoryDepositPopulatedDTO } from '../shared/test-data';
import { MockBuilder, MockRender, ngMocks } from 'ng-mocks';

describe('SeoTagsService', () => {
  function metaElement(name: string, content: string): string {
    return `<meta name="${name}" content="${content}">`;
  }

  beforeEach(() => {
    return MockBuilder(SeoTagsService).keep(Title).keep(Meta);
  });

  it('should be created', () => {
    const fixture = MockRender(SeoTagsService);
    expect(fixture.point.componentInstance).toBeTruthy();
  });

  it('should be create deposit tags', () => {
    const fixture = MockRender(SeoTagsService);
    expect(fixture.point.componentInstance).toBeTruthy();

    const service = fixture.point.componentInstance;
    const titleService = ngMocks.get(Title);

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
      firstpage: 1,
      lastpage: 50,
      dissertationInstitution: 'my dissertation institution',
      technicalReportInstitution: 'technical report',
      canonical: 'example.com',
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
          institutions: ['Technical University HW', 'Universiteit Atlantis'],
          orcid: 'https://orcid.org/0000-0000-0000-0000',
        },
      ],
      doi: 'http://dx.doi.org/10.4121/3326451.0004.222',
      extraMetadata: metadata,
      pdfUrl: 'mypublication.pdf',
      html: '<p></p>',
    });

    service.setGeneralSeo(deposit.title, deposit.abstract);
    service.setOpengraphTags(deposit.title, deposit.abstract, 'http://localhost');
    service.setPublicationTags(deposit, '/deposit/view');

    expect(titleService.getTitle()).toBe(deposit.title);
    expect(service.getTag('citation_title')?.outerHTML).toEqual(
      metaElement('citation_title', deposit.title)
    );
    expect(service.getTag('description')?.outerHTML).toEqual(
      metaElement('description', deposit.abstract)
    );
    expect(service.getTag('citation_publication_date')?.outerHTML).toEqual(
      metaElement('citation_publication_date', '2020/1/1')
    );
    expect(service.getTag('citation_keywords')?.outerHTML).toEqual(
      metaElement('citation_keywords', deposit.keywords.join(', ') || '')
    );
    expect(service.getTag('citation_abstract_html_url')?.outerHTML).toEqual(
      metaElement('citation_abstract_html_url', 'http://localhost:4200/deposit/view')
    );
    expect(service.getTag('citation_fulltext_html_url')?.outerHTML).toEqual(
      metaElement('citation_fulltext_html_url', 'http://localhost:4200/deposit/view')
    );
    expect(service.getTag('citation_public_url')?.outerHTML).toEqual(
      metaElement('citation_public_url', 'http://localhost:4200/deposit/view')
    );
    expect(service.getTag('citation_year')?.outerHTML).toEqual(
      metaElement('citation_year', '2020')
    );

    service.removeTagsAndCanonical();
    expect(service.metaElements).toEqual([]);

    // Now check without pdfurl
    service.setPublicationTags(
      { ...deposit, pdfUrl: undefined, publicationDate: undefined },
      '/deposit/view'
    );
    expect(service.getTag('citation_title')?.outerHTML).toEqual(
      metaElement('citation_title', deposit.title)
    );
    expect(service.getTag('description')?.outerHTML).toEqual(
      metaElement('description', deposit.abstract)
    );
    expect(service.getTag('citation_publication_date')?.outerHTML).toEqual(
      metaElement('citation_publication_date', '2019/1/1')
    );
    expect(service.getTag('citation_keywords')?.outerHTML).toEqual(
      metaElement('citation_keywords', deposit.keywords.join(', ') || '')
    );
    expect(service.getTag('citation_abstract_html_url')?.outerHTML).toEqual(
      metaElement('citation_abstract_html_url', 'http://localhost:4200/deposit/view')
    );
    expect(service.getTag('citation_fulltext_html_url')?.outerHTML).toEqual(
      metaElement('citation_fulltext_html_url', 'http://localhost:4200/deposit/view')
    );
    expect(service.getTag('citation_public_url')?.outerHTML).toEqual(
      metaElement('citation_public_url', 'http://localhost:4200/deposit/view')
    );
  });
});
