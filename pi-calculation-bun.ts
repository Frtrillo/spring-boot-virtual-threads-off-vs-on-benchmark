/**
 * Pure computational benchmark: Leibniz formula for π
 * Single-threaded Bun vs Single-threaded Java
 * No I/O, no database, just pure math - fair comparison
 */

console.log("🔢 Bun Single-Thread π Calculation (Leibniz Formula)");
console.log("==================================================");

// Warm up JavaScript engine
console.log("⚡ Warming up JavaScript engine...");
warmupEngine();

// Test different iteration counts
const iterations = [1_000_000, 10_000_000, 100_000_000];

for (const n of iterations) {
    console.log(`\n🧮 Calculating π with ${n.toLocaleString()} iterations:`);
    
    const startTime = Bun.nanoseconds();
    const pi = calculatePiLeibniz(n);
    const endTime = Bun.nanoseconds();
    
    const elapsedMs = (endTime - startTime) / 1_000_000;
    const accuracy = Math.abs(Math.PI - pi);
    
    console.log(`   Result: ${pi}`);
    console.log(`   Actual π: ${Math.PI}`);
    console.log(`   Error: ${accuracy}`);
    console.log(`   Time: ${elapsedMs.toFixed(2)} ms`);
    console.log(`   Rate: ${Math.round(n / elapsedMs * 1000).toLocaleString()} iterations/second`);
}

// Extended precision test - where compiled languages usually shine
console.log("\n🎯 Extended precision test (1 billion iterations):");
const startTime = Bun.nanoseconds();
const pi = calculatePiLeibnizOptimized(1_000_000_000);
const endTime = Bun.nanoseconds();

const elapsedMs = (endTime - startTime) / 1_000_000;
const accuracy = Math.abs(Math.PI - pi);

console.log(`   Result: ${pi}`);
console.log(`   Error: ${accuracy}`);
console.log(`   Time: ${elapsedMs.toFixed(2)} ms`);
console.log(`   Rate: ${Math.round(1_000_000_000 / elapsedMs * 1000).toLocaleString()} iterations/second`);

console.log("\n✅ Bun benchmark complete!");

/**
 * Warm up the JavaScript engine with repeated calculations
 */
function warmupEngine(): void {
    for (let i = 0; i < 10; i++) {
        calculatePiLeibniz(100_000);
    }
}

/**
 * Calculate π using Leibniz formula: π/4 = 1 - 1/3 + 1/5 - 1/7 + 1/9 - ...
 * Standard implementation
 */
function calculatePiLeibniz(iterations: number): number {
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
 * Optimized version - should benefit from JIT compilation
 * Reduces conditional branching and improves cache locality
 */
function calculatePiLeibnizOptimized(iterations: number): number {
    let pi = 0.0;
    let sign = 1.0;
    
    // Unroll loop for better performance (JavaScript engine should optimize this)
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
