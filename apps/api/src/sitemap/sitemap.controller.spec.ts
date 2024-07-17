import { Test, TestingModule } from '@nestjs/testing';
import { SitemapController } from './sitemap.controller';
import {
  createCommunity,
  createDeposit,
  createDepositSet,
  createReviewSet,
  createUser,
} from '../utils/test-data';
import { XMLParser } from 'fast-xml-parser';
import { SessionService } from '../session/session.service';
import { cleanCollections, MongooseTestingModule } from '../utils/mongoose-testing.module';
import { CommunityStatus } from '../communities/communities.schema';
import { DepositStatus } from '../deposit/deposit.schema';

describe('Sitemap Controller', () => {
  let controller: SitemapController;
  let sessionService: SessionService;
  const parser = new XMLParser();
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      controllers: [SitemapController],
      imports: [MongooseTestingModule.forRoot('SitemapController')],
      providers: [],
    }).compile();
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    sessionService = module.get(SessionService);

    controller = module.get(SitemapController);
    await cleanCollections(module);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return empty sitemap', async () => {
    const sitemap = await controller.getSitemap();
    const parser = new XMLParser();
    const parsed = parser.parse(sitemap);
    expect(parsed.urlset.url.loc).toBe('http://localhost:4200');
  });

  it('should include only public deposits', async () => {
    const { community, moderator } = await createCommunity(module);
    await createDepositSet(module, community, moderator); // +4 public users

    const sitemap = await controller.getSitemap();
    const parsed = parser.parse(sitemap);

    // +2 users, +1 community, +2 deposit (preprint, published), +2 pdf urls, +1 home url
    expect(parsed.urlset.url.length).toBe(8);
    expect(parsed.urlset.url[0].loc).toBe('http://localhost:4200');
  });

  it('should include only public reviews', async () => {
    const { community, moderator } = await createCommunity(module);
    const { deposit } = await createDeposit(module, { community, author: moderator });
    const { published } = await createReviewSet(module, deposit, moderator, {
      showReviewToEveryone: true,
      showReviewToAuthor: true,
    });

    const sitemap = await controller.getSitemap();
    const parsed = parser.parse(sitemap);
    // +2 users, +1 community, +1 deposit, +1 pdf urls, +1 home url, +1 review
    expect(parsed.urlset.url.length).toBe(7);
    expect(parsed.urlset.url[3].loc).toContain(published._id.toHexString());
  });

  it('should include only reviews from public deposits', async () => {
    const { community, moderator } = await createCommunity(module);
    const { deposit } = await createDeposit(module, {
      community,
      author: moderator,
      deposit: { status: DepositStatus.pendingApproval },
    });
    await createReviewSet(module, deposit, moderator, {
      showReviewToEveryone: true,
      showReviewToAuthor: true,
    });

    const sitemap = await controller.getSitemap();
    const parsed = parser.parse(sitemap);
    // +2 users, +1 community, +0 deposit, +0 pdf urls, +1 home url, +0 review
    expect(parsed.urlset.url.length).toBe(4);
  });

  it('should only include published communities', async () => {
    await createCommunity(module, { community: { status: CommunityStatus.draft } }); // +2 public users
    await createCommunity(module, { community: { status: CommunityStatus.pendingApproval } }); // +2 public users
    const { community } = await createCommunity(module); // +2 public users

    const sitemap = await controller.getSitemap();
    const parsed = parser.parse(sitemap);
    expect(parsed.urlset.url.length).toBe(8); // take community moderators and owners into account
    expect(parsed.urlset.url[1].loc).toContain(community._id.toHexString());
  });

  it('should include community sessions', async () => {
    const { community } = await createCommunity(module);

    const sessionBase = {
      _id: '5fa1908fd29a17dc961cc435',
      title: 'session 1',
      community: community._id,
    };

    await sessionService.sessionModel.create(sessionBase);

    const sitemap = await controller.getSitemap();
    const parsed = parser.parse(sitemap);
    // +2 users, +1 community, +1 home, +1 session
    expect(parsed.urlset.url.length).toBe(5);
    expect(parsed.urlset.url[2].loc).toBe(
      'http://localhost:4200/session/5fa1908fd29a17dc961cc435/view'
    );
  });

  it('should include user profiles', async () => {
    const user = await createUser(module);

    const sitemap = await controller.getSitemap();
    const parsed = parser.parse(sitemap);
    expect(parsed.urlset.url.length).toBe(2);
    expect(parsed.urlset.url[1].loc).toBe(`http://localhost:4200/profile/${user.nickname}`);
  });
});
