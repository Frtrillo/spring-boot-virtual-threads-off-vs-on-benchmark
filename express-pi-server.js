const express = require('express');
const app = express();

app.use(express.json());

// Warm up function
function warmupEngine() {
    for (let i = 0; i < 5; i++) {
        calculatePiLeibniz(100000);
    }
}

// Calculate π using Leibniz formula
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

app.post('/api/pi/calculate', (req, res) => {
    const startTime = process.hrtime.bigint();
    
    try {
        let iterations = req.body.iterations || 1000000;
        if (iterations <= 0) iterations = 1000000;
        
        // Warm up for large calculations
        if (iterations > 10000000) {
            warmupEngine();
        }
        
        const pi = calculatePiLeibniz(iterations);
        
        const endTime = process.hrtime.bigint();
        const elapsedMs = Number(endTime - startTime) / 1000000;
        const accuracy = Math.abs(Math.PI - pi);
        
        res.json({
            result: pi,
            actualPi: Math.PI,
            error: accuracy,
            iterations: iterations,
            timeMs: Math.round(elapsedMs * 100) / 100,
            iterationsPerSecond: Math.round(iterations / elapsedMs * 1000),
            runtime: `Express + Node.js ${process.version}`,
            threadType: "Single Thread (Event Loop)"
        });
        
    } catch (error) {
        const endTime = process.hrtime.bigint();
        const elapsedMs = Number(endTime - startTime) / 1000000;
        
        res.status(500).json({
            error: 'π calculation failed',
            message: error.message,
            timeMs: Math.round(elapsedMs * 100) / 100
        });
    }
});

app.get('/api/pi/health', (req, res) => {
    const memUsage = process.memoryUsage();
    
    res.json({
        status: 'ok',
        timestamp: new Date(),
        runtime: 'Express π Calculator',
        nodeVersion: process.version,
        virtualThreads: false,
        availableProcessors: require('os').cpus().length,
        memoryUsage: memUsage
    });
});

app.listen(8080, '0.0.0.0', () => {
    console.log('🚀 Express π Calculator running on port 8080');
    console.log(`📊 Runtime: Node.js ${process.version}`);
    console.log('Ready to calculate π with Leibniz formula...');
});

// Warm up V8 on startup
console.log('⚡ Warming up V8 engine...');
warmupEngine();
