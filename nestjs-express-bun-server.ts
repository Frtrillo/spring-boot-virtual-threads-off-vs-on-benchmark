import { NestFactory } from '@nestjs/core';
import { AppBunModule } from './app-bun.module';

async function bootstrap() {
  // Use Express instead of Fastify
  const app = await NestFactory.create(AppBunModule);
  
  await app.listen(8080, '0.0.0.0');
  
  console.log(`NestJS + Express (Bun-optimized) running on port 8080`);
  console.log(`Process ID: ${process.pid}`);
  console.log(`Runtime: ${typeof Bun !== 'undefined' ? `Bun ${Bun.version}` : `Node.js ${process.version}`}`);
  console.log('Ready to receive requests...');
}

bootstrap();
