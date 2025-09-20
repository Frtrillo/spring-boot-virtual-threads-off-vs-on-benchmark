const fastify = require('fastify')({ logger: false });
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const { v4: uuidv4 } = require('uuid');

const port = 8080;

/**
 * CPU-intensive server using Node.js
 * This workload challenges Node.js single-threaded nature:
 * 1. Heavy mathematical computations (where JVM excels)
 * 2. Limited multi-core utilization (Node.js weakness)
 * 3. No JIT compilation optimizations (Java advantage)
 */

// Worker thread function for CPU-intensive tasks
function createWorker(workerScript) {
    return new Promise((resolve, reject) => {
        const worker = new Worker(__filename, { workerData: workerScript });
        worker.on('message', resolve);
        worker.on('error', reject);
        worker.on('exit', (code) => {
            if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
        });
    });
}

fastify.post('/cpu/compute', async (request, reply) => {
    const start = process.hrtime.bigint();
    
    try {
        const payload = request.body;
        const computationId = uuidv4();
        
        // CPU-intensive computations (limited by Node.js single-threaded nature)
        const results = await Promise.all([
            performMonteCarloSimulation(payload),
            calculateMatrixDeterminant(payload),
            countPrimesInRange(payload),
            calculateFibonacciSum(payload),
            performParallelTasks(payload)
        ]);
        
        const elapsedNanos = process.hrtime.bigint() - start;
        const elapsedMs = Number(elapsedNanos) / 1_000_000;
        
        const response = {
            computation_id: computationId,
            status: "COMPUTED",
            monte_carlo_result: results[0],
            matrix_determinant: results[1],
            prime_count: results[2],
            fibonacci_sum: results[3],
            parallel_tasks_completed: results[4],
            processing_time_ms: Math.round(elapsedMs * 100) / 100,
            thread_info: `Node.js ${process.version} - Single Thread`,
            cpu_cores_used: 1, // Node.js is single-threaded
            jvm_optimization: "No JIT (V8 only)"
        };
        
        return response;
        
    } catch (error) {
        const elapsedNanos = process.hrtime.bigint() - start;
        const elapsedMs = Number(elapsedNanos) / 1_000_000;
        
        return reply.status(500).send({
            error: "CPU computation failed",
            message: error.message,
            processing_time_ms: Math.round(elapsedMs * 100) / 100
        });
    }
});

fastify.get('/cpu/health', async (request, reply) => {
    const memUsage = process.memoryUsage();
    
    return {
        status: "ok",
        timestamp: new Date(),
        runtime: "Node.js CPU-Intensive",
        virtual_threads: false,
        active_threads: 1,
        available_processors: require('os').cpus().length,
        memory_usage: {
            rss: memUsage.rss,
            heapTotal: memUsage.heapTotal,
            heapUsed: memUsage.heapUsed,
            external: memUsage.external
        },
        gc_info: "V8 Garbage Collector",
        jit_status: "V8 JIT (Limited vs HotSpot)"
    };
});

/**
 * Monte Carlo simulation - CPU-intensive mathematical computation
 */
function performMonteCarloSimulation(payload) {
    return new Promise((resolve) => {
        const iterations = 100000; // Same as Java version
        const seed = payload.toString().split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        
        let sum = 0;
        for (let i = 0; i < iterations; i++) {
            // Simple PRNG (not as optimized as Java's)
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
        
        resolve(sum / iterations);
    });
}

/**
 * Matrix determinant calculation - memory and CPU intensive
 */
function calculateMatrixDeterminant(payload) {
    return new Promise((resolve) => {
        const size = 50; // Same as Java version
        const matrix = generateMatrix(size, payload.toString().length);
        const det = calculateDeterminant(matrix);
        resolve(det);
    });
}

function generateMatrix(size, seed) {
    const matrix = [];
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

function calculateDeterminant(matrix) {
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
function countPrimesInRange(payload) {
    return new Promise((resolve) => {
        const start = Math.abs(payload.toString().length * 1000) + 1000;
        const end = start + 10000;
        
        let count = 0;
        for (let n = start; n <= end; n++) {
            if (isPrime(n)) count++;
        }
        
        resolve(count);
    });
}

function isPrime(n) {
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
function calculateFibonacciSum(payload) {
    return new Promise((resolve) => {
        const count = 35; // Same as Java version
        
        let sum = 0;
        for (let i = 1; i <= count; i++) {
            sum += fibonacci(i);
        }
        
        resolve(sum);
    });
}

function fibonacci(n) {
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
 * Parallel task execution - limited by Node.js single-threaded nature
 */
function performParallelTasks(payload) {
    return new Promise((resolve) => {
        const taskCount = require('os').cpus().length; // Can't really parallelize in Node.js
        
        let completed = 0;
        for (let taskId = 0; taskId < taskCount; taskId++) {
            // Simulate CPU-intensive work (but still single-threaded)
            let result = 0;
            for (let j = 0; j < 100000; j++) {
                result += Math.sin(j * taskId) * Math.cos(j * taskId);
            }
            if (result !== undefined) completed++;
        }
        
        resolve(completed);
    });
}

const start = async () => {
    try {
        await fastify.listen({ port: port, host: '0.0.0.0' });
        console.log('🚀 CPU-Intensive Node.js server listening on port 8080');
        console.log('📊 This workload challenges Node.js single-threaded architecture');
        console.log('🔄 Limited multi-core utilization compared to Java');
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
