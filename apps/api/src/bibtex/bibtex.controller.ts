import { Body, Controller, Get, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BibtexService } from './bibtex.service';
import { BibtexReferences } from '../deposit/deposit.schema';
import { IsDefined, IsString } from 'class-validator';
import { BibtexParser } from 'bibtex-js-parser';

/**
 * Class decorator for handling inline citation to Bibtex conversion requests and managing Bibtex file uploads.
 */
export class CitationsToBibtexBody {
  @IsDefined() @ApiProperty() citations!: string[];
}

/**
 * Payload class for uploading Bibtex references as a string.
 */
export class UploadBibtexFilePayload {
  @IsString() @ApiProperty() bibtexReferences!: string;
}

/**
 * Controller that manages Bibtex-related operations such as retrieving Bibtex data from a DOI,
 * transforming text citations into Bibtex format, and handling Bibtex file uploads.
 *
 * @controller bibtex
 * @tags 'bibtex' - Swagger API tag for grouping endpoints related to Bibtex operations.
 */
@ApiTags('bibtex')
@Controller('bibtex')
export class BibtexController {
  constructor(private readonly bibtexService: BibtexService) {}

  /**
   * GET - Retrieves Bibtex reference metadata from a given DOI.
   * @param {string} doi - The DOI from which to retrieve Bibtex data.
   * @return {Promise<BibtexReferences>} - A promise that resolves to the Bibtex metadata.
   */
  @ApiOperation({ summary: 'Get the metadata for a DOI associated with a bibtex reference' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('')
  async getBibtexDoi(@Query('doi') doi: string): Promise<BibtexReferences> {
    return await this.bibtexService.getBibtexDataFromDoi(doi);
  }

  /**
   * POST- Get the metadata for a DOI associated with a deposit.
   * @param {CitationsToBibtexBody} payload - Contains an array of citations to be transformed.
   * @return {Promise<BibtexReferences[]>} - A promise that resolves to an array of Bibtex references.
   */
  @ApiOperation({ summary: 'Parse inline style citations to bibtex and adds to the deposit' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('citationsToBibtex')
  async transformCitationsToBibtex(
    @Body() payload: CitationsToBibtexBody
  ): Promise<BibtexReferences[]> {
    return await this.bibtexService.textCitationToBibtex(payload.citations);
  }

  /**
   * PATCH - Accepts a Bibtex file in string format and parses it into JSON, returning the Bibtex references.
   * @param {UploadBibtexFilePayload} payload - Contains the Bibtex file data as a string.
   * @return {Promise<BibtexReferences[]>} - A promise that resolves to an array of parsed Bibtex references.
   */
  @ApiOperation({ summary: 'Uploaded a bibtex file ' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('files/bibtex')
  async uploadBibtexFile(@Body() payload: UploadBibtexFilePayload): Promise<BibtexReferences[]> {
    return BibtexParser.parseToJSON(payload.bibtexReferences);
  }
}
