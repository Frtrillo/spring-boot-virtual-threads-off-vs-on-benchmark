import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { UltraFastModule } from './ultra-fast.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    UltraFastModule,
    new FastifyAdapter({
      logger: false,
      bodyLimit: 10 * 1024 * 1024,
      // Ultra-fast Fastify settings
      trustProxy: false,
      ignoreTrailingSlash: true,
      ignoreDuplicateSlashes: true,
      disableRequestLogging: true,
    }),
    {
      // Disable all NestJS overhead
      logger: false,
      abortOnError: false,
    }
  );

  // Disable all interceptors and guards for maximum speed
  app.useGlobalInterceptors();
  app.useGlobalGuards();
  app.useGlobalFilters();

  await app.listen(8080, '0.0.0.0');
  
  console.log(`Ultra-Fast NestJS running on port 8080`);
  console.log(`Process ID: ${process.pid}`);
  console.log(`Runtime: ${typeof Bun !== 'undefined' ? `Bun ${Bun.version}` : `Node.js ${process.version}`}`);
  console.log('Ready for MAXIMUM SPEED...');
}

bootstrap();
