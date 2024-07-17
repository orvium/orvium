import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { OaipmhService } from './oaipmh.service';
import { OaipmhController } from './oaipmh.controller';
import { DepositService } from '../deposit/deposit.service';
import { CommunitiesService } from '../communities/communities.service';
import {
  createCommunity,
  createDeposit,
  factoryCommunity,
  factoryDepositDocumentDefinition,
} from '../utils/test-data';
import { MongooseTestingModule } from '../utils/mongoose-testing.module';

describe('Oaipmh e2e', () => {
  let app: INestApplication;
  let depositService: DepositService;
  let communitiesService: CommunitiesService;
  let oaiService: OaipmhService;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      providers: [OaipmhService],
      controllers: [OaipmhController],
      imports: [MongooseTestingModule.forRoot('OaipmhE2E')],
    }).compile();

    depositService = module.get(DepositService);
    communitiesService = module.get(CommunitiesService);

    await depositService.depositModel.deleteMany({});
    await communitiesService.communityModel.deleteMany({});

    oaiService = module.get(OaipmhService);

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/GET return badVerb code when invalid verb', async () => {
    const response = await request(app.getHttpServer())
      .get('/oai')
      .expect(200)
      .expect('Content-Type', 'text/xml; charset=utf-8');
    expect(response.text).toEqual(expect.stringContaining('code="badVerb"'));
  });

  it('/GET identify', async () => {
    const response = await request(app.getHttpServer())
      .get('/oai?verb=Identify')
      .expect(200)
      .expect('Content-Type', 'text/xml; charset=utf-8');
    expect(response.text).toEqual(
      expect.stringContaining('<adminEmail>info@example.com</adminEmail>')
    );
  });

  it('/GET identify with wrong arguments', async () => {
    const response = await request(app.getHttpServer())
      .get('/oai?verb=Identify&set=physics:hep')
      .expect(200)
      .expect('Content-Type', 'text/xml; charset=utf-8');
    expect(response.text).toEqual(expect.stringContaining('code="badArgument"'));
  });

  it('/GET ListMetadataFormats', async () => {
    const response = await request(app.getHttpServer())
      .get('/oai?verb=ListMetadataFormats')
      .expect(200)
      .expect('Content-Type', 'text/xml; charset=utf-8');
    expect(response.text).toEqual(
      expect.stringContaining('<metadataPrefix>oai_openaire</metadataPrefix>')
    );
  });

  it('/GET ListMetadataFormats bad argument', async () => {
    const response = await request(app.getHttpServer())
      .get('/oai?verb=ListMetadataFormats&set=physics:hep')
      .expect(200)
      .expect('Content-Type', 'text/xml; charset=utf-8');
    expect(response.text).toEqual(expect.stringContaining('code="badArgument"'));
  });

  it('/GET ListSets', async () => {
    const response = await request(app.getHttpServer())
      .get('/oai?verb=ListSets')
      .expect(200)
      .expect('Content-Type', 'text/xml; charset=utf-8');
    expect(response.text).toEqual(expect.stringContaining('<setSpec>orvium</setSpec>'));
  });

  it('/GET ListSets bad argument', async () => {
    const response = await request(app.getHttpServer())
      .get('/oai?verb=ListSets&set=physics:hep')
      .expect(200)
      .expect('Content-Type', 'text/xml; charset=utf-8');
    expect(response.text).toEqual(expect.stringContaining('code="badArgument"'));
  });

  it('/GET GetRecord should get the creator data and journal field', async () => {
    const community = await communitiesService.communityModel.create(factoryCommunity.build());
    const deposit = await depositService.depositModel.create(
      factoryDepositDocumentDefinition.build({
        community: community._id,
        authors: [
          {
            firstName: 'John',
            lastName: 'Doe',
            credit: [],
            institutions: ['The Evolving Scholar', 'Orvium'],
          },
        ],
        extraMetadata: {
          journalTitle: 'My Scientific Journal',
        },
      })
    );
    const response = await request(app.getHttpServer())
      .get(
        `/oai?verb=GetRecord&identifier=oai:orvium.io:${deposit._id.toHexString()}&metadataPrefix=oai_openaire`
      )
      .expect(200)
      .expect('Content-Type', 'text/xml; charset=utf-8');
    expect(response.text).toEqual(
      expect.stringContaining(`<identifier>oai:orvium.io:${deposit._id.toHexString()}</identifier>`)
    );
    expect(response.text).toEqual(expect.stringContaining('<datacite:relatedItems>'));
    expect(response.text).toEqual(
      expect.stringContaining('<datacite:title>My Scientific Journal</datacite:title>')
    );
    expect(response.text).toEqual(
      expect.stringContaining('<datacite:creatorName>Doe, John</datacite:creatorName>')
    );
    expect(response.text).toEqual(
      expect.stringContaining('<datacite:affiliation>The Evolving Scholar</datacite:affiliation>')
    );
    expect(response.text).toEqual(
      expect.stringContaining('<datacite:affiliation>Orvium</datacite:affiliation>')
    );
  });

  it('/GET GetRecord should show publisher, volume, issue and language but not relatedItems and setSpec should be orvium', async () => {
    const { community } = await createCommunity(module);

    const { deposit: deposit2 } = await createDeposit(module, {
      community,
      deposit: {
        extraMetadata: {
          publisher: 'Datacite',
          volume: 5,
          issue: 8,
          language: 'eng',
        },
      },
    });
    const response2 = await request(app.getHttpServer())
      .get(
        `/oai?verb=GetRecord&identifier=oai:orvium.io:${deposit2._id.toHexString()}&metadataPrefix=oai_openaire`
      )
      .expect(200)
      .expect('Content-Type', 'text/xml; charset=utf-8');
    expect(response2.text).toEqual(
      expect.stringContaining(`<setSpec>${community.codename}</setSpec>`)
    );
    expect(response2.text).not.toEqual(expect.stringContaining('<datacite:relatedItems>'));
    expect(response2.text).toEqual(expect.stringContaining('<dc:language>eng</dc:language>'));
    expect(response2.text).toEqual(
      expect.stringContaining('<oaire:citationVolume>5</oaire:citationVolume>')
    );
    expect(response2.text).toEqual(
      expect.stringContaining('<oaire:citationIssue>8</oaire:citationIssue>')
    );
    expect(response2.text).toEqual(
      expect.stringContaining('<dc:publisher>Datacite</dc:publisher>')
    );
  });

  it('/GET GetRecord should show ISSN and dissertationTitle', async () => {
    const community = await communitiesService.communityModel.create(factoryCommunity.build());
    const deposit3 = await depositService.depositModel.create(
      factoryDepositDocumentDefinition.build({
        community: community._id,
        extraMetadata: {
          issn: '2215-5445',
          dissertationName:
            'An investigation into the relationship between early exposure and brand loyalty',
        },
      })
    );
    const response3 = await request(app.getHttpServer())
      .get(
        `/oai?verb=GetRecord&identifier=oai:orvium.io:${deposit3._id.toHexString()}&metadataPrefix=oai_openaire`
      )
      .expect(200)
      .expect('Content-Type', 'text/xml; charset=utf-8');
    expect(response3.text).toEqual(expect.stringContaining('<datacite:relatedIdentifiers>'));
    expect(response3.text).toEqual(expect.stringContaining('<datacite:relatedItems>'));
    expect(response3.text).toEqual(
      expect.stringContaining(
        '<datacite:relatedIdentifier relatedIdentifierType="ISSN" relationType="IsPartOf">2215-5445</datacite:relatedIdentifier>'
      )
    );
    expect(response3.text).toEqual(
      expect.stringContaining(
        '<datacite:title>An investigation into the relationship between early exposure and brand loyalty</datacite:title>'
      )
    );
  });

  it('/GET GetRecord should show ISBN and conferenceTitle', async () => {
    const community = await communitiesService.communityModel.create(factoryCommunity.build());

    const deposit4 = await depositService.depositModel.create(
      factoryDepositDocumentDefinition.build({
        community: community._id,
        abstract: 'An Abstract',
        extraMetadata: {
          conferenceTitle: 'IFoU 2021',
          isbn: '978-3-16-148410-0',
        },
      })
    );
    const response4 = await request(app.getHttpServer())
      .get(
        `/oai?verb=GetRecord&identifier=oai:orvium.io:${deposit4._id.toHexString()}&metadataPrefix=oai_openaire`
      )
      .expect(200)
      .expect('Content-Type', 'text/xml; charset=utf-8');
    expect(response4.text).toEqual(
      expect.stringContaining('<dc:description>An Abstract</dc:description>')
    );
    expect(response4.text).toEqual(expect.stringContaining('<datacite:relatedItems>'));
    expect(response4.text).toEqual(
      expect.stringContaining(
        '<datacite:relatedIdentifier relatedIdentifierType="ISBN" relationType="IsPartOf">978-3-16-148410-0</datacite:relatedIdentifier>'
      )
    );
    expect(response4.text).toEqual(
      expect.stringContaining('<datacite:title>IFoU 2021</datacite:title>')
    );
  });

  it('/GET GetRecord should show firstpage, lastpage and bookTitle but not relatedIdentifiers', async () => {
    const community = await communitiesService.communityModel.create(factoryCommunity.build());
    const deposit5 = await depositService.depositModel.create(
      factoryDepositDocumentDefinition.build({
        community: community._id,
        extraMetadata: {
          firstpage: 5,
          lastpage: 8,
          inbookTitle: 'Philosophiae Naturalis Principia Mathematica',
        },
      })
    );
    const response5 = await request(app.getHttpServer())
      .get(
        `/oai?verb=GetRecord&identifier=oai:orvium.io:${deposit5._id.toHexString()}&metadataPrefix=oai_openaire`
      )
      .expect(200)
      .expect('Content-Type', 'text/xml; charset=utf-8');
    expect(response5.text).not.toEqual(expect.stringContaining('<datacite:relatedIdentifiers>'));
    expect(response5.text).toEqual(expect.stringContaining('<datacite:relatedItems>'));
    expect(response5.text).toEqual(
      expect.stringContaining(
        '<datacite:title>Philosophiae Naturalis Principia Mathematica</datacite:title>'
      )
    );
    expect(response5.text).toEqual(
      expect.stringContaining('<oaire:citationStartPage>5</oaire:citationStartPage>')
    );
    expect(response5.text).toEqual(
      expect.stringContaining('<oaire:citationEndPage>8</oaire:citationEndPage>')
    );
  });

  it('/GET GetRecord idDoesNotExist error', async () => {
    const response = await request(app.getHttpServer())
      .get('/oai?verb=GetRecord&identifier=oai:arXiv.org:cs/0112017&metadataPrefix=oai_openaire')
      .expect(200)
      .expect('Content-Type', 'text/xml; charset=utf-8');
    expect(response.text).toEqual(expect.stringContaining('code="idDoesNotExist"'));
  });

  it('/GET GetRecord cannotDisseminateFormat error', async () => {
    const response = await request(app.getHttpServer())
      .get('/oai?verb=GetRecord&identifier=oai:arXiv.org:cs/0112017&metadataPrefix=openaire')
      .expect(200)
      .expect('Content-Type', 'text/xml; charset=utf-8');
    expect(response.text).toEqual(expect.stringContaining('code="cannotDisseminateFormat"'));
  });

  it('/GET GetRecord badArgument error', async () => {
    const response = await request(app.getHttpServer())
      .get(
        '/oai?verb=GetRecord&identifier=oai:arXiv.org:cs/0112017&metadataPrefix=oai_dc&set=physics:hep'
      )
      .expect(200)
      .expect('Content-Type', 'text/xml; charset=utf-8');
    expect(response.text).toEqual(expect.stringContaining('code="badArgument"'));
  });

  it('/GET ListIdentifiers', async () => {
    const deposit = await depositService.create(factoryDepositDocumentDefinition.build());
    const response = await request(app.getHttpServer())
      .get('/oai?verb=ListIdentifiers&metadataPrefix=oai_openaire')
      .expect(200)
      .expect('Content-Type', 'text/xml; charset=utf-8');
    expect(response.text).toEqual(
      expect.stringContaining(`<identifier>oai:orvium.io:${deposit._id.toHexString()}</identifier>`)
    );
  });

  it('/GET ListIdentifiers cannotDisseminateFormat error', async () => {
    const response = await request(app.getHttpServer())
      .get('/oai?verb=ListIdentifiers&metadataPrefix=invalid')
      .expect(200)
      .expect('Content-Type', 'text/xml; charset=utf-8');
    expect(response.text).toEqual(expect.stringContaining('code="cannotDisseminateFormat"'));
  });

  it('/GET ListIdentifiers badArgument error', async () => {
    const response = await request(app.getHttpServer())
      .get(
        '/oai?verb=ListIdentifiers&identifier=oai:arXiv.org:cs/0112017&metadataPrefix=oai_dc&set=physics:hep'
      )
      .expect(200)
      .expect('Content-Type', 'text/xml; charset=utf-8');
    expect(response.text).toEqual(expect.stringContaining('code="badArgument"'));
  });

  it('/GET ListIdentifiers with valid resumptionToken', async () => {
    const deposit = await depositService.depositModel.create(
      factoryDepositDocumentDefinition.build()
    );

    // Add several deposits to get valid pagination
    for (let i = 0; i < 20; i++) {
      await depositService.depositModel.create(factoryDepositDocumentDefinition.build());
    }

    const token = oaiService.createResumptionToken('2020-01-01', '2025-01-01');
    const response = await request(app.getHttpServer())
      .get(`/oai?verb=ListIdentifiers&resumptionToken=${token}`)
      .expect(200)
      .expect('Content-Type', 'text/xml; charset=utf-8');
    expect(response.text).toEqual(
      expect.stringContaining(`<identifier>oai:orvium.io:${deposit._id.toHexString()}</identifier>`)
    );
  });

  it('/GET ListIdentifiers badResumptionToken error', async () => {
    const response = await request(app.getHttpServer())
      .get('/oai?verb=ListIdentifiers&resumptionToken=oasdfohsadfo')
      .expect(200)
      .expect('Content-Type', 'text/xml; charset=utf-8');
    expect(response.text).toEqual(expect.stringContaining('code="badResumptionToken"'));
  });

  it('/GET ListRecords', async () => {
    const deposit = await depositService.depositModel.create(
      factoryDepositDocumentDefinition.build()
    );
    const response = await request(app.getHttpServer())
      .get('/oai?verb=ListRecords&metadataPrefix=oai_openaire')
      .expect(200)
      .expect('Content-Type', 'text/xml; charset=utf-8');
    expect(response.text).toEqual(
      expect.stringContaining(`<identifier>oai:orvium.io:${deposit._id.toHexString()}</identifier>`)
    );
  });

  it('/GET ListRecords cannotDisseminateFormat error', async () => {
    const response = await request(app.getHttpServer())
      .get('/oai?verb=ListRecords&metadataPrefix=invalid')
      .expect(200)
      .expect('Content-Type', 'text/xml; charset=utf-8');
    expect(response.text).toEqual(expect.stringContaining('code="cannotDisseminateFormat"'));
  });

  it('/GET ListRecords badArgument error', async () => {
    const response = await request(app.getHttpServer())
      .get(
        '/oai?verb=ListRecords&identifier=oai:arXiv.org:cs/0112017&metadataPrefix=oai_dc&set=physics:hep'
      )
      .expect(200)
      .expect('Content-Type', 'text/xml; charset=utf-8');
    expect(response.text).toEqual(expect.stringContaining('code="badArgument"'));
  });

  it('/GET ListRecords with valid resumptionToken', async () => {
    const deposit = await depositService.depositModel.create(
      factoryDepositDocumentDefinition.build()
    );

    // Add several deposits to get valid pagination
    for (let i = 0; i < 20; i++) {
      await depositService.depositModel.create(factoryDepositDocumentDefinition.build());
    }

    const token = oaiService.createResumptionToken('2020-01-01', '2025-01-01');
    const response = await request(app.getHttpServer())
      .get(`/oai?verb=ListRecords&resumptionToken=${token}`)
      .expect(200)
      .expect('Content-Type', 'text/xml; charset=utf-8');
    expect(response.text).toEqual(
      expect.stringContaining(`<identifier>oai:orvium.io:${deposit._id.toHexString()}</identifier>`)
    );
  });

  it('/GET ListRecords badResumptionToken error', async () => {
    const response = await request(app.getHttpServer())
      .get('/oai?verb=ListRecords&resumptionToken=oasdfohsadfo')
      .expect(200)
      .expect('Content-Type', 'text/xml; charset=utf-8');
    expect(response.text).toEqual(expect.stringContaining('code="badResumptionToken"'));
  });

  afterAll(async () => {
    await app.close();
  });
});
