#!/bin/bash

# Framework π Calculation Benchmark
# Spring Boot vs NestJS - Real-world framework overhead comparison
# Tests pure computational performance under actual web frameworks

echo "🌐 FRAMEWORK π CALCULATION BENCHMARK"
echo "===================================="
echo "Testing Leibniz π calculation under real web frameworks:"
echo "• Spring Boot (Java) vs NestJS (Node.js)"
echo "• Real framework overhead included"
echo "• HTTP request/response processing"
echo "• JSON serialization/deserialization"
echo "• Framework middleware and routing"
echo ""

# Check dependencies
if ! command -v wrk &> /dev/null; then
    echo "❌ wrk not installed"
    exit 1
fi

# Function to test a framework
test_framework() {
    local name="$1"
    local port="$2"
    local result_file="$3"
    
    echo ""
    echo "🧪 Testing $name..."
    echo "⏱️  Warming up framework and JIT..."
    
    # Extended warmup for framework initialization and JIT
    wrk -t2 -c10 -d20s -s pi_request.lua http://localhost:$port/api/pi/calculate > /dev/null 2>&1
    sleep 3
    
    echo "🚀 Running benchmark (60s, 500 connections)..."
    echo "📊 Testing computational performance under framework load"
    
    # Framework benchmark - moderate load to focus on computation
    wrk -t6 -c500 -d60s --timeout 30s -s pi_request.lua http://localhost:$port/api/pi/calculate > "$result_file"
    
    # Extract and display results
    local rps=$(grep "Requests/sec:" "$result_file" | awk '{print $2}' | tr -d ',')
    local latency=$(grep "Latency" "$result_file" | awk '{print $2}')
    local errors=$(grep "Socket errors:" "$result_file" | grep -o "timeout [0-9]*" | awk '{print $2}' || echo "0")
    
    echo "   📊 RPS: $rps, Latency: $latency, Timeouts: $errors"
    
    # Test single large calculation
    echo "   🎯 Testing single large calculation (100M iterations)..."
    local single_result=$(curl -s -X POST -H "Content-Type: application/json" \
                         -d '{"iterations": 100000000}' \
                         http://localhost:$port/api/pi/calculate)
    
    if [ $? -eq 0 ]; then
        local time_ms=$(echo "$single_result" | grep -o '"timeMs":[0-9.]*' | cut -d':' -f2)
        local iterations_per_sec=$(echo "$single_result" | grep -o '"iterationsPerSecond":[0-9]*' | cut -d':' -f2)
        echo "   📊 Single calc: ${time_ms}ms, ${iterations_per_sec} iter/sec"
    else
        echo "   ❌ Single calculation failed"
    fi
}

# Build and start Spring Boot application
echo "🔨 Building Spring Boot π Calculator..."
mvn clean package -q -DskipTests

echo ""
echo "☕ Starting Spring Boot π Calculator..."
java -server -Xms512m -Xmx1g -XX:+UseG1GC \
     -jar target/iot-bench-0.1.0.jar \
     --spring.main.class=com.example.iotbench.PiCalculationApplication \
     --server.port=8080 \
     --logging.level.org.springframework=WARN > /dev/null 2>&1 &
SPRING_PID=$!

# Wait for Spring Boot to start and JIT to warm up
echo "⏳ Waiting for Spring Boot to start and JIT to optimize..."
sleep 25

if curl -s http://localhost:8080/api/pi/health > /dev/null; then
    test_framework "Spring Boot π Calculator" 8080 "result_framework_spring_pi.txt"
else
    echo "❌ Spring Boot failed to start"
fi

# Stop Spring Boot
kill $SPRING_PID 2>/dev/null
sleep 5

# Check if NestJS dependencies are available
if [ ! -f "node_modules/@nestjs/core/package.json" ]; then
    echo "📦 Installing NestJS dependencies..."
    npm install @nestjs/core @nestjs/common @nestjs/platform-express reflect-metadata
fi

echo ""
echo "🟦 Starting NestJS π Calculator..."
npm run build > /dev/null 2>&1 || true  # Try to build if build script exists

# Check if we need to compile TypeScript
if command -v npx &> /dev/null; then
    npx ts-node pi-nestjs-app.ts > /dev/null 2>&1 &
    NESTJS_PID=$!
elif command -v bun &> /dev/null; then
    bun run pi-nestjs-app.ts > /dev/null 2>&1 &
    NESTJS_PID=$!
else
    # Fallback: try to run with node (if compiled)
    node pi-nestjs-app.ts > /dev/null 2>&1 &
    NESTJS_PID=$!
fi

# Wait for NestJS to start and V8 to warm up
echo "⏳ Waiting for NestJS to start and V8 to optimize..."
sleep 15

if curl -s http://localhost:8080/api/pi/health > /dev/null; then
    test_framework "NestJS π Calculator" 8080 "result_framework_nestjs_pi.txt"
else
    echo "❌ NestJS failed to start"
    echo "   Trying alternative startup method..."
    
    # Kill previous attempt
    kill $NESTJS_PID 2>/dev/null
    
    # Try with simple Node.js version
    cat > simple-nestjs-pi.js << 'EOF'
const express = require('express');
const app = express();

app.use(express.json());

app.post('/api/pi/calculate', (req, res) => {
    const startTime = process.hrtime.bigint();
    
    try {
        let iterations = req.body.iterations || 1000000;
        if (iterations <= 0) iterations = 1000000;
        
        // Warm up for large calculations
        if (iterations > 10000000) {
            for (let i = 0; i < 5; i++) {
                calculatePiLeibniz(100000);
            }
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

app.listen(8080, '0.0.0.0', () => {
    console.log('🚀 Express π Calculator running on port 8080');
    console.log(`📊 Runtime: Node.js ${process.version}`);
    console.log('Ready to calculate π with Leibniz formula...');
});
EOF
    
    node simple-nestjs-pi.js > /dev/null 2>&1 &
    NESTJS_PID=$!
    
    sleep 10
    if curl -s http://localhost:8080/api/pi/health > /dev/null; then
        test_framework "Express π Calculator" 8080 "result_framework_express_pi.txt"
    else
        echo "❌ Express also failed to start"
    fi
fi

# Stop NestJS/Express
kill $NESTJS_PID 2>/dev/null
sleep 3

# Results Summary
echo ""
echo "🏆 FRAMEWORK π CALCULATION BENCHMARK RESULTS"
echo "============================================="
echo ""

show_result() {
    local file="$1"
    local name="$2"
    
    if [ -f "$file" ]; then
        local rps=$(grep "Requests/sec:" "$file" | awk '{print $2}' | tr -d ',')
        local latency=$(grep "Latency" "$file" | awk '{print $2}')
        local timeouts=$(grep "Socket errors:" "$file" | grep -o "timeout [0-9]*" | awk '{print $2}' || echo "0")
        
        printf "%-30s | %10s | %10s | %10s\n" "$name" "$rps" "$latency" "$timeouts"
    fi
}

printf "%-30s | %10s | %10s | %10s\n" "Framework" "RPS" "Latency" "Timeouts"
printf "%-30s | %10s | %10s | %10s\n" "------------------------------" "----------" "----------" "----------"

show_result "result_framework_spring_pi.txt" "Spring Boot π Calculator"
show_result "result_framework_nestjs_pi.txt" "NestJS π Calculator"
show_result "result_framework_express_pi.txt" "Express π Calculator"

echo ""
echo "📊 Analysis:"
echo "• Framework overhead impact on computational performance"
echo "• HTTP request/response processing costs"
echo "• JSON serialization/deserialization overhead"
echo "• Framework middleware and routing performance"
echo ""
echo "🎯 This shows real-world performance under web framework load"
echo "   including all the overhead of actual web applications"

# Cleanup
rm -f simple-nestjs-pi.js *.class

echo ""
echo "📁 Detailed results saved to result_framework_*.txt files"
