#!/bin/bash

# Realistic Enterprise Benchmark
# Tests actual enterprise patterns: business logic heavy, minimal I/O
# This should show where Java excels vs JavaScript runtimes

echo "🏢 REALISTIC Enterprise Order Processing Benchmark"
echo "=================================================="
echo "This benchmark tests ACTUAL enterprise patterns:"
echo "• Complex business logic (pricing, discounts, taxes)"
echo "• CPU-intensive calculations (where Java should excel)"
echo "• Minimal I/O operations (realistic database usage)"
echo "• Real-world order processing workflow"
echo ""

# Check dependencies
if ! command -v wrk &> /dev/null; then
    echo "❌ wrk not installed"
    exit 1
fi

run_test() {
    local name="$1"
    local port="$2" 
    local result_file="$3"
    
    echo ""
    echo "🧪 Testing $name..."
    echo "⏱️  Warming up (JIT compilation for Java)..."
    wrk -t4 -c200 -d15s -s order_payload.lua http://localhost:$port/api/process-order > /dev/null 2>&1
    sleep 2
    
    echo "🚀 Running benchmark (60s, 1500 connections)..."
    echo "📊 Focus on CPU-intensive business logic processing"
    
    # Realistic load: fewer connections, focus on throughput
    wrk -t8 -c1500 -d60s --timeout 30s -s order_payload.lua http://localhost:$port/api/process-order > "$result_file"
    
    # Extract and display results
    local rps=$(grep "Requests/sec:" "$result_file" | awk '{print $2}' | tr -d ',')
    local latency=$(grep "Latency" "$result_file" | awk '{print $2}')
    local errors=$(grep "Socket errors:" "$result_file" | grep -o "timeout [0-9]*" | awk '{print $2}' || echo "0")
    
    echo "   📊 RPS: $rps, Latency: $latency, Timeouts: $errors"
}

# Build Java application
echo "🔨 Building Java Realistic Enterprise application..."
mvn clean package -q -DskipTests

# Test 1: Java Virtual Threads
echo ""
echo "🟢 Java + Virtual Threads (Realistic Enterprise)..."
java -server -Xms1g -Xmx2g -XX:+UseG1GC \
     -jar target/iot-bench-0.1.0.jar \
     --spring.main.class=com.example.iotbench.RealisticEnterpriseApplication \
     --server.port=8080 \
     --logging.level.org.springframework=WARN > /dev/null 2>&1 &
JAVA_VT_PID=$!

sleep 20  # Extra time for JIT warmup
if curl -s http://localhost:8080/api/health > /dev/null; then
    run_test "Java Virtual Threads (Realistic)" 8080 "result_realistic_java_vt.txt"
else
    echo "❌ Java Virtual Threads failed to start"
fi
kill $JAVA_VT_PID 2>/dev/null
sleep 3

# Test 2: Java Traditional Threads
echo ""
echo "🟡 Java Traditional Threads (Realistic Enterprise)..."
export SPRING_THREADS_VIRTUAL_ENABLED=false
java -server -Xms1g -Xmx2g -XX:+UseG1GC \
     -jar target/iot-bench-0.1.0.jar \
     --spring.main.class=com.example.iotbench.RealisticEnterpriseApplication \
     --server.port=8080 \
     --logging.level.org.springframework=WARN > /dev/null 2>&1 &
JAVA_TRADITIONAL_PID=$!

sleep 20
if curl -s http://localhost:8080/api/health > /dev/null; then
    run_test "Java Traditional Threads (Realistic)" 8080 "result_realistic_java_traditional.txt"
else
    echo "❌ Java Traditional failed to start"
fi
kill $JAVA_TRADITIONAL_PID 2>/dev/null
sleep 3

# Test 3: Node.js Single Thread
echo ""
echo "🟦 Node.js Single Thread (Realistic Enterprise)..."
node realistic-nodejs-server.js > /dev/null 2>&1 &
NODE_PID=$!

sleep 8
if curl -s http://localhost:8080/api/health > /dev/null; then
    run_test "Node.js Single Thread (Realistic)" 8080 "result_realistic_nodejs.txt"
else
    echo "❌ Node.js failed to start"
fi
kill $NODE_PID 2>/dev/null
sleep 3

# Test 4: Node.js Cluster Mode
echo ""
echo "🟦 Node.js Cluster Mode (Realistic Enterprise)..."

# Create clustered version for realistic benchmark
cat > clustered-realistic-server.js << 'EOF'
const cluster = require('cluster');
const os = require('os');
const numCPUs = os.cpus().length;

if (cluster.isMaster) {
    console.log(`Master ${process.pid} starting ${numCPUs} workers for realistic enterprise benchmark`);
    
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }
    
    cluster.on('exit', (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died`);
    });
    
} else {
    // Worker process - run the realistic enterprise server
    require('./realistic-nodejs-server.js');
}
EOF

node clustered-realistic-server.js > /dev/null 2>&1 &
NODE_CLUSTER_PID=$!

sleep 10
if curl -s http://localhost:8080/api/health > /dev/null; then
    run_test "Node.js Cluster Mode (Realistic)" 8080 "result_realistic_nodejs_cluster.txt"
else
    echo "❌ Node.js cluster failed to start"
fi
kill $NODE_CLUSTER_PID 2>/dev/null
sleep 3

# Test 5: Bun Single Thread
echo ""
echo "🟠 Bun Single Thread (Realistic Enterprise)..."
if command -v bun &> /dev/null; then
    bun run realistic-bun-server.ts > /dev/null 2>&1 &
    BUN_PID=$!
    
    sleep 5
    if curl -s http://localhost:8080/api/health > /dev/null; then
        run_test "Bun Single Thread (Realistic)" 8080 "result_realistic_bun.txt"
    else
        echo "❌ Bun failed to start"
    fi
    kill $BUN_PID 2>/dev/null
    sleep 3
else
    echo "⚠️  Bun not installed"
fi

# Results Summary
echo ""
echo "🏆 REALISTIC ENTERPRISE BENCHMARK RESULTS"
echo "=========================================="
echo "Testing actual enterprise patterns with business logic"
echo ""

printf "%-40s | %10s | %10s | %10s\n" "Runtime" "RPS" "Latency" "Timeouts"
printf "%-40s | %10s | %10s | %10s\n" "----------------------------------------" "----------" "----------" "----------"

show_result() {
    local file="$1"
    local name="$2"
    
    if [ -f "$file" ]; then
        local rps=$(grep "Requests/sec:" "$file" | awk '{print $2}' | tr -d ',')
        local latency=$(grep "Latency" "$file" | awk '{print $2}')
        local timeouts=$(grep "Socket errors:" "$file" | grep -o "timeout [0-9]*" | awk '{print $2}' || echo "0")
        
        printf "%-40s | %10s | %10s | %10s\n" "$name" "$rps" "$latency" "$timeouts"
    fi
}

show_result "result_realistic_java_vt.txt" "Java Virtual Threads"
show_result "result_realistic_java_traditional.txt" "Java Traditional Threads"  
show_result "result_realistic_nodejs.txt" "Node.js Single Thread"
show_result "result_realistic_nodejs_cluster.txt" "Node.js Cluster Mode"
show_result "result_realistic_bun.txt" "Bun Single Thread"

echo ""
echo "📊 Analysis:"
echo "• This benchmark tests REAL enterprise business logic"
echo "• Heavy CPU work: pricing calculations, discounts, taxes"
echo "• Minimal I/O: only necessary database operations"
echo "• Should favor compiled languages and JIT optimization"
echo ""
echo "🎯 Expected: Java should perform well due to:"
echo "   - JIT compilation optimizing hot business logic paths"
echo "   - Efficient mathematical operations"
echo "   - Mature JVM optimizations for enterprise workloads"
echo ""

# Cleanup
rm -f clustered-realistic-server.js

echo "📁 Detailed results saved to result_realistic_*.txt files"
