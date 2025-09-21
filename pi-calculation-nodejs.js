/**
 * Pure computational benchmark: Leibniz formula for π
 * Single-threaded Node.js comparison
 * No I/O, no database, just pure math
 */

console.log("🔢 Node.js Single-Thread π Calculation (Leibniz Formula)");
console.log("=======================================================");

// Warm up V8 engine
console.log("⚡ Warming up V8 engine...");
warmupEngine();

// Test different iteration counts
const iterations = [1_000_000, 10_000_000, 100_000_000];

for (const n of iterations) {
    console.log(`\n🧮 Calculating π with ${n.toLocaleString()} iterations:`);
    
    const startTime = process.hrtime.bigint();
    const pi = calculatePiLeibniz(n);
    const endTime = process.hrtime.bigint();
    
    const elapsedMs = Number(endTime - startTime) / 1_000_000;
    const accuracy = Math.abs(Math.PI - pi);
    
    console.log(`   Result: ${pi}`);
    console.log(`   Actual π: ${Math.PI}`);
    console.log(`   Error: ${accuracy}`);
    console.log(`   Time: ${elapsedMs.toFixed(2)} ms`);
    console.log(`   Rate: ${Math.round(n / elapsedMs * 1000).toLocaleString()} iterations/second`);
}

// Extended precision test
console.log("\n🎯 Extended precision test (1 billion iterations):");
const startTime = process.hrtime.bigint();
const pi = calculatePiLeibnizOptimized(1_000_000_000);
const endTime = process.hrtime.bigint();

const elapsedMs = Number(endTime - startTime) / 1_000_000;
const accuracy = Math.abs(Math.PI - pi);

console.log(`   Result: ${pi}`);
console.log(`   Error: ${accuracy}`);
console.log(`   Time: ${elapsedMs.toFixed(2)} ms`);
console.log(`   Rate: ${Math.round(1_000_000_000 / elapsedMs * 1000).toLocaleString()} iterations/second`);

console.log("\n✅ Node.js benchmark complete!");

/**
 * Warm up the V8 engine with repeated calculations
 */
function warmupEngine() {
    for (let i = 0; i < 10; i++) {
        calculatePiLeibniz(100_000);
    }
}

/**
 * Calculate π using Leibniz formula: π/4 = 1 - 1/3 + 1/5 - 1/7 + 1/9 - ...
 */
function calculatePiLeibniz(iterations) {
    let pi = 0.0;
    
    for (let i = 0; i < iterations; i++) {
        const term = 1.0 / (2 * i + 1);
        if (i % 2 === 0) {
            pi += term;
        } else {
            pi -= term;
        }
    }
    
    return pi * 4.0;
}

/**
 * Optimized version with loop unrolling
 */
function calculatePiLeibnizOptimized(iterations) {
    let pi = 0.0;
    let sign = 1.0;
    
    // Unroll loop for better performance
    let i = 0;
    for (; i < iterations - 4; i += 4) {
        pi += sign / (2 * i + 1);
        pi -= sign / (2 * i + 3);
        pi += sign / (2 * i + 5);
        pi -= sign / (2 * i + 7);
    }
    
    // Handle remaining iterations
    for (; i < iterations; i++) {
        pi += sign / (2 * i + 1);
        sign = -sign;
    }
    
    return pi * 4.0;
}
