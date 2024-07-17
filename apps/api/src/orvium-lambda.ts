/* eslint-disable */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as Sentry from '@sentry/node';
import { environment } from './environments/environment';
import { ValidationPipe } from '@nestjs/common';
import { SentryInterceptor } from './sentry.interceptor';
import { configure as serverlessExpress } from '@codegenie/serverless-express';
import { json, urlencoded } from 'express';
import { rawBodyMiddleware } from './utils/rawBody.middleware';

// @ts-ignore
let serverlessExpressInstance;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  app.use(json({ limit: '4mb', verify: rawBodyMiddleware }));
  app.use(urlencoded({ limit: '4mb', verify: rawBodyMiddleware, extended: true }));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  Sentry.init({
    dsn: environment.sentryDSN,
    environment: environment.name,
  });
  app.useGlobalInterceptors(new SentryInterceptor());

  await app.init();
  const expressApp = app.getHttpAdapter().getInstance();

  return serverlessExpress({ app: expressApp });
}

export const handler = async (event: any, context: any) => {
  // @ts-ignore
  serverlessExpressInstance = serverlessExpressInstance ?? (await bootstrap());

  return serverlessExpressInstance(event, context);
};
