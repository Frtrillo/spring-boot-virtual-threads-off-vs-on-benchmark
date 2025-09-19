import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Database } from 'sqlite3';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private db: Database;

  onModuleInit() {
    this.db = new Database(':memory:');
    
    // Initialize table (like the Java version)
    this.db.serialize(() => {
      this.db.run(`CREATE TABLE IF NOT EXISTS iot_payload (
        id TEXT PRIMARY KEY,
        content TEXT,
        ts DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);
    });
  }

  onModuleDestroy() {
    if (this.db) {
      this.db.close();
    }
  }

  async insertPayload(id: string, content: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO iot_payload (id, content, ts) VALUES (?, ?, datetime("now"))',
        [id, content],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }
}
