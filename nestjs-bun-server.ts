import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppBunModule } from './app-bun.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppBunModule,
    new FastifyAdapter({
      logger: false,
      bodyLimit: 10 * 1024 * 1024, // 10MB
    })
  );

  await app.listen(8080, '0.0.0.0');
  
  console.log(`NestJS + Fastify (Bun-optimized) running on port 8080`);
  console.log(`Process ID: ${process.pid}`);
  console.log(`Runtime: ${typeof Bun !== 'undefined' ? `Bun ${Bun.version}` : `Node.js ${process.version}`}`);
  console.log('Ready to receive requests...');
}

bootstrap();
