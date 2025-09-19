const fastify = require('fastify')({ 
    logger: false,
    bodyLimit: 10 * 1024 * 1024
});
const { v4: uuidv4 } = require('uuid');

const port = 8080;

// Simple in-memory storage (no SQLite)
const payloads = new Map();

// Simulate async background work
async function doBackgroundWork(id, payload) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, 50);
    });
}

// Ingest endpoint - NO DATABASE
fastify.post('/ingest', async (request, reply) => {
    const startTime = process.hrtime.bigint();
    
    try {
        const id = uuidv4();
        const payload = request.body;
        
        // Store in memory instead of database
        payloads.set(id, {
            content: JSON.stringify(payload),
            timestamp: new Date().toISOString()
        });
        
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
        payloads_count: payloads.size
    };
});

// Start server
const start = async () => {
    try {
        await fastify.listen({ port: port, host: '0.0.0.0' });
        console.log(`Simple Fastify Server (NO DB) running on port ${port}`);
        console.log(`Process ID: ${process.pid}`);
        console.log(`Runtime: ${process.version || 'Bun'}`);
        console.log('Ready to receive requests...');
    } catch (err) {
        console.error('Error starting server:', err);
        process.exit(1);
    }
};

start();
