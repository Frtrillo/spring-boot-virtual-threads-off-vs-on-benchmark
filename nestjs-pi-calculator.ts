import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Controller, Post, Get, Body, Module } from '@nestjs/common';
import { Injectable } from '@nestjs/common';

@Injectable()
class PiService {
  /**
   * Warm up the V8 engine for large calculations
   */
  warmupEngine(): void {
    for (let i = 0; i < 5; i++) {
      this.calculatePiLeibniz(100_000);
    }
  }

  /**
   * Calculate π using Leibniz formula: π/4 = 1 - 1/3 + 1/5 - 1/7 + 1/9 - ...
   */
  calculatePiLeibniz(iterations: number): number {
    let pi = 0.0;
    
    for (let i = 0; i < iterations; i++) {
      const term = 1.0 / (2 * i + 1);
      if (i % 2 === 0) {
        pi += term;
      } else {
        pi -= term;
      }
    }
    
    return pi * 4.0;
  }
}

@Controller('api/pi')
class PiController {
  constructor(private readonly piService: PiService) {}
  
  @Post('calculate')
  async calculatePi(@Body() request: any) {
    const startTime = process.hrtime.bigint();
    
    try {
      // Extract iterations from request
      let iterations = request.iterations || 1_000_000;
      if (iterations <= 0) {
        iterations = 1_000_000;
      }
      
      // Warm up V8 engine if this is a large calculation
      if (iterations > 10_000_000) {
        this.piService.warmupEngine();
      }
      
      // Calculate π using Leibniz formula
      const pi = this.piService.calculatePiLeibniz(iterations);
      
      const endTime = process.hrtime.bigint();
      const elapsedMs = Number(endTime - startTime) / 1_000_000;
      const accuracy = Math.abs(Math.PI - pi);
      
      const response = {
        result: pi,
        actualPi: Math.PI,
        error: accuracy,
        iterations: iterations,
        timeMs: Math.round(elapsedMs * 100) / 100,
        iterationsPerSecond: Math.round(iterations / elapsedMs * 1000),
        runtime: `NestJS + Node.js ${process.version}`,
        threadType: "Single Thread (Event Loop)"
      };
      
      return response;
      
    } catch (error) {
      const endTime = process.hrtime.bigint();
      const elapsedMs = Number(endTime - startTime) / 1_000_000;
      
      throw {
        error: 'π calculation failed',
        message: error.message,
        timeMs: Math.round(elapsedMs * 100) / 100
      };
    }
  }

  @Get('health')
  getHealth() {
    const memUsage = process.memoryUsage();
    
    return {
      status: 'ok',
      timestamp: new Date(),
      runtime: 'NestJS π Calculator',
      nodeVersion: process.version,
      virtualThreads: false,
      availableProcessors: require('os').cpus().length,
      memoryUsage: {
        rss: memUsage.rss,
        heapTotal: memUsage.heapTotal,
        heapUsed: memUsage.heapUsed,
        external: memUsage.external
      }
    };
  }
}

@Module({
  controllers: [PiController],
  providers: [PiService],
})
class AppModule {}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  await app.listen(8080, '0.0.0.0');
  
  console.log('🚀 NestJS π Calculator running on port 8080');
  console.log(`📊 Runtime: Node.js ${process.version}`);
  console.log('Ready to calculate π with Leibniz formula...');
  
  // Warm up V8 on startup
  console.log('⚡ Warming up V8 engine...');
  const piService = new PiService();
  piService.warmupEngine();
  console.log('✅ V8 engine warmed up');
}

bootstrap();
