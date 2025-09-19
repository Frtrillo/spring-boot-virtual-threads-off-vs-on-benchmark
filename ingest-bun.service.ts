import { Injectable } from '@nestjs/common';
import { DatabaseBunService } from './database-bun.service';
import { AsyncWorkerService } from './async-worker.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class IngestBunService {
  constructor(
    private readonly databaseService: DatabaseBunService,
    private readonly asyncWorkerService: AsyncWorkerService,
  ) {}

  async process(payload: Record<string, any>): Promise<string> {
    const id = uuidv4();
    const content = JSON.stringify(payload);
    
    // Insert into database (will use Bun native SQLite if available)
    await this.databaseService.insertPayload(id, content);
    
    // Start background work (fire and forget like @Async in Java)
    this.asyncWorkerService.doBackgroundWork(id, payload).catch(err => {
      console.error('Background work failed:', err);
    });
    
    return id;
  }
}
