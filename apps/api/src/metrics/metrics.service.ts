import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AnyKeys, Model } from 'mongoose';
import { assertIsDefined } from '../utils/utils';
import { Metrics, MetricsDocument } from './metrics.schema';
import { google } from '@google-analytics/data/build/protos/protos';
import { environment } from '../environments/environment';
import IRunReportResponse = google.analytics.data.v1beta.IRunReportResponse;
import MatchType = google.analytics.data.v1beta.Filter.StringFilter.MatchType;

export type MetricResult = { screeviews: number; objectId: string };

/**
 * Generates a Google Analytics report request for community views between specified dates.
 *
 * @param {string} [startDate='yesterday'] - The start date for the data range (defaults to 'yesterday' if not specified).
 * @param {string} [endDate='yesterday'] - The end date for the data range (defaults to 'yesterday' if not specified).
 * @returns {google.analytics.data.v1beta.IRunReportRequest} A configured Google Analytics run report request.
 */
export function gaRequestCommunityViews(
  startDate?: string,
  endDate?: string
): google.analytics.data.v1beta.IRunReportRequest {
  return {
    property: `properties/${environment.googleAnalytics.property}`,
    dateRanges: [
      {
        startDate: startDate ?? 'yesterday',
        endDate: endDate ?? 'yesterday',
      },
    ],
    metrics: [
      {
        name: 'screenPageViews',
      },
    ],
    dimensions: [
      {
        name: 'unifiedPagePathScreen',
      },
    ],
    dimensionFilter: {
      filter: {
        fieldName: 'unifiedPagePathScreen',
        stringFilter: {
          value: '^/communities/([0-9]|[a-z]){24}/view$',
          matchType: MatchType.PARTIAL_REGEXP,
        },
      },
    },
  };
}

/**
 * Generates a Google Analytics report request for deposit views between specified dates.
 *
 * @param {string} [startDate='yesterday'] - The start date for the data range (defaults to 'yesterday' if not specified).
 * @param {string} [endDate='yesterday'] - The end date for the data range (defaults to 'yesterday' if not specified).
 * @returns {google.analytics.data.v1beta.IRunReportRequest} A configured Google Analytics run report request.
 */
export function gaRequestDepositViews(
  startDate?: string,
  endDate?: string
): google.analytics.data.v1beta.IRunReportRequest {
  return {
    property: `properties/${environment.googleAnalytics.property}`,
    dateRanges: [
      {
        startDate: startDate ?? 'yesterday',
        endDate: endDate ?? 'yesterday',
      },
    ],
    metrics: [
      {
        name: 'screenPageViews',
      },
    ],
    dimensions: [
      {
        name: 'unifiedPagePathScreen',
      },
    ],
    dimensionFilter: {
      filter: {
        fieldName: 'unifiedPagePathScreen',
        stringFilter: {
          value: '^/deposits/([0-9]|[a-z]){24}/view$',
          matchType: MatchType.PARTIAL_REGEXP,
        },
      },
    },
  };
}

/**
 * Generates a Google Analytics report request for review views between specified dates.
 *
 * @param {string} [startDate='yesterday'] - The start date for the data range (defaults to 'yesterday' if not specified).
 * @param {string} [endDate='yesterday'] - The end date for the data range (defaults to 'yesterday' if not specified).
 * @returns {google.analytics.data.v1beta.IRunReportRequest} A configured Google Analytics run report request.
 */
export function gaRequestReviewViews(
  startDate?: string,
  endDate?: string
): google.analytics.data.v1beta.IRunReportRequest {
  return {
    property: `properties/${environment.googleAnalytics.property}`,
    dateRanges: [
      {
        startDate: startDate ?? 'yesterday',
        endDate: endDate ?? 'yesterday',
      },
    ],
    metrics: [
      {
        name: 'screenPageViews',
      },
    ],
    dimensions: [
      {
        name: 'unifiedPagePathScreen',
      },
    ],
    dimensionFilter: {
      filter: {
        fieldName: 'unifiedPagePathScreen',
        stringFilter: {
          value: '^/reviews/([0-9]|[a-z]){24}/view$',
          matchType: MatchType.PARTIAL_REGEXP,
        },
      },
    },
  };
}

/**
 * Service for handling MetricsService.
 */
@Injectable()
export class MetricsService {
  /**
   * Constructs an instance of MetricsService.
   *
   * @param {Model<Metrics>} ViewModel - The view model for Metrics, injected using dependency injection.
   */
  constructor(@InjectModel(Metrics.name) public ViewModel: Model<Metrics>) {}

  /**
   * Creates a new metrics document based on the provided filter.
   *
   * @param {AnyKeys<Metrics>} filter - The properties to set on the new metrics document.
   * @returns {Promise<MetricsDocument>} A promise resolved with the newly created metrics document.
   */
  async create(filter: AnyKeys<Metrics>): Promise<MetricsDocument> {
    return await this.ViewModel.create(filter);
  }

  /**
   * Extracts metrics results from a Google Analytics run report response.
   *
   * @param {IRunReportResponse} report - The Google Analytics run report response to extract data from.
   * @returns {MetricResult[] | undefined} An array of metric results or undefined if no rows are found in the report.
   */
  extractMetricsFromGAReport(report: IRunReportResponse): MetricResult[] | undefined {
    if (report.rows) {
      return report.rows.map(row => {
        // Check that we have proper values, every row should be like
        // "dimensionValues": [{
        //     "value": "/communities/5f4682518939a34d480d3d40/view",
        //     "oneValue": "value"
        //   }],
        //   "metricValues": [{
        //     "value": "4171",
        //     "oneValue": "value"
        //   }]

        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        const objectId = row.dimensionValues?.pop()?.value?.split('/')?.[2];
        const screenviews = row.metricValues?.pop()?.value;
        assertIsDefined(objectId, 'ObjectId not found in report');
        assertIsDefined(screenviews, 'screenviews not found in report');
        return { objectId, screeviews: Number(screenviews) };
      });
    }

    return undefined;
  }
}
