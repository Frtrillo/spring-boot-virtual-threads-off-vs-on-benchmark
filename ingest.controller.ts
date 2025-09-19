import { Controller, Post, Body, Get } from '@nestjs/common';
import { IngestService } from './ingest.service';

export interface IngestResponse {
  id: string;
  t_ms: number;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
}

@Controller()
export class IngestController {
  constructor(private readonly ingestService: IngestService) {}

  @Post('ingest')
  async ingest(@Body() payload: Record<string, any>): Promise<IngestResponse> {
    const startTime = process.hrtime.bigint();
    
    const id = await this.ingestService.process(payload);
    
    const endTime = process.hrtime.bigint();
    const elapsedMs = Number(endTime - startTime) / 1000000; // Convert nanoseconds to milliseconds
    
    return {
      id,
      t_ms: Math.round(elapsedMs * 100) / 100 // Round to 2 decimal places
    };
  }

  @Get('health')
  getHealth(): HealthResponse {
    return {
      status: 'ok',
      timestamp: new Date().toISOString()
    };
  }
}
