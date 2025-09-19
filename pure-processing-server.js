// Pure processing server - no database, just like your successful benchmark
const fastify = require('fastify')({ 
    logger: false,
    bodyLimit: 10 * 1024 * 1024
});
const { v4: uuidv4 } = require('uuid');

const port = 8080;

// In-memory storage like your benchmark
const processedPayloads = new Map();
let totalProcessed = 0;

// FNV-1a hash like in your benchmark
function fnv1aHash(data) {
    let hash = 2166136261;
    for (let i = 0; i < data.length; i++) {
        hash ^= data.charCodeAt(i);
        hash = (hash * 16777619) >>> 0;
    }
    return hash;
}

// Processing function similar to your MQTT benchmark
function processPayload(payload) {
    // 1. JSON validation (already parsed by Fastify)
    const requiredFields = ['deviceId', 'temperature', 'humidity', 'status'];
    for (const field of requiredFields) {
        if (!(field in payload)) {
            throw new Error(`Missing required field: ${field}`);
        }
    }
    
    // 2. Data enrichment
    const isAlarm = payload.temperature > 30 || payload.status === 'error';
    
    // 3. Aggregation
    const deviceId = payload.deviceId;
    if (!processedPayloads.has(deviceId)) {
        processedPayloads.set(deviceId, { count: 0, lastSeen: Date.now() });
    }
    const deviceData = processedPayloads.get(deviceId);
    deviceData.count++;
    deviceData.lastSeen = Date.now();
    
    // 4. Checksum calculation
    const payloadStr = JSON.stringify(payload);
    const checksum = fnv1aHash(payloadStr);
    
    totalProcessed++;
    
    return {
        processed: true,
        deviceId,
        isAlarm,
        checksum,
        totalProcessed
    };
}

// Simulate background work (CPU intensive like your algorithmic benchmark)
function simulateWork() {
    // Monte Carlo style computation like your benchmark
    let sum = 0;
    for (let i = 0; i < 1000; i++) {
        sum += Math.sin(i) * Math.cos(i) * Math.exp(i / 1000);
    }
    return sum;
}

// Ingest endpoint - pure processing, no I/O
fastify.post('/ingest', async (request, reply) => {
    const startTime = process.hrtime.bigint();
    
    try {
        const id = uuidv4();
        const payload = request.body;
        
        // Pure processing like your benchmark
        const result = processPayload(payload);
        
        // Background CPU work (non-blocking)
        setImmediate(() => {
            simulateWork();
        });
        
        const endTime = process.hrtime.bigint();
        const elapsedMs = Number(endTime - startTime) / 1000000;
        
        return {
            id,
            t_ms: Math.round(elapsedMs * 100) / 100,
            ...result
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
        runtime: typeof Bun !== 'undefined' ? `Bun ${Bun.version}` : `Node.js ${process.version}`,
        totalProcessed,
        uniqueDevices: processedPayloads.size
    };
});

// Start server
const start = async () => {
    try {
        await fastify.listen({ port: port, host: '0.0.0.0' });
        console.log(`Pure Processing Server running on port ${port}`);
        console.log(`Process ID: ${process.pid}`);
        console.log(`Runtime: ${typeof Bun !== 'undefined' ? `Bun ${Bun.version}` : process.version}`);
        console.log('Ready to receive requests...');
    } catch (err) {
        console.error('Error starting server:', err);
        process.exit(1);
    }
};

start();
