import { NestFactory } from '@nestjs/core';
import { environment } from './environments/environment';
import { AgentModule } from './agent.module';
import { init } from '@sentry/node';

async function bootstrap(): Promise<void> {
  await NestFactory.createApplicationContext(AgentModule);

  init({
    dsn: environment.sentryDSN,
    environment: environment.name,
  });
}

void bootstrap();
