import { serve } from "bun";

/**
 * CPU-intensive server using Bun
 * This workload challenges Bun's computational capabilities:
 * 1. Heavy mathematical computations (where JVM excels)
 * 2. Limited JIT optimizations compared to HotSpot
 * 3. Single-threaded execution model
 */

const server = serve({
    port: 8080,
    async fetch(req) {
        const url = new URL(req.url);
        
        if (req.method === "POST" && url.pathname === "/cpu/compute") {
            const start = Bun.nanoseconds();
            
            try {
                const payload = await req.json();
                const computationId = crypto.randomUUID();
                
                // CPU-intensive computations (limited by Bun's single-threaded nature)
                const results = await Promise.all([
                    performMonteCarloSimulation(payload),
                    calculateMatrixDeterminant(payload),
                    countPrimesInRange(payload),
                    calculateFibonacciSum(payload),
                    performParallelTasks(payload)
                ]);
                
                const elapsedNanos = Bun.nanoseconds() - start;
                const elapsedMs = elapsedNanos / 1_000_000;
                
                const response = {
                    computation_id: computationId,
                    status: "COMPUTED",
                    monte_carlo_result: results[0],
                    matrix_determinant: results[1],
                    prime_count: results[2],
                    fibonacci_sum: results[3],
                    parallel_tasks_completed: results[4],
                    processing_time_ms: Math.round(elapsedMs * 100) / 100,
                    thread_info: `Bun ${Bun.version} - Single Thread`,
                    cpu_cores_used: 1, // Bun is single-threaded
                    jvm_optimization: "No JIT (JavaScriptCore)"
                };
                
                return new Response(JSON.stringify(response), {
                    headers: { "Content-Type": "application/json" }
                });
                
            } catch (error) {
                const elapsedNanos = Bun.nanoseconds() - start;
                const elapsedMs = elapsedNanos / 1_000_000;
                
                return new Response(JSON.stringify({
                    error: "CPU computation failed",
                    message: error.message,
                    processing_time_ms: Math.round(elapsedMs * 100) / 100
                }), {
                    status: 500,
                    headers: { "Content-Type": "application/json" }
                });
            }
        }
        
        if (req.method === "GET" && url.pathname === "/cpu/health") {
            const memUsage = process.memoryUsage();
            
            return new Response(JSON.stringify({
                status: "ok",
                timestamp: new Date(),
                runtime: "Bun CPU-Intensive",
                virtual_threads: false,
                active_threads: 1,
                available_processors: navigator.hardwareConcurrency || 4,
                memory_usage: {
                    rss: memUsage.rss,
                    heapTotal: memUsage.heapTotal,
                    heapUsed: memUsage.heapUsed,
                    external: memUsage.external
                },
                gc_info: "JavaScriptCore GC",
                jit_status: "JavaScriptCore JIT (Limited vs HotSpot)"
            }), {
                headers: { "Content-Type": "application/json" }
            });
        }
        
        return new Response("Not Found", { status: 404 });
    }
});

/**
 * Monte Carlo simulation - CPU-intensive mathematical computation
 */
async function performMonteCarloSimulation(payload: any): Promise<number> {
    const iterations = 100000; // Same as Java version
    
    let sum = 0;
    for (let i = 0; i < iterations; i++) {
        const x = Math.random();
        const y = Math.random();
        
        // Complex calculation simulating IoT sensor data processing
        const temperature = 20 + (x * 40); // 20-60°C range
        const humidity = y * 100;          // 0-100% range
        const pressure = 1000 + (x * y * 100); // 1000-1100 hPa range
        
        // Environmental stress calculation
        const stress = Math.sin(temperature * Math.PI / 180) * 
                      Math.cos(humidity * Math.PI / 180) *
                      Math.log(pressure / 1000.0);
        
        sum += Math.exp(-stress * stress);
    }
    
    return sum / iterations;
}

/**
 * Matrix determinant calculation - memory and CPU intensive
 */
async function calculateMatrixDeterminant(payload: any): Promise<number> {
    const size = 50; // Same as Java version
    const matrix = generateMatrix(size, JSON.stringify(payload).length);
    return calculateDeterminant(matrix);
}

function generateMatrix(size: number, seed: number): number[][] {
    const matrix: number[][] = [];
    let random = seed;
    
    for (let i = 0; i < size; i++) {
        matrix[i] = [];
        for (let j = 0; j < size; j++) {
            // Simple PRNG (not as good as Java's Gaussian)
            random = (random * 1103515245 + 12345) & 0x7fffffff;
            matrix[i][j] = (random / 0x7fffffff - 0.5) * 20;
        }
    }
    return matrix;
}

function calculateDeterminant(matrix: number[][]): number {
    const n = matrix.length;
    const copy = matrix.map(row => [...row]);
    
    let det = 1.0;
    for (let i = 0; i < n; i++) {
        // Find pivot
        let maxRow = i;
        for (let k = i + 1; k < n; k++) {
            if (Math.abs(copy[k][i]) > Math.abs(copy[maxRow][i])) {
                maxRow = k;
            }
        }
        
        // Swap rows
        if (maxRow !== i) {
            [copy[i], copy[maxRow]] = [copy[maxRow], copy[i]];
            det = -det;
        }
        
        det *= copy[i][i];
        
        // Make all rows below this one 0 in current column
        for (let k = i + 1; k < n; k++) {
            const factor = copy[k][i] / copy[i][i];
            for (let j = i; j < n; j++) {
                copy[k][j] -= factor * copy[i][j];
            }
        }
    }
    
    return det;
}

/**
 * Prime counting - CPU-intensive number theory computation
 */
async function countPrimesInRange(payload: any): Promise<number> {
    const start = Math.abs(JSON.stringify(payload).length * 1000) + 1000;
    const end = start + 10000;
    
    let count = 0;
    for (let n = start; n <= end; n++) {
        if (isPrime(n)) count++;
    }
    
    return count;
}

function isPrime(n: number): boolean {
    if (n < 2) return false;
    if (n === 2) return true;
    if (n % 2 === 0) return false;
    
    const sqrt = Math.floor(Math.sqrt(n));
    for (let i = 3; i <= sqrt; i += 2) {
        if (n % i === 0) return false;
    }
    return true;
}

/**
 * Fibonacci computation - recursive mathematical calculation
 */
async function calculateFibonacciSum(payload: any): Promise<number> {
    const count = 35; // Same as Java version
    
    let sum = 0;
    for (let i = 1; i <= count; i++) {
        sum += fibonacci(i);
    }
    
    return sum;
}

function fibonacci(n: number): number {
    if (n <= 1) return n;
    
    let a = 0, b = 1;
    for (let i = 2; i <= n; i++) {
        const temp = a + b;
        a = b;
        b = temp;
    }
    return b;
}

/**
 * Parallel task execution - limited by Bun's single-threaded nature
 */
async function performParallelTasks(payload: any): Promise<number> {
    const taskCount = navigator.hardwareConcurrency || 4; // Can't really parallelize in Bun
    
    let completed = 0;
    for (let taskId = 0; taskId < taskCount; taskId++) {
        // Simulate CPU-intensive work (but still single-threaded)
        let result = 0;
        for (let j = 0; j < 100000; j++) {
            result += Math.sin(j * taskId) * Math.cos(j * taskId);
        }
        if (result !== undefined) completed++;
    }
    
    return completed;
}

console.log('🚀 CPU-Intensive Bun server listening on port 8080');
console.log('📊 This workload challenges Bun computational capabilities');
console.log('🔄 Limited JIT optimizations compared to Java HotSpot');
