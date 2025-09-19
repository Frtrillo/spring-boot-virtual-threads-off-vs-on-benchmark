import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: false,
      bodyLimit: 10 * 1024 * 1024, // 10MB
    })
  );

  await app.listen(8080, '0.0.0.0');
  
  console.log(`NestJS + Fastify IoT Benchmark Server running on port 8080`);
  console.log(`Process ID: ${process.pid}`);
  console.log(`Runtime: ${process.version || 'Bun'}`);
  console.log('Ready to receive requests...');
}

bootstrap();