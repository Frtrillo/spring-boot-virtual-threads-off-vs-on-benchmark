import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';

@Injectable()
export class DatabaseBunService implements OnModuleInit, OnModuleDestroy {
  private db: any;
  private isBun: boolean = false;

  onModuleInit() {
    // Check if we're running in Bun
    this.isBun = typeof Bun !== 'undefined';
    
    if (this.isBun) {
      // Use Bun's native SQLite
      const { Database } = require('bun:sqlite');
      this.db = new Database(':memory:');
      console.log('Using Bun native SQLite');
    } else {
      // Fallback to node-sqlite3 for Node.js
      const { Database } = require('sqlite3');
      this.db = new Database(':memory:');
      console.log('Using Node.js SQLite3');
    }
    
    this.initTable();
  }

  private initTable() {
    if (this.isBun) {
      // Bun native SQLite
      this.db.exec(`CREATE TABLE IF NOT EXISTS iot_payload (
        id TEXT PRIMARY KEY,
        content TEXT,
        ts DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);
    } else {
      // Node.js SQLite3
      this.db.serialize(() => {
        this.db.run(`CREATE TABLE IF NOT EXISTS iot_payload (
          id TEXT PRIMARY KEY,
          content TEXT,
          ts DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
      });
    }
  }

  onModuleDestroy() {
    if (this.db) {
      this.db.close();
    }
  }

  async insertPayload(id: string, content: string): Promise<void> {
    if (this.isBun) {
      // Bun native SQLite - Just use it synchronously but return a Promise
      // The key insight: don't try to make sync operations async artificially
      try {
        const stmt = this.db.prepare('INSERT INTO iot_payload (id, content, ts) VALUES (?, ?, datetime("now"))');
        stmt.run(id, content);
        return Promise.resolve();
      } catch (err) {
        return Promise.reject(err);
      }
    } else {
      // Node.js SQLite3 - asynchronous
      return new Promise((resolve, reject) => {
        this.db.run(
          'INSERT INTO iot_payload (id, content, ts) VALUES (?, ?, datetime("now"))',
          [id, content],
          function(err: any) {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    }
  }
}
