import { Injectable } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { AsyncWorkerService } from './async-worker.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class IngestService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly asyncWorkerService: AsyncWorkerService,
  ) {}

  async process(payload: Record<string, any>): Promise<string> {
    const id = uuidv4();
    const content = JSON.stringify(payload);
    
    // Insert into database (synchronous like the Java version)
    await this.databaseService.insertPayload(id, content);
    
    // Start background work (fire and forget like @Async in Java)
    this.asyncWorkerService.doBackgroundWork(id, payload).catch(err => {
      console.error('Background work failed:', err);
    });
    
    return id;
  }
}
