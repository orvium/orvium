import { Injectable, Logger } from '@nestjs/common';
import { AwsStorageService } from '../common/aws-storage-service/aws-storage.service';
import { execFileSync } from 'child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from 'fs';
import { environment } from '../environments/environment';
import { DepositService } from '../deposit/deposit.service';
import path, { basename, dirname, extname, parse, resolve } from 'path';
import { INewFileEventData } from '../event/events/fileUploadedEvent';
import { assertIsDefined } from '../utils/utils';
import { chdir, cwd } from 'process';
import { ReviewService } from '../review/review.service';
import ConvertAPI from 'convertapi';
import { SubscriptionType } from '../communities/communities.schema';

/**
 * Service for handling PandocService.
 */
@Injectable()
export class PandocService {
  public systemBasePath = '/tmp/nestApi';

  /**
   * Constructs an instance of PandocService with required services.
   *
   * @param {AwsStorageService} storageService - Service for managing storage operations.
   * @param {DepositService} depositService - Service for managing deposits.
   * @param {ReviewService} reviewService - Service for managing reviews.
   */
  constructor(
    private readonly storageService: AwsStorageService,
    private readonly depositService: DepositService,
    private readonly reviewService: ReviewService
  ) {
    if (!existsSync(this.systemBasePath)) {
      mkdirSync(this.systemBasePath);
    }
  }

  /**
   * Compresses image files based on their extensions.
   *
   * @param {string} data - The path of the image file.
   */
  compressImg(data: string): void {
    Logger.debug('Compressing img: ' + data);
    const regexpgn = /image[\d]{1,}.png/;
    const regexjpeg = /image[\d]{1,}.(jpeg|jpg)/;
    if (regexpgn.test(data)) {
      execFileSync('optipng', ['-fix', data]);
      execFileSync('pngquant', ['--speed', '3', data, '--ext', '.png', '--force', '--verbose']);
    } else if (regexjpeg.test(data)) {
      execFileSync('jpegoptim', ['--size=500', '--strip-all', data], { stdio: 'inherit' });
    } else {
      Logger.debug('No compression method available');
    }
  }

  /**
   * Converts image files to more web-friendly formats like SVG, PNG, and WEBP.
   *
   * @param {string} path - The path of the image file.
   * @returns {{converted: boolean; imgPath: string}} An object containing a boolean indicating if the conversion was done and the new path.
   */
  convertImage(path: string): { converted: boolean; imgPath: string } {
    Logger.debug(`Checking if image ${path} needs conversion`);
    let converted = false;
    let imgPath = path;
    const regexEMF = /image[\d]{1,}.emf/;
    const regexWMF = /image[\d]{1,}.wmf/;
    const regexTIFF = /image[\d]{1,}.tiff/;
    if (regexEMF.test(path)) {
      Logger.debug('Converting EMF image');
      execFileSync('inkscape', ['--export-type', 'svg', path]);
      converted = true;
      imgPath = path.replace('.emf', '.svg');
    } else if (regexWMF.test(path)) {
      Logger.debug('Converting WMF image');
      imgPath = path.replace('.wmf', '.png');
      execFileSync('libreoffice7.5', [
        '--headless',
        '--convert-to',
        'png',
        path,
        '--outdir',
        dirname(path),
      ]);
      execFileSync('convert', [imgPath, '-trim', imgPath]);
      converted = true;
    } else if (regexTIFF.test(path)) {
      Logger.debug('Converting TIFF image');
      imgPath = path.replace('.tiff', '.webp');
      execFileSync('cwebp', ['-lossless', path, '-o', imgPath]);
      converted = true;
    } else {
      Logger.debug('No conversion needed');
    }

    return { converted, imgPath };
  }

  /**
   * Downloads a file from AWS S3 and saves it locally.
   *
   * @param {INewFileEventData} data - Event data containing information about the file.
   * @returns {string} The path to the downloaded file.
   */
  downloadFile(data: INewFileEventData): string {
    assertIsDefined(environment.aws.endpoint);
    assertIsDefined(environment.aws.s3.privateBucket);

    const s3filePath =
      'peerReviews' in data.depositOrReview
        ? `s3://${environment.aws.s3.privateBucket}/${data.depositOrReview._id.toHexString()}/${
            data.filename
          }`
        : `s3://${
            environment.aws.s3.privateBucket
          }/reviews/${data.depositOrReview._id.toHexString()}/${data.filename}`;

    const timestamp = Date.now().toString();
    const basePath = `${
      this.systemBasePath
    }/${timestamp}/${data.depositOrReview._id.toHexString()}`;
    const downloadedFilePath = `${basePath}/${data.filename}`;
    Logger.debug('Copying data from aws');
    execFileSync('aws', [
      `--endpoint-url=${environment.aws.endpoint}`,
      's3',
      'cp',
      s3filePath,
      downloadedFilePath,
    ]);
    Logger.debug(`File downloaded at ${downloadedFilePath}`);
    return downloadedFilePath;
  }

  /**
   * Exports a file to HTML format including all media contained within.
   *
   * @param {string} localFileToProcess - The local path to the file to be processed.
   * @param {INewFileEventData} data - Additional event data needed for processing.
   */
  async exportToHTML(localFileToProcess: string, data: INewFileEventData): Promise<void> {
    const destinationMedia =
      'peerReviews' in data.depositOrReview
        ? `${data.depositOrReview._id.toHexString()}/media/`
        : `reviews/${data.depositOrReview._id.toHexString()}/media/`;
    const htmlConversion = this.convertToHTML(localFileToProcess);
    const newHtml = this.refreshHtml(htmlConversion.destinationHtml, htmlConversion.outDir, data);
    Logger.debug(`Cleaning AWS media folder ${destinationMedia}`);
    await this.storageService.deleteRecursive(destinationMedia);
    const imagesFiles = await this.copyMediaToS3(
      `${htmlConversion.outDir}/media/`,
      destinationMedia
    );

    if ('peerReviews' in data.depositOrReview) {
      Logger.debug('Adding html to deposit');
      await this.depositService.findOneAndUpdate(
        { _id: data.depositOrReview._id },
        {
          html: newHtml,
          images: imagesFiles,
        }
      );
    } else {
      Logger.debug('Adding html to review');
      await this.reviewService.findOneAndUpdate(
        { _id: data.depositOrReview._id },
        {
          html: newHtml,
          images: imagesFiles,
        }
      );
    }

    Logger.debug('HTML exported');
  }

  /**
   * Copies media files to AWS S3 and returns an array of new media file names.
   *
   * @param {string} originMediaDir - The directory of the original media files.
   * @param {string} destinationMediaDir - The S3 directory where media files will be copied.
   * @returns {Promise<string[]>} An array of new media file names.
   */
  async copyMediaToS3(originMediaDir: string, destinationMediaDir: string): Promise<string[]> {
    const imagesFiles: string[] = [];
    if (existsSync(originMediaDir)) {
      Logger.debug('Copying new generated images to S3');
      const files = readdirSync(originMediaDir);
      for (const file of files) {
        const sourceFileAbsolutePath = path.join(originMediaDir, file);
        const convertImageOutput = this.convertImage(sourceFileAbsolutePath);
        if (convertImageOutput.converted) {
          unlinkSync(sourceFileAbsolutePath); // remove emf file, no compression needed for svg
        } else {
          try {
            this.compressImg(sourceFileAbsolutePath);
          } catch (e) {
            Logger.error(e);
          }
        }
      }
      await this.storageService.copyRecursive(destinationMediaDir, originMediaDir);
      Logger.debug('Adding images to deposit');
      const listObjectsV2CommandOutput =
        await this.storageService.listObjectsV2(destinationMediaDir);

      Logger.debug(JSON.stringify(listObjectsV2CommandOutput.Contents));
      if (listObjectsV2CommandOutput.Contents) {
        for (const image of listObjectsV2CommandOutput.Contents) {
          if (image.Key && image.Key != destinationMediaDir) {
            const imageFile = image.Key.replace(destinationMediaDir, '');
            imagesFiles.push(imageFile);
          }
        }
      }
    }
    Logger.debug('Media extracted');
    return imagesFiles;
  }

  /**
   * Exports a file to PDF format.
   *
   * @param {string} localFileToProcess - The local path to the file to be converted.
   * @param {INewFileEventData} data - Additional event data needed for processing.
   */
  async exportToPDF(localFileToProcess: string, data: INewFileEventData): Promise<void> {
    const enableConvertAPI =
      environment.name === 'production' &&
      data.depositOrReview.communityPopulated.subscription === SubscriptionType.premium;
    const generatedPdfPath = await this.converToPdf(localFileToProcess, enableConvertAPI);
    const filenamePdf = basename(generatedPdfPath);
    Logger.debug('Saving pdf file in ASW S3');
    const s3Object =
      'peerReviews' in data.depositOrReview
        ? `${data.depositOrReview._id.toHexString()}/${filenamePdf}`
        : `reviews/${data.depositOrReview._id.toHexString()}/${filenamePdf}`;
    await this.storageService.save(s3Object, readFileSync(generatedPdfPath));
    Logger.debug('Adding generated pdf to deposit');

    if ('peerReviews' in data.depositOrReview) {
      await this.depositService.findOneAndUpdate(
        { _id: data.depositOrReview._id },
        {
          pdfUrl: filenamePdf,
        }
      );
    } else {
      await this.reviewService.findOneAndUpdate(
        { _id: data.depositOrReview._id },
        {
          pdfUrl: filenamePdf,
        }
      );
    }

    Logger.debug('PDF Generated');
  }

  /**
   * Unzips a file into a designated output directory.
   *
   * @param {string} origin - The file path of the zip file.
   * @returns {string} The output directory containing unzipped files.
   */
  unzipFile(origin: string): string {
    Logger.debug(`Unzip ${origin}`);
    const fileDir = dirname(origin);
    const outDir = `${fileDir}/unzipped`;
    execFileSync('unzip', ['-o', origin, '-d', outDir]);
    Logger.debug('Unzip finished');
    return outDir;
  }

  /**
   * Searches for a LaTeX main file in a directory.
   *
   * @param {string} filesDir - The directory to search in.
   * @returns {string | undefined} The path to the LaTeX main file if found; otherwise, undefined.
   */
  findLatexMainFile(filesDir: string): string | undefined {
    Logger.debug(`Finding tex file at ${filesDir}`);
    let files = readdirSync(filesDir, { withFileTypes: true });
    let currentPath = filesDir;

    // Check if project is in a subfolder
    if (files.length === 1 && files[0].isDirectory()) {
      const subfolder = resolve(filesDir, files[0].name);
      files = readdirSync(subfolder, { withFileTypes: true });
      currentPath = subfolder;
    }
    const latexfile = files.find(file => extname(file.name) === '.tex');
    if (latexfile) {
      Logger.debug(`Text file found ${latexfile.name}`);
      return `${currentPath}/${latexfile.name}`;
    } else {
      Logger.debug('Tex file NOT FOUND');
      return undefined;
    }
  }

  /**
   * Converts a document to PDF using different tools based on the file extension and settings.
   *
   * @param {string} origin - The path to the file to convert.
   * @param {boolean} enableConvertAPI - A flag indicating whether to use an external API for conversion.
   * @returns {Promise<string>} The path to the generated PDF file.
   */
  async converToPdf(origin: string, enableConvertAPI = false): Promise<string> {
    Logger.debug(`Converting ${origin} to pdf`);
    const filename = basename(origin);
    const filenameWithoutExt = parse(filename).name;
    const fileExtension = extname(filename);
    const fileDir = dirname(origin);
    const outDir = `${fileDir}/conversions`;
    const pdfFilePath = `${outDir}/${filename.replace(fileExtension, '.pdf')}`;

    if (!existsSync(outDir)) {
      mkdirSync(outDir);
    }

    if (fileExtension === '.docx') {
      Logger.debug('Docx file detected');
      if (enableConvertAPI) {
        Logger.debug('ConvertAPI enabled. Converting using the API service');
        const convertapi = new ConvertAPI(environment.convertAPIKey);
        const result = await convertapi.convert('pdf', { File: origin });
        await result.file.save(pdfFilePath);
      } else {
        Logger.debug('ConvertAPI disabled. Standard file detected, using LibreOffice');
        execFileSync('libreoffice7.5', [
          '--headless',
          '--convert-to',
          'pdf',
          origin,
          '--outdir',
          outDir,
        ]);
      }
    } else if (fileExtension === '.tex') {
      Logger.debug('Tex file detected, using pdflatex');
      chdir(fileDir);
      Logger.debug(`Current path is ${cwd()}`);
      try {
        execFileSync('pdflatex', ['-interaction', 'nonstopmode', filename]);
      } catch (e) {
        Logger.debug(e);
      }
      try {
        execFileSync('bibtex', [`${filenameWithoutExt}`]);
      } catch (e) {
        Logger.debug('Error processing bibtex');
      }
      try {
        execFileSync('pdflatex', [
          '-interaction',
          'nonstopmode',
          '-output-directory',
          outDir,
          filename,
        ]);
        execFileSync('pdflatex', [
          '-interaction',
          'nonstopmode',
          '-output-directory',
          outDir,
          filename,
        ]);
      } catch {}
    } else {
      Logger.debug('Standard file detected, using LibreOffice');
      execFileSync('libreoffice7.5', [
        '--headless',
        '--convert-to',
        'pdf',
        origin,
        '--outdir',
        outDir,
      ]);
    }

    Logger.debug(`Conversion to pdf finished. Output file ${pdfFilePath}`);
    return pdfFilePath;
  }

  /**
   * Converts a file to HTML format.
   *
   * @param {string} origin - The path to the file to convert.
   * @returns {{destinationHtml: string; outDir: string}} An object containing paths to the generated HTML and its media directory.
   */
  convertToHTML(origin: string): { destinationHtml: string; outDir: string } {
    const filename = basename(origin);
    const fileExtension = extname(filename);
    const fileDir = dirname(origin);
    const outDir = `${fileDir}/conversions`;
    const destinationHtml = `${outDir}/${filename.replace(fileExtension, '.html')}`;
    let docxFilePath;

    if (!existsSync(outDir)) {
      mkdirSync(outDir);
    }

    if (fileExtension === '.tex') {
      Logger.debug(`Converting ${fileExtension} file to DOCX using pandoc`);
      chdir(fileDir);
      const destinationDocx = `${outDir}/${filename.replace(fileExtension, '.docx')}`;
      execFileSync('pandoc', [filename, '-o', destinationDocx]);
      docxFilePath = destinationDocx;
    } else if (fileExtension !== '.docx') {
      Logger.debug(`Converting ${fileExtension} file to DOCX using pandoc`);
      const destinationDocx = `${outDir}/${filename.replace(fileExtension, '.docx')}`;
      execFileSync('pandoc', [origin, '-o', destinationDocx]);
      docxFilePath = destinationDocx;
    } else {
      docxFilePath = origin;
    }

    Logger.debug('Converting file to HTML using pandoc');
    execFileSync('pandoc', [
      docxFilePath,
      '-o',
      destinationHtml,
      '--extract-media',
      outDir,
      '--mathjax',
    ]);

    return { destinationHtml, outDir };
  }

  /**
   * Updates the HTML content to use the correct media paths and adjusts image tags.
   *
   * @param {string} destinationHtml - The path to the HTML file.
   * @param {string} outDir - The directory containing the media files.
   * @param {INewFileEventData} data - Additional event data needed for processing.
   * @returns {string} The updated HTML content.
   */
  refreshHtml(destinationHtml: string, outDir: string, data: INewFileEventData): string {
    const src =
      'peerReviews' in data.depositOrReview
        ? `src="${
            environment.publicUrlWithPrefix
          }/deposits/${data.depositOrReview._id.toHexString()}`
        : `src="${
            environment.publicUrlWithPrefix
          }/reviews/${data.depositOrReview._id.toHexString()}`;
    Logger.debug('Reading HTML content and replace img src url');
    let html = readFileSync(destinationHtml, 'utf-8');
    html = html.replace(/<p> <\/p>/gi, ' ');
    Logger.debug('Adding images');
    const regexSource = new RegExp(`src="${outDir}`, 'gi');
    html = html.replace(regexSource, src);
    const regexSize = new RegExp('<img', 'gi');
    html = html.replace(regexSize, '<img class="paper-images"');
    // replace emf images by svg
    html = html.replace(new RegExp(/\.emf/, 'gi'), '.svg');
    html = html.replace(new RegExp(/\.wmf/, 'gi'), '.png');
    html = html.replace(new RegExp(/\.tiff/, 'gi'), '.webp');

    writeFileSync(destinationHtml, html);

    return html;
  }
}
