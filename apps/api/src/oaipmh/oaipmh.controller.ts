import { Controller, Get, Query, Req, Res } from '@nestjs/common';
import { VERBS } from './oaipmh.schema';
import { OaipmhService } from './oaipmh.service';
import { Request, Response } from 'express';
import { ApiExcludeController } from '@nestjs/swagger';

/**
 * Controller responsible for managing interaction with the Open Archives Initiative Protocol for Metadata Harvesting.
 * More information (https://www.openarchives.org/pmh/)
 *
 * @controller oai
 */
@ApiExcludeController()
@Controller('oai')
export class OaipmhController {
  /**
   * Instantiates a OaipmhController object.
   *
   * @param {OaipmhController} oaipmhController - Service for for managing interaction with aoipmh.
   */
  constructor(private readonly oaipmhService: OaipmhService) {}

  /**
   * Handles Open Archives Initiative Protocol for Metadata Harvesting (OAI-PMH) requests.
   * Supports various verbs to retrieve data or metadata formats, based on the provided query parameters.
   *
   * @param {Request} req - The HTTP request object containing the query parameters.
   * @param {Response} res - The HTTP response object used to return XML responses.
   * @param {string} verb - The OAI-PMH verb specifying the type of request.
   * @param {string} metadataPrefix - The metadata format.
   * @param {string} identifier - A unique identifier for a record.
   * @param {string} from - Start date for selective harvesting.
   * @param {string} until - End date for selective harvesting.
   * @param {string} set - Set specification for selective harvesting.
   * @param {string} resumptionToken - Token for resuming a previously suspended request.
   * @returns {Promise<void>} - Sends an XML response directly.
   * @throws {BadArgumentException} - If query parameters do not match the expected format for the given verb.
   * @throws {BadVerbException} - If the provided verb is not recognized.
   */
  @Get()
  async oai(
    @Req() req: Request,
    @Res() res: Response,
    @Query('verb') verb?: string,
    @Query('metadataPrefix') metadataPrefix?: string,
    @Query('identifier') identifier?: string,
    @Query('from') from?: string,
    @Query('until') until?: string,
    @Query('set') set?: string,
    @Query('resumptionToken') resumptionToken?: string
  ): Promise<void> {
    switch (verb) {
      case VERBS.IDENTIFY: {
        // Query parameters are more than 1 => raise badArgument exception
        if (Object.keys(req.query).length > 1) {
          const badArgumentTemplate = this.oaipmhService.badArgument();
          res.set('Content-Type', 'text/xml');
          res.send(badArgumentTemplate);
          return;
        }
        const identifyTemplate = this.oaipmhService.identify();
        res.set('Content-Type', 'text/xml');
        res.send(identifyTemplate);

        break;
      }
      case VERBS.LIST_METADATA_FORMATS: {
        // Query parameters are more than 1 => raise badArgument exception
        if (Object.keys(req.query).length > 1) {
          const badArgumentTemplate = this.oaipmhService.badArgument();
          res.set('Content-Type', 'text/xml');
          res.send(badArgumentTemplate);
          return;
        }
        const listMetadataFormatsTemplate = this.oaipmhService.listMetadataFormats();
        res.set('Content-Type', 'text/xml');
        res.send(listMetadataFormatsTemplate);
        break;
      }
      case VERBS.LIST_SETS: {
        // Query parameters are more than 1 => raise badArgument exception
        if (Object.keys(req.query).length > 1) {
          const badArgumentTemplate = this.oaipmhService.badArgument();
          res.set('Content-Type', 'text/xml');
          res.send(badArgumentTemplate);
          return;
        }
        const listSetsTemplate = await this.oaipmhService.listSets();
        res.set('Content-Type', 'text/xml');
        res.send(listSetsTemplate);
        break;
      }
      case VERBS.GET_RECORD: {
        // Query parameters are not 3 or incorrect query parameters => raise badArgument exception
        if (Object.keys(req.query).length !== 3 || !identifier || !metadataPrefix) {
          const badArgumentTemplate = this.oaipmhService.badArgument();
          res.set('Content-Type', 'text/xml');
          res.send(badArgumentTemplate);
          return;
        }
        const getRecordTemplate = await this.oaipmhService.getRecord(identifier, metadataPrefix);
        res.set('Content-Type', 'text/xml');
        res.send(getRecordTemplate);
        break;
      }
      case VERBS.LIST_IDENTIFIERS: {
        const validArguments = [
          'verb',
          'from',
          'until',
          'metadataPrefix',
          'set',
          'resumptionToken',
        ];
        // Query parameters are not 3 or incorrect query parameters => raise badArgument exception
        if (
          (!metadataPrefix && !resumptionToken) ||
          !Object.keys(req.query).every(key => validArguments.includes(key))
        ) {
          const badArgumentTemplate = this.oaipmhService.badArgument();
          res.set('Content-Type', 'text/xml');
          res.send(badArgumentTemplate);
          return;
        }

        // TODO this should be properly validated instead of setting this by default
        if (!metadataPrefix) {
          metadataPrefix = 'oai_openaire';
        }

        const listIdentifierTemplate = await this.oaipmhService.listIdentifiers(
          metadataPrefix,
          from,
          until,
          set,
          resumptionToken
        );
        res.set('Content-Type', 'text/xml');
        res.send(listIdentifierTemplate);
        break;
      }
      case VERBS.LIST_RECORDS: {
        const validArguments = [
          'verb',
          'from',
          'until',
          'metadataPrefix',
          'set',
          'resumptionToken',
        ];

        // Query parameters are not 3 or incorrect query parameters => raise badArgument exception
        if (
          (!metadataPrefix && !resumptionToken) ||
          !Object.keys(req.query).every(key => validArguments.includes(key))
        ) {
          const badArgumentTemplate = this.oaipmhService.badArgument();
          res.set('Content-Type', 'text/xml');
          res.send(badArgumentTemplate);
          return;
        }
        // TODO this should be properly validated instead of setting this by default
        if (!metadataPrefix) {
          metadataPrefix = 'oai_openaire';
        }
        const listRecordTemplate = await this.oaipmhService.listRecords(
          metadataPrefix,
          from,
          until,
          set,
          resumptionToken
        );
        res.set('Content-Type', 'text/xml');
        res.send(listRecordTemplate);
        break;
      }
      default: {
        const badVerbTemplate = this.oaipmhService.badVerb();
        res.set('Content-Type', 'text/xml');
        res.send(badVerbTemplate);
      }
    }
  }
}
