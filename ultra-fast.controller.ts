import { Controller, Post, Body, Get, Res, Req } from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';

// Ultra-fast SQLite setup
let db: any;
let insertStmt: any;
let isBun = false;
let counter = 0;

// Initialize database on module load
if (typeof Bun !== 'undefined') {
    isBun = true;
    const { Database } = require('bun:sqlite');
    db = new Database(':memory:');
    
    // Create table
    db.exec(`CREATE TABLE iot_payload (
        id TEXT PRIMARY KEY,
        content TEXT,
        ts INTEGER
    )`);
    
    // Pre-prepare statement for maximum speed
    insertStmt = db.prepare('INSERT INTO iot_payload (id, content, ts) VALUES (?, ?, ?)');
    console.log('Ultra-Fast: Using Bun native SQLite');
} else {
    const sqlite3 = require('sqlite3').verbose();
    db = new sqlite3.Database(':memory:');
    
    db.serialize(() => {
        db.run(`CREATE TABLE iot_payload (
            id TEXT PRIMARY KEY,
            content TEXT,
            ts INTEGER
        )`);
    });
    console.log('Ultra-Fast: Using Node.js SQLite3');
}

// Pre-allocated objects to avoid GC pressure
const responseTemplate = { id: '', t_ms: 0 };
const healthTemplate = { status: 'ok', timestamp: '', runtime: '', count: 0 };

@Controller()
export class UltraFastController {

  @Post('ingest')
  async ingest(
    @Body() payload: any,
    @Req() request: FastifyRequest,
    @Res() reply: FastifyReply
  ) {
    const start = process.hrtime.bigint();
    
    try {
      // Ultra-fast ID generation
      const id = `id_${++counter}_${Date.now()}`;
      const content = JSON.stringify(payload);
      const timestamp = Date.now();
      
      // Ultra-fast database insert
      if (isBun) {
        // Bun native SQLite - should be ultra fast
        insertStmt.run(id, content, timestamp);
      } else {
        // Node.js SQLite3 - async but optimized
        await new Promise<void>((resolve, reject) => {
          db.run(
            'INSERT INTO iot_payload (id, content, ts) VALUES (?, ?, ?)',
            [id, content, timestamp],
            function(err: any) {
              if (err) reject(err);
              else resolve();
            }
          );
        });
      }
      
      // No background processing - just return immediately
      const end = process.hrtime.bigint();
      const elapsed = Number(end - start) / 1000000;
      
      // Reuse object to avoid allocation
      responseTemplate.id = id;
      responseTemplate.t_ms = Math.round(elapsed * 100) / 100;
      
      reply.send(responseTemplate);
      
    } catch (error) {
      console.error('Error:', error);
      reply.code(500).send({ error: 'Internal error' });
    }
  }

  @Get('health')
  health(@Res() reply: FastifyReply) {
    // Reuse object to avoid allocation
    healthTemplate.timestamp = new Date().toISOString();
    healthTemplate.runtime = typeof Bun !== 'undefined' ? `Bun ${Bun.version}` : `Node.js ${process.version}`;
    healthTemplate.count = counter;
    
    reply.send(healthTemplate);
  }
}
