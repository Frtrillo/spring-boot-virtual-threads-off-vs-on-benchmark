import { Database } from "bun:sqlite";
import { serve } from "bun";
import { writeFile, readFile, unlink, mkdir } from "fs/promises";
import { join } from "path";

// In-memory SQLite database (equivalent to Spring Boot's H2)
const db = new Database(":memory:");

// Initialize database tables (equivalent to Spring Boot's schema)
db.exec(`
    CREATE TABLE enterprise_devices (
        id TEXT PRIMARY KEY,
        device_type TEXT,
        location TEXT,
        last_seen DATETIME,
        status TEXT
    );
    
    CREATE TABLE enterprise_events (
        id TEXT PRIMARY KEY,
        device_id TEXT,
        event_type TEXT,
        payload TEXT,
        processed_at DATETIME,
        risk_score REAL,
        FOREIGN KEY (device_id) REFERENCES enterprise_devices(id)
    );
    
    CREATE TABLE enterprise_audit (
        id TEXT PRIMARY KEY,
        event_id TEXT,
        validation_result TEXT,
        compliance_status TEXT,
        audit_timestamp DATETIME,
        FOREIGN KEY (event_id) REFERENCES enterprise_events(id)
    );
`);

// Prepared statements for better performance (like Spring Boot's JdbcTemplate)
const checkDeviceStmt = db.prepare("SELECT COUNT(*) as count FROM enterprise_devices WHERE id = ?");
const insertDeviceStmt = db.prepare(`
    INSERT INTO enterprise_devices (id, device_type, location, last_seen, status)
    VALUES (?, ?, ?, datetime('now'), 'ACTIVE')
`);
const updateDeviceStmt = db.prepare(`
    UPDATE enterprise_devices 
    SET last_seen = datetime('now'), status = 'ACTIVE' 
    WHERE id = ?
`);
const insertEventStmt = db.prepare(`
    INSERT INTO enterprise_events (id, device_id, event_type, payload, processed_at, risk_score)
    VALUES (?, ?, ?, ?, datetime('now'), ?)
`);
const complianceCheckStmt = db.prepare(`
    SELECT e.risk_score, e.processed_at, d.device_type 
    FROM enterprise_events e 
    JOIN enterprise_devices d ON e.device_id = d.id 
    WHERE e.device_id = ? 
    ORDER BY e.processed_at DESC 
    LIMIT 10
`);
const insertAuditStmt = db.prepare(`
    INSERT INTO enterprise_audit (id, event_id, validation_result, compliance_status, audit_timestamp)
    VALUES (?, ?, ?, ?, datetime('now'))
`);
const cacheQueryStmt = db.prepare(`
    SELECT * FROM enterprise_devices d 
    LEFT JOIN enterprise_events e ON d.id = e.device_id 
    WHERE d.id = ? 
    ORDER BY e.processed_at DESC 
    LIMIT 5
`);

// Temp directory for file operations
const tempDir = join(import.meta.dir, 'temp-enterprise-bun');
await mkdir(tempDir, { recursive: true }).catch(() => {});

// Cache for device data (simple in-memory cache)
const deviceCache = new Map();

/**
 * Enterprise processing endpoint - equivalent to Spring Boot's EnterpriseController
 * This workload is designed to challenge all runtimes fairly:
 * 1. Multiple sequential database operations (Bun's native SQLite advantage)
 * 2. File I/O operations (where Virtual Threads excel)
 * 3. Network I/O operations (where all async runtimes do well)
 * 4. Complex business logic (CPU work)
 */
const server = serve({
    port: 8080,
    async fetch(req) {
        const url = new URL(req.url);
        
        if (req.method === "POST" && url.pathname === "/enterprise/process") {
            const start = Bun.nanoseconds();
            
            try {
                const payload = await req.json();
                const eventId = crypto.randomUUID();
                const deviceId = extractOrGenerateDeviceId(payload);
                
                // Step 1: Device registration/update (Database I/O - Bun native SQLite advantage)
                await upsertDevice(deviceId, payload);
                
                // Step 2: Event storage (Database I/O - Bun advantage)
                const riskScore = await storeEvent(eventId, deviceId, payload);
                
                // Step 3: File I/O operations (Where Virtual Threads should excel)
                const fileReport = await generateFileReport(eventId, payload);
                
                // Step 4: External API validation (Network I/O - all async runtimes handle well)
                const validationResult = await performExternalValidation(payload);
                
                // Step 5: Compliance check (Complex database query - Bun advantage)
                const complianceStatus = await performComplianceCheck(deviceId, riskScore);
                
                // Step 6: Audit logging (Database I/O - Bun advantage)
                await auditTransaction(eventId, validationResult, complianceStatus);
                
                // Step 7: Cache warming (Database + memory operations)
                await warmupDeviceCache(deviceId);
                
                const elapsedNanos = Bun.nanoseconds() - start;
                const elapsedMs = elapsedNanos / 1_000_000;
                
                const response = {
                    id: eventId,
                    status: "PROCESSED",
                    processed_records: 7,
                    validation_score: validationResult,
                    risk_assessment: riskScore,
                    compliance_check: complianceStatus,
                    processing_time_ms: Math.round(elapsedMs * 100) / 100,
                    thread_info: `Bun ${Bun.version} - Single Thread`
                };
                
                return new Response(JSON.stringify(response), {
                    headers: { "Content-Type": "application/json" }
                });
                
            } catch (error) {
                const elapsedNanos = Bun.nanoseconds() - start;
                const elapsedMs = elapsedNanos / 1_000_000;
                
                return new Response(JSON.stringify({
                    error: "Enterprise processing failed",
                    message: error.message,
                    processing_time_ms: Math.round(elapsedMs * 100) / 100
                }), {
                    status: 500,
                    headers: { "Content-Type": "application/json" }
                });
            }
        }
        
        if (req.method === "GET" && url.pathname === "/enterprise/health") {
            return new Response(JSON.stringify({
                status: "ok",
                timestamp: new Date(),
                runtime: "Bun Enterprise",
                virtual_threads: false,
                active_threads: 1,
                memory_usage: process.memoryUsage()
            }), {
                headers: { "Content-Type": "application/json" }
            });
        }
        
        return new Response("Not Found", { status: 404 });
    }
});

function extractOrGenerateDeviceId(payload: any): string {
    return payload.device_id || `device_${crypto.randomUUID().substring(0, 8)}`;
}

async function upsertDevice(deviceId: string, payload: any): Promise<void> {
    const result = checkDeviceStmt.get(deviceId) as { count: number };
    
    if (result.count === 0) {
        // Insert new device
        insertDeviceStmt.run(
            deviceId,
            payload.type || 'SENSOR',
            payload.location || 'UNKNOWN'
        );
    } else {
        // Update existing device
        updateDeviceStmt.run(deviceId);
    }
}

async function storeEvent(eventId: string, deviceId: string, payload: any): Promise<number> {
    const riskScore = calculateRiskScore(payload);
    
    insertEventStmt.run(eventId, deviceId, 'IOT_DATA', JSON.stringify(payload), riskScore);
    
    return riskScore;
}

function calculateRiskScore(payload: any): number {
    let score = 0;
    for (const value of Object.values(payload)) {
        if (typeof value === 'string') {
            score += value.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 100;
        }
    }
    return (score % 1000) / 10.0; // 0-100 range
}

/**
 * File I/O operations - this is where Virtual Threads should have an advantage
 * Bun handles file I/O well but Virtual Threads can handle many concurrent file operations
 */
async function generateFileReport(eventId: string, payload: any): Promise<string> {
    try {
        const reportFile = join(tempDir, `report_${eventId}.txt`);
        
        let report = "=== Enterprise IoT Event Report ===\n";
        report += `Event ID: ${eventId}\n`;
        report += `Timestamp: ${new Date()}\n`;
        report += `Thread: Bun Single Thread\n`;
        report += `Payload Fields: ${Object.keys(payload).length}\n`;
        
        // Add processing details
        for (const [key, value] of Object.entries(payload)) {
            const valueStr = value.toString().substring(0, Math.min(50, value.toString().length));
            report += `- ${key}: ${valueStr}\n`;
        }
        
        // Write to file (I/O operation)
        await writeFile(reportFile, report);
        
        // Read back for validation (more I/O)
        const content = await readFile(reportFile, 'utf8');
        
        // Cleanup
        await unlink(reportFile).catch(() => {});
        
        return "REPORT_GENERATED";
        
    } catch (error) {
        return "REPORT_FAILED";
    }
}

/**
 * External API validation - all async runtimes handle network I/O well
 */
async function performExternalValidation(payload: any): Promise<string> {
    try {
        const jsonPayload = JSON.stringify({
            validation_request: `${Object.keys(payload).length}_fields`
        });
        
        // Try real HTTP request first
        const response = await fetch('https://httpbin.org/delay/1', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: jsonPayload,
            signal: AbortSignal.timeout(3000)
        });
        
        return response.ok ? 'VALIDATED' : 'VALIDATION_FAILED';
        
    } catch (error) {
        // Fallback simulation
        await Bun.sleep(100); // Minimal delay to simulate network
        return 'VALIDATION_TIMEOUT';
    }
}

async function performComplianceCheck(deviceId: string, riskScore: number): Promise<string> {
    // Complex database query with joins (Bun's native SQLite advantage)
    const rows = complianceCheckStmt.all(deviceId) as Array<{
        risk_score: number;
        processed_at: string;
        device_type: string;
    }>;
    
    // Business logic for compliance
    if (rows.length > 5 && riskScore > 50.0) {
        return 'NON_COMPLIANT';
    } else if (riskScore > 80.0) {
        return 'HIGH_RISK';
    } else {
        return 'COMPLIANT';
    }
}

async function auditTransaction(eventId: string, validationResult: string, complianceStatus: string): Promise<void> {
    insertAuditStmt.run(crypto.randomUUID(), eventId, validationResult, complianceStatus);
}

async function warmupDeviceCache(deviceId: string): Promise<void> {
    if (deviceCache.has(deviceId)) {
        return;
    }
    
    const rows = cacheQueryStmt.all(deviceId);
    deviceCache.set(deviceId, rows);
}

console.log('🚀 Enterprise Bun server listening on port 8080');
console.log('📊 This workload tests multiple I/O patterns fairly');
console.log('🔄 Database: Bun advantage, File I/O: Virtual Threads advantage, Network: Even');
