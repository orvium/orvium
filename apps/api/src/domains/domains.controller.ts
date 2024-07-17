import { Controller, Get, Query } from '@nestjs/common';
import { DomainsService } from './domains.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

/**
 * Controller for handling operations with domains in the application.
 *
 * @tags domains
 * @controller domains
 */
@ApiTags('domains')
@Controller('domains')
export class DomainsController {
  /**
   * Instantiates a DomainsController
   * @param {DomainsController} domainsController - Service for domains management.
   */
  constructor(private readonly domainService: DomainsService) {}

  /**
   * GET - Checks if a given domain is blocked within the application. This function is particularly useful for preventing
   * registrations from certain domains. It will return `true` if the domain is currently on the blocked list,
   * indicating that users cannot use email addresses from this domain to sign up.
   *
   * @param {string} domain - The domain name to check against the blocked list.
   * @returns {Promise<boolean>} - A promise that resolves to `true` if the domain is blocked, `false` otherwise.
   */
  @ApiOperation({ summary: 'Verify a domain' })
  @Get('blocked')
  async isDomainBlocked(@Query('domain') domain: string): Promise<boolean> {
    const domainResult = await this.domainService.findOne({ emailDomain: domain });
    if (!domainResult) {
      return false;
    } else {
      return true;
    }
  }
}
