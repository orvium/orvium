import { Injectable, Logger } from '@nestjs/common';
import { environment } from '../environments/environment';
import { createTransport } from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';

/**
 * Service for handling email operations.
 */
@Injectable()
export class EmailService {
  public transporter: Mail;
  private defaultOptions: Mail.Options = {
    from: environment.senderEmail,
    headers: {
      'X-SES-CONFIGURATION-SET': 'SESConfigurationSet',
    },
  };
  public subjectPrefix: string;

  /**
   * Constructs a new instance of EmailService.
   */
  constructor() {
    this.transporter = createTransport(environment.smtp);
    // TODO This commented part makes the constructor async causing issues with jest.
    //  Check how to fix later.
    // this.transporter.verify(function (error, success) {
    //   if (error) {
    //     Logger.debug(error);
    //   } else {
    //     Logger.debug('SMTP Server is ready to take messages');
    //   }
    // });
    this.subjectPrefix = environment.name === 'production' ? '' : `[${environment.name}] `;
  }

  /**
   * Sends an email with the specified options, automatically adding default configurations.
   *
   * @param {Mail.Options} options - The configuration and content of the email to send.
   * @returns {Promise<unknown>} A promise that resolves when the email has been sent.
   */
  async sendMail(options: Mail.Options): Promise<unknown> {
    options = { ...this.defaultOptions, ...options };
    options.subject = this.subjectPrefix.concat(options.subject || '');
    options.html = this.footerWrapper(options.html as string);
    Logger.debug('Sending email', options);
    return this.transporter.sendMail(options);
  }

  /**
   * Wraps the provided HTML email content with a standardized footer.
   *
   * @param {string} body - The HTML content to wrap with a footer.
   * @returns {string} The HTML content wrapped with a footer.
   */
  footerWrapper(body: string): string {
    return `
${body}
<table style="border: 0;margin-left: auto;margin-right: auto;text-align: center;line-height: 0.8;">
  <tbody>
  <tr>
    <td>
      <p><em>Powered by Orvium. One platform for all your publishing needs.</em></p>
      <p><em> Send us your feedback to support@orvium.io</em></p>
      <img
        style="display: block;margin-left: auto;margin-right: auto;margin-top: 10px;"
        src="https://assets.orvium.io/logo/orvium_logo_200px.png"
        alt="Orvium Logo"
        width="100px" />
    </td>
  </tr>
  </tbody>
</table>`;
  }
}
