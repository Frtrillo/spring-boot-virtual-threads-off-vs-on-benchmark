import { Injectable } from '@nestjs/common';

@Injectable()
export class AsyncWorkerService {
  async doBackgroundWork(id: string, payload: Record<string, any>): Promise<void> {
    // Simulate 50ms blocking I/O (same as Java @Async version)
    return new Promise((resolve) => {
      setTimeout(() => {
        // In a real app, this might be:
        // - External API calls
        // - File operations
        // - Additional database operations
        resolve();
      }, 50);
    });
  }
}
