// Bun-optimized server using Bun.sqlite instead of node-sqlite3
const { Database } = require("bun:sqlite");
const { v4: uuidv4 } = require('uuid');

// Use Bun's native SQLite (should be faster)
const db = new Database(":memory:");

// Initialize table
db.exec(`CREATE TABLE IF NOT EXISTS iot_payload (
    id TEXT PRIMARY KEY,
    content TEXT,
    ts DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

const insertStmt = db.prepare("INSERT INTO iot_payload (id, content, ts) VALUES (?, ?, datetime('now'))");

// Simulate async background work
async function doBackgroundWork(id, payload) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, 50);
    });
}

// Bun server using native HTTP
const server = Bun.serve({
    port: 8080,
    async fetch(request) {
        const url = new URL(request.url);
        
        if (url.pathname === "/health") {
            return new Response(JSON.stringify({
                status: "ok",
                timestamp: new Date().toISOString()
            }), {
                headers: { "Content-Type": "application/json" }
            });
        }
        
        if (url.pathname === "/ingest" && request.method === "POST") {
            const startTime = performance.now();
            
            try {
                const payload = await request.json();
                const id = uuidv4();
                const content = JSON.stringify(payload);
                
                // Use Bun's native SQLite (should be faster)
                insertStmt.run(id, content);
                
                // Start background work
                doBackgroundWork(id, payload).catch(err => {
                    console.error('Background work failed:', err);
                });
                
                const endTime = performance.now();
                const elapsedMs = endTime - startTime;
                
                return new Response(JSON.stringify({
                    id: id,
                    t_ms: Math.round(elapsedMs * 100) / 100
                }), {
                    headers: { "Content-Type": "application/json" }
                });
                
            } catch (error) {
                console.error('Error processing request:', error);
                return new Response(JSON.stringify({ error: 'Internal server error' }), {
                    status: 500,
                    headers: { "Content-Type": "application/json" }
                });
            }
        }
        
        return new Response("Not Found", { status: 404 });
    },
});

console.log(`Bun Native Server running on port 8080`);
console.log(`Process ID: ${process.pid}`);
console.log(`Runtime: Bun ${Bun.version}`);
console.log('Ready to receive requests...');
