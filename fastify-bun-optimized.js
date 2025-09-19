const fastify = require('fastify')({ 
    logger: false,
    bodyLimit: 10 * 1024 * 1024
});
const { v4: uuidv4 } = require('uuid');

const port = 8080;

// Use Bun's native SQLite if available
let db, insertStmt, isBun = false;

if (typeof Bun !== 'undefined') {
    isBun = true;
    const { Database } = require('bun:sqlite');
    db = new Database(':memory:');
    console.log('Using Bun native SQLite');
    
    // Initialize table
    db.exec(`CREATE TABLE IF NOT EXISTS iot_payload (
        id TEXT PRIMARY KEY,
        content TEXT,
        ts DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    // Pre-prepare statement
    insertStmt = db.prepare('INSERT INTO iot_payload (id, content, ts) VALUES (?, ?, datetime("now"))');
} else {
    const sqlite3 = require('sqlite3').verbose();
    db = new sqlite3.Database(':memory:');
    console.log('Using Node.js SQLite3');
    
    db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS iot_payload (
            id TEXT PRIMARY KEY,
            content TEXT,
            ts DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
    });
}

// Simulate async background work
async function doBackgroundWork(id, payload) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, 50);
    });
}

// Ingest endpoint
fastify.post('/ingest', async (request, reply) => {
    const startTime = process.hrtime.bigint();
    
    try {
        const id = uuidv4();
        const payload = request.body;
        const content = JSON.stringify(payload);
        
        // Insert into database
        if (isBun) {
            // Bun native - use pre-prepared statement
            insertStmt.run(id, content);
        } else {
            // Node.js - async
            await new Promise((resolve, reject) => {
                db.run(
                    'INSERT INTO iot_payload (id, content, ts) VALUES (?, ?, datetime("now"))',
                    [id, content],
                    function(err) {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });
        }
        
        // Start background work (fire and forget)
        doBackgroundWork(id, payload).catch(err => {
            console.error('Background work failed:', err);
        });
        
        const endTime = process.hrtime.bigint();
        const elapsedMs = Number(endTime - startTime) / 1000000;
        
        return {
            id: id,
            t_ms: Math.round(elapsedMs * 100) / 100
        };
        
    } catch (error) {
        console.error('Error processing request:', error);
        reply.code(500);
        return { error: 'Internal server error' };
    }
});

// Health check endpoint
fastify.get('/health', async (request, reply) => {
    return { 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        runtime: typeof Bun !== 'undefined' ? `Bun ${Bun.version}` : `Node.js ${process.version}`
    };
});

// Start server
const start = async () => {
    try {
        await fastify.listen({ port: port, host: '0.0.0.0' });
        console.log(`Fastify + Bun Optimized Server running on port ${port}`);
        console.log(`Process ID: ${process.pid}`);
        console.log(`Runtime: ${process.version || 'Bun'}`);
        console.log('Ready to receive requests...');
    } catch (err) {
        console.error('Error starting server:', err);
        process.exit(1);
    }
};

start();
