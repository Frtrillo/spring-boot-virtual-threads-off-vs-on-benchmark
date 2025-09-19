const fastify = require('fastify')({ 
    logger: false,
    bodyLimit: 10 * 1024 * 1024
});
const { v4: uuidv4 } = require('uuid');

const port = 8080;

// Use Bun's native SQLite if available, otherwise node-sqlite3
let db, insertStmt, isBun = false;

if (typeof Bun !== 'undefined') {
    isBun = true;
    const { Database } = require('bun:sqlite');
    db = new Database(':memory:');
    
    // Initialize table
    db.exec(`CREATE TABLE IF NOT EXISTS iot_payload (
        id TEXT PRIMARY KEY,
        content TEXT,
        ts DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    // Pre-prepare statement
    insertStmt = db.prepare('INSERT INTO iot_payload (id, content, ts) VALUES (?, ?, datetime("now"))');
    console.log('Using Bun native SQLite');
} else {
    const sqlite3 = require('sqlite3').verbose();
    db = new sqlite3.Database(':memory:');
    
    db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS iot_payload (
            id TEXT PRIMARY KEY,
            content TEXT,
            ts DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
    });
    console.log('Using Node.js SQLite3');
}

// Realistic IoT processing functions (no artificial sleep!)
function validateAndEnrichPayload(payload) {
    // 1. Data validation and enrichment (like Java version)
    for (const [key, value] of Object.entries(payload)) {
        // Data type validation
        if (typeof value === 'string' && value.length > 100) {
            throw new Error(`Field ${key} too long`);
        }
    }
    
    // Add enrichment fields
    payload.processed_at = Date.now();
    payload.processor_id = process.pid;
    
    return payload;
}

function calculateDeviceMetrics(payload) {
    // 2. Simulate realistic metric calculations
    let sum = 0;
    let count = 0;
    
    for (const value of Object.values(payload)) {
        if (typeof value === 'string') {
            // Simple hash calculation
            let hash = 0;
            for (let i = 0; i < value.length; i++) {
                const char = value.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Convert to 32-bit integer
            }
            sum += hash;
            count++;
        }
    }
    
    if (count > 0) {
        payload.avg_hash = sum / count;
        payload.field_count = count;
    }
    
    return payload;
}

function calculateRiskScore(payload) {
    // 3. Monte Carlo style risk calculation (CPU intensive like your benchmark)
    let risk = 0.0;
    const iterations = 1000; // Realistic computation load
    
    for (let i = 0; i < iterations; i++) {
        const x = Math.random();
        const y = Math.random();
        
        // Environmental stress calculation
        const temp = 20 + (x * 40); // 20-60°C range
        const humidity = y * 100;   // 0-100% range
        
        // Risk formula (similar to your benchmark)
        const stress = Math.sin(temp * Math.PI / 180) * Math.cos(humidity * Math.PI / 180);
        risk += Math.exp(-stress * stress);
    }
    
    return risk / iterations;
}

function logProcessingResult(id, riskScore) {
    // 4. Simulate realistic logging (minimal I/O)
    if (riskScore > 0.5) {
        console.log(`HIGH RISK detected for device ${id}: ${riskScore}`);
    }
}

// Realistic background work (CPU intensive, no sleep!)
async function doRealisticBackgroundWork(id, payload) {
    // Process in next tick to not block the main request
    return new Promise((resolve) => {
        setImmediate(() => {
            try {
                // 1. Data validation and enrichment
                validateAndEnrichPayload(payload);
                
                // 2. Calculate device metrics
                calculateDeviceMetrics(payload);
                
                // 3. Risk assessment computation
                const riskScore = calculateRiskScore(payload);
                
                // 4. Log processing result
                logProcessingResult(id, riskScore);
                
                resolve();
            } catch (error) {
                console.error('Error processing payload', id, ':', error.message);
                resolve(); // Don't fail the request
            }
        });
    });
}

// Ingest endpoint - realistic IoT processing
fastify.post('/ingest', async (request, reply) => {
    const startTime = process.hrtime.bigint();
    
    try {
        const id = uuidv4();
        const payload = request.body;
        const content = JSON.stringify(payload);
        
        // Insert into database (fast operation)
        if (isBun) {
            // Bun native - pre-prepared statement
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
        
        // Start realistic background work (fire and forget)
        doRealisticBackgroundWork(id, { ...payload }).catch(err => {
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
        runtime: typeof Bun !== 'undefined' ? `Bun ${Bun.version}` : `Node.js ${process.version}`,
        totalProcessed: totalProcessed
    };
});

// Start server
const start = async () => {
    try {
        await fastify.listen({ port: port, host: '0.0.0.0' });
        console.log(`Realistic IoT Server running on port ${port}`);
        console.log(`Process ID: ${process.pid}`);
        console.log(`Runtime: ${typeof Bun !== 'undefined' ? `Bun ${Bun.version}` : process.version}`);
        console.log('Ready to receive requests...');
    } catch (err) {
        console.error('Error starting server:', err);
        process.exit(1);
    }
};

let totalProcessed = 0;
start();
