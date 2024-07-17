import { ForbiddenException, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import {
  Configuration,
  EulaAcceptListItem,
  EULAApi,
  EulaVersion,
  FeaturesApi,
  FeaturesEnabled,
  SimilarityApi,
  SimilarityGenerationSettingsSearchRepositoriesEnum,
  SimilarityMetadata,
  SimilarityViewerUrlResponse,
  SimilarityViewerUrlSettingsLocaleEnum,
  SimpleSubmissionResponse,
  Submission,
  SubmissionApi,
  SubmissionBaseOwnerDefaultPermissionSetEnum,
  SubmissionBaseSubmitterDefaultPermissionSetEnum,
  SuccessMessage,
  Webhook,
  WebhookApi,
  WebhookWithSecretEventTypesEnum,
} from '@orvium/ithenticate-client';
import { UserDocument } from '../users/user.schema';
import { assertIsDefined, decryptJson } from '../utils/utils';
import { AwsStorageService } from '../common/aws-storage-service/aws-storage.service';
import { environment } from '../environments/environment';
import { PopulatedDepositDocument } from '../deposit/deposit.service';

/**
 * Service for managing iThenticate operations.
 */
@Injectable()
export class IthenticateService {
  featuresApi: FeaturesApi;
  eulaApi: EULAApi;
  submissionApi: SubmissionApi;
  similarityApi: SimilarityApi;
  webhookApi: WebhookApi;
  ithenticateEndpoint: string;
  ithenticateSerciveName: string;
  ithenticateServiceVersion: string;
  ithenticateSigningSecret: string;

  /**
   * Constructs an instance of IthenticateService.
   *
   * @param {httpService} httpService.
   * @param {storageService} AwsStorageService - AWS storeService
   */
  constructor(
    private httpService: HttpService,
    private readonly storageService: AwsStorageService
  ) {
    assertIsDefined(environment.ithenticate.endpoint, 'ithenticate endpoint not defined');
    assertIsDefined(environment.ithenticate.service_name, 'ithenticate service name not defined');
    assertIsDefined(
      environment.ithenticate.service_version,
      'ithenticate service version not defined'
    );
    assertIsDefined(
      environment.ithenticate.signing_secret,
      'ithenticate signing secret not defined'
    );

    this.ithenticateEndpoint = environment.ithenticate.endpoint;
    this.ithenticateSerciveName = environment.ithenticate.service_name;
    this.ithenticateServiceVersion = environment.ithenticate.service_version;
    this.ithenticateSigningSecret = environment.ithenticate.signing_secret;

    this.featuresApi = new FeaturesApi(
      new Configuration(),
      this.ithenticateEndpoint,
      this.httpService.axiosRef
    );
    this.eulaApi = new EULAApi(
      new Configuration(),
      this.ithenticateEndpoint,
      this.httpService.axiosRef
    );
    this.submissionApi = new SubmissionApi(
      new Configuration(),
      this.ithenticateEndpoint,
      this.httpService.axiosRef
    );
    this.similarityApi = new SimilarityApi(
      new Configuration(),
      this.ithenticateEndpoint,
      this.httpService.axiosRef
    );
    this.webhookApi = new WebhookApi(
      new Configuration(),
      this.ithenticateEndpoint,
      this.httpService.axiosRef
    );
  }

  /**
   * Shows Features enabled
   *
   * @param key iThenticate integration key
   * @returns Features enabled
   */
  async getFeaturesEnabled(key: string): Promise<FeaturesEnabled> {
    const response = await this.featuresApi.featuresEnabledGet(
      this.ithenticateSerciveName,
      this.ithenticateServiceVersion,
      {
        headers: {
          Authorization: `Bearer ${decryptJson<string>(key)}`,
        },
      }
    );

    return response.data;
  }

  /**
   * Shows EULA Info
   *
   * @param key iThenticate integration key
   * @returns EULA information in a string
   */
  async getEULA(key: string): Promise<EulaVersion> {
    const response = await this.eulaApi.eulaVersionIdGet(
      this.ithenticateSerciveName,
      this.ithenticateServiceVersion,
      'latest',
      'en-US',
      {
        headers: {
          Authorization: `Bearer ${decryptJson<string>(key)}`,
        },
      }
    );

    return response.data;
  }

  /**
   * Shows EULA HTML
   *
   * @param key iThenticate integration key
   * @returns EULA HTML
   */
  async getEULAHTML(key: string): Promise<string> {
    const response = await this.eulaApi.eulaVersionIdViewGet(
      this.ithenticateSerciveName,
      this.ithenticateServiceVersion,
      'latest',
      'en-US',
      {
        headers: {
          Authorization: `Bearer ${decryptJson<string>(key)}`,
        },
      }
    );

    return response.data;
  }

  /**
   * Accepts a particular EULA version
   *
   * @param user The user ID accepting the EULA version
   * @param key iThenticate integration key
   * @param version
   * @returns EULA accepted item
   */
  async acceptEULA(user: string, key: string, version: string): Promise<EulaAcceptListItem> {
    const response = await this.eulaApi.eulaVersionIdAcceptPost(
      this.ithenticateSerciveName,
      this.ithenticateServiceVersion,
      version,
      {
        user_id: user,
        accepted_timestamp: Date.now().toString(),
        version: version,
        language: 'en-US',
      },
      {
        headers: {
          Authorization: `Bearer ${decryptJson<string>(key)}`,
        },
      }
    );

    return response.data;
  }

  /**
   * Gets an EULA acceptance
   *
   * @param user The ID from the user who accepted
   * @param key iThenticate integration key
   * @returns an EULA acceptance object
   */
  async getEULAAcceptance(user: string, key: string): Promise<EulaAcceptListItem[]> {
    const response = await this.eulaApi.eulaVersionIdAcceptUserIdGet(
      this.ithenticateSerciveName,
      this.ithenticateServiceVersion,
      'latest',
      user,
      {
        headers: {
          Authorization: `Bearer ${decryptJson<string>(key)}`,
        },
      }
    );

    return response.data;
  }

  /**
   * Gets info of a submission
   *
   * @param submissionId Id of the submission
   * @param key iThenticate integration key
   * @returns Info of the submission
   */
  async infoSubmission(submissionId: string, key: string): Promise<Submission> {
    const response = await this.submissionApi.getSubmiddionDetails(
      this.ithenticateSerciveName,
      this.ithenticateServiceVersion,
      submissionId,
      {
        headers: {
          Authorization: `Bearer ${decryptJson<string>(key)}`,
        },
      }
    );

    return response.data;
  }

  /**
   * Creates a new submission
   *
   * @param deposit The deposit to be submitted
   * @param key iThenticate integration key
   * @param submitter The ID of the user
   * @returns Id of the submission
   */
  async createSubmission(
    deposit: PopulatedDepositDocument,
    key: string,
    submitter: UserDocument
  ): Promise<SimpleSubmissionResponse> {
    const acceptance = await this.getEULAAcceptance(submitter._id.toHexString(), key);
    assertIsDefined(acceptance, 'Acceptance not found');
    if (acceptance.length === 0) {
      throw new ForbiddenException('EULA not accepted');
    } else {
      const response = await this.submissionApi.createSubmission(
        this.ithenticateSerciveName,
        this.ithenticateServiceVersion,
        {
          owner: deposit.creator.toHexString(),
          submitter: submitter._id.toHexString(),
          title: deposit.title,
          owner_default_permission_set: SubmissionBaseOwnerDefaultPermissionSetEnum.User,
          submitter_default_permission_set: SubmissionBaseSubmitterDefaultPermissionSetEnum.Editor,
          eula: {
            accepted_timestamp: acceptance[0].accepted_timestamp,
            version: acceptance[0].version,
            language: acceptance[0].language,
          },
          metadata: {
            owners: [
              {
                id: deposit.creator.toHexString(),
              },
            ],
            submitter: {
              id: submitter._id.toHexString(),
              given_name: submitter.firstName,
              family_name: submitter.lastName,
              email: submitter.email,
            },
            original_submitted_time: deposit.submissionDate?.toISOString(),
          },
        },
        {
          headers: {
            Authorization: `Bearer ${decryptJson<string>(key)}`,
          },
        }
      );
      return response.data;
    }
  }

  /**
   * Uploads file to a new submission
   *
   * @param submissionId identification of the submission
   * @param deposit
   * @param key iThenticate integration key
   * @returns Success string
   */
  async uploadFileToSubmission(
    submissionId: string,
    deposit: { id: string; publication: { filename: string } },
    key: string
  ): Promise<SuccessMessage> {
    const file = await this.storageService.get(`${deposit.id}/${deposit.publication.filename}`);
    const response = await this.submissionApi.uploadSubmittedFile(
      this.ithenticateSerciveName,
      this.ithenticateServiceVersion,
      submissionId,
      'binary/octet-stream',
      `inline; filename="${encodeURIComponent(deposit.publication.filename)}"`,
      file,
      {
        headers: {
          Authorization: `Bearer ${decryptJson<string>(key)}`,
        },
      }
    );
    return response.data;
  }

  /**
   * Generates a similarity report
   *
   * @param id identification of the similarity report
   * @param key iThenticate integration key
   * @returns Success string
   */
  async generateSimilarityReport(id: string, key: string): Promise<SuccessMessage> {
    const response = await this.similarityApi.requestSimilarityReport(
      this.ithenticateSerciveName,
      this.ithenticateServiceVersion,
      id,
      {
        generation_settings: {
          search_repositories: [
            SimilarityGenerationSettingsSearchRepositoriesEnum.Internet,
            SimilarityGenerationSettingsSearchRepositoriesEnum.SubmittedWork,
            SimilarityGenerationSettingsSearchRepositoriesEnum.Publication,
            SimilarityGenerationSettingsSearchRepositoriesEnum.Crossref,
            SimilarityGenerationSettingsSearchRepositoriesEnum.CrossrefPostedContent,
          ],
        },
      },
      {
        headers: {
          Authorization: `Bearer ${decryptJson<string>(key)}`,
        },
      }
    );
    return response.data;
  }

  /**
   * Gets similarity report results
   *
   * @param id identification of the submission
   * @param key iThenticate integration key
   * @returns similarity report metadata
   */
  async getSimilarityReport(id: string, key: string): Promise<SimilarityMetadata> {
    const report = await this.similarityApi.getSimilarityReportResults(
      this.ithenticateSerciveName,
      this.ithenticateServiceVersion,
      id,
      {
        headers: {
          Authorization: `Bearer ${decryptJson<string>(key)}`,
        },
      }
    );
    return report.data;
  }

  /**
   * Gets similarity report URL
   *
   * @param id identification of the submission
   * @param key iThenticate integration key
   * @param userId viewer id
   * @returns similarity report metadata
   */
  async getSimilarityReportUrl(
    id: string,
    key: string,
    userId: string
  ): Promise<SimilarityViewerUrlResponse> {
    const report = await this.similarityApi.getSimilarityReportUrl(
      this.ithenticateSerciveName,
      this.ithenticateServiceVersion,
      id,
      {
        viewer_user_id: userId,
        locale: SimilarityViewerUrlSettingsLocaleEnum.EnUs,
        viewer_default_permission_set: 'EDITOR',
      },
      {
        headers: {
          Authorization: `Bearer ${decryptJson<string>(key)}`,
        },
      }
    );
    return report.data;
  }

  /**
   * Creates a iThenticate Webhook
   *
   * @param key iThenticate integration key
   * @returns Info of the webhook created
   */
  async createWebhook(key: string): Promise<Webhook> {
    const webhook = await this.webhookApi.webhooksPost(
      this.ithenticateSerciveName,
      this.ithenticateServiceVersion,
      {
        url: `${environment.publicUrl}/ithenticate/webhooks/events`,
        signing_secret: Buffer.from(this.ithenticateSigningSecret).toString(
          'base64'
        ) as unknown as File,
        event_types: [
          WebhookWithSecretEventTypesEnum.SubmissionComplete,
          WebhookWithSecretEventTypesEnum.SimilarityComplete,
        ],
        allow_insecure: true,
      },
      {
        headers: {
          Authorization: `Bearer ${decryptJson<string>(key)}`,
        },
      }
    );

    return webhook.data;
  }

  /**
   * Deletes an iThenticate webhook
   *
   * @param id Id of the webhook
   * @param key iThenticate integration key
   */
  async deleteWebhook(id: string, key: string): Promise<void> {
    await this.webhookApi.deleteWebhook(
      this.ithenticateSerciveName,
      this.ithenticateServiceVersion,
      id,
      {
        headers: {
          Authorization: `Bearer ${decryptJson<string>(key)}`,
        },
      }
    );
  }

  /**
   * Lists all iThenticate webhooks
   *
   * @param key iThenticate integration key
   */
  async listWebhooks(key: string): Promise<Webhook[]> {
    const webhooks = await this.webhookApi.webhooksGet(
      this.ithenticateSerciveName,
      this.ithenticateServiceVersion,
      {
        headers: {
          Authorization: `Bearer ${decryptJson<string>(key)}`,
        },
      }
    );

    return webhooks.data;
  }

  /**
   * Creates a iThenticate Webhook
   *
   * @param id Id of the webhook
   * @param key Ithenticate api key
   * @returns Info of the webhook created
   */
  async webhookInfo(id: string, key: string): Promise<Webhook> {
    const webhook = await this.webhookApi.getWebhook(
      this.ithenticateSerciveName,
      this.ithenticateServiceVersion,
      id,
      {
        headers: {
          Authorization: `Bearer ${decryptJson<string>(key)}`,
        },
      }
    );

    return webhook.data;
  }
}
