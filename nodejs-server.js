const fastify = require('fastify')({ 
    logger: false,
    bodyLimit: 10 * 1024 * 1024 // 10MB limit
});
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');

const port = 8080;

// Initialize SQLite database (in-memory like H2)
const db = new sqlite3.Database(':memory:');

// Create table
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS iot_payload (
        id TEXT PRIMARY KEY,
        content TEXT,
        ts DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

// Simulate async background work (like the Java AsyncWorker)
async function doBackgroundWork(id, payload) {
    return new Promise((resolve) => {
        // Simulate 50ms blocking I/O (same as Java version)
        setTimeout(() => {
            // In a real app, this might be:
            // - External API calls
            // - File operations
            // - Additional database operations
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
        
        // Insert into database (synchronous like the Java version)
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
        
        // Start background work (don't await - fire and forget like @Async in Java)
        doBackgroundWork(id, payload).catch(err => {
            console.error('Background work failed:', err);
        });
        
        const endTime = process.hrtime.bigint();
        const elapsedMs = Number(endTime - startTime) / 1000000; // Convert nanoseconds to milliseconds
        
        return {
            id: id,
            t_ms: Math.round(elapsedMs * 100) / 100 // Round to 2 decimal places
        };
        
    } catch (error) {
        console.error('Error processing request:', error);
        reply.code(500);
        return { error: 'Internal server error' };
    }
});

// Health check endpoint
fastify.get('/health', async (request, reply) => {
    return { status: 'ok', timestamp: new Date().toISOString() };
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    db.close((err) => {
        if (err) console.error('Error closing database:', err);
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    db.close((err) => {
        if (err) console.error('Error closing database:', err);
        process.exit(0);
    });
});

// Start server
const start = async () => {
    try {
        await fastify.listen({ port: port, host: '0.0.0.0' });
        console.log(`Fastify IoT Benchmark Server running on port ${port}`);
        console.log(`Process ID: ${process.pid}`);
        console.log(`Runtime: ${process.version || 'Bun'}`);
        console.log('Ready to receive requests...');
    } catch (err) {
        console.error('Error starting server:', err);
        process.exit(1);
    }
};

start();
