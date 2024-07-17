import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { environment } from './environments/environment';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { writeFileSync } from 'fs';
import { sortObjectByKey } from './utils/utils';
import { json, urlencoded } from 'express';
import { rawBodyMiddleware } from './utils/rawBody.middleware';
import helmet from 'helmet';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  app.setGlobalPrefix('api/v1');
  app.use(json({ limit: '4mb', verify: rawBodyMiddleware }));
  app.use(urlencoded({ limit: '4mb', verify: rawBodyMiddleware, extended: true }));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      validateCustomDecorators: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  if (environment.name === 'development') {
    console.log('Starting swagger module');
    const config = new DocumentBuilder()
      .setTitle('Orvium API')
      .setDescription(
        `
This is the OpenAPI 3.0 specification for the Orvium REST API.

Some useful links:

- [Orvium website](https://orvium.io)
`
      )
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('blockchain', 'Blockchain networks')
      .addTag('call', 'Call for Papers/Abstracts')
      .addTag('comments', 'User comments about publications')
      .addTag('communities', 'Communities management')
      .addTag('configuration', 'Configuration')
      .addTag('conversations', 'Chat and conversations')
      .addTag('deposits', 'Publications management')
      .addTag('disciplines', 'Disciplines')
      .addTag('domains', 'Blocked email domains')
      .addTag('feedback', 'Feedback')
      .addTag('institutions', 'Institutions')
      .addTag('Invitations', 'Invitations to peer review and copy editing')
      .addTag('ithenticate', 'IThenticate management')
      .addTag('notifications', 'Nofitications')
      // .addTag('orcid', 'ORCID (Open Researcher and Contributor ID) management')
      .addTag('payment', 'Payment operations with Stripe')
      .addTag('Push Notifications', 'Push Notifications')
      .addTag('reviews', 'Peer reviews management')
      .addTag('session', 'Conference sessions')
      .addTag('templates', 'Email templating')
      .addTag('users', 'Users management')
      .addTag('admin', 'Platform admins management')
      .build();
    const operationIds: string[] = [];
    const document = SwaggerModule.createDocument(app, config, {
      operationIdFactory: (controllerKey: string, methodKey: string) => {
        const operationId = operationIds.includes(`${controllerKey}_${methodKey}`)
          ? `${controllerKey}_${methodKey}_2`
          : `${controllerKey}_${methodKey}`;
        operationIds.push(operationId);
        return operationId;
      },
    });
    document.paths = sortObjectByKey(document.paths);
    if (document.components?.schemas) {
      document.components.schemas = sortObjectByKey(document.components.schemas);
    }
    const documentString = JSON.stringify(document, null, '  ');
    writeFileSync('libs/api-client/openapi.json', documentString);
    SwaggerModule.setup('api', app, document);
  }

  await app.listen(environment.port);
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
