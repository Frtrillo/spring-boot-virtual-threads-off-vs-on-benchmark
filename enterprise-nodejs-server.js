const fastify = require('fastify')({ logger: true });
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const { v4: uuidv4 } = require('uuid');

// In-memory SQLite database (equivalent to Spring Boot's H2)
const db = new sqlite3.Database(':memory:');

// Initialize database tables (equivalent to Spring Boot's schema)
db.serialize(() => {
    db.run(`
        CREATE TABLE enterprise_devices (
            id TEXT PRIMARY KEY,
            device_type TEXT,
            location TEXT,
            last_seen DATETIME,
            status TEXT
        )
    `);
    
    db.run(`
        CREATE TABLE enterprise_events (
            id TEXT PRIMARY KEY,
            device_id TEXT,
            event_type TEXT,
            payload TEXT,
            processed_at DATETIME,
            risk_score REAL,
            FOREIGN KEY (device_id) REFERENCES enterprise_devices(id)
        )
    `);
    
    db.run(`
        CREATE TABLE enterprise_audit (
            id TEXT PRIMARY KEY,
            event_id TEXT,
            validation_result TEXT,
            compliance_status TEXT,
            audit_timestamp DATETIME,
            FOREIGN KEY (event_id) REFERENCES enterprise_events(id)
        )
    `);
});

// Temp directory for file operations
const tempDir = path.join(__dirname, 'temp-enterprise');
fs.mkdir(tempDir, { recursive: true }).catch(() => {});

// Cache for device data (simple in-memory cache)
const deviceCache = new Map();

/**
 * Enterprise processing endpoint - equivalent to Spring Boot's EnterpriseController
 * This workload is challenging for Node.js single-threaded architecture:
 * 1. Multiple sequential database operations
 * 2. File I/O operations (blocking in Node.js)
 * 3. Network I/O operations (but Node.js handles these well)
 * 4. Complex business logic
 */
fastify.post('/enterprise/process', async (request, reply) => {
    const start = process.hrtime.bigint();
    
    try {
        const payload = request.body;
        const eventId = uuidv4();
        const deviceId = extractOrGenerateDeviceId(payload);
        
        // Step 1: Device registration/update (Database I/O)
        await upsertDevice(deviceId, payload);
        
        // Step 2: Event storage (Database I/O)
        const riskScore = await storeEvent(eventId, deviceId, payload);
        
        // Step 3: File I/O operations (Blocking I/O - challenging for Node.js)
        const fileReport = await generateFileReport(eventId, payload);
        
        // Step 4: External API validation (Network I/O - Node.js handles well)
        const validationResult = await performExternalValidation(payload);
        
        // Step 5: Compliance check (Database I/O with complex queries)
        const complianceStatus = await performComplianceCheck(deviceId, riskScore);
        
        // Step 6: Audit logging (Database I/O)
        await auditTransaction(eventId, validationResult, complianceStatus);
        
        // Step 7: Cache warming
        await warmupDeviceCache(deviceId);
        
        const elapsedNanos = process.hrtime.bigint() - start;
        const elapsedMs = Number(elapsedNanos) / 1_000_000;
        
        const response = {
            id: eventId,
            status: "PROCESSED",
            processed_records: 7,
            validation_score: validationResult,
            risk_assessment: riskScore,
            compliance_check: complianceStatus,
            processing_time_ms: Math.round(elapsedMs * 100) / 100,
            thread_info: `Node.js ${process.version} PID:${process.pid}`
        };
        
        return response;
        
    } catch (error) {
        const elapsedNanos = process.hrtime.bigint() - start;
        const elapsedMs = Number(elapsedNanos) / 1_000_000;
        
        return reply.status(500).send({
            error: "Enterprise processing failed",
            message: error.message,
            processing_time_ms: Math.round(elapsedMs * 100) / 100
        });
    }
});

fastify.get('/enterprise/health', async (request, reply) => {
    return {
        status: "ok",
        timestamp: new Date(),
        runtime: "Node.js Enterprise",
        virtual_threads: false,
        active_threads: 1,
        memory_usage: process.memoryUsage()
    };
});

function extractOrGenerateDeviceId(payload) {
    return payload.device_id || `device_${uuidv4().substring(0, 8)}`;
}

function upsertDevice(deviceId, payload) {
    return new Promise((resolve, reject) => {
        // Check if device exists
        db.get("SELECT COUNT(*) as count FROM enterprise_devices WHERE id = ?", [deviceId], (err, row) => {
            if (err) return reject(err);
            
            if (row.count === 0) {
                // Insert new device
                db.run(`
                    INSERT INTO enterprise_devices (id, device_type, location, last_seen, status)
                    VALUES (?, ?, ?, datetime('now'), 'ACTIVE')
                `, [
                    deviceId,
                    payload.type || 'SENSOR',
                    payload.location || 'UNKNOWN'
                ], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            } else {
                // Update existing device
                db.run(`
                    UPDATE enterprise_devices 
                    SET last_seen = datetime('now'), status = 'ACTIVE' 
                    WHERE id = ?
                `, [deviceId], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            }
        });
    });
}

function storeEvent(eventId, deviceId, payload) {
    return new Promise((resolve, reject) => {
        const riskScore = calculateRiskScore(payload);
        
        db.run(`
            INSERT INTO enterprise_events (id, device_id, event_type, payload, processed_at, risk_score)
            VALUES (?, ?, ?, ?, datetime('now'), ?)
        `, [eventId, deviceId, 'IOT_DATA', JSON.stringify(payload), riskScore], (err) => {
            if (err) reject(err);
            else resolve(riskScore);
        });
    });
}

function calculateRiskScore(payload) {
    let score = 0;
    for (const value of Object.values(payload)) {
        if (typeof value === 'string') {
            score += value.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 100;
        }
    }
    return (score % 1000) / 10.0; // 0-100 range
}

/**
 * File I/O operations - this is where Node.js struggles compared to Virtual Threads
 * Node.js has to use async/await but still blocks the event loop for file operations
 */
async function generateFileReport(eventId, payload) {
    try {
        const reportFile = path.join(tempDir, `report_${eventId}.txt`);
        
        let report = "=== Enterprise IoT Event Report ===\n";
        report += `Event ID: ${eventId}\n`;
        report += `Timestamp: ${new Date()}\n`;
        report += `Thread: Node.js Single Thread\n`;
        report += `Payload Fields: ${Object.keys(payload).length}\n`;
        
        // Add processing details
        for (const [key, value] of Object.entries(payload)) {
            const valueStr = value.toString().substring(0, Math.min(50, value.toString().length));
            report += `- ${key}: ${valueStr}\n`;
        }
        
        // Write to file (blocking I/O operation)
        await fs.writeFile(reportFile, report);
        
        // Read back for validation (more I/O)
        const content = await fs.readFile(reportFile, 'utf8');
        
        // Cleanup
        await fs.unlink(reportFile).catch(() => {});
        
        return "REPORT_GENERATED";
        
    } catch (error) {
        return "REPORT_FAILED";
    }
}

/**
 * External API validation - Node.js handles this reasonably well
 */
function performExternalValidation(payload) {
    return new Promise((resolve) => {
        const jsonPayload = JSON.stringify({
            validation_request: `${Object.keys(payload).length}_fields`
        });
        
        // Try real HTTP request first, fallback to simulation
        const options = {
            hostname: 'httpbin.org',
            path: '/delay/1',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(jsonPayload)
            },
            timeout: 3000
        };
        
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                resolve(res.statusCode === 200 ? 'VALIDATED' : 'VALIDATION_FAILED');
            });
        });
        
        req.on('error', () => {
            // Fallback simulation
            setTimeout(() => resolve('VALIDATION_TIMEOUT'), 100);
        });
        
        req.on('timeout', () => {
            req.destroy();
            resolve('VALIDATION_TIMEOUT');
        });
        
        req.write(jsonPayload);
        req.end();
    });
}

function performComplianceCheck(deviceId, riskScore) {
    return new Promise((resolve, reject) => {
        // Complex database query with joins
        db.all(`
            SELECT e.risk_score, e.processed_at, d.device_type 
            FROM enterprise_events e 
            JOIN enterprise_devices d ON e.device_id = d.id 
            WHERE e.device_id = ? 
            ORDER BY e.processed_at DESC 
            LIMIT 10
        `, [deviceId], (err, rows) => {
            if (err) return reject(err);
            
            // Business logic for compliance
            if (rows.length > 5 && riskScore > 50.0) {
                resolve('NON_COMPLIANT');
            } else if (riskScore > 80.0) {
                resolve('HIGH_RISK');
            } else {
                resolve('COMPLIANT');
            }
        });
    });
}

function auditTransaction(eventId, validationResult, complianceStatus) {
    return new Promise((resolve, reject) => {
        db.run(`
            INSERT INTO enterprise_audit (id, event_id, validation_result, compliance_status, audit_timestamp)
            VALUES (?, ?, ?, ?, datetime('now'))
        `, [uuidv4(), eventId, validationResult, complianceStatus], (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

async function warmupDeviceCache(deviceId) {
    return new Promise((resolve, reject) => {
        if (deviceCache.has(deviceId)) {
            return resolve();
        }
        
        db.all(`
            SELECT * FROM enterprise_devices d 
            LEFT JOIN enterprise_events e ON d.id = e.device_id 
            WHERE d.id = ? 
            ORDER BY e.processed_at DESC 
            LIMIT 5
        `, [deviceId], (err, rows) => {
            if (err) return reject(err);
            
            deviceCache.set(deviceId, rows);
            resolve();
        });
    });
}

const start = async () => {
    try {
        await fastify.listen({ port: 8080, host: '0.0.0.0' });
        console.log('🚀 Enterprise Node.js server listening on port 8080');
        console.log('📊 This workload favors Spring Boot + Virtual Threads');
        console.log('🔄 Multiple sequential I/O operations challenge Node.js single thread');
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();

