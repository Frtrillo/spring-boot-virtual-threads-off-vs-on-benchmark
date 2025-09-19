// Pure SQLite benchmark - no HTTP, no frameworks
// Just like the official Bun benchmarks

const iterations = 100000;

function testBunSQLite() {
    if (typeof Bun === 'undefined') {
        console.log('Not running in Bun, skipping...');
        return;
    }
    
    console.log('=== Testing Bun Native SQLite ===');
    const { Database } = require('bun:sqlite');
    const db = new Database(':memory:');
    
    // Create table
    db.exec(`CREATE TABLE test_table (
        id INTEGER PRIMARY KEY,
        data TEXT,
        timestamp INTEGER
    )`);
    
    // Prepare statement
    const insert = db.prepare('INSERT INTO test_table (data, timestamp) VALUES (?, ?)');
    
    console.log(`Starting ${iterations} inserts...`);
    const start = performance.now();
    
    // Batch inserts
    for (let i = 0; i < iterations; i++) {
        insert.run(`data_${i}`, Date.now());
    }
    
    const end = performance.now();
    const duration = end - start;
    const opsPerSec = iterations / (duration / 1000);
    
    console.log(`Bun SQLite: ${duration.toFixed(2)}ms for ${iterations} inserts`);
    console.log(`Bun SQLite: ${opsPerSec.toFixed(0)} operations/sec`);
    
    // Test query performance
    const select = db.prepare('SELECT * FROM test_table WHERE id = ?');
    const queryStart = performance.now();
    
    for (let i = 0; i < 10000; i++) {
        select.get(Math.floor(Math.random() * iterations));
    }
    
    const queryEnd = performance.now();
    const queryDuration = queryEnd - queryStart;
    const queryOpsPerSec = 10000 / (queryDuration / 1000);
    
    console.log(`Bun SQLite Queries: ${queryDuration.toFixed(2)}ms for 10,000 queries`);
    console.log(`Bun SQLite Queries: ${queryOpsPerSec.toFixed(0)} queries/sec`);
    
    db.close();
}

function testNodeSQLite() {
    console.log('=== Testing Node.js SQLite3 ===');
    const sqlite3 = require('sqlite3').verbose();
    const db = new sqlite3.Database(':memory:');
    
    return new Promise((resolve) => {
        // Create table
        db.serialize(() => {
            db.run(`CREATE TABLE test_table (
                id INTEGER PRIMARY KEY,
                data TEXT,
                timestamp INTEGER
            )`);
            
            console.log(`Starting ${iterations} inserts...`);
            const start = performance.now();
            
            let completed = 0;
            const stmt = db.prepare('INSERT INTO test_table (data, timestamp) VALUES (?, ?)');
            
            for (let i = 0; i < iterations; i++) {
                stmt.run(`data_${i}`, Date.now(), function(err) {
                    if (err) console.error(err);
                    completed++;
                    
                    if (completed === iterations) {
                        const end = performance.now();
                        const duration = end - start;
                        const opsPerSec = iterations / (duration / 1000);
                        
                        console.log(`Node.js SQLite3: ${duration.toFixed(2)}ms for ${iterations} inserts`);
                        console.log(`Node.js SQLite3: ${opsPerSec.toFixed(0)} operations/sec`);
                        
                        stmt.finalize();
                        db.close();
                        resolve();
                    }
                });
            }
        });
    });
}

async function main() {
    console.log('=== SQLite Performance Test ===');
    console.log(`Runtime: ${typeof Bun !== 'undefined' ? `Bun ${Bun.version}` : `Node.js ${process.version}`}`);
    console.log('');
    
    if (typeof Bun !== 'undefined') {
        testBunSQLite();
    } else {
        await testNodeSQLite();
    }
}

main().catch(console.error);
