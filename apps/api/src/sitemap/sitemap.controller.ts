import { Controller, Get, Header } from '@nestjs/common';
import { DepositService } from '../deposit/deposit.service';
import { DepositStatus } from '../deposit/deposit.schema';
import { environment } from '../environments/environment';
import { ReviewService } from '../review/review.service';
import { ReviewStatus } from '../review/review.schema';
import { readFileSync } from 'fs';
import handlebars from 'handlebars';
import { join } from 'path';
import { CommunitiesService } from '../communities/communities.service';
import { UserService } from '../users/user.service';
import { ApiExcludeController } from '@nestjs/swagger';
import { SessionService } from '../session/session.service';
import { CommunityStatus } from '../communities/communities.schema';

const TEMPLATES_PATH = join(__dirname, '/templates');

/**
 * The SitemapController is responsible for generating an XML sitemap of the application's accessible URLs.
 * This includes URLs for publicly available deposits, reviews, communities, sessions, and user profiles.
 * The sitemap helps search engines better index the site's content, improving SEO and site discoverability.
 *
 * @controller sitemap
 */
@ApiExcludeController()
@Controller('sitemap')
export class SitemapController {
  /**
   * Instantiates a SitemapController object.
   *
   * @param {DepositService} depositService - Service for deposits data management.
   * @param {ReviewService} reviewService - Service for manage review.
   * @param {CommunitiesService} communitiesService - Service for community data management.
   * @param {UserService} userService - Service for user data management.
   * @param {SessionService} sessionService - Service for conference sessions data management.
   */
  constructor(
    private readonly depositService: DepositService,
    private readonly reviewService: ReviewService,
    private readonly communitiesService: CommunitiesService,
    private readonly userService: UserService,
    private readonly sessionService: SessionService
  ) {}

  /**
   * GET - Generates an XML sitemap containing URLs for various publicly accessible resources.
   * This includes main site URL, individual deposits, PDFs, reviews, community profiles, sessions, and user profiles.
   * Each URL is adjusted based on the environment's public URL setting.
   *
   * @returns A string containing the XML formatted sitemap.
   */
  @Get('')
  @Header('Content-Type', 'text/xml')
  async getSitemap(): Promise<string> {
    const locations: unknown[] = [];

    // Add main url
    locations.push({ url: environment.publicUrl });

    // Add deposits url
    const deposits = await this.depositService.find({
      status: { $in: [DepositStatus.preprint, DepositStatus.published] },
    });

    for (const deposit of deposits) {
      locations.push({
        url: `${environment.publicUrl}/deposits/${deposit._id.toHexString()}/view`,
      });

      // Add deposits pdf url
      if (deposit.pdfUrl) {
        locations.push({
          url: `${
            environment.publicUrlWithPrefix
          }/deposits/${deposit._id.toHexString()}/publication.pdf`,
        });
      }
    }

    const publicDepositsIds = deposits.map(deposit => deposit._id);

    // Add reviews url
    const reviews = await this.reviewService.reviewModel
      .find({
        status: { $in: [ReviewStatus.published] },
        deposit: { $in: publicDepositsIds }, // only reviews for public deposits are accessible
        showReviewToEveryone: true,
      })
      .lean();

    for (const review of reviews) {
      locations.push({ url: `${environment.publicUrl}/reviews/${review._id.toHexString()}/view` });
    }

    // Add communities url
    const communities = await this.communitiesService.communityModel
      .find({ status: CommunityStatus.published })
      .lean();

    for (const community of communities) {
      locations.push({
        url: `${environment.publicUrl}/communities/${community._id.toHexString()}/view`,
      });
    }

    // Add conference sessions
    const sessions = await this.sessionService.sessionModel.find({}).lean();

    for (const session of sessions) {
      locations.push({ url: `${environment.publicUrl}/session/${session._id.toHexString()}/view` });
    }

    // Add users public profile
    const users = await this.userService.userModel
      .find({
        isOnboarded: true,
      })
      .lean();

    for (const user of users) {
      locations.push({ url: `${environment.publicUrl}/profile/${user.nickname}` });
    }

    const source = readFileSync(`${TEMPLATES_PATH}/sitemap.hbs`, 'utf-8');
    const template = handlebars.compile<{ locations: unknown[] }>(source);
    return template({ locations: locations });
  }
}
